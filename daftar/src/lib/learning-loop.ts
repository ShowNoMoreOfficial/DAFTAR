import { prisma } from "@/lib/prisma";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import { daftarEvents } from "@/lib/event-bus";
import type { Prisma } from "@prisma/client";

// ---------- Types ----------

interface SkillScore {
  skillPath: string;
  avgScore: number;
  trend: "improving" | "stable" | "declining";
  consistency: number;
  sampleSize: number;
  health: "star" | "solid" | "variable" | "struggling" | "untested";
  topPattern: string | null;
  bottomPattern: string | null;
  revision: string | null;
}

interface LearningCycleResult {
  period: { start: string; end: string };
  attribution: Record<string, unknown>[];
  skillScores: SkillScore[];
  sentiment: Record<string, unknown> | null;
  revenue: Record<string, unknown> | null;
  testsManaged: { closed: number; proposed: number };
  reportGenerated: boolean;
}

// ---------- Stage 2: Performance Attribution ----------

async function runPerformanceAttribution(
  periodStart: Date,
  periodEnd: Date
): Promise<Record<string, unknown>[]> {
  const performances = await prisma.contentPerformance.findMany({
    where: {
      publishedAt: { gte: periodStart, lte: periodEnd },
    },
  });

  const attributions: Record<string, unknown>[] = [];

  for (const perf of performances) {
    const result = await skillOrchestrator.executeSkill({
      skillPath: "analytics/performance/performance-attribution.md",
      context: {
        contentId: perf.id,
        platform: perf.platform,
        metrics: perf.metrics,
        skillsUsed: perf.skillsUsed,
        narrativeAngle: perf.narrativeAngle,
        hookType: perf.hookType,
      },
      brandId: perf.brandId,
      platform: perf.platform,
    });

    if (result.success) {
      attributions.push({
        contentId: perf.id,
        deliverableId: perf.deliverableId,
        attribution: result.output,
        skillsUsed: perf.skillsUsed,
      });
    }
  }

  return attributions;
}

// ---------- Stage 3: Skill Scoring ----------

function computeSkillScores(
  attributions: Record<string, unknown>[],
  executions: { skillId: string; skill: { path: string }; performanceScore: number | null }[]
): SkillScore[] {
  const bySkill = new Map<string, number[]>();

  for (const exec of executions) {
    if (exec.performanceScore == null) continue;
    const path = exec.skill.path;
    if (!bySkill.has(path)) bySkill.set(path, []);
    bySkill.get(path)!.push(exec.performanceScore);
  }

  const scores: SkillScore[] = [];

  for (const [skillPath, values] of bySkill.entries()) {
    if (values.length < 3) {
      scores.push({
        skillPath,
        avgScore: 0,
        trend: "stable",
        consistency: 0,
        sampleSize: values.length,
        health: "untested",
        topPattern: null,
        bottomPattern: null,
        revision: null,
      });
      continue;
    }

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - stdDev / 5);

    // Trend: compare first half vs second half
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    const trend: "improving" | "stable" | "declining" =
      diff > 0.5 ? "improving" : diff < -0.5 ? "declining" : "stable";

    // Health category
    let health: SkillScore["health"];
    if (avg >= 8.0 && consistency >= 0.7 && trend !== "declining") {
      health = "star";
    } else if (avg >= 6.0 && consistency >= 0.6) {
      health = "solid";
    } else if (avg >= 5.0 && consistency < 0.6) {
      health = "variable";
    } else {
      health = "struggling";
    }

    scores.push({
      skillPath,
      avgScore: Math.round(avg * 100) / 100,
      trend,
      consistency: Math.round(consistency * 100) / 100,
      sampleSize: values.length,
      health,
      topPattern: null,
      bottomPattern: null,
      revision:
        health === "struggling"
          ? `Skill needs revision — avg score ${avg.toFixed(1)}, trend: ${trend}`
          : null,
    });
  }

  return scores;
}

// ---------- Stage 6: Learning Log Updates ----------

async function updateLearningLogs(
  skillScores: SkillScore[],
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  let updated = 0;

  for (const score of skillScores) {
    if (score.health === "untested") continue;

    const skill = await prisma.skill.findUnique({
      where: { path: score.skillPath },
    });

    if (!skill) continue;

    const entry = {
      period: `${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)}`,
      executions: score.sampleSize,
      avgScore: score.avgScore,
      trend: score.trend,
      health: score.health,
      topPattern: score.topPattern,
      bottomPattern: score.bottomPattern,
      recommendation: score.revision,
    };

    await prisma.skillLearningLog.create({
      data: {
        skillId: skill.id,
        entry: entry as unknown as Prisma.InputJsonValue,
        source: "auto",
        periodStart,
        periodEnd,
      },
    });

    updated++;
  }

  return updated;
}

// ---------- Stage 7: Strategy Test Management ----------

async function manageStrategyTests(
  periodEnd: Date
): Promise<{ closed: number; proposed: number }> {
  // Close completed tests
  const completedTests = await prisma.strategyTest.updateMany({
    where: {
      status: "active",
      endDate: { lte: periodEnd },
    },
    data: { status: "completed" },
  });

  return { closed: completedTests.count, proposed: 0 };
}

// ---------- Master Workflow: Monthly Learning Cycle ----------

export async function runLearningCycle(
  periodStart: Date,
  periodEnd: Date
): Promise<LearningCycleResult> {
  // Stage 1: Data collection
  const executions = await prisma.skillExecution.findMany({
    where: {
      executedAt: { gte: periodStart, lte: periodEnd },
    },
    include: { skill: true },
  });

  // Stage 2: Performance attribution
  const attributions = await runPerformanceAttribution(periodStart, periodEnd);

  // Stage 3: Skill scoring
  const skillScores = computeSkillScores(attributions, executions);

  // Stage 4: Sentiment (run via skill orchestrator if content available)
  let sentiment: Record<string, unknown> | null = null;
  const topContent = await prisma.contentPerformance.findMany({
    where: { publishedAt: { gte: periodStart, lte: periodEnd } },
    orderBy: { benchmarkDelta: "desc" },
    take: 10,
  });
  if (topContent.length > 0) {
    const sentimentResult = await skillOrchestrator.executeSkill({
      skillPath: "analytics/feedback/sentiment-feedback-loop.md",
      context: { topContent: topContent.map((c) => ({ id: c.id, platform: c.platform, metrics: c.metrics })) },
    });
    if (sentimentResult.success) sentiment = sentimentResult.output as Record<string, unknown>;
  }

  // Stage 5: Revenue attribution
  let revenue: Record<string, unknown> | null = null;
  const revenueResult = await skillOrchestrator.executeSkill({
    skillPath: "analytics/revenue/revenue-attribution.md",
    context: {
      period: { start: periodStart.toISOString(), end: periodEnd.toISOString() },
      contentPerformances: topContent.map((c) => ({
        id: c.id,
        brandId: c.brandId,
        platform: c.platform,
        revenue: c.revenueGenerated,
        skillsUsed: c.skillsUsed,
      })),
    },
  });
  if (revenueResult.success) revenue = revenueResult.output as Record<string, unknown>;

  // Stage 6: Update learning logs
  const logsUpdated = await updateLearningLogs(skillScores, periodStart, periodEnd);

  // Stage 7: Strategy test management
  const testsManaged = await manageStrategyTests(periodEnd);

  // Emit event
  daftarEvents.emitEvent("learning_cycle.completed", {
    period: { start: periodStart.toISOString(), end: periodEnd.toISOString() },
    skillsScored: skillScores.length,
    logsUpdated,
    testsClosed: testsManaged.closed,
  });

  return {
    period: {
      start: periodStart.toISOString().slice(0, 10),
      end: periodEnd.toISOString().slice(0, 10),
    },
    attribution: attributions,
    skillScores,
    sentiment,
    revenue,
    testsManaged,
    reportGenerated: true,
  };
}

// ---------- Utility: Score a single content piece ----------

export async function scoreContent(contentPerformanceId: string): Promise<Record<string, unknown> | null> {
  const perf = await prisma.contentPerformance.findUnique({
    where: { id: contentPerformanceId },
  });
  if (!perf) return null;

  const result = await skillOrchestrator.executeSkill({
    skillPath: "analytics/performance/performance-attribution.md",
    context: {
      contentId: perf.id,
      platform: perf.platform,
      metrics: perf.metrics,
      skillsUsed: perf.skillsUsed,
      narrativeAngle: perf.narrativeAngle,
      hookType: perf.hookType,
    },
    brandId: perf.brandId,
    platform: perf.platform,
  });

  return result.success ? (result.output as Record<string, unknown>) : null;
}
