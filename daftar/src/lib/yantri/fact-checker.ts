/**
 * Yantri Fact-Checking Middleware
 *
 * Before any generated content is saved, this module verifies factual
 * accuracy by cross-referencing the draft against the original signal
 * context. Uses a mock LLM call to identify deviations in dates,
 * names, statistics, and claims.
 *
 * In production, the LLM call would hit Claude/Gemini with the
 * fact-check-shield.md skill instructions as the system prompt.
 */

import { skillOrchestrator } from "@/lib/skill-orchestrator";

// ─── Types ────────────────────────────────────────────────

export interface SignalContext {
  title: string;
  content: string | null;
  source: string;
  stakeholders: Record<string, unknown> | null;
  eventMarkers: Record<string, unknown> | null;
  detectedAt: string;
}

export interface FactDeviation {
  claim: string;
  location: string;
  issue: string;
  severity: "critical" | "major" | "minor";
  suggestion: string | null;
}

export interface FactCheckResult {
  passed: boolean;
  totalClaims: number;
  verified: number;
  flagged: number;
  deviations: FactDeviation[];
  confidence: number; // 0-1 overall confidence in the draft's accuracy
  checkDurationMs: number;
}

// ─── Extraction helpers ───────────────────────────────────

/** Extract date-like patterns from text (ISO, "March 2026", "3/10/2026", etc.) */
function extractDates(text: string): string[] {
  const patterns = [
    /\d{4}-\d{2}-\d{2}/g, // ISO
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g, // MM/DD/YYYY
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}/gi,
    /\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi,
  ];

  const dates: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) dates.push(...matches);
  }
  return [...new Set(dates)];
}

/** Extract numbers and statistics (percentages, large numbers, etc.) */
function extractStatistics(text: string): string[] {
  const patterns = [
    /\d+(?:\.\d+)?%/g, // percentages
    /(?:₹|\$|€|£)\s?\d[\d,.]*/g, // currency figures
    /\d{1,3}(?:,\d{3})+/g, // comma-separated numbers
    /\d+(?:\.\d+)?\s*(?:million|billion|trillion|crore|lakh|thousand)/gi,
  ];

  const stats: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) stats.push(...matches);
  }
  return [...new Set(stats)];
}

/** Extract capitalized proper nouns (names of people, orgs, places) */
function extractNames(text: string): string[] {
  // Match sequences of 2+ capitalized words (likely proper nouns)
  const matches = text.match(
    /(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g
  );
  if (!matches) return [];

  // Filter out common sentence starters
  const ignore = new Set([
    "The",
    "This",
    "That",
    "These",
    "Those",
    "According",
    "However",
    "Meanwhile",
    "Furthermore",
    "In Addition",
  ]);

  return [...new Set(
    matches.filter((m) => !ignore.has(m.split(" ")[0]))
  )];
}

// ─── Mock LLM verification ───────────────────────────────

/**
 * Simulate an LLM-based claim-by-claim verification.
 * In production, this calls the LLM with the fact-check-shield.md
 * skill instructions + the draft + the source signal as context.
 *
 * The mock implementation does deterministic cross-referencing:
 * - Checks if dates in the draft also appear in the signal
 * - Checks if stats in the draft also appear in the signal
 * - Checks if named entities in the draft appear in the signal
 */
function mockVerifyClaims(
  draftContent: string,
  signal: SignalContext
): FactDeviation[] {
  const deviations: FactDeviation[] = [];
  const signalText = [
    signal.title,
    signal.content ?? "",
    JSON.stringify(signal.stakeholders ?? {}),
    JSON.stringify(signal.eventMarkers ?? {}),
  ].join(" ");

  // ── Verify dates ────────────────────────────────────
  const draftDates = extractDates(draftContent);
  const signalDates = extractDates(signalText);

  for (const date of draftDates) {
    const normalized = date.toLowerCase().replace(/,/g, "").trim();
    const found = signalDates.some((sd) =>
      sd.toLowerCase().replace(/,/g, "").trim().includes(normalized) ||
      normalized.includes(sd.toLowerCase().replace(/,/g, "").trim())
    );

    if (!found) {
      deviations.push({
        claim: `Date "${date}" appears in the draft`,
        location: `near "${draftContent.substring(Math.max(0, draftContent.indexOf(date) - 30), draftContent.indexOf(date) + date.length + 30).trim()}"`,
        issue: `Date "${date}" is not present in the source signal. It may be fabricated or inferred.`,
        severity: "major",
        suggestion: "Remove or replace with a verified date from the source.",
      });
    }
  }

  // ── Verify statistics ────────────────────────────────
  const draftStats = extractStatistics(draftContent);
  const signalStats = extractStatistics(signalText);

  for (const stat of draftStats) {
    const found = signalStats.some((ss) => ss === stat);

    if (!found) {
      deviations.push({
        claim: `Statistic "${stat}" appears in the draft`,
        location: `near "${draftContent.substring(Math.max(0, draftContent.indexOf(stat) - 30), draftContent.indexOf(stat) + stat.length + 30).trim()}"`,
        issue: `Statistic "${stat}" cannot be verified against the source signal.`,
        severity: "critical",
        suggestion: "Cross-reference with the original data source or remove.",
      });
    }
  }

  // ── Verify named entities ───────────────────────────
  const draftNames = extractNames(draftContent);
  const signalLower = signalText.toLowerCase();

  for (const name of draftNames) {
    if (!signalLower.includes(name.toLowerCase())) {
      deviations.push({
        claim: `Name "${name}" appears in the draft`,
        location: `in generated content`,
        issue: `"${name}" is not mentioned in the source signal. It may be hallucinated.`,
        severity: "major",
        suggestion: `Verify "${name}" exists in the context or remove.`,
      });
    }
  }

  return deviations;
}

// ─── Main fact-check function ─────────────────────────────

/**
 * Run fact-checking on generated content against the source signal.
 *
 * @param draftContent  The AI-generated content to verify
 * @param signal        The original signal context (dates, names, facts)
 * @param options       Optional: skill execution for audit trail
 * @returns FactCheckResult with pass/fail and any deviations
 */
export async function factCheck(
  draftContent: string,
  signal: SignalContext,
  options?: { brandId?: string; deliverableId?: string }
): Promise<FactCheckResult> {
  const start = Date.now();

  // Execute the fact-check-shield skill for audit trail
  const skillResult = await skillOrchestrator.executeSkill({
    skillPath: "narrative/research/fact-check-shield.md",
    context: {
      draft_content: draftContent,
      fact_dossier: {
        title: signal.title,
        content: signal.content,
        source: signal.source,
        stakeholders: signal.stakeholders,
        eventMarkers: signal.eventMarkers,
        detectedAt: signal.detectedAt,
      },
    },
    brandId: options?.brandId,
    deliverableId: options?.deliverableId,
  });

  // Run the actual verification (mock LLM)
  const deviations = mockVerifyClaims(draftContent, signal);

  // Compute result
  const draftDates = extractDates(draftContent);
  const draftStats = extractStatistics(draftContent);
  const draftNames = extractNames(draftContent);
  const totalClaims = draftDates.length + draftStats.length + draftNames.length;
  const flagged = deviations.length;
  const verified = totalClaims - flagged;

  const hasCritical = deviations.some((d) => d.severity === "critical");
  const hasMajor = deviations.filter((d) => d.severity === "major").length;

  // Pass criteria: no critical deviations, at most 1 major deviation
  const passed = !hasCritical && hasMajor <= 1;

  const confidence =
    totalClaims > 0
      ? Math.round(((verified / totalClaims) * 100)) / 100
      : 1;

  return {
    passed,
    totalClaims,
    verified,
    flagged,
    deviations,
    confidence,
    checkDurationMs: Date.now() - start,
  };
}
