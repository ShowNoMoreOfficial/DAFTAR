/**
 * Learning Loop — Skill Mutator
 *
 * Reads an existing .md skill file, applies feedback from the evaluator,
 * and returns a proposed rewrite of the # RULES section. The LLM call is
 * mocked — in production this would hit Claude or GPT-4 with the skill
 * content + performance feedback as context.
 */

import { promises as fs } from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────

export interface SkillFeedback {
  diagnosis: string;
  hookScore: number;
  platform: string;
  brandId: string;
  metrics: {
    ctr: number | null;
    retention: number | null;
    engagementRate: number | null;
  };
  sampleSize?: number;
}

export interface SkillUpdateProposal {
  skillPath: string;
  originalContent: string;
  proposedContent: string;
  changedSection: string; // "RULES"
  diff: {
    originalRules: string;
    proposedRules: string;
  };
  reasoning: string;
  confidence: number; // 0-1
}

// ─── Helpers ──────────────────────────────────────────────

const SKILLS_ROOT = path.resolve(process.cwd(), "skills");

/**
 * Extract a markdown section by heading.
 * Returns the content between `# HEADING` and the next `#` heading (or EOF).
 */
function extractSection(
  markdown: string,
  heading: string
): { content: string; startIdx: number; endIdx: number } | null {
  // Match `# HEADING` or `## HEADING` (any level)
  const pattern = new RegExp(
    `^(#{1,3})\\s+${escapeRegex(heading)}\\s*$`,
    "mi"
  );
  const match = pattern.exec(markdown);
  if (!match) return null;

  const level = match[1].length;
  const startIdx = match.index;
  const afterHeading = startIdx + match[0].length;

  // Find next heading of same or higher level
  const nextPattern = new RegExp(`^#{1,${level}}\\s+`, "m");
  const rest = markdown.slice(afterHeading);
  const nextMatch = nextPattern.exec(rest);

  const endIdx = nextMatch
    ? afterHeading + nextMatch.index
    : markdown.length;

  return {
    content: markdown.slice(afterHeading, endIdx).trim(),
    startIdx,
    endIdx,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Mock LLM call that rewrites the RULES section based on feedback.
 * In production, this would call Claude/GPT-4 with a structured prompt.
 */
function mockLLMRewriteRules(
  currentRules: string,
  feedback: SkillFeedback,
  skillPath: string
): { newRules: string; reasoning: string; confidence: number } {
  const lines = currentRules.split("\n").filter((l) => l.trim().length > 0);
  const newLines: string[] = [];
  let changesMade = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // If CTR is low, add urgency/specificity guidance
    if (
      feedback.metrics.ctr !== null &&
      feedback.metrics.ctr < 3.0 &&
      trimmed.toLowerCase().includes("hook")
    ) {
      newLines.push(line);
      newLines.push(
        `- UPDATED: Lead with a specific number, bold claim, or direct question in the first 8 words (CTR was ${feedback.metrics.ctr.toFixed(1)}%, target ≥4.5%)`
      );
      changesMade++;
      continue;
    }

    // If retention is low, add pacing guidance
    if (
      feedback.metrics.retention !== null &&
      feedback.metrics.retention < 40 &&
      trimmed.toLowerCase().includes("retention")
    ) {
      newLines.push(line);
      newLines.push(
        `- UPDATED: Insert a pattern interrupt (visual cut, tone shift, or rhetorical question) before the 30-second mark (retention was ${feedback.metrics.retention.toFixed(0)}%, target ≥45%)`
      );
      changesMade++;
      continue;
    }

    // If engagement is low, add CTA guidance
    if (
      feedback.metrics.engagementRate !== null &&
      feedback.metrics.engagementRate < 2.5 &&
      trimmed.toLowerCase().includes("engagement")
    ) {
      newLines.push(line);
      newLines.push(
        `- UPDATED: Include an explicit engagement prompt (poll, question, or hot-take invitation) within the first 3 sentences (engagement was ${feedback.metrics.engagementRate.toFixed(1)}%, target ≥3.5%)`
      );
      changesMade++;
      continue;
    }

    newLines.push(line);
  }

  // If no specific lines matched, append general feedback
  if (changesMade === 0) {
    newLines.push("");
    newLines.push(`### Performance-Based Additions (auto-generated)`);
    newLines.push("");
    newLines.push(`Based on ${feedback.sampleSize ?? "recent"} posts on ${feedback.platform}:`);
    newLines.push(`- Hook score: ${feedback.hookScore.toFixed(1)}/10 — needs improvement`);
    if (feedback.metrics.ctr !== null) {
      newLines.push(
        `- Prioritize thumb-stopping first lines; current CTR is ${feedback.metrics.ctr.toFixed(1)}%`
      );
    }
    if (feedback.metrics.retention !== null) {
      newLines.push(
        `- Front-load value delivery; retention at ${feedback.metrics.retention.toFixed(0)}%`
      );
    }
    if (feedback.metrics.engagementRate !== null) {
      newLines.push(
        `- Add stronger CTAs; engagement rate at ${feedback.metrics.engagementRate.toFixed(1)}%`
      );
    }
    newLines.push(
      `- Diagnosis: ${feedback.diagnosis}`
    );
    changesMade++;
  }

  const confidence = changesMade > 2 ? 0.85 : changesMade > 0 ? 0.7 : 0.5;

  return {
    newRules: newLines.join("\n"),
    reasoning: `Applied ${changesMade} rule update(s) for ${feedback.platform} based on hook score ${feedback.hookScore.toFixed(1)}/10. ${feedback.diagnosis}`,
    confidence,
  };
}

// ─── Main function ────────────────────────────────────────

export async function proposeSkillUpdate(
  skillPath: string,
  feedback: SkillFeedback
): Promise<SkillUpdateProposal | null> {
  // Resolve to absolute path under /skills/
  const absolutePath = path.isAbsolute(skillPath)
    ? skillPath
    : path.join(SKILLS_ROOT, skillPath);

  let originalContent: string;
  try {
    originalContent = await fs.readFile(absolutePath, "utf-8");
  } catch {
    console.error(`[skill-mutator] Cannot read skill file: ${absolutePath}`);
    return null;
  }

  // Extract the RULES section
  const rulesSection = extractSection(originalContent, "RULES");

  if (!rulesSection) {
    // No RULES section found — try "Rules" or "rules"
    const altSection =
      extractSection(originalContent, "Rules") ??
      extractSection(originalContent, "rules");

    if (!altSection) {
      console.warn(
        `[skill-mutator] No RULES section found in ${skillPath}. Appending new section.`
      );

      // Create a new RULES section at the end
      const { newRules, reasoning, confidence } = mockLLMRewriteRules(
        "",
        feedback,
        skillPath
      );

      const proposedContent =
        originalContent.trimEnd() + "\n\n# RULES\n\n" + newRules + "\n";

      return {
        skillPath,
        originalContent,
        proposedContent,
        changedSection: "RULES",
        diff: { originalRules: "(none)", proposedRules: newRules },
        reasoning,
        confidence,
      };
    }

    // Use the alt-cased section
    return buildProposal(originalContent, altSection, feedback, skillPath);
  }

  return buildProposal(originalContent, rulesSection, feedback, skillPath);
}

function buildProposal(
  originalContent: string,
  section: { content: string; startIdx: number; endIdx: number },
  feedback: SkillFeedback,
  skillPath: string
): SkillUpdateProposal {
  const { newRules, reasoning, confidence } = mockLLMRewriteRules(
    section.content,
    feedback,
    skillPath
  );

  // Reconstruct: keep heading line, replace body
  const headingLine = originalContent
    .slice(section.startIdx, section.startIdx + 200)
    .split("\n")[0];

  const proposedContent =
    originalContent.slice(0, section.startIdx) +
    headingLine +
    "\n\n" +
    newRules +
    "\n\n" +
    originalContent.slice(section.endIdx);

  return {
    skillPath,
    originalContent,
    proposedContent,
    changedSection: "RULES",
    diff: { originalRules: section.content, proposedRules: newRules },
    reasoning,
    confidence,
  };
}
