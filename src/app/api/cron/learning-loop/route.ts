import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  evaluatePerformanceData,
  type PerformanceRecord,
} from "@/lib/learning/evaluator";
import { proposeSkillUpdate } from "@/lib/learning/skill-mutator";
import { daftarEvents } from "@/lib/event-bus";
import type { Prisma } from "@prisma/client";
import { apiHandler } from "@/lib/api-handler";

/**
 * GET /api/cron/learning-loop
 *
 * Triggered by an external cron service (Vercel Cron, GitHub Actions, etc.).
 * Protected by CRON_SECRET bearer token.
 *
 * Pipeline:
 * 1. Fetch recent ContentPerformance records (last 7 days)
 * 2. Run evaluator -> compute success scores + detect hook failures
 * 3. For each hook failure, propose skill updates via the mutator
 * 4. Persist a SkillLearningLog entry for every affected skill
 * 5. Emit learning_loop.evaluated event
 */
export const GET = apiHandler(async (req: NextRequest) => {
  // -- Config ---
  const lookbackDays = parseInt(
    req.nextUrl.searchParams.get("days") ?? "7",
    10
  );
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  // -- Step 1: Fetch ContentPerformance --
  const rawRecords = await prisma.contentPerformance.findMany({
    where: {
      publishedAt: { gte: since },
    },
    orderBy: { publishedAt: "desc" },
  });

  if (rawRecords.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No content performance data in the lookback window",
      evaluated: 0,
      hookFailures: 0,
      learningLogsCreated: 0,
      timestamp: new Date().toISOString(),
    });
  }

  // Map Prisma records to evaluator input
  const records: PerformanceRecord[] = rawRecords.map((r) => ({
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

  // -- Step 2: Evaluate --
  const evaluation = evaluatePerformanceData(records);

  // -- Step 3: Update content performance tiers --
  for (const score of evaluation.scores) {
    await prisma.contentPerformance.update({
      where: { id: score.id },
      data: { performanceTier: score.tier },
    });
  }

  // -- Step 4: Propose skill updates for failures --
  let learningLogsCreated = 0;
  const proposals: Array<{
    skillPath: string;
    reasoning: string;
    confidence: number;
  }> = [];

  // Group hook failures by the skills that were used
  const failuresBySkill = new Map<
    string,
    Array<(typeof evaluation.hookFailures)[number]>
  >();

  for (const failure of evaluation.hookFailures) {
    for (const sp of failure.skillsUsed) {
      if (!failuresBySkill.has(sp)) failuresBySkill.set(sp, []);
      failuresBySkill.get(sp)!.push(failure);
    }
    // Also flag suggested skill paths
    for (const sp of failure.suggestedSkillPaths) {
      if (!failuresBySkill.has(sp)) failuresBySkill.set(sp, []);
      failuresBySkill.get(sp)!.push(failure);
    }
  }

  for (const [skillPath, failures] of failuresBySkill.entries()) {
    // Aggregate feedback from all failures for this skill
    const avgHookScore =
      failures.reduce((s, f) => s + f.hookScore, 0) / failures.length;
    const primaryPlatform = failures[0].platform;
    const primaryBrand = failures[0].brandId;

    const aggregateFeedback = {
      diagnosis: failures.map((f) => f.diagnosis).join(" | "),
      hookScore: avgHookScore,
      platform: primaryPlatform,
      brandId: primaryBrand,
      metrics: {
        ctr: avg(failures.map((f) => f.metrics.ctr)),
        retention: avg(failures.map((f) => f.metrics.retention)),
        engagementRate: avg(failures.map((f) => f.metrics.engagementRate)),
      },
      sampleSize: failures.length,
    };

    // Propose an update (reads the .md file, mock-rewrites RULES)
    const proposal = await proposeSkillUpdate(skillPath, aggregateFeedback);

    if (proposal) {
      proposals.push({
        skillPath: proposal.skillPath,
        reasoning: proposal.reasoning,
        confidence: proposal.confidence,
      });

      // Persist to SkillLearningLog
      const skill = await prisma.skill.findUnique({
        where: { path: skillPath },
      });

      if (skill) {
        await prisma.skillLearningLog.create({
          data: {
            skillId: skill.id,
            entry: {
              type: "hook_failure_feedback",
              hookScore: avgHookScore,
              platform: primaryPlatform,
              sampleSize: failures.length,
              diagnosis: aggregateFeedback.diagnosis,
              proposedChanges: proposal.diff.proposedRules,
              confidence: proposal.confidence,
            } as unknown as Prisma.InputJsonValue,
            source: "auto",
            periodStart: since,
            periodEnd: new Date(),
          },
        });
        learningLogsCreated++;
      }
    }
  }

  // -- Step 5: Emit event --
  daftarEvents.emitEvent("learning_loop.evaluated", {
    postsEvaluated: evaluation.totalPosts,
    avgScore: evaluation.avgSuccessScore,
    hookFailures: evaluation.hookFailures.length,
    skillProposals: proposals.length,
    learningLogsCreated,
    lookbackDays,
  });

  return NextResponse.json({
    success: true,
    evaluated: evaluation.totalPosts,
    avgSuccessScore: evaluation.avgSuccessScore,
    hookFailures: evaluation.hookFailures.length,
    hookFailureRate: evaluation.summary.hookFailureRate,
    learningLogsCreated,
    proposals: proposals.map((p) => ({
      skillPath: p.skillPath,
      reasoning: p.reasoning,
      confidence: p.confidence,
    })),
    tierBreakdown: {
      top: evaluation.summary.top,
      aboveAvg: evaluation.summary.aboveAvg,
      average: evaluation.summary.average,
      belowAvg: evaluation.summary.belowAvg,
      poor: evaluation.summary.poor,
    },
    timestamp: new Date().toISOString(),
  });
}, { requireCronSecret: true });

// --- Utility ---

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((s, v) => s + v, 0) / valid.length) * 100) / 100;
}
