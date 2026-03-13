/**
 * SEO Engine — Keyword research and SEO analysis for all content types.
 *
 * Loads SEO skill files and runs keyword analysis via Gemini (strategy task),
 * then returns structured SEO data to inject into content generation prompts.
 */

import { SkillOrchestrator, type SkillFile } from "@/lib/skill-orchestrator";
import { routeToModel } from "@/lib/yantri/model-router";

// ─── Types ────────────────────────────────────────────────

export interface SEOAnalysis {
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  searchVolumeTrend: "rising" | "stable" | "declining";
  competitionLevel: "low" | "medium" | "high";
  youtubeKeywords: string[];
  twitterHashtags: string[];
  instagramHashtags: string[];
  linkedinKeywords: string[];
  seoTitle: string;
  metaDescription: string;
  suggestedSlug: string;
}

const SEO_SKILL_PATHS = [
  "platforms/seo/content-seo.md",
  "platforms/seo/on-page-seo.md",
  "platforms/seo/keyword-research.md",
  "platforms/seo/technical-seo.md",
  "platforms/youtube/description-optimization.md",
  "platforms/youtube/tag-category-strategy.md",
];

// ─── Skill Loader ─────────────────────────────────────────

let cachedSEOContext: string | null = null;

async function loadSEOSkillContext(): Promise<string> {
  if (cachedSEOContext) return cachedSEOContext;

  const orchestrator = new SkillOrchestrator();
  const skills = await Promise.all(
    SEO_SKILL_PATHS.map((p) =>
      orchestrator.loadSkill(p).catch(() => null)
    )
  );

  const loaded = skills.filter((s): s is SkillFile => s !== null);
  if (loaded.length === 0) {
    cachedSEOContext = "";
    return "";
  }

  cachedSEOContext = loaded
    .map((s) => {
      const instructions = s.instructions.length > 800
        ? s.instructions.slice(0, 800) + "\n[truncated]"
        : s.instructions;
      return `## ${s.meta.name}\n${instructions}`;
    })
    .join("\n\n");

  return cachedSEOContext;
}

// ─── SEO Analysis ─────────────────────────────────────────

export async function runSEOAnalysis(
  topic: string,
  brandName?: string,
  language?: string
): Promise<SEOAnalysis> {
  const seoSkillContext = await loadSEOSkillContext();

  const systemPrompt = `You are an expert SEO analyst for a media agency. Use the following SEO knowledge to analyze topics for search optimization across all platforms.

${seoSkillContext}

Return ONLY valid JSON. No preamble, no markdown backticks.`;

  const userPrompt = `Analyze this topic for SEO:
"${topic}"
${brandName ? `Brand: ${brandName}` : ""}
${language ? `Language: ${language}` : ""}

Return JSON with this EXACT structure:
{
  "primaryKeyword": "main keyword phrase (2-4 words)",
  "secondaryKeywords": ["5-8 related keywords"],
  "longTailKeywords": ["3-5 long-tail keywords (4+ words, lower competition)"],
  "searchVolumeTrend": "rising|stable|declining",
  "competitionLevel": "low|medium|high",
  "youtubeKeywords": ["8-12 YouTube search keywords including video-intent terms"],
  "twitterHashtags": ["5-8 Twitter/X hashtags WITHOUT # prefix"],
  "instagramHashtags": ["10-15 Instagram hashtags WITHOUT # prefix"],
  "linkedinKeywords": ["5-8 professional/industry keywords"],
  "seoTitle": "SEO-optimized title under 60 chars with primary keyword in first 5 words",
  "metaDescription": "150-160 char meta description with primary keyword and CTA",
  "suggestedSlug": "url-friendly-slug-with-keywords"
}`;

  const result = await routeToModel("strategy", systemPrompt, userPrompt, {
    temperature: 0.3,
  });

  if (!result.parsed) {
    return getDefaultSEOAnalysis(topic);
  }

  const parsed = result.parsed as Record<string, unknown>;
  return normalizeSEOAnalysis(parsed, topic);
}

// ─── Helpers ──────────────────────────────────────────────

function normalizeSEOAnalysis(
  raw: Record<string, unknown>,
  topic: string
): SEOAnalysis {
  const asStringArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.filter((v) => typeof v === "string");
    return [];
  };

  const asString = (val: unknown, fallback: string): string =>
    typeof val === "string" && val.trim() ? val.trim() : fallback;

  const slug = asString(raw.suggestedSlug, "").replace(/[^a-z0-9-]/g, "") ||
    topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);

  return {
    primaryKeyword: asString(raw.primaryKeyword, topic.slice(0, 50)),
    secondaryKeywords: asStringArray(raw.secondaryKeywords).slice(0, 10),
    longTailKeywords: asStringArray(raw.longTailKeywords).slice(0, 6),
    searchVolumeTrend: (["rising", "stable", "declining"].includes(raw.searchVolumeTrend as string)
      ? raw.searchVolumeTrend : "stable") as SEOAnalysis["searchVolumeTrend"],
    competitionLevel: (["low", "medium", "high"].includes(raw.competitionLevel as string)
      ? raw.competitionLevel : "medium") as SEOAnalysis["competitionLevel"],
    youtubeKeywords: asStringArray(raw.youtubeKeywords).slice(0, 15),
    twitterHashtags: asStringArray(raw.twitterHashtags).map((h) => h.replace(/^#/, "")).slice(0, 10),
    instagramHashtags: asStringArray(raw.instagramHashtags).map((h) => h.replace(/^#/, "")).slice(0, 20),
    linkedinKeywords: asStringArray(raw.linkedinKeywords).slice(0, 10),
    seoTitle: asString(raw.seoTitle, topic.slice(0, 60)),
    metaDescription: asString(raw.metaDescription, `${topic} — comprehensive analysis and latest developments.`).slice(0, 160),
    suggestedSlug: slug,
  };
}

function getDefaultSEOAnalysis(topic: string): SEOAnalysis {
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
  return {
    primaryKeyword: topic.slice(0, 50),
    secondaryKeywords: [],
    longTailKeywords: [],
    searchVolumeTrend: "stable",
    competitionLevel: "medium",
    youtubeKeywords: [],
    twitterHashtags: [],
    instagramHashtags: [],
    linkedinKeywords: [],
    seoTitle: topic.slice(0, 60),
    metaDescription: `${topic} — comprehensive analysis and latest developments.`.slice(0, 160),
    suggestedSlug: slug,
  };
}

// ─── SEO Context for Prompts ──────────────────────────────

/**
 * Builds a concise SEO context block to inject into content generation prompts.
 * Platform-aware: only includes relevant keywords for the target platform.
 */
export function buildSEOPromptBlock(
  seo: SEOAnalysis,
  platform: string
): string {
  const p = platform.toLowerCase();

  let platformKeywords = "";
  if (p.includes("youtube") || p.includes("yt")) {
    platformKeywords = `YouTube Keywords: ${seo.youtubeKeywords.join(", ")}`;
  } else if (p.includes("twitter") || p.includes("x_")) {
    platformKeywords = `Hashtags: ${seo.twitterHashtags.map((h) => `#${h}`).join(" ")}`;
  } else if (p.includes("meta") || p.includes("instagram") || p.includes("carousel") || p.includes("reel")) {
    platformKeywords = `Instagram Hashtags: ${seo.instagramHashtags.map((h) => `#${h}`).join(" ")}`;
  } else if (p.includes("linkedin")) {
    platformKeywords = `LinkedIn Keywords: ${seo.linkedinKeywords.join(", ")}`;
  } else if (p.includes("blog")) {
    platformKeywords = `Focus Keyphrase: ${seo.primaryKeyword}\nSecondary Keywords: ${seo.secondaryKeywords.join(", ")}`;
  }

  return `## SEO INTELLIGENCE
Primary Keyword: ${seo.primaryKeyword}
Secondary Keywords: ${seo.secondaryKeywords.slice(0, 5).join(", ")}
Long-tail Keywords: ${seo.longTailKeywords.slice(0, 3).join(", ")}
Search Trend: ${seo.searchVolumeTrend} | Competition: ${seo.competitionLevel}
SEO Title: ${seo.seoTitle}
Meta Description: ${seo.metaDescription}
Suggested Slug: ${seo.suggestedSlug}
${platformKeywords}

SEO RULES:
- Include primary keyword in the title/headline naturally
- Use secondary keywords in subheadings (H2/H3)
- Front-load the primary keyword in descriptions (first 160 chars)
- For YouTube: include primary keyword in first 2 lines of description, use chapter timestamps
- For Twitter/X: use 2-3 relevant hashtags from the list above
- For Instagram: use 15-20 hashtags from the list above in the caption
- For LinkedIn: weave professional keywords naturally, 3-5 hashtags at end
- For Blog: proper H1 with primary keyword, H2s with secondary keywords, meta description under 160 chars`;
}
