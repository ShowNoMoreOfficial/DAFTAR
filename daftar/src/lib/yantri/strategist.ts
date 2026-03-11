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
  contentType: string;
  angle: string;
  hook: string;
  tone: string;
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
          contentType: ct.type,
          angle: a.angle,
          hook: a.angle.slice(0, 100),
          tone: brand.tone ?? "neutral",
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

// ─── DossierStrategy: FactDossier-first strategy generation ─────────

export interface DossierStrategyInput {
  factDossierId: string;
  brandId: string;
  skillContext?: string;
}

export interface DossierStrategyResult {
  decisions: StrategyDecision[];
  treeId: string;
  model: string;
  generatedAt: string;
}

/**
 * generateStrategyFromDossier — Given a FactDossier ID and a Brand ID,
 * loads the dossier, brand config, and calls the LLM to produce strategy
 * decisions. Returns typed decisions ready for persistence.
 */
export async function generateStrategyFromDossier(
  input: DossierStrategyInput
): Promise<DossierStrategyResult> {
  const { factDossierId, brandId, skillContext } = input;

  const dossier = await prisma.factDossier.findUniqueOrThrow({
    where: { id: factDossierId },
    include: {
      tree: { select: { id: true, title: true, summary: true, urgency: true } },
    },
  });

  const brand = await prisma.brand.findUniqueOrThrow({
    where: { id: brandId },
    include: { platforms: { where: { isActive: true } } },
  });

  const platformDetails = brand.platforms
    .map((p) => `${p.platform} (config: ${JSON.stringify(p.config ?? {})})`)
    .join(", ");

  const brandCtx = `${buildBrandContext(brand)}\nActive BrandPlatforms: ${platformDetails || "None configured"}`;

  const structuredStr = typeof dossier.structuredData === "string"
    ? dossier.structuredData
    : JSON.stringify(dossier.structuredData, null, 2);
  const sourcesStr = (dossier.sources ?? []).join("\n");
  const rawSlice = dossier.rawResearch?.slice(0, 3000) ?? "";

  const system = `You are an elite media strategist for a multi-brand content organization.

You have a verified FactDossier with research, facts, statistics, quotes, and a timeline.
Your job: determine the optimal content strategy for ONE specific brand.

BRAND CONTEXT:
${brandCtx}
${skillContext ? `\nSKILL CONTEXT:\n${skillContext}` : ""}

Return a JSON object:
{
  "decisions": [
    {
      "contentType": "VIDEO_SCRIPT | TWEET_THREAD | TWEET_SINGLE | INSTAGRAM_CAROUSEL | INSTAGRAM_REEL | LINKEDIN_POST | BLOG_ARTICLE | VIDEO_SHORT | PODCAST_SCRIPT",
      "platform": "YOUTUBE | X_THREAD | X_SINGLE | META_CAROUSEL | META_REEL | LINKEDIN | BLOG",
      "angle": "The specific editorial angle to take",
      "hook": "The opening hook / first line that grabs attention",
      "tone": "The specific tone for this piece",
      "priority": 8,
      "reasoning": "Why this content type + platform + angle is the right call"
    }
  ]
}

Rules:
- Only recommend platforms the brand is ACTIVE on
- Max 3 decisions per brand (quality over quantity)
- Each decision must have a DISTINCT angle
- Priority: 1 = lowest, 10 = highest
- contentType must be one of the enum values listed above
- platform must match the contentType (e.g., VIDEO_SCRIPT -> YOUTUBE)`;

  const user = `Narrative: ${dossier.tree.title}
Summary: ${dossier.tree.summary ?? "N/A"}
Urgency: ${dossier.tree.urgency}

FACT DOSSIER:
${structuredStr.slice(0, 4000)}

SOURCES:
${sourcesStr.slice(0, 1000)}

ADDITIONAL RESEARCH:
${rawSlice}

Generate strategy decisions for brand "${brand.name}".`;

  const result = await routeToModel("strategy", system, user, { temperature: 0.4 });

  const parsed = result.parsed as {
    decisions?: Array<{
      contentType: string;
      platform: string;
      angle: string;
      hook: string;
      tone: string;
      priority: number;
      reasoning: string;
    }>;
  } | null;

  if (!parsed?.decisions || parsed.decisions.length === 0) {
    console.warn("[Strategist] No decisions from LLM for dossier:", factDossierId);
    return {
      decisions: [],
      treeId: dossier.treeId,
      model: result.model,
      generatedAt: new Date().toISOString(),
    };
  }

  const decisions: StrategyDecision[] = parsed.decisions.map((d) => ({
    brandId: brand.id,
    brandName: brand.name,
    platform: d.platform,
    contentType: d.contentType,
    angle: d.angle,
    hook: d.hook || d.angle.slice(0, 100),
    tone: d.tone || brand.tone || "neutral",
    reasoning: d.reasoning,
    priority: d.priority,
    urgency: dossier.tree.urgency,
  }));

  return {
    decisions,
    treeId: dossier.treeId,
    model: result.model,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Map helpers for persistence ────────────────────────────────────

const CONTENT_TYPE_TO_PLATFORM: Record<string, string> = {
  VIDEO_SCRIPT: "YOUTUBE",
  VIDEO_SHORT: "YOUTUBE",
  TWEET_THREAD: "X_THREAD",
  TWEET_SINGLE: "X_SINGLE",
  INSTAGRAM_CAROUSEL: "META_CAROUSEL",
  INSTAGRAM_REEL: "META_REEL",
  LINKEDIN_POST: "LINKEDIN",
  LINKEDIN_ARTICLE: "LINKEDIN",
  BLOG_ARTICLE: "BLOG",
  FACEBOOK_POST: "META_POST",
  PODCAST_SCRIPT: "BLOG",
};

const CONTENT_TYPE_TO_PIPELINE: Record<string, string> = {
  VIDEO_SCRIPT: "cinematic",
  VIDEO_SHORT: "reel",
  TWEET_THREAD: "viral_micro",
  TWEET_SINGLE: "viral_micro",
  INSTAGRAM_CAROUSEL: "carousel",
  INSTAGRAM_REEL: "reel",
  LINKEDIN_POST: "viral_micro",
  LINKEDIN_ARTICLE: "viral_micro",
  BLOG_ARTICLE: "standard",
  FACEBOOK_POST: "viral_micro",
  PODCAST_SCRIPT: "standard",
};

/**
 * persistStrategyDecisions — Saves strategy decisions as Narrative records
 * and creates corresponding Deliverable records ready for content generation.
 * Returns the created Deliverable IDs.
 */
export async function persistStrategyDecisions(
  treeId: string,
  factDossierId: string,
  decisions: StrategyDecision[]
): Promise<string[]> {
  const deliverableIds: string[] = [];

  for (const decision of decisions) {
    const platformEnum = CONTENT_TYPE_TO_PLATFORM[decision.contentType] ?? decision.platform;
    const pipelineType = CONTENT_TYPE_TO_PIPELINE[decision.contentType] ?? "standard";

    // Upsert a Narrative record to track the strategy decision
    await prisma.narrative.upsert({
      where: {
        treeId_brandId_platform: {
          treeId,
          brandId: decision.brandId,
          platform: platformEnum.toLowerCase(),
        },
      },
      create: {
        treeId,
        brandId: decision.brandId,
        platform: platformEnum.toLowerCase(),
        angle: decision.angle,
        formatNotes: `Content Type: ${decision.contentType}\nHook: ${decision.hook}\nTone: ${decision.tone}`,
        editorialNotes: `Priority: ${decision.priority}\nUrgency: ${decision.urgency}\nReasoning: ${decision.reasoning}`,
        status: "APPROVED",
      },
      update: {
        angle: decision.angle,
        formatNotes: `Content Type: ${decision.contentType}\nHook: ${decision.hook}\nTone: ${decision.tone}`,
        editorialNotes: `Priority: ${decision.priority}\nUrgency: ${decision.urgency}\nReasoning: ${decision.reasoning}`,
        status: "APPROVED",
      },
    });

    // Create a Deliverable record ready for content generation
    const deliverable = await prisma.deliverable.create({
      data: {
        brandId: decision.brandId,
        treeId,
        platform: platformEnum as "YOUTUBE" | "X_THREAD" | "X_SINGLE" | "BLOG" | "LINKEDIN" | "META_REEL" | "META_CAROUSEL" | "META_POST",
        pipelineType,
        status: "PLANNED",
        copyMarkdown: `# ${decision.angle}\n\n**Hook:** ${decision.hook}\n**Tone:** ${decision.tone}\n\n**Reasoning:** ${decision.reasoning}`,
        factDossierId,
        postingPlan: {
          strategyDecision: {
            contentType: decision.contentType,
            angle: decision.angle,
            hook: decision.hook,
            tone: decision.tone,
            priority: decision.priority,
            urgency: decision.urgency,
            reasoning: decision.reasoning,
            generatedAt: new Date().toISOString(),
          },
        },
      },
    });

    deliverableIds.push(deliverable.id);
  }

  return deliverableIds;
}
