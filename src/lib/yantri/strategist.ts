/**
 * Yantri Strategist
 *
 * Given a NarrativeTree and a set of Brands, the strategist determines:
 * 1. Which brands should cover this story
 * 2. What angles each brand should take
 * 3. What content types and platforms to target
 * 4. Priority and urgency scoring
 *
 * Uses the model-router to call the LLM with brand context.
 */

import { Brand } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { routeToModel } from "./model-router";

// ─── Types ────────────────────────────────────────────────

export interface BrandStrategy {
  brandId: string;
  brandName: string;
  shouldCover: boolean;
  reason: string;
  angles: StrategyAngle[];
  priority: number; // 1-10
  urgency: "breaking" | "high" | "normal" | "low";
}

export interface StrategyAngle {
  angle: string;
  whyThisAngle: string;
  informationGap: string;
  contentTypes: ContentTypeRecommendation[];
  priority: number; // 1-10
}

export interface ContentTypeRecommendation {
  type: string;
  platform: string;
  rationale: string;
}

export interface StrategyResult {
  treeId: string;
  treeTitle: string;
  strategies: BrandStrategy[];
  generatedAt: string;
  model: string;
}

// ─── Brand context builder ───────────────────────────────

function buildBrandContext(brand: Brand): string {
  const platforms = JSON.parse(brand.activePlatforms || "[]");
  const covers = JSON.parse(brand.editorialCovers || "[]");
  const never = JSON.parse(brand.editorialNever || "[]");
  const priorities = JSON.parse(brand.editorialPriorities || "[]");

  return `
Brand: ${brand.name}
Tagline: ${(brand as Record<string, unknown>).tagline ?? "N/A"}
Language: ${brand.language || "English"}
Tone: ${brand.tone || "neutral"}
Editorial covers: ${covers.length > 0 ? covers.join(", ") : "Not specified"}
Editorial never: ${never.length > 0 ? never.join(", ") : "Not specified"}
Editorial priorities: ${priorities.length > 0 ? priorities.join(", ") : "Not specified"}
Active platforms: ${platforms.length > 0 ? platforms.map((p: { name: string; role?: string }) => `${p.name} (${p.role ?? "general"})`).join(", ") : "Not specified"}
Voice rules: ${brand.voiceRules ? JSON.stringify(brand.voiceRules) : "Not specified"}
`.trim();
}

// ─── System prompt ───────────────────────────────────────

function buildStrategyPrompt(
  treeTitle: string,
  treeSummary: string | null,
  brandContexts: string[]
): { system: string; user: string } {
  const system = `You are a media strategist for a multi-brand content organization.

Your job is to analyze a trending topic / narrative tree and determine:
1. Which brands should cover it (based on their editorial scope)
2. What angles each brand should take (unique to their identity)
3. What content types and platforms to target
4. Priority and urgency scoring

Return a JSON object with the following structure:
{
  "strategies": [
    {
      "brandIndex": 0,
      "shouldCover": true,
      "reason": "This topic directly aligns with...",
      "angles": [
        {
          "angle": "The geopolitical implications of...",
          "whyThisAngle": "This brand's audience cares about...",
          "informationGap": "No one is covering the...",
          "contentTypes": [
            { "type": "VIDEO_SCRIPT", "platform": "youtube", "rationale": "Deep-dive format suits..." },
            { "type": "TWEET_THREAD", "platform": "x", "rationale": "Breaking news angle for..." }
          ],
          "priority": 8
        }
      ],
      "priority": 8,
      "urgency": "high"
    }
  ]
}

Rules:
- Only recommend coverage if the topic genuinely fits the brand's editorial scope
- Never recommend topics that fall under the brand's "editorial never" list
- Each angle must be unique — no two brands should cover the exact same angle
- Priority: 1 = lowest, 10 = highest
- Urgency: "breaking" (< 2h window), "high" (< 12h), "normal" (< 48h), "low" (evergreen)
- Content types must match the brand's active platforms`;

  const user = `
Narrative Tree Title: ${treeTitle}
Summary: ${treeSummary ?? "No summary available yet."}

Brands to evaluate:
${brandContexts.map((ctx, i) => `--- Brand ${i} ---\n${ctx}`).join("\n\n")}

Analyze and return strategies.`.trim();

  return { system, user };
}

// ─── Main strategist function ────────────────────────────

export async function generateStrategies(
  treeId: string,
  brandIds?: string[]
): Promise<StrategyResult> {
  // Fetch the narrative tree
  const tree = await prisma.narrativeTree.findUniqueOrThrow({
    where: { id: treeId },
  });

  // Fetch brands — either specific ones or all
  const whereClause: Record<string, unknown> = {};
  if (brandIds && brandIds.length > 0) {
    whereClause.id = { in: brandIds };
  }

  const brands = await prisma.brand.findMany({
    where: whereClause,
  });

  if (brands.length === 0) {
    return {
      treeId,
      treeTitle: tree.title,
      strategies: [],
      generatedAt: new Date().toISOString(),
      model: "gemini",
    };
  }

  // Build brand contexts
  const brandContexts = brands.map((b) => buildBrandContext(b));

  // Build prompt
  const { system, user } = buildStrategyPrompt(
    tree.title,
    tree.summary,
    brandContexts
  );

  // Call LLM
  const result = await routeToModel("strategy", system, user, {
    temperature: 0.4,
  });

  // Parse response
  const parsed = result.parsed as {
    strategies?: Array<{
      brandIndex: number;
      shouldCover: boolean;
      reason: string;
      angles: Array<{
        angle: string;
        whyThisAngle: string;
        informationGap: string;
        contentTypes: Array<{
          type: string;
          platform: string;
          rationale: string;
        }>;
        priority: number;
      }>;
      priority: number;
      urgency: string;
    }>;
  } | null;

  if (!parsed?.strategies) {
    console.error("[Strategist] Failed to parse LLM response for tree:", treeId);
    return {
      treeId,
      treeTitle: tree.title,
      strategies: [],
      generatedAt: new Date().toISOString(),
      model: result.model,
    };
  }

  // Map LLM output to typed strategies
  const strategies: BrandStrategy[] = parsed.strategies
    .filter((s) => s.brandIndex >= 0 && s.brandIndex < brands.length)
    .map((s) => ({
      brandId: brands[s.brandIndex].id,
      brandName: brands[s.brandIndex].name,
      shouldCover: s.shouldCover,
      reason: s.reason,
      angles: (s.angles || []).map((a) => ({
        angle: a.angle,
        whyThisAngle: a.whyThisAngle,
        informationGap: a.informationGap,
        contentTypes: (a.contentTypes || []).map((ct) => ({
          type: ct.type,
          platform: ct.platform,
          rationale: ct.rationale,
        })),
        priority: a.priority,
      })),
      priority: s.priority,
      urgency: (["breaking", "high", "normal", "low"].includes(s.urgency)
        ? s.urgency
        : "normal") as BrandStrategy["urgency"],
    }));

  return {
    treeId,
    treeTitle: tree.title,
    strategies,
    generatedAt: new Date().toISOString(),
    model: result.model,
  };
}

// ─── Single-brand strategy ──────────────────────────────

export async function generateBrandStrategy(
  treeId: string,
  brandId: string
): Promise<BrandStrategy | null> {
  const result = await generateStrategies(treeId, [brandId]);
  return result.strategies[0] ?? null;
}

// ─── Batch strategy for all active brands ────────────────

export async function generateStrategiesForAllBrands(
  treeId: string
): Promise<StrategyResult> {
  return generateStrategies(treeId);
}

// ─── StrategyDecision (flat format for Inngest / API) ────

export interface StrategyDecision {
  brandId: string;
  brandName: string;
  platform: string;
  angle: string;
  reasoning: string;
  deep_research_prompt?: string;
  priority: number;
  urgency: string;
}

/**
 * runStrategist — accepts pre-fetched brands and dossier context, returns
 * a flat list of StrategyDecisions (one per brand-platform-angle combo).
 */
export async function runStrategist(input: {
  treeId: string;
  brands: Brand[];
  dossier: {
    structuredData: unknown;
    sources: string[];
    rawResearch: string | null;
  };
}): Promise<StrategyDecision[]> {
  const { treeId, brands, dossier } = input;

  // Fetch tree for title / summary
  const tree = await prisma.narrativeTree.findUniqueOrThrow({
    where: { id: treeId },
  });

  // Build brand contexts
  const brandContexts = brands.map((b) => buildBrandContext(b));

  // Enhance the summary with dossier research if available
  const enrichedSummary = dossier.rawResearch
    ? `${tree.summary ?? ""}\n\nResearch:\n${dossier.rawResearch.slice(0, 2000)}`
    : tree.summary;

  const { system, user } = buildStrategyPrompt(tree.title, enrichedSummary, brandContexts);

  const result = await routeToModel("strategy", system, user, { temperature: 0.4 });

  const parsed = result.parsed as {
    strategies?: Array<{
      brandIndex: number;
      shouldCover: boolean;
      reason: string;
      angles: Array<{
        angle: string;
        whyThisAngle: string;
        informationGap: string;
        contentTypes: Array<{ type: string; platform: string; rationale: string }>;
        priority: number;
      }>;
      priority: number;
      urgency: string;
    }>;
  } | null;

  if (!parsed?.strategies) return [];

  // Flatten strategies into one decision per brand-platform-angle
  const decisions: StrategyDecision[] = [];
  for (const s of parsed.strategies) {
    if (s.brandIndex < 0 || s.brandIndex >= brands.length || !s.shouldCover) continue;
    const brand = brands[s.brandIndex];
    for (const a of s.angles ?? []) {
      for (const ct of a.contentTypes ?? []) {
        decisions.push({
          brandId: brand.id,
          brandName: brand.name,
          platform: ct.platform.toUpperCase(),
          angle: a.angle,
          reasoning: a.whyThisAngle,
          deep_research_prompt: a.informationGap
            ? `Research: ${a.informationGap}`
            : undefined,
          priority: a.priority,
          urgency: (["breaking", "high", "normal", "low"].includes(s.urgency)
            ? s.urgency
            : "normal"),
        });
      }
    }
  }

  return decisions;
}
