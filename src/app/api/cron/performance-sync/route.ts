import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPlatformMetrics } from "@/lib/relay/analytics-fetchers";
import {
  evaluatePerformanceData,
  type PerformanceRecord,
} from "@/lib/learning/evaluator";
import { updateSkillLearningLogs } from "@/lib/learning/performance-feedback";
import { daftarEvents } from "@/lib/event-bus";
import { apiHandler } from "@/lib/api-handler";

/**
 * GET /api/cron/performance-sync
 *
 * Runs every 6 hours. For each published post with a platformPostId:
 *  1. Fetch live metrics from the platform API
 *  2. Update PostAnalytics with fresh data
 *  3. After 7 days, calculate final score -> ContentPerformance
 *  4. Trigger skill learning log updates for high/low performers
 *
 * Protected by CRON_SECRET bearer token.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = apiHandler(async () => {
  const now = new Date();
  const stats = {
    synced: 0,
    failed: 0,
    finalized: 0,
    learningUpdates: 0,
    skipped: 0,
  };

  // -- 1. Find published posts needing sync --
  // Sync posts published in the last 30 days that have a real platformPostId
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const posts = await prisma.contentPost.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: thirtyDaysAgo },
      platformPostId: { not: null },
    },
    include: {
      analytics: true,
      brand: { select: { id: true, name: true } },
    },
    orderBy: { publishedAt: "asc" },
    take: 100,
  });

  if (posts.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No published posts to sync",
      ...stats,
      timestamp: now.toISOString(),
    });
  }

  // -- 2. Fetch metrics for each post --
  for (const post of posts) {
    // Skip simulated posts
    if (post.platformPostId?.startsWith("sim_")) {
      stats.skipped++;
      continue;
    }

    // Skip if synced within last 4 hours (avoid redundant API calls)
    if (
      post.analytics?.lastSyncedAt &&
      now.getTime() - post.analytics.lastSyncedAt.getTime() < 4 * 3600000
    ) {
      stats.skipped++;
      continue;
    }

    // Find platform connection
    const connection = await prisma.platformConnection.findUnique({
      where: {
        brandId_platform: {
          brandId: post.brandId,
          platform: post.platform,
        },
      },
    });

    if (!connection?.id) {
      stats.skipped++;
      continue;
    }

    // Fetch real metrics
    const metrics = await fetchPlatformMetrics(
      post.platform,
      connection.id,
      post.platformPostId!
    );

    if (!metrics) {
      stats.failed++;
      continue;
    }

    // -- 3. Update PostAnalytics --
    await prisma.postAnalytics.upsert({
      where: { postId: post.id },
      create: {
        postId: post.id,
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        clicks: metrics.clicks,
        reach: metrics.reach,
        impressions: metrics.impressions,
        engagementRate: metrics.engagementRate,
        rawData: metrics.rawData as object,
        lastSyncedAt: now,
      },
      update: {
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        clicks: metrics.clicks,
        reach: metrics.reach,
        impressions: metrics.impressions,
        engagementRate: metrics.engagementRate,
        rawData: metrics.rawData as object,
        lastSyncedAt: now,
      },
    });

    stats.synced++;

    // -- 4. After 7 days -> finalize to ContentPerformance --
    const daysSincePublish = post.publishedAt
      ? (now.getTime() - post.publishedAt.getTime()) / 86400000
      : 0;

    if (daysSincePublish >= 7) {
      await finalizeContentPerformance(post, metrics);
      stats.finalized++;
    }
  }

  // -- 5. Run skill learning on finalized content --
  if (stats.finalized > 0) {
    const learningUpdates = await runPerformanceLearning();
    stats.learningUpdates = learningUpdates;
  }

  // -- 6. Emit event --
  daftarEvents.emitEvent("performance.synced", {
    ...stats,
    timestamp: now.toISOString(),
  });

  return NextResponse.json({
    success: true,
    ...stats,
    timestamp: now.toISOString(),
  });
}, { requireCronSecret: true });

// --- Finalize performance record ---

async function finalizeContentPerformance(
  post: {
    id: string;
    title: string;
    platform: string;
    brandId: string;
    content: string | null;
    metadata: unknown;
  },
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    engagementRate: number;
    ctr?: number;
    retention?: number;
    watchTime?: number;
    saves?: number;
  }
) {
  // Check if already finalized
  const existing = await prisma.contentPerformance.findFirst({
    where: { deliverableId: post.id, platform: post.platform },
  });

  if (existing) {
    // Update existing record with latest metrics
    await prisma.contentPerformance.update({
      where: { id: existing.id },
      data: {
        metrics: {
          views: metrics.views,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          ctr: metrics.ctr ?? null,
          retention: metrics.retention ?? null,
          watchTime: metrics.watchTime ?? null,
          saves: metrics.saves ?? null,
          engagementRate: metrics.engagementRate,
        } as object,
      },
    });
    return;
  }

  // Extract hook type from metadata
  const metadata = (post.metadata as Record<string, unknown>) ?? {};
  const hookType = (metadata.hookType as string) ?? null;
  const narrativeAngle = (metadata.narrativeAngle as string) ?? null;

  // Find skill executions linked to this post's deliverable
  const skillExecutions = await prisma.skillExecution.findMany({
    where: { deliverableId: post.id },
    select: { skill: { select: { path: true } } },
  });
  const skillsUsed = skillExecutions.map((se) => se.skill.path);

  await prisma.contentPerformance.create({
    data: {
      deliverableId: post.id,
      brandId: post.brandId,
      platform: post.platform,
      publishedAt: new Date(),
      metrics: {
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        ctr: metrics.ctr ?? null,
        retention: metrics.retention ?? null,
        watchTime: metrics.watchTime ?? null,
        saves: metrics.saves ?? null,
        engagementRate: metrics.engagementRate,
      } as object,
      skillsUsed,
      narrativeAngle,
      hookType,
    },
  });
}

// --- Trigger learning from recent performance ---

async function runPerformanceLearning(): Promise<number> {
  // Get recently finalized ContentPerformance records (last 24h)
  const oneDayAgo = new Date(Date.now() - 86400000);

  const records = await prisma.contentPerformance.findMany({
    where: { lastUpdated: { gte: oneDayAgo } },
    orderBy: { lastUpdated: "desc" },
  });

  if (records.length === 0) return 0;

  // Evaluate using the existing evaluator
  const perfRecords: PerformanceRecord[] = records.map((r) => ({
    id: r.id,
    deliverableId: r.deliverableId,
    brandId: r.brandId,
    platform: r.platform,
    metrics: (r.metrics ?? {}) as PerformanceRecord["metrics"],
    skillsUsed: r.skillsUsed,
    hookType: r.hookType,
    narrativeAngle: r.narrativeAngle,
    performanceTier: r.performanceTier,
    benchmarkDelta: r.benchmarkDelta,
    publishedAt: r.publishedAt,
  }));

  const evaluation = evaluatePerformanceData(perfRecords);

  // Update performance tiers
  for (const score of evaluation.scores) {
    await prisma.contentPerformance.update({
      where: { id: score.id },
      data: { performanceTier: score.tier },
    });
  }

  // Run skill learning updates for high/low performers
  const learningCount = await updateSkillLearningLogs(evaluation.scores);

  return learningCount;
}
