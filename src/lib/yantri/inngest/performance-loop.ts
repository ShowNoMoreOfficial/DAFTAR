/**
 * Performance Feedback Loop — Inngest Functions
 *
 * Triggered when a deliverable is published. Schedules measurement
 * windows at 24h, 72h, and 7d. Scores performance, attributes to
 * skills, and updates skill Learning Logs for future generation.
 *
 * Generate → Publish → Measure → Learn → Generate Better
 */

import { yantriInngest } from "./client";
import { prisma } from "@/lib/prisma";
import {
  scoreDeliverablePerformance,
  savePerformanceRecord,
  simulateMetrics,
  type PerformanceMetrics,
} from "@/lib/yantri/performance-scorer";

// ─── Event Types ───

type PublishEvent = {
  data: {
    deliverableId: string;
    brandId: string;
    platform: string;
  };
};

type MeasureEvent = {
  data: {
    deliverableId: string;
    brandId: string;
    platform: string;
    window: "24h" | "72h" | "7d";
    publishedAt: string;
  };
};

// ─── 1. Publish Trigger → Schedules 24h/72h/7d measurement windows ───

export const performanceTrackingStart = yantriInngest.createFunction(
  {
    id: "performance-tracking-start",
    name: "Performance: Start Tracking on Publish",
    retries: 1,
  },
  { event: "yantri/deliverable.published" },
  async ({ event, step }) => {
    const { deliverableId, brandId, platform } =
      event.data as PublishEvent["data"];

    // Mark the deliverable with publish timestamp
    await step.run("mark-published", async () => {
      // Create initial ContentPerformance record
      const existing = await prisma.contentPerformance.findFirst({
        where: { deliverableId },
      });

      if (!existing) {
        // Get skills used from execution records
        const executions = await prisma.skillExecution.findMany({
          where: { deliverableId },
          include: { skill: { select: { path: true } } },
        });

        await prisma.contentPerformance.create({
          data: {
            deliverableId,
            brandId,
            platform,
            publishedAt: new Date(),
            metrics: {},
            skillsUsed: executions.map((e) => e.skill.path),
            performanceTier: null,
            benchmarkDelta: null,
          },
        });
      }
    });

    // Schedule 24h measurement
    await step.sendEvent("schedule-24h", {
      name: "yantri/performance.measure",
      data: {
        deliverableId,
        brandId,
        platform,
        window: "24h",
        publishedAt: new Date().toISOString(),
      },
    });

    // Wait 24h, then schedule 72h
    await step.sleep("wait-for-72h", "72h");

    await step.sendEvent("schedule-72h", {
      name: "yantri/performance.measure",
      data: {
        deliverableId,
        brandId,
        platform,
        window: "72h",
        publishedAt: new Date().toISOString(),
      },
    });

    // Wait remaining time to 7d
    await step.sleep("wait-for-7d", "96h");

    await step.sendEvent("schedule-7d", {
      name: "yantri/performance.measure",
      data: {
        deliverableId,
        brandId,
        platform,
        window: "7d",
        publishedAt: new Date().toISOString(),
      },
    });

    return { deliverableId, status: "tracking-scheduled" };
  }
);

// ─── 2. Measure + Score + Learn at each window ───

export const performanceMeasure = yantriInngest.createFunction(
  {
    id: "performance-measure",
    name: "Performance: Measure & Score",
    retries: 2,
    concurrency: { limit: 5 },
  },
  { event: "yantri/performance.measure" },
  async ({ event, step }) => {
    const { deliverableId, brandId, platform, window } =
      event.data as MeasureEvent["data"];

    // Step 1: Fetch metrics
    const metrics = await step.run("fetch-metrics", async () => {
      // Try to get real metrics from PerformanceData table
      const realMetrics = await prisma.performanceData.findFirst({
        where: {
          narrativeId: deliverableId,
        },
        orderBy: { recordedAt: "desc" },
      });

      if (realMetrics) {
        return {
          views: realMetrics.views ?? undefined,
          impressions: realMetrics.impressions ?? undefined,
          likes: undefined,
          comments: undefined,
          shares: undefined,
          retention: undefined,
          ctr: realMetrics.ctr ?? undefined,
          watchTime: realMetrics.watchTime ?? undefined,
          saves: undefined,
          engagementRate: realMetrics.engagementRate ?? undefined,
        } as PerformanceMetrics;
      }

      // Fallback: simulate metrics (until real platform APIs are connected)
      console.log(
        `[performance-loop] No real metrics for ${deliverableId} — simulating for ${window}`
      );
      return simulateMetrics(platform, window);
    });

    // Step 2: Score and attribute
    const attribution = await step.run("score-performance", async () => {
      return scoreDeliverablePerformance(deliverableId, metrics, window);
    });

    if (!attribution) {
      return {
        deliverableId,
        window,
        status: "scoring-failed",
        metrics,
      };
    }

    // Step 3: Save to DB + update skill files
    await step.run("save-and-learn", async () => {
      const executions = await prisma.skillExecution.findMany({
        where: { deliverableId },
        include: { skill: { select: { path: true } } },
      });
      const skillsUsed = executions.map((e) => e.skill.path);

      await savePerformanceRecord(
        deliverableId,
        brandId,
        platform,
        metrics,
        attribution,
        skillsUsed,
        window
      );
    });

    // Step 4: Also write to PerformanceData for dashboard aggregation
    await step.run("write-performance-data", async () => {
      const deliverable = await prisma.deliverable.findUnique({
        where: { id: deliverableId },
        include: {
          brand: { select: { name: true } },
        },
      });

      if (deliverable) {
        await prisma.performanceData.create({
          data: {
            narrativeId: deliverableId,
            platform,
            brandName: deliverable.brand.name,
            contentType: deliverable.pipelineType,
            impressions: metrics.impressions ?? null,
            engagementRate:
              metrics.likes && metrics.views
                ? metrics.likes / metrics.views
                : null,
            views: metrics.views ?? null,
            watchTime: metrics.watchTime ?? null,
            ctr: metrics.ctr ?? null,
            notes: `Auto-recorded at ${window} window. Score: ${attribution.overallScore}/10, Tier: ${attribution.tier}`,
            publishedAt: new Date(),
          },
        });
      }
    });

    return {
      deliverableId,
      window,
      status: "measured",
      score: attribution.overallScore,
      tier: attribution.tier,
      benchmarkDelta: attribution.benchmarkDelta,
      learningEntriesWritten: attribution.learningEntries.length,
      recommendations: attribution.recommendations,
    };
  }
);
