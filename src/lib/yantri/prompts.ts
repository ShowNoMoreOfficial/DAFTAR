import { Brand, PlatformRule, ImportedTrend } from "@prisma/client";

export function buildEditorialScanPrompt(
  brands: Brand[],
  rules: PlatformRule[],
  trends: ImportedTrend[]
) {
  const allowedPlatformPrefixes: string[] = [];
  brands.forEach((b) => {
    let platforms: { name: string; role: string }[] = [];
    try { platforms = JSON.parse(b.activePlatforms ?? "[]"); } catch { /* empty */ }
    platforms.forEach((p) => {
      const name = p.name.toLowerCase();
      if (!allowedPlatformPrefixes.includes(name)) allowedPlatformPrefixes.push(name);
    });
  });

  const brandText = brands
    .map((b) => {
      let platforms: { name: string; role: string }[] = [];
      let covers: string[] = [];
      let never: string[] = [];
      let priorities: string[] = [];
      try { platforms = JSON.parse(b.activePlatforms ?? "[]"); } catch { /* empty */ }
      try { covers = JSON.parse(b.editorialCovers ?? "[]"); } catch { /* empty */ }
      try { never = JSON.parse(b.editorialNever ?? "[]"); } catch { /* empty */ }
      try { priorities = JSON.parse(b.editorialPriorities ?? "[]"); } catch { /* empty */ }
      const platformList = platforms.map((p) => `${p.name} (${p.role})`).join(", ");
      return `
BRAND: ${b.name}
Language: ${b.language ?? "English"}
Tone: ${b.tone ?? "neutral"}
Covers: ${covers.join(", ")}
Never Covers: ${never.join(", ")}
ALLOWED PLATFORMS (ONLY use these): ${platformList}
Voice Rules: ${(Array.isArray(b.voiceRules) ? (b.voiceRules as string[]) : []).join("; ")}
Editorial Priorities: ${priorities.join(", ")}`;
    })
    .join("\n---\n");

  const platformMatches = (platformStr: string) => {
    const p = platformStr.toLowerCase();
    return allowedPlatformPrefixes.some((prefix) => p.startsWith(prefix));
  };

  const filteredRules = rules.filter((r) => platformMatches(r.primaryPlatform));

  const rulesText = filteredRules
    .map((r) => {
      const secondary =
        r.secondaryPlatform && platformMatches(r.secondaryPlatform)
          ? r.secondaryPlatform
          : "none";
      return `${r.narrativeType} -> ${r.primaryPlatform} (primary) -> ${secondary} (secondary) -> speed: ${r.speedPriority}`;
    })
    .join("\n");

  const trendText = trends
    .map((t) => `ID: ${t.id} | Rank ${t.rank} | Score ${t.score} | ${t.headline} | ${t.reason}`)
    .join("\n");

  const systemPrompt = `You are the editorial brain of a multi-brand media newsroom. You make decisions. You do not present menus or options.

BRAND IDENTITIES:
${brandText}

PLATFORM ROUTING RULES:
${rulesText}

BEHAVIORAL RULES:
1. DECIDE, DO NOT ASK.
2. ONE PRIMARY NARRATIVE PER TREND, with optional SECONDARY deliverable.
3. KILL BAD IDEAS EARLY.
4. BRAND FIT IS ABSOLUTE.
5. QUALITY OVER QUANTITY. Maximum 3 priorities.

OUTPUT FORMAT (respond in JSON only, no preamble, no markdown backticks):
{
  "plan_date": "YYYY-MM-DD",
  "priorities": [
    {
      "priority": 1,
      "trend_id": "copy exact trend ID",
      "trend_headline": "...",
      "trend_score": 95,
      "narrative_angle": "...",
      "information_gap": "...",
      "why_this_narrative": "...",
      "brand": "Brand Name",
      "platform": "from brand's ALLOWED PLATFORMS only",
      "secondary_platform": null,
      "format": "blog | linkedin_post | meta_carousel | meta_post | meta_reel | single_tweet | thread_6_9 | youtube_longform",
      "urgency": "publish within X hours/days",
      "deep_research_prompt": "Full 150-300 word system prompt here.",
      "secondary_deliverable": null
    }
  ],
  "skipped": [{ "trend_id": "...", "trend_headline": "...", "reason": "..." }]
}

CRITICAL PLATFORM CONSTRAINT: You MUST ONLY route content to platforms listed in a brand's ALLOWED PLATFORMS.`;

  return { systemPrompt, userMessage: `Here are today's trends:\n\n${trendText}` };
}

export function buildResearchPrompt(
  narrativeAngle: string,
  trendHeadline: string,
  brandName: string,
  platform: string
) {
  const systemPrompt = `You are an investigative research analyst for ${brandName}. Produce a focused, sourced research dossier.

NARRATIVE ANGLE: ${narrativeAngle}
SOURCE TREND: ${trendHeadline}
TARGET PLATFORM: ${platform}

CONFIDENCE LABELING:
[VERIFIED] — official government source, primary document
[REPORTED] — credible outlet with named sourcing
[ESTIMATED] — analyst, think tank, or expert projection
[UNCONFIRMED] — single source, unnamed, or unverified

Structure: Key Facts & Timeline, Critical Numbers, Stakeholder Positions, Contradictions & Gaps, Ground Reality, Context & Precedents, Sensitivity Flags.

RULES:
- Focus TIGHTLY on the narrative angle
- Every claim must cite its source
- 800-1500 words, concise and data-dense`;

  return { systemPrompt, userMessage: `Research this narrative angle now: ${narrativeAngle}` };
}

export function buildEnginePrompt(
  narrativeAngle: string,
  platform: string,
  format: string,
  brandName: string,
  voiceRules: string,
  researchResults: string
) {
  const systemPrompt = `You are generating a prompt for a specialized content engine.

NARRATIVE: ${narrativeAngle}
PLATFORM: ${platform}
FORMAT: ${format}
BRAND: ${brandName}
BRAND VOICE: ${voiceRules}
RESEARCH DOSSIER: ${researchResults}

OUTPUT FORMAT (respond in JSON only):
{
  "target_engine": "${brandName}_${normalizePlatform(platform)}_engine",
  "prompt": "The complete prompt text",
  "is_direct_content": true/false
}`;

  return { systemPrompt, userMessage: "Generate the engine prompt now." };
}

export function buildPackagingPrompt(
  narrativeAngle: string,
  platform: string,
  brandName: string,
  keyDataPoints: string
) {
  const systemPrompt = `Generate a complete content package.

NARRATIVE: ${narrativeAngle}
PLATFORM: ${platform}
BRAND: ${brandName}
KEY DATA POINTS: ${keyDataPoints}

OUTPUT FORMAT (respond in JSON only):
{
  "titles": {"data_first": "...", "question": "...", "consequence": "..."},
  "thumbnail": {"visual": "...", "text_overlay": "...", "emotion": "...", "color_mood": "..."},
  "description": "...",
  "tags": ["..."],
  "posting_time": {"time_ist": "...", "reasoning": "..."},
  "repurpose": [{"target_platform": "...", "what_to_extract": "...", "format": "..."}]
}`;

  return { systemPrompt, userMessage: "Generate the content package now." };
}

function normalizePlatform(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("twitter") || p.includes("x_thread") || p.includes("x_single") || p === "x") return "twitter";
  if (p.includes("youtube") || p.includes("yt")) return "youtube";
  if (p.includes("blog") || p.includes("article") || p.includes("website")) return "blog";
  if (p.includes("meta") || p.includes("instagram") || p.includes("reel") || p.includes("carousel")) return "meta";
  if (p.includes("linkedin")) return "linkedin";
  return "twitter";
}

function sharedContext(params: {
  narrativeAngle: string;
  trendHeadline: string;
  brandName: string;
  brandTone: string;
  voiceRules: string;
  language: string;
  researchResults: string;
  format: string;
}): string {
  return `
NARRATIVE ANGLE: ${params.narrativeAngle}
SOURCE TREND: ${params.trendHeadline}
BRAND: ${params.brandName}
BRAND TONE: ${params.brandTone}
BRAND VOICE RULES: ${params.voiceRules}
LANGUAGE: ${params.language}
FORMAT: ${params.format}

RESEARCH DOSSIER:
${params.researchResults}`;
}

function buildTwitterPrompt(ctx: string): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You are the Twitter/X Content Engine — a Twitter/X content creator. Produce complete, publish-ready content.

${ctx}

FORMAT: Choose "single_tweet" or "thread" based on depth.

HOOK ARCHETYPES:
  * The Number That Should Not Exist
  * The Contradiction
  * The Question Nobody Is Asking
  * The System Reveal
  * The Timeline Compression
  * The Scale Translation
  * The Uncomfortable Comparison
  * The Source Authority

SINGLE TWEET: Max 280 chars, one powerful hook, source-cited.
THREAD: 3-5 tweets, hook -> data -> context -> close. No hashtags in text.

OUTPUT FORMAT (respond in JSON only):
For single_tweet:
{ "platform": "twitter", "format": "single_tweet", "brand": "...", "narrative_angle": "...", "content": { "tweet": "...", "character_count": 241, "hook_archetype": "...", "nano_banana_prompt": "..." }, "postingPlan": { "time_ist": "...", "time_reasoning": "...", "hashtags": [], "engagement_strategy": "..." } }

For thread:
{ "platform": "twitter", "format": "thread", "brand": "...", "narrative_angle": "...", "content": { "tweets": [{ "position": 1, "text": "...", "character_count": 241, "type": "hook", "hook_archetype": "...", "nano_banana_prompt": "..." }], "thread_length": 4, "source_replies": [], "pinned_reply": "..." }, "postingPlan": { "time_ist": "...", "time_reasoning": "...", "hashtags": [], "thread_pacing": "...", "engagement_playbook": {} } }`;

  return { systemPrompt, userMessage: "Assess depth, choose format, generate complete Twitter content and posting plan." };
}

function buildYouTubePrompt(ctx: string): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You are the YouTube Script Engine — a YouTube longform script writer. Produce complete, shoot-ready video scripts.

${ctx}

Write a complete 10-15 min video script in SECTIONS with timestamps, production cues, HOOK in first 30 seconds.

OUTPUT FORMAT (respond in JSON only):
{
  "platform": "youtube",
  "content": { "script": "...", "sections": [{ "title": "...", "timestamp": "...", "notes": "...", "cues": "..." }], "runtime_estimate": "..." },
  "postingPlan": { "titles": { "data_first": "...", "question": "...", "consequence": "..." }, "thumbnail": { "visual": "...", "text_overlay": "...", "emotion": "..." }, "description": "...", "tags": [], "time_ist": "...", "time_reasoning": "..." }
}`;

  return { systemPrompt, userMessage: "Generate the complete YouTube script and posting plan now." };
}

function buildBlogPrompt(ctx: string): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You are the Blog Engine — a long-form editorial writer. Produce complete, publish-ready articles in markdown.

${ctx}

Write 1200-2500 words in markdown with heading hierarchy, SEO optimization, inline image placement.

OUTPUT FORMAT (respond in JSON only):
{
  "platform": "blog",
  "content": { "article": "...", "word_count": 1800, "format_type": "...", "featured_image_prompt": "...", "inline_image_prompts": [{ "index": 0, "prompt": "...", "alt": "..." }] },
  "postingPlan": { "title": "...", "english_title_slug": "...", "summary": "...", "seo_title": "...", "meta_description": "...", "tags": [], "focus_keyphrase": "...", "time_ist": "...", "time_reasoning": "..." }
}`;

  return { systemPrompt, userMessage: "Generate the complete blog article and posting plan now." };
}

function buildMetaPrompt(ctx: string): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You are the Meta Content Engine — short-form content creator for Instagram/Meta.

${ctx}

Choose REEL (under 60s, works without sound) or CAROUSEL (5-10 slides).

OUTPUT FORMAT (respond in JSON only):
{
  "platform": "meta",
  "content": { "type": "reel", "script": "...", "text_overlays": [{ "time": "0-2s", "text": "..." }], "duration": "45 seconds", "music_mood": "...", "slides": null },
  "postingPlan": { "caption": "...", "hashtags": [], "time_ist": "...", "time_reasoning": "...", "story_tease": "..." }
}`;

  return { systemPrompt, userMessage: "Generate the complete Meta content and posting plan now." };
}

function buildLinkedInPrompt(ctx: string): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You are the LinkedIn Content Engine — professional thought-leadership writer.

${ctx}

Write 400-1200 words. HOOK in first 2 lines. Generous line breaks. 3-5 hashtags at END only. NO external links.

OUTPUT FORMAT (respond in JSON only):
{
  "platform": "linkedin",
  "content": { "post": "...", "word_count": 650 },
  "postingPlan": { "hashtags": [], "time_ist": "...", "time_reasoning": "...", "engagement_note": "..." }
}`;

  return { systemPrompt, userMessage: "Generate the complete LinkedIn post and posting plan now." };
}

export async function buildContentGenerationPrompt(
  platform: string,
  narrativeAngle: string,
  format: string,
  brandName: string,
  brandTone: string,
  voiceRules: string,
  language: string,
  researchResults: string,
  trendHeadline: string,
  promptTemplateId?: string
): Promise<{ systemPrompt: string; userMessage: string }> {
  const ctx = sharedContext({ narrativeAngle, trendHeadline, brandName, brandTone, voiceRules, language, researchResults, format });

  if (promptTemplateId || true) {
    try {
      const { prisma } = await import("@/lib/prisma");
      const normalized = normalizePlatform(platform);
      const template = promptTemplateId
        ? await prisma.promptTemplate.findUnique({ where: { id: promptTemplateId } })
        : await prisma.promptTemplate.findFirst({ where: { platform: normalized, isActive: true } });

      if (template) {
        const replacePlaceholders = (text: string) =>
          text
            .replace(/\{\{narrativeAngle\}\}/g, narrativeAngle)
            .replace(/\{\{trendHeadline\}\}/g, trendHeadline)
            .replace(/\{\{brandName\}\}/g, brandName)
            .replace(/\{\{brandTone\}\}/g, brandTone)
            .replace(/\{\{voiceRules\}\}/g, voiceRules)
            .replace(/\{\{language\}\}/g, language)
            .replace(/\{\{researchResults\}\}/g, researchResults)
            .replace(/\{\{format\}\}/g, format)
            .replace(/\{\{platform\}\}/g, platform);

        return { systemPrompt: replacePlaceholders(template.systemPrompt), userMessage: replacePlaceholders(template.userFormat) };
      }
    } catch {
      // DB not available — fall through to hardcoded prompts
    }
  }

  const normalized = normalizePlatform(platform);
  switch (normalized) {
    case "youtube": return buildYouTubePrompt(ctx);
    case "blog": return buildBlogPrompt(ctx);
    case "meta": return buildMetaPrompt(ctx);
    case "linkedin": return buildLinkedInPrompt(ctx);
    case "twitter":
    default: return buildTwitterPrompt(ctx);
  }
}

export function getPlatformAgentName(platform: string): string {
  const normalized = normalizePlatform(platform);
  switch (normalized) {
    case "twitter": return "Twitter Agent";
    case "youtube": return "YouTube Agent";
    case "blog": return "Blog Agent";
    case "meta": return "Meta Agent";
    case "linkedin": return "LinkedIn Agent";
    default: return "Content Agent";
  }
}

export function getPlatformDeliverableDescription(platform: string): string[] {
  const normalized = normalizePlatform(platform);
  switch (normalized) {
    case "twitter": return ["Single tweet or thread based on narrative depth", "Optimal posting time and engagement strategy", "Hashtag recommendations"];
    case "youtube": return ["Full video script with production cues", "Three title options with thumbnail brief", "SEO description, tags, and posting time"];
    case "blog": return ["Complete article with headings and SEO", "Meta description and keyphrases", "Publishing schedule"];
    case "meta": return ["Reel script with text overlays or carousel slides", "Caption and hashtag strategy", "Story tease and posting time"];
    case "linkedin": return ["Complete professional post", "Hashtag strategy and posting time", "Engagement playbook"];
    default: return ["Platform-specific content", "Posting plan"];
  }
}
