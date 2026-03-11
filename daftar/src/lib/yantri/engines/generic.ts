/**
 * Generic Content Engine
 *
 * Fallback engine for content types that don't have a dedicated engine.
 * Generates platform-appropriate content using the model-router and
 * skill files from the engine-router's skill chain.
 *
 * Handles: LinkedIn Posts, Blog Articles, Instagram Reels, Podcast Scripts,
 * Facebook Posts, LinkedIn Articles, and any new content types.
 */

import { routeToModel } from "@/lib/yantri/model-router";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import { engineRouter, type ContentType } from "@/lib/yantri/engine-router";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GenericEngineParams {
  narrativeAngle: string;
  brandName: string;
  brandTone: string;
  voiceRules: string;
  language: string;
  researchResults: string;
  trendHeadline: string;
  hook: string;
  tone: string;
  contentType: ContentType;
  platform: string;
  brandSlug?: string;
  brandConfig?: Record<string, unknown> | null;
}

export interface GenericEngineResult {
  platform: string;
  contentType: string;
  draft: string;
  titles: string[];
  description: string;
  tags: string[];
  thumbnailBrief: string | null;
  postingPlan: Record<string, unknown>;
  skillsUsed: string[];
  model: string;
  raw: string;
}

// ─── Platform-specific formatting instructions ─────────────────────────────

function getPlatformInstructions(contentType: ContentType, platform: string): string {
  switch (contentType) {
    case "LINKEDIN_POST":
      return `FORMAT: LinkedIn Post (400-800 words)
- HOOK in the first 2 lines (before the "see more" fold)
- Generous line breaks for mobile readability
- Professional but not corporate tone
- 3-5 hashtags at END only, never in body
- NO external links in body (LinkedIn penalizes links)
- Structure: Hook -> Story/Context -> Insight -> CTA`;

    case "LINKEDIN_ARTICLE":
      return `FORMAT: LinkedIn Article (1200-2500 words)
- Compelling headline that promises value
- Clear heading hierarchy (H2, H3)
- Data-backed claims with inline citations
- 2-3 key takeaways in bold
- Professional tone, thought-leadership positioning
- CTA at the end for follows/newsletter`;

    case "BLOG_ARTICLE":
      return `FORMAT: Blog Article (1200-2500 words, Markdown)
- SEO-optimized title and meta description
- Clear heading hierarchy with keyword-rich H2s
- Featured image prompt
- Internal linking opportunities noted
- 2-3 inline image placement suggestions
- Strong introduction and conclusion`;

    case "INSTAGRAM_REEL":
      return `FORMAT: Instagram Reel Script (30-60 seconds)
- HOOK in first 2 seconds (text overlay + audio)
- Works WITHOUT sound (text overlays carry the story)
- 3-5 text overlay timestamps
- Music mood suggestion
- Trending audio recommendation if applicable
- Caption with keywords (not hashtag-heavy)`;

    case "PODCAST_SCRIPT":
      return `FORMAT: Podcast Script (15-30 minutes)
- Cold open hook (30 seconds)
- Introduction and topic framing
- 3-4 main segments with transitions
- Interview questions if applicable
- Outro with CTA
- Show notes with timestamps and links`;

    case "FACEBOOK_POST":
      return `FORMAT: Facebook Post (200-500 words)
- Hook that encourages comments
- Community-oriented tone
- Question or poll at the end
- Shareable format
- 2-3 relevant hashtags`;

    default:
      return `FORMAT: ${contentType.replace(/_/g, " ")} for ${platform}
- Platform-appropriate length and formatting
- Strong hook opening
- Data-backed content
- Clear CTA`;
  }
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export async function runGenericEngine(
  params: GenericEngineParams
): Promise<GenericEngineResult> {
  if (!params.narrativeAngle?.trim()) {
    throw new Error("GenericEngine: narrativeAngle is required");
  }
  if (!params.brandName?.trim()) {
    throw new Error("GenericEngine: brandName is required");
  }

  const platformInstructions = getPlatformInstructions(params.contentType, params.platform);

  // Try skill-based generation first
  const skillsUsed: string[] = [];
  let skillContext = "";

  try {
    const chain = engineRouter.resolve(params.contentType);
    const primarySkill = engineRouter.getPrimaryDraftSkill(params.contentType);

    const exists = await skillOrchestrator.skillExists(primarySkill.skillPath);
    if (exists) {
      const skillResult = await skillOrchestrator.executeSkill({
        skillPath: primarySkill.skillPath,
        context: {
          narrative: params.narrativeAngle,
          brand: {
            brandName: params.brandName,
            brandSlug: params.brandSlug,
            config: params.brandConfig,
          },
          targetPlatform: params.platform,
          contentType: params.contentType,
          research: params.researchResults,
          hook: params.hook,
          tone: params.tone,
        },
        brandId: undefined,
        platform: params.platform,
        skipLlm: true, // Just get the prompt, we'll handle LLM ourselves
      });

      if (skillResult.success && skillResult.output?.instructions) {
        skillContext = `\nSKILL INSTRUCTIONS:\n${skillResult.output.instructions as string}`;
        skillsUsed.push(primarySkill.skillPath);
      }
    }

    // Also load brand identity skill if available
    if (params.brandSlug) {
      try {
        const identitySkill = await skillOrchestrator.loadSkill(
          `brand/identity/${params.brandSlug}/identity.md`
        );
        skillContext += `\nBRAND IDENTITY:\n${identitySkill.instructions}`;
        skillsUsed.push(`brand/identity/${params.brandSlug}/identity.md`);
      } catch {
        // No brand identity skill — continue without
      }
    }

    skillsUsed.push(...chain.stages.map((s) => s.skillPath));
  } catch {
    // Skill loading failed — continue with direct LLM
  }

  const systemPrompt = `You are a professional content creator for "${params.brandName}".

NARRATIVE ANGLE: ${params.narrativeAngle}
SOURCE TREND: ${params.trendHeadline}
BRAND: ${params.brandName}
BRAND TONE: ${params.brandTone}
VOICE RULES: ${params.voiceRules}
LANGUAGE: ${params.language}
OPENING HOOK: ${params.hook}
TONE DIRECTIVE: ${params.tone}
${skillContext}

${platformInstructions}

RESEARCH DOSSIER:
${params.researchResults}

OUTPUT FORMAT (respond in JSON only):
{
  "draft": "The complete content ready for review...",
  "titles": ["Option 1", "Option 2", "Option 3"],
  "description": "SEO-optimized description or meta description",
  "tags": ["tag1", "tag2", "tag3"],
  "thumbnailBrief": "Visual brief for cover image/thumbnail, or null if not applicable",
  "postingPlan": {
    "timeIST": "optimal posting time",
    "timeReasoning": "why this time",
    "hashtags": ["#tag1"],
    "additionalNotes": "any platform-specific notes"
  }
}`;

  const userMessage = `Create complete ${params.contentType.replace(/_/g, " ").toLowerCase()} content for ${params.platform} about: "${params.narrativeAngle}". Use the research to make it fact-dense and engaging.`;

  const result = await routeToModel("drafting", systemPrompt, userMessage, {
    temperature: 0.5,
  });

  if (!result.parsed) {
    // Fallback: use raw response as draft
    return {
      platform: params.platform,
      contentType: params.contentType,
      draft: result.raw,
      titles: [params.narrativeAngle.slice(0, 100)],
      description: "",
      tags: [],
      thumbnailBrief: null,
      postingPlan: {},
      skillsUsed,
      model: result.model,
      raw: result.raw,
    };
  }

  const parsed = result.parsed as Record<string, unknown>;
  const postingPlan = (parsed.postingPlan ?? {}) as Record<string, unknown>;

  return {
    platform: params.platform,
    contentType: params.contentType,
    draft: (parsed.draft as string) ?? result.raw,
    titles: (parsed.titles as string[]) ?? [],
    description: (parsed.description as string) ?? "",
    tags: (parsed.tags as string[]) ?? [],
    thumbnailBrief: (parsed.thumbnailBrief as string) ?? null,
    postingPlan,
    skillsUsed,
    model: result.model,
    raw: result.raw,
  };
}
