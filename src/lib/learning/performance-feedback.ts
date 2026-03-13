/**
 * Performance Feedback — Skill Learning Log Updater
 *
 * When content is scored by the evaluator, this module:
 *  - Writes positive learnings to SkillLearningLog for high performers (score ≥ 8.0)
 *  - Writes warnings to SkillLearningLog for poor performers (score < 4.0)
 *  - Updates the actual .md skill files' Learning Log section
 *
 * This closes the feedback loop: published content → performance → skill improvement.
 */

import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import type { PostScore } from "./evaluator";

const SKILLS_ROOT = path.resolve(process.cwd(), "skills");

const HIGH_SCORE_THRESHOLD = 8.0;
const LOW_SCORE_THRESHOLD = 4.0;

// ─── Update skill learning logs from scores ──────────────

export async function updateSkillLearningLogs(
  scores: PostScore[]
): Promise<number> {
  let logsCreated = 0;

  // Get ContentPerformance records for these scores
  const scoreIds = scores.map((s) => s.id);
  const perfRecords = await prisma.contentPerformance.findMany({
    where: { id: { in: scoreIds } },
  });

  const perfMap = new Map(perfRecords.map((p) => [p.id, p]));

  for (const score of scores) {
    const perf = perfMap.get(score.id);
    if (!perf || perf.skillsUsed.length === 0) continue;

    const metrics = (perf.metrics ?? {}) as Record<string, unknown>;
    const title = perf.narrativeAngle || perf.hookType || "content";

    if (score.successScore >= HIGH_SCORE_THRESHOLD) {
      // ── High performer: record what worked ──────────
      for (const skillPath of perf.skillsUsed) {
        const skill = await prisma.skill.findUnique({
          where: { path: skillPath },
        });
        if (!skill) continue;

        const entry = {
          type: "high_performer",
          score: score.successScore,
          tier: score.tier,
          platform: score.platform,
          brandId: score.brandId,
          hookScore: score.hookScore,
          engagementScore: score.engagementScore,
          reachScore: score.reachScore,
          title,
          pattern: detectSuccessPattern(metrics, score),
          recommendation: `This pattern works well on ${score.platform}. Replicate.`,
        };

        await prisma.skillLearningLog.create({
          data: {
            skillId: skill.id,
            entry: entry as object,
            source: "auto",
            periodStart: new Date(Date.now() - 7 * 86400000),
            periodEnd: new Date(),
          },
        });

        // Append to .md skill file
        await appendToSkillLearningLog(
          skillPath,
          `[${new Date().toISOString().split("T")[0]}] SUCCESS: "${title}" scored ${score.successScore.toFixed(1)}/10 on ${score.platform}. ` +
            `Pattern: ${entry.pattern}. Hook: ${score.hookScore.toFixed(1)}, Engagement: ${score.engagementScore.toFixed(1)}, Reach: ${score.reachScore.toFixed(1)}.`
        );

        logsCreated++;
      }
    } else if (score.successScore < LOW_SCORE_THRESHOLD) {
      // ── Low performer: record warning ───────────────
      for (const skillPath of perf.skillsUsed) {
        const skill = await prisma.skill.findUnique({
          where: { path: skillPath },
        });
        if (!skill) continue;

        const entry = {
          type: "low_performer",
          score: score.successScore,
          tier: score.tier,
          platform: score.platform,
          brandId: score.brandId,
          hookScore: score.hookScore,
          engagementScore: score.engagementScore,
          reachScore: score.reachScore,
          title,
          diagnosis: diagnoseFailure(metrics, score),
          recommendation: `Avoid this pattern on ${score.platform}. Review hook and engagement approach.`,
        };

        await prisma.skillLearningLog.create({
          data: {
            skillId: skill.id,
            entry: entry as object,
            source: "auto",
            periodStart: new Date(Date.now() - 7 * 86400000),
            periodEnd: new Date(),
          },
        });

        // Append warning to .md skill file
        await appendToSkillLearningLog(
          skillPath,
          `[${new Date().toISOString().split("T")[0]}] WARNING: "${title}" scored ${score.successScore.toFixed(1)}/10 on ${score.platform}. ` +
            `Avoid: ${entry.diagnosis}. Hook: ${score.hookScore.toFixed(1)}, Engagement: ${score.engagementScore.toFixed(1)}, Reach: ${score.reachScore.toFixed(1)}.`
        );

        logsCreated++;
      }
    }
  }

  return logsCreated;
}

// ─── Detect what made content succeed ─────────────────────

function detectSuccessPattern(
  metrics: Record<string, unknown>,
  score: PostScore
): string {
  const parts: string[] = [];

  if (score.hookScore >= 8.0) parts.push("strong hook");
  if (score.engagementScore >= 8.0) parts.push("high engagement");
  if (score.reachScore >= 8.0) parts.push("viral reach");

  const ctr = metrics.ctr as number | undefined;
  if (ctr && ctr > 5) parts.push(`high CTR (${ctr.toFixed(1)}%)`);

  const retention = metrics.retention as number | undefined;
  if (retention && retention > 60) parts.push(`strong retention (${retention.toFixed(0)}%)`);

  const engRate = metrics.engagementRate as number | undefined;
  if (engRate && engRate > 5) parts.push(`engagement rate ${engRate.toFixed(1)}%`);

  return parts.length > 0 ? parts.join(", ") : "solid overall performance";
}

// ─── Diagnose what went wrong ─────────────────────────────

function diagnoseFailure(
  metrics: Record<string, unknown>,
  score: PostScore
): string {
  const parts: string[] = [];

  if (score.hookScore < 3.0) parts.push("weak hook — didn't capture attention");
  if (score.engagementScore < 3.0) parts.push("low engagement — audience didn't interact");
  if (score.reachScore < 3.0) parts.push("poor reach — didn't surface in algorithms");

  const ctr = metrics.ctr as number | undefined;
  if (ctr !== undefined && ctr < 2) parts.push(`CTR too low (${ctr.toFixed(1)}%)`);

  const retention = metrics.retention as number | undefined;
  if (retention !== undefined && retention < 30) parts.push(`retention dropped (${retention.toFixed(0)}%)`);

  return parts.length > 0 ? parts.join("; ") : "underperformed across metrics";
}

// ─── Append entry to skill file's Learning Log section ────

async function appendToSkillLearningLog(
  skillPath: string,
  entry: string
): Promise<void> {
  const absolutePath = path.isAbsolute(skillPath)
    ? skillPath
    : path.join(SKILLS_ROOT, skillPath);

  try {
    let content = await fs.readFile(absolutePath, "utf-8");

    // Find Learning Log section
    const logMatch = /^(#{1,3})\s+Learning Log\s*$/im.exec(content);

    if (logMatch) {
      // Insert after the Learning Log heading
      const insertPos = logMatch.index + logMatch[0].length;
      content =
        content.slice(0, insertPos) +
        "\n" +
        entry +
        content.slice(insertPos);
    } else {
      // No Learning Log section — append one
      content = content.trimEnd() + "\n\n## Learning Log\n\n" + entry + "\n";
    }

    await fs.writeFile(absolutePath, content, "utf-8");
  } catch (err) {
    // Non-critical: skill file might not exist on disk in production
    console.warn(
      `[performance-feedback] Could not update skill file ${skillPath}:`,
      err instanceof Error ? err.message : err
    );
  }
}
