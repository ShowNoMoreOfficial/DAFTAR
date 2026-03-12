/**
 * Performance Scorer — Scores content performance and generates
 * attribution analysis using the performance-attribution skill.
 *
 * Called by the Inngest performance loop at 24h, 72h, 7d windows.
 */

import { prisma } from "@/lib/prisma";
import { routeToModel } from "@/lib/yantri/model-router";
import { SkillOrchestrator, type SkillFile } from "@/lib/skill-orchestrator";

// ─── Types ───

export interface PerformanceMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  retention?: number;
  ctr?: number;
  watchTime?: number;
  saves?: number;
  impressions?: number;
}

export interface AttributionResult {
  overallScore: number;
  tier: "top_10" | "above_avg" | "average" | "below_avg" | "poor";
  benchmarkDelta: number;
  attribution: {
    skillContribution: { score: number; topSkill: string; weakestSkill: string };
    hookContribution: { score: number; hookType: string; platformAvg: number };
    narrativeContribution: { score: number; angle: string; timeliness: string };
    externalFactors: { score: number; notes: string };
  };
  recommendations: string[];
  skillScores: Record<string, number>;
  learningEntries: LearningEntry[];
}

export interface LearningEntry {
  skillPath: string;
  entry: string;
  score: number;
  contentType: string;
  platform: string;
  angle: string;
}

// ─── Score a deliverable's performance ───

export async function scoreDeliverablePerformance(
  deliverableId: string,
  metrics: PerformanceMetrics,
  window: "24h" | "72h" | "7d"
): Promise<AttributionResult | null> {
  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: {
      brand: { select: { id: true, name: true, slug: true } },
      tree: { select: { title: true, signalData: true } },
    },
  });

  if (!deliverable) return null;

  // Get skills used in generation
  const skillExecutions = await prisma.skillExecution.findMany({
    where: { deliverableId },
    include: { skill: { select: { path: true, name: true } } },
  });

  const skillsUsed = skillExecutions.map((e) => e.skill.path);

  // Get brand benchmarks from recent performance data
  const benchmarks = await getBrandPlatformBenchmarks(
    deliverable.brandId,
    deliverable.platform
  );

  // Extract narrative angle and hook type from tree signalData
  const signalData = deliverable.tree?.signalData as Record<string, unknown> | null;
  const narrativeAngle = (signalData?.angle as string) ?? "general";
  const hookType = extractHookType(deliverable.copyMarkdown);

  // Load attribution skill
  const orchestrator = new SkillOrchestrator();
  let attributionSkill: SkillFile | null = null;
  try {
    attributionSkill = await orchestrator.loadSkill(
      "analytics/performance/performance-attribution.md"
    );
  } catch {
    // Non-critical
  }

  // Score via LLM using the attribution skill framework
  const systemPrompt = `You are the Performance Attribution Analyst for ${deliverable.brand.name}.
${attributionSkill?.instructions ? `\n## ATTRIBUTION FRAMEWORK\n${attributionSkill.instructions}` : ""}

Score this content piece and attribute performance to specific factors.
Return ONLY valid JSON matching the schema below.`;

  const userPrompt = `## CONTENT DETAILS
- Brand: ${deliverable.brand.name}
- Platform: ${deliverable.platform}
- Pipeline: ${deliverable.pipelineType}
- Topic: ${deliverable.tree?.title ?? "Unknown"}
- Narrative Angle: ${narrativeAngle}
- Hook Type: ${hookType}
- Measurement Window: ${window}

## METRICS
${JSON.stringify(metrics, null, 2)}

## BENCHMARKS (brand/platform averages)
${JSON.stringify(benchmarks, null, 2)}

## SKILLS USED
${skillsUsed.length > 0 ? skillsUsed.join("\n") : "No skill execution records found"}

## CONTENT PREVIEW
${deliverable.copyMarkdown?.slice(0, 1500) ?? "N/A"}

## TASK
1. Calculate an overallScore (1-10) based on metrics vs benchmarks
2. Determine performance tier (top_10, above_avg, average, below_avg, poor)
3. Calculate benchmarkDelta (% above/below average)
4. Attribute performance to skills, hook, narrative, external factors
5. Score each skill used (1-10 based on its contribution)
6. Generate specific learning entries for each relevant skill

Return JSON:
{
  "overallScore": 7.5,
  "tier": "above_avg",
  "benchmarkDelta": 23.5,
  "attribution": {
    "skillContribution": { "score": 8, "topSkill": "skill-path", "weakestSkill": "skill-path" },
    "hookContribution": { "score": 7, "hookType": "data-first", "platformAvg": 6.5 },
    "narrativeContribution": { "score": 8, "angle": "contrarian", "timeliness": "peak" },
    "externalFactors": { "score": 6, "notes": "..." }
  },
  "recommendations": ["..."],
  "skillScores": { "skill/path.md": 8.5 },
  "learningEntries": [
    {
      "skillPath": "skill/path.md",
      "entry": "Human-readable learning: what worked/didn't for this skill",
      "score": 8.5,
      "contentType": "${deliverable.pipelineType}",
      "platform": "${deliverable.platform}",
      "angle": "${narrativeAngle}"
    }
  ]
}`;

  const result = await routeToModel("analysis", systemPrompt, userPrompt, {
    temperature: 0.2,
  });

  if (!result.parsed || typeof result.parsed !== "object") {
    console.error("[performance-scorer] Failed to parse attribution result");
    return null;
  }

  return result.parsed as AttributionResult;
}

// ─── Save performance + attribution to DB ───

export async function savePerformanceRecord(
  deliverableId: string,
  brandId: string,
  platform: string,
  metrics: PerformanceMetrics,
  attribution: AttributionResult,
  skillsUsed: string[],
  window: "24h" | "72h" | "7d"
) {
  // Upsert ContentPerformance
  const existing = await prisma.contentPerformance.findFirst({
    where: { deliverableId },
  });

  if (existing) {
    await prisma.contentPerformance.update({
      where: { id: existing.id },
      data: {
        metrics: metrics as object,
        performanceTier: attribution.tier,
        benchmarkDelta: attribution.benchmarkDelta,
        narrativeAngle: attribution.attribution.narrativeContribution.angle,
        hookType: attribution.attribution.hookContribution.hookType,
      },
    });
  } else {
    await prisma.contentPerformance.create({
      data: {
        deliverableId,
        brandId,
        platform,
        publishedAt: new Date(),
        metrics: metrics as object,
        skillsUsed,
        narrativeAngle: attribution.attribution.narrativeContribution.angle,
        hookType: attribution.attribution.hookContribution.hookType,
        performanceTier: attribution.tier,
        benchmarkDelta: attribution.benchmarkDelta,
      },
    });
  }

  // Write learning entries to SkillLearningLog
  const now = new Date();
  const windowMs =
    window === "24h"
      ? 24 * 60 * 60 * 1000
      : window === "72h"
        ? 72 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;
  const periodStart = new Date(now.getTime() - windowMs);

  for (const learning of attribution.learningEntries) {
    try {
      const skill = await prisma.skill.findFirst({
        where: { path: learning.skillPath },
      });

      if (skill) {
        await prisma.skillLearningLog.create({
          data: {
            skillId: skill.id,
            entry: {
              pattern: learning.entry,
              score: learning.score,
              contentType: learning.contentType,
              platform: learning.platform,
              angle: learning.angle,
              window,
              deliverableId,
              recordedAt: now.toISOString(),
            },
            source: "auto",
            periodStart,
            periodEnd: now,
          },
        });

        // Update the skill execution score if we have one
        const execution = await prisma.skillExecution.findFirst({
          where: {
            deliverableId,
            skillId: skill.id,
          },
        });

        if (execution) {
          await prisma.skillExecution.update({
            where: { id: execution.id },
            data: { performanceScore: learning.score },
          });
        }
      }
    } catch {
      // Non-critical — don't break the loop
    }
  }

  // Also update the actual .md skill files' Learning Log sections
  await updateSkillFileLearningLogs(attribution.learningEntries, window);
}

// ─── Update .md skill file Learning Log sections ───

async function updateSkillFileLearningLogs(
  entries: LearningEntry[],
  window: string
) {
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const SKILLS_DIR = path.join(process.cwd(), "skills");
  const now = new Date();
  const dateStr = `${now.toLocaleString("en-US", { month: "long" })} ${now.getFullYear()}`;

  for (const entry of entries) {
    try {
      const fullPath = path.join(SKILLS_DIR, entry.skillPath);
      const content = await fs.readFile(fullPath, "utf-8");

      // Find the Learning Log section
      const logMarker = "## Learning Log";
      const logIdx = content.indexOf(logMarker);
      if (logIdx === -1) continue;

      const afterMarker = logIdx + logMarker.length;
      const existingLog = content.slice(afterMarker);

      // Build new entry line
      const tierLabel =
        entry.score >= 9 ? "exceptional"
          : entry.score >= 7 ? "high"
            : entry.score >= 5 ? "average"
              : "low";

      const newLine = `\n- ${entry.entry} (score ${entry.score}, ${entry.platform}, ${dateStr}, ${window} window)`;

      // Don't duplicate — check if similar entry exists
      if (existingLog.includes(entry.entry.slice(0, 50))) continue;

      // Remove placeholder comment if present
      let updatedLog = existingLog.replace(
        /\n<!-- Auto-updated by the learning loop -->/,
        ""
      );

      // Keep only last 20 entries to prevent bloat
      const lines = updatedLog.split("\n").filter((l) => l.startsWith("- "));
      if (lines.length >= 20) {
        // Remove oldest
        const oldestLine = lines[0];
        updatedLog = updatedLog.replace(oldestLine + "\n", "");
      }

      const newContent =
        content.slice(0, afterMarker) + newLine + updatedLog;

      await fs.writeFile(fullPath, newContent, "utf-8");
    } catch {
      // Skill file may not exist or be read-only — non-critical
    }
  }
}

// ─── Helpers ───

async function getBrandPlatformBenchmarks(
  brandId: string,
  platform: string
): Promise<Record<string, unknown>> {
  const recentPerformance = await prisma.contentPerformance.findMany({
    where: { brandId, platform },
    orderBy: { lastUpdated: "desc" },
    take: 30,
  });

  if (recentPerformance.length === 0) {
    return { note: "No historical benchmarks — first content on this platform/brand" };
  }

  // Calculate benchmarks from historical data
  const scores = recentPerformance
    .map((p) => p.benchmarkDelta)
    .filter((d): d is number => d !== null);

  const tiers = recentPerformance
    .map((p) => p.performanceTier)
    .filter(Boolean);

  const metrics = recentPerformance.map(
    (p) => p.metrics as Record<string, unknown>
  );

  // Aggregate views
  const views = metrics
    .map((m) => (m.views as number) ?? 0)
    .filter((v) => v > 0);

  const avgViews =
    views.length > 0 ? views.reduce((a, b) => a + b, 0) / views.length : 0;

  const engagementRates = metrics
    .map((m) => (m.engagementRate as number) ?? 0)
    .filter((v) => v > 0);

  const avgEngagement =
    engagementRates.length > 0
      ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
      : 0;

  return {
    totalRecords: recentPerformance.length,
    avgViews: Math.round(avgViews),
    avgEngagementRate: Math.round(avgEngagement * 1000) / 1000,
    avgBenchmarkDelta:
      scores.length > 0
        ? Math.round(
            (scores.reduce((a, b) => a + b, 0) / scores.length) * 10
          ) / 10
        : null,
    tierDistribution: {
      top_10: tiers.filter((t) => t === "top_10").length,
      above_avg: tiers.filter((t) => t === "above_avg").length,
      average: tiers.filter((t) => t === "average").length,
      below_avg: tiers.filter((t) => t === "below_avg").length,
      poor: tiers.filter((t) => t === "poor").length,
    },
  };
}

function extractHookType(copyMarkdown: string | null): string {
  if (!copyMarkdown) return "unknown";
  const lower = copyMarkdown.toLowerCase();
  // Simple heuristic based on content patterns
  if (lower.includes("[hook]")) {
    const hookSection = copyMarkdown.match(
      /\[HOOK\]\*?\*?\n([\s\S]*?)(?=\n\*?\*?\[|$)/i
    );
    if (hookSection) {
      const hook = hookSection[1].trim();
      if (hook.includes("?")) return "question";
      if (/\d+[%$₹]/.test(hook)) return "data-first";
      if (hook.startsWith('"') || hook.includes("story")) return "story";
      return "statement";
    }
  }
  return "unknown";
}

// ─── Simulate metrics for platforms without real API connections ───
// TODO: Replace with real platform API calls when Relay is wired

export function simulateMetrics(
  platform: string,
  window: "24h" | "72h" | "7d"
): PerformanceMetrics {
  const multiplier = window === "24h" ? 1 : window === "72h" ? 2.5 : 5;

  switch (platform) {
    case "YOUTUBE":
      return {
        views: Math.round((3000 + Math.random() * 15000) * multiplier),
        likes: Math.round((150 + Math.random() * 800) * multiplier),
        comments: Math.round((20 + Math.random() * 100) * multiplier),
        shares: Math.round((10 + Math.random() * 50) * multiplier),
        retention: 35 + Math.random() * 30,
        ctr: 3 + Math.random() * 8,
        watchTime: 120 + Math.random() * 300,
      };
    case "X_THREAD":
    case "X_SINGLE":
      return {
        impressions: Math.round((5000 + Math.random() * 20000) * multiplier),
        likes: Math.round((100 + Math.random() * 500) * multiplier),
        comments: Math.round((10 + Math.random() * 80) * multiplier),
        shares: Math.round((30 + Math.random() * 200) * multiplier),
      };
    case "META_CAROUSEL":
    case "META_REEL":
    case "META_POST":
      return {
        impressions: Math.round((2000 + Math.random() * 10000) * multiplier),
        likes: Math.round((200 + Math.random() * 1000) * multiplier),
        comments: Math.round((15 + Math.random() * 60) * multiplier),
        shares: Math.round((20 + Math.random() * 100) * multiplier),
        saves: Math.round((50 + Math.random() * 200) * multiplier),
      };
    default:
      return {
        views: Math.round((1000 + Math.random() * 5000) * multiplier),
        likes: Math.round((50 + Math.random() * 200) * multiplier),
        comments: Math.round((5 + Math.random() * 30) * multiplier),
      };
  }
}
