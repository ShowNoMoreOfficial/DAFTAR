import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { routeToModel } from "@/lib/yantri/model-router";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBrandVoiceBlock, getBrandColorPalette } from "@/lib/yantri/brand-voice";
import { engineRouter, type ContentType } from "@/lib/yantri/engine-router";
import { SkillOrchestrator, type SkillFile } from "@/lib/skill-orchestrator";
import { runSEOAnalysis, buildSEOPromptBlock, type SEOAnalysis } from "@/lib/yantri/seo-engine";

/**
 * POST /api/yantri/quick-generate
 *
 * Skill-powered synchronous content generation.
 * Loads editorial skills, brand voice, and recommendation context
 * to produce intelligent content via the full intelligence stack.
 *
 * Body: {
 *   topic: string,
 *   brandId: string,
 *   contentType: "youtube_explainer" | "x_thread" | "carousel" | "quick_take",
 *   recommendationContext?: RecommendationContext
 * }
 */

// ─── Types ───

interface RecommendationContext {
  angle: string;
  reasoning: string;
  priority: string;
  urgency: string;
  assetsRequired: {
    images: string[];
    video: string[];
    graphics: string[];
    other: string[];
  };
  keyDataPoints: string[];
  stakeholders: string[];
  sensitivityLevel: string;
  suggestedTitle: string;
}

interface AssetInput {
  deliverableId: string;
  type: string;
  url: string;
  promptUsed?: string;
  slideIndex?: number;
  metadata?: Record<string, unknown>;
}

interface ContentTypeMapping {
  engineType: ContentType;
  platform: "YOUTUBE" | "X_THREAD" | "X_SINGLE" | "BLOG" | "LINKEDIN" | "META_REEL" | "META_CAROUSEL" | "META_POST";
  pipelineType: string;
  jsonStructure: string;
}

// ─── JSON Structure Templates (must be declared before CONTENT_TYPE_MAP) ───

const YOUTUBE_EXPLAINER_STRUCTURE = `Create a complete content package with this EXACT JSON structure:
{
  "script": {
    "sections": [
      { "type": "hook", "timeCode": "0:00-0:30", "text": "...", "visualNotes": "..." },
      { "type": "context", "timeCode": "0:30-2:00", "text": "...", "visualNotes": "..." },
      { "type": "thesis", "timeCode": "2:00-4:00", "text": "...", "visualNotes": "..." },
      { "type": "evidence", "timeCode": "4:00-8:00", "text": "...", "visualNotes": "..." },
      { "type": "counterpoint", "timeCode": "8:00-10:00", "text": "...", "visualNotes": "..." },
      { "type": "implications", "timeCode": "10:00-12:00", "text": "...", "visualNotes": "..." },
      { "type": "cta", "timeCode": "12:00-12:30", "text": "...", "visualNotes": "..." }
    ]
  },
  "titles": [
    { "text": "...", "strategy": "curiosity_gap" },
    { "text": "...", "strategy": "data_driven" },
    { "text": "...", "strategy": "provocative_question" }
  ],
  "description": "YouTube description (SEO optimized, 200+ words)",
  "tags": ["keyword1", "keyword2", "...15-20 relevant keywords"],
  "thumbnailBriefs": [
    { "concept": "...", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." },
    { "concept": "...", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." },
    { "concept": "...", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- Each script section "text" field must contain the ACTUAL script text the host reads aloud
- Apply hook engineering: the hook must be a provocative opening — NOT "today we're going to discuss..."
- Apply title engineering: use formulas from the title engineering skill — CTR optimized
- Every claim must be backed by data from the research dossier
- Visual notes should be specific B-roll/graphic suggestions`;

const X_THREAD_STRUCTURE = `Create a complete thread with this EXACT JSON structure:
{
  "tweets": [
    { "position": 1, "text": "Hook tweet (max 280 chars)", "type": "hook" },
    { "position": 2, "text": "Context tweet", "type": "context" },
    { "position": 3, "text": "Data point tweet", "type": "evidence" },
    { "position": 4, "text": "...", "type": "analysis" },
    { "position": 5, "text": "...", "type": "analysis" },
    { "position": 6, "text": "...", "type": "analysis" },
    { "position": 7, "text": "...", "type": "analysis" },
    { "position": 8, "text": "...", "type": "implication" },
    { "position": 9, "text": "Engagement CTA tweet", "type": "cta" }
  ],
  "titles": [
    { "text": "Thread title option 1", "strategy": "hook" },
    { "text": "Thread title option 2", "strategy": "data" }
  ],
  "description": "Brief summary of the thread (100 words)",
  "tags": ["keyword1", "keyword2", "...10-15 relevant hashtags"],
  "thumbnailBriefs": [
    { "concept": "Thread header image", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- 8-12 tweets total, each MUST be under 280 characters
- Apply hook engineering: hook tweet must stop the scroll — provocative claim or surprising fact
- Include data in at least 3 tweets
- Last tweet is engagement CTA (question + follow prompt)`;

const CAROUSEL_STRUCTURE = `Create a carousel with this EXACT JSON structure:
{
  "slides": [
    { "position": 1, "role": "hook", "headline": "...", "bodyText": "...", "visualPrompt": "Image generation prompt", "textOverlay": "...", "colorHex": "#..." },
    { "position": 2, "role": "context", "headline": "...", "bodyText": "...", "visualPrompt": "...", "textOverlay": "...", "colorHex": "#..." },
    { "position": 3, "role": "data", "headline": "...", "bodyText": "...", "visualPrompt": "...", "textOverlay": "...", "colorHex": "#..." },
    { "position": 4, "role": "escalation", "headline": "...", "bodyText": "...", "visualPrompt": "...", "textOverlay": "...", "colorHex": "#..." },
    { "position": 5, "role": "escalation", "headline": "...", "bodyText": "...", "visualPrompt": "...", "textOverlay": "...", "colorHex": "#..." },
    { "position": 6, "role": "data", "headline": "...", "bodyText": "...", "visualPrompt": "...", "textOverlay": "...", "colorHex": "#..." },
    { "position": 7, "role": "climax", "headline": "...", "bodyText": "...", "visualPrompt": "...", "textOverlay": "...", "colorHex": "#..." },
    { "position": 8, "role": "cta", "headline": "...", "bodyText": "...", "visualPrompt": "...", "textOverlay": "...", "colorHex": "#..." }
  ],
  "caption": "Instagram caption (500+ chars with line breaks and emojis)",
  "titles": [
    { "text": "Carousel title option 1", "strategy": "hook" },
    { "text": "Carousel title option 2", "strategy": "data" }
  ],
  "description": "Brief summary",
  "tags": ["#hashtag1", "#hashtag2", "...15-20 relevant hashtags"],
  "thumbnailBriefs": [
    { "concept": "Cover slide design", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- 8-10 slides with strong visual design direction
- Apply hook engineering: hook slide must stop the scroll
- Data slides should present ONE clear stat per slide
- CTA slide drives saves, shares, follows`;

const QUICK_TAKE_STRUCTURE = `Create a quick take with this EXACT JSON structure:
{
  "script": {
    "sections": [
      { "type": "hook", "timeCode": "0:00-0:15", "text": "...", "visualNotes": "..." },
      { "type": "context", "timeCode": "0:15-1:00", "text": "...", "visualNotes": "..." },
      { "type": "opinion", "timeCode": "1:00-3:00", "text": "...", "visualNotes": "..." },
      { "type": "implication", "timeCode": "3:00-4:00", "text": "...", "visualNotes": "..." },
      { "type": "cta", "timeCode": "4:00-4:30", "text": "...", "visualNotes": "..." }
    ]
  },
  "titles": [
    { "text": "...", "strategy": "hot_take" },
    { "text": "...", "strategy": "breaking" }
  ],
  "description": "YouTube description (150 words)",
  "tags": ["keyword1", "keyword2", "...10-15 keywords"],
  "thumbnailBriefs": [
    { "concept": "...", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- This is a SHORT opinion piece — more editorial, less research depth
- The host should have a clear, strong take
- Max 5 minutes runtime
- More conversational than a full explainer
- Apply hook engineering for the opening`;

// ─── Additional JSON Structure Templates ───

const YOUTUBE_SHORT_STRUCTURE = `Create a 60-second YouTube Short with this EXACT JSON structure:
{
  "script": {
    "hook": { "text": "...", "duration": "0:00-0:02", "visualNote": "..." },
    "segments": [
      { "text": "...", "duration": "0:02-0:15", "visualNote": "...", "textOverlay": "..." },
      { "text": "...", "duration": "0:15-0:35", "visualNote": "...", "textOverlay": "..." },
      { "text": "...", "duration": "0:35-0:50", "visualNote": "...", "textOverlay": "..." }
    ],
    "cta": { "text": "...", "duration": "0:50-0:58", "visualNote": "..." }
  },
  "totalDuration": "58 seconds",
  "titles": [
    { "text": "...", "strategy": "hook" },
    { "text": "...", "strategy": "curiosity" },
    { "text": "...", "strategy": "data" }
  ],
  "description": "YouTube Shorts description (100 words, SEO optimized)",
  "tags": ["keyword1", "keyword2", "...10-15 keywords"],
  "hashtags": ["#short1", "#short2", "...5 max"],
  "musicMood": "energetic|tense|uplifting|dramatic",
  "textOverlays": [
    { "text": "...", "timing": "0:02", "style": "bold|subtle|data" }
  ],
  "thumbnailBriefs": [
    { "concept": "...", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- HOOK in first 1.5 seconds — text overlay + spoken word
- Vertical format (9:16, 1080x1920)
- No intro/outro — jump straight in
- End with subscribe CTA overlay
- One key insight only — don't cover everything
- Max 60 seconds total`;

const X_SINGLE_STRUCTURE = `Create a single tweet with this EXACT JSON structure:
{
  "tweets": [
    { "position": 1, "text": "Tweet text (max 280 chars)", "type": "main" }
  ],
  "variants": [
    { "text": "Provocative variant (max 280 chars)", "strategy": "provocative" },
    { "text": "Data-driven variant (max 280 chars)", "strategy": "data_driven" },
    { "text": "Question variant (max 280 chars)", "strategy": "question" }
  ],
  "titles": [
    { "text": "Main tweet", "strategy": "primary" }
  ],
  "description": "Brief context about this tweet",
  "tags": ["#hashtag1", "#hashtag2", "...3-5 relevant hashtags"],
  "mediaDescription": "Suggested image/graphic to accompany the tweet",
  "thumbnailBriefs": [
    { "concept": "Social card image", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- MUST be under 280 characters
- Provide 3 variants with different strategies
- Include media suggestion for higher engagement
- Strategic hashtag placement (2-3 max in tweet)`;

const INSTAGRAM_REEL_STRUCTURE = `Create a 60-90 second Instagram Reel with this EXACT JSON structure:
{
  "script": {
    "hook": { "text": "...", "duration": "0:00-0:02", "visualNote": "..." },
    "segments": [
      { "text": "...", "duration": "0:02-0:20", "visualNote": "...", "textOverlay": "..." },
      { "text": "...", "duration": "0:20-0:45", "visualNote": "...", "textOverlay": "..." },
      { "text": "...", "duration": "0:45-1:05", "visualNote": "...", "textOverlay": "..." }
    ],
    "cta": { "text": "...", "duration": "1:05-1:15", "visualNote": "..." }
  },
  "totalDuration": "75 seconds",
  "titles": [
    { "text": "...", "strategy": "hook" },
    { "text": "...", "strategy": "curiosity" }
  ],
  "description": "Instagram caption (2200 chars max with line breaks)",
  "tags": ["#hashtag1", "#hashtag2", "...20-30 relevant hashtags"],
  "musicMood": "trending|energetic|dramatic|chill",
  "textOverlays": [
    { "text": "...", "timing": "0:02", "style": "bold|subtle|data" }
  ],
  "coverFrameDescription": "Description of the cover frame for the reel",
  "thumbnailBriefs": [
    { "concept": "Cover frame design", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- HOOK in first 2 seconds
- Vertical format (9:16, 1080x1920)
- Text overlays at key moments with timing
- Trending audio mood suggestion
- Caption with line breaks (2200 char max)
- 20-30 relevant hashtags
- CTA: save or share`;

const LINKEDIN_POST_STRUCTURE = `Create a LinkedIn post with this EXACT JSON structure:
{
  "post": {
    "text": "Full LinkedIn post text (1000-2000 chars with line breaks for readability)"
  },
  "titles": [
    { "text": "Post headline option 1", "strategy": "professional" },
    { "text": "Post headline option 2", "strategy": "thought_leadership" }
  ],
  "description": "Brief summary of the post angle",
  "tags": ["#keyword1", "#keyword2", "...5-8 professional hashtags"],
  "thumbnailBriefs": [
    { "concept": "Professional header image", "textOverlay": "4 words max", "colorScheme": "corporate blues", "composition": "1200x627" }
  ]
}

REQUIREMENTS:
- 1000-2000 characters
- Professional tone, data-driven insights
- Line breaks every 1-2 sentences for LinkedIn readability
- Hook in first line (before "see more" fold)
- End with question or CTA for engagement
- 5-8 professional hashtags`;

const LINKEDIN_ARTICLE_STRUCTURE = `Create a LinkedIn article with this EXACT JSON structure:
{
  "article": {
    "headline": "Article headline",
    "subtitle": "Article subtitle",
    "sections": [
      { "heading": "...", "text": "...", "type": "intro" },
      { "heading": "...", "text": "...", "type": "analysis" },
      { "heading": "...", "text": "...", "type": "analysis" },
      { "heading": "...", "text": "...", "type": "data" },
      { "heading": "...", "text": "...", "type": "implications" },
      { "heading": "...", "text": "...", "type": "conclusion" }
    ]
  },
  "titles": [
    { "text": "...", "strategy": "thought_leadership" },
    { "text": "...", "strategy": "data_driven" }
  ],
  "description": "Article summary for preview",
  "tags": ["#keyword1", "#keyword2", "...5-8 professional hashtags"],
  "thumbnailBriefs": [
    { "concept": "Article cover image", "textOverlay": "4 words max", "colorScheme": "professional", "composition": "1200x627" }
  ]
}

REQUIREMENTS:
- Long-form with 5-7 sections
- Professional, thought-leadership tone
- Data-backed arguments with cited sources
- Each section 200-400 words
- Strong headline that promises insight`;

const BLOG_POST_STRUCTURE = `Create an SEO-optimized blog post with this EXACT JSON structure:
{
  "article": {
    "headline": "H1 title with primary keyword",
    "metaDescription": "155 chars max SEO meta description",
    "sections": [
      { "heading": "H2 heading", "text": "...", "type": "intro" },
      { "heading": "H2 heading", "text": "...", "type": "body" },
      { "heading": "H2 heading", "text": "...", "type": "body" },
      { "heading": "H2 heading", "text": "...", "type": "body" },
      { "heading": "H2 heading", "text": "...", "type": "conclusion" }
    ]
  },
  "titles": [
    { "text": "...", "strategy": "seo_keyword" },
    { "text": "...", "strategy": "curiosity" }
  ],
  "description": "SEO meta description (155 chars max)",
  "tags": ["keyword1", "keyword2", "...10-15 SEO keywords"],
  "seo": {
    "primaryKeyword": "...",
    "secondaryKeywords": ["...", "..."],
    "slug": "url-friendly-slug"
  },
  "thumbnailBriefs": [
    { "concept": "Featured image", "textOverlay": "4 words max", "colorScheme": "editorial", "composition": "1200x630" }
  ]
}

REQUIREMENTS:
- SEO-optimized H1 with primary keyword
- H2 headings with secondary keywords
- Meta description under 155 characters
- 1500-3000 words total
- Internal and external link suggestions
- Readable paragraphs (3-4 sentences each)`;

const NEWSLETTER_STRUCTURE = `Create a newsletter with this EXACT JSON structure:
{
  "newsletter": {
    "subject": "Email subject line (50 chars max)",
    "previewText": "Preview text shown in inbox (90 chars max)",
    "sections": [
      { "heading": "...", "text": "...", "type": "lead" },
      { "heading": "...", "text": "...", "type": "analysis" },
      { "heading": "...", "text": "...", "type": "data" },
      { "heading": "...", "text": "...", "type": "takeaway" }
    ],
    "cta": { "text": "CTA button text", "description": "Where it links / what it does" }
  },
  "titles": [
    { "text": "Subject line option 1", "strategy": "curiosity" },
    { "text": "Subject line option 2", "strategy": "urgency" }
  ],
  "description": "Newsletter summary",
  "tags": ["topic1", "topic2"],
  "thumbnailBriefs": []
}

REQUIREMENTS:
- Subject line under 50 chars (high open rate)
- Preview text under 90 chars
- 3-5 sections, scannable format
- Clear CTA at the end
- Conversational but informative tone`;

const PODCAST_SCRIPT_STRUCTURE = `Create a podcast script with this EXACT JSON structure:
{
  "script": {
    "sections": [
      { "type": "intro", "timeCode": "0:00-2:00", "text": "...", "visualNotes": "Speaker notes / tone direction" },
      { "type": "segment_1", "timeCode": "2:00-8:00", "text": "...", "visualNotes": "..." },
      { "type": "segment_2", "timeCode": "8:00-16:00", "text": "...", "visualNotes": "..." },
      { "type": "segment_3", "timeCode": "16:00-22:00", "text": "...", "visualNotes": "..." },
      { "type": "wrap_up", "timeCode": "22:00-25:00", "text": "...", "visualNotes": "..." }
    ]
  },
  "titles": [
    { "text": "Episode title option 1", "strategy": "hook" },
    { "text": "Episode title option 2", "strategy": "descriptive" }
  ],
  "description": "Episode description / show notes (300 words)",
  "tags": ["keyword1", "keyword2", "...10-15 keywords"],
  "segments": [
    { "name": "...", "duration": "6 min", "summary": "..." }
  ],
  "thumbnailBriefs": [
    { "concept": "Podcast cover art", "textOverlay": "4 words max", "colorScheme": "...", "composition": "square 1400x1400" }
  ]
}

REQUIREMENTS:
- 20-30 minute episode format
- Clear segment structure with time codes
- Conversational host voice — not scripted reading
- Include discussion prompts and talking points
- Show notes with timestamps`;

const COMMUNITY_POST_STRUCTURE = `Create a YouTube community post with this EXACT JSON structure:
{
  "post": {
    "text": "Community post text (max 500 chars)"
  },
  "poll": {
    "question": "Poll question (optional, null if not applicable)",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
  },
  "titles": [
    { "text": "Post summary", "strategy": "engagement" }
  ],
  "description": "Brief context",
  "tags": [],
  "thumbnailBriefs": []
}

REQUIREMENTS:
- Max 500 characters for the post text
- Include a poll if the topic lends itself to audience opinion
- Engagement-focused: ask questions, tease upcoming content, or share quick takes
- Casual, direct tone — this is community interaction`;

// ─── Content Type Mapping ───

const CONTENT_TYPE_MAP: Record<string, ContentTypeMapping> = {
  youtube_explainer: {
    engineType: "VIDEO_SCRIPT",
    platform: "YOUTUBE",
    pipelineType: "cinematic",
    jsonStructure: YOUTUBE_EXPLAINER_STRUCTURE,
  },
  youtube_short: {
    engineType: "VIDEO_SHORT",
    platform: "YOUTUBE",
    pipelineType: "viral_micro",
    jsonStructure: YOUTUBE_SHORT_STRUCTURE,
  },
  x_thread: {
    engineType: "TWEET_THREAD",
    platform: "X_THREAD",
    pipelineType: "viral_micro",
    jsonStructure: X_THREAD_STRUCTURE,
  },
  x_single: {
    engineType: "TWEET_SINGLE",
    platform: "X_SINGLE",
    pipelineType: "viral_micro",
    jsonStructure: X_SINGLE_STRUCTURE,
  },
  carousel: {
    engineType: "INSTAGRAM_CAROUSEL",
    platform: "META_CAROUSEL",
    pipelineType: "carousel",
    jsonStructure: CAROUSEL_STRUCTURE,
  },
  instagram_carousel: {
    engineType: "INSTAGRAM_CAROUSEL",
    platform: "META_CAROUSEL",
    pipelineType: "carousel",
    jsonStructure: CAROUSEL_STRUCTURE,
  },
  instagram_reel: {
    engineType: "INSTAGRAM_REEL",
    platform: "META_REEL",
    pipelineType: "viral_micro",
    jsonStructure: INSTAGRAM_REEL_STRUCTURE,
  },
  linkedin_post: {
    engineType: "LINKEDIN_POST",
    platform: "LINKEDIN",
    pipelineType: "standard",
    jsonStructure: LINKEDIN_POST_STRUCTURE,
  },
  linkedin_article: {
    engineType: "LINKEDIN_ARTICLE",
    platform: "LINKEDIN",
    pipelineType: "standard",
    jsonStructure: LINKEDIN_ARTICLE_STRUCTURE,
  },
  blog_post: {
    engineType: "BLOG_ARTICLE",
    platform: "BLOG",
    pipelineType: "standard",
    jsonStructure: BLOG_POST_STRUCTURE,
  },
  newsletter: {
    engineType: "BLOG_ARTICLE",
    platform: "BLOG",
    pipelineType: "standard",
    jsonStructure: NEWSLETTER_STRUCTURE,
  },
  podcast_script: {
    engineType: "PODCAST_SCRIPT",
    platform: "YOUTUBE",
    pipelineType: "cinematic",
    jsonStructure: PODCAST_SCRIPT_STRUCTURE,
  },
  quick_take: {
    engineType: "VIDEO_SHORT",
    platform: "YOUTUBE",
    pipelineType: "cinematic",
    jsonStructure: QUICK_TAKE_STRUCTURE,
  },
  community_post: {
    engineType: "VIDEO_SHORT",
    platform: "YOUTUBE",
    pipelineType: "standard",
    jsonStructure: COMMUNITY_POST_STRUCTURE,
  },
};

// ─── Main Handler ───

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topic, brandId, contentType, recommendationContext } = body as {
      topic: string;
      brandId: string;
      contentType: string;
      recommendationContext?: RecommendationContext;
    };

    if (!topic || !brandId || !contentType) {
      return NextResponse.json(
        { error: "topic, brandId, and contentType are required" },
        { status: 400 }
      );
    }

    const mapping = CONTENT_TYPE_MAP[contentType];
    if (!mapping) {
      return NextResponse.json(
        { error: `Invalid contentType. Must be one of: ${Object.keys(CONTENT_TYPE_MAP).join(", ")}` },
        { status: 400 }
      );
    }

    // Load brand
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const voiceRules = parseSafe<string[]>(brand.voiceRules, []);
    const rec = recommendationContext;

    // ─── STEP 1: Load skills for this content type ───

    const orchestrator = new SkillOrchestrator();
    const baseSkillPaths = engineRouter.getSkillPaths(mapping.engineType);

    // Load additional short-form platform skills alongside engine-router defaults
    const extraSkillPaths: string[] = [];
    if (contentType === "youtube_short") {
      extraSkillPaths.push("platforms/youtube/shorts-strategy");
      extraSkillPaths.push("platforms/x-twitter/algorithm-awareness");
    }
    if (contentType === "instagram_reel") {
      extraSkillPaths.push("platforms/meta/reel-production");
      extraSkillPaths.push("production/short-form/vertical-video-adaptation");
      extraSkillPaths.push("platforms/x-twitter/algorithm-awareness");
    }
    const skillPaths = [...new Set([...baseSkillPaths, ...extraSkillPaths])];

    const loadedSkills = await Promise.all(
      skillPaths.map((p) => orchestrator.loadSkill(p).catch(() => null))
    );
    const skills = loadedSkills.filter((s): s is SkillFile => s !== null);

    // Load brand identity skill
    const brandSlug = brand.slug;
    const brandIdentity = await orchestrator
      .loadSkill(`brand/identity/${brandSlug}/identity.md`)
      .catch(() => null);
    const brandVoiceExamples = await orchestrator
      .loadSkill(`brand/identity/${brandSlug}/voice-examples.md`)
      .catch(() => null);
    const brandPlatformSkill = await orchestrator
      .loadSkill(`brand/identity/${brandSlug}/platforms.md`)
      .catch(() => null);

    // ─── STEP 2: Build brand voice block ───

    const brandVoice = getBrandVoiceBlock(
      brand.name,
      voiceRules,
      brand.tone ?? "neutral",
      brand.language ?? "English"
    );

    const brandColorPalette = await getBrandColorPalette(brand.name);

    // ─── STEP 3: Build skill context ───

    // Separate research skills from editorial/platform skills
    const researchSkill = skills.find((s) => s.path.includes("fact-dossier-building"));
    const factCheckSkill = skills.find((s) => s.path.includes("fact-check-shield"));
    const editorialSkills = skills.filter(
      (s) =>
        !s.path.includes("fact-dossier-building") &&
        !s.path.includes("fact-check-shield")
    );

    const editorialSkillContext = editorialSkills
      .map((s) => `## ${s.meta.name}\n${s.instructions}`)
      .join("\n\n");

    // ─── STEP 4: Guided research via Gemini ───

    const researchSystemPrompt = `You are a senior research analyst preparing a comprehensive fact dossier for content creation.
${researchSkill?.instructions ? `\n## RESEARCH METHODOLOGY\n${researchSkill.instructions}` : ""}
${factCheckSkill?.instructions ? `\n## FACT-CHECK PROTOCOL\n${factCheckSkill.instructions}` : ""}

Be thorough, factual, and cite sources where possible. For each claim, note the source. For each stakeholder, note their position and recent statements. For data points, find the most recent authoritative numbers.`;

    const researchUserPrompt = `Research this topic thoroughly for a ${contentType.replace(/_/g, " ")} piece by ${brand.name}.

TOPIC: ${topic}
${rec?.angle ? `EDITORIAL ANGLE: ${rec.angle}` : ""}
${rec?.keyDataPoints?.length ? `KEY DATA POINTS TO VERIFY: ${rec.keyDataPoints.join(", ")}` : ""}
${rec?.stakeholders?.length ? `KEY STAKEHOLDERS: ${rec.stakeholders.join(", ")}` : ""}
${rec?.sensitivityLevel ? `SENSITIVITY LEVEL: ${rec.sensitivityLevel}` : ""}
${rec?.reasoning ? `EDITORIAL REASONING: ${rec.reasoning}` : ""}

Provide a comprehensive research dossier including:
- Key facts and verified data points (with sources)
- Timeline of events (with dates)
- Key stakeholders and their positions
- Statistics and numbers (with attribution)
- Different perspectives and viewpoints
- Geopolitical implications (especially for India)
- Context and background needed for the audience
- Potential counterarguments and their evidence

Return a well-structured report.`;

    const [researchResult, seoAnalysis] = await Promise.all([
      routeToModel("research", researchSystemPrompt, researchUserPrompt),
      runSEOAnalysis(topic, brand.name, brand.language ?? "English").catch((e) => {
        console.error("[quick-generate] SEO analysis failed:", e?.message || e);
        return null as SEOAnalysis | null;
      }),
    ]);
    const research = researchResult.raw;

    if (!research || research.trim().length < 100) {
      return NextResponse.json(
        { error: "Research phase failed — insufficient data returned" },
        { status: 500 }
      );
    }

    // ─── STEP 5: Generate content via Claude (creative writing) ───

    const contentSystemPrompt = `You are a world-class content creator for ${brand.name}. Return ONLY valid JSON.

## YOUR BRAND VOICE
${brandVoice}
${brandIdentity?.instructions ? `\n## BRAND IDENTITY\n${brandIdentity.instructions}` : ""}
${brandVoiceExamples?.instructions ? `\n## VOICE EXAMPLES\n${brandVoiceExamples.instructions}` : ""}
${brandPlatformSkill?.instructions ? `\n## PLATFORM STRATEGY\n${brandPlatformSkill.instructions}` : ""}

## YOUR EDITORIAL SKILLS
${editorialSkillContext}

## CONTENT TYPE: ${contentType.replace(/_/g, " ")}
## PLATFORM: ${engineRouter.getPlatform(mapping.engineType)}
${brandColorPalette ? `## COLOR PALETTE: ${brandColorPalette.description}` : ""}
${seoAnalysis ? `\n${buildSEOPromptBlock(seoAnalysis, mapping.platform)}` : ""}

Apply every skill instruction above to produce exceptional content. Don't just write — think editorially.
Use the hook engineering principles. Use the title engineering formulas. Use the narrative arc structure.
Every choice should be deliberate and backed by the skill frameworks above.
${seoAnalysis ? "Apply the SEO intelligence above: use primary keyword in titles, include platform-specific hashtags/keywords, structure descriptions for search discovery." : ""}
${contentType === "youtube_short" ? `
## SHORT-FORM OPTIMIZATION (YouTube Shorts)
- HOOK in first 1.5 seconds (text overlay + spoken) — this is non-negotiable
- Vertical 9:16 (1080x1920) — design every visual for phone screens
- No intro/outro — jump straight into value
- One key insight only — don't try to cover everything
- End with subscribe CTA overlay
- 3 title options optimized for YouTube Shorts algorithm
- Suggest trending sound/music mood
- Max 5 hashtags` : ""}
${contentType === "instagram_reel" ? `
## SHORT-FORM OPTIMIZATION (Instagram Reels)
- HOOK in first 2 seconds — pattern interrupt required
- Vertical 9:16 (1080x1920) — phone-first design
- Text overlays at key moments with specific timing
- Suggest trending audio mood
- Caption: 2200 char max with strategic line breaks
- 20-30 relevant hashtags (mix of broad + niche)
- CTA: save or share (not follow)
- Include cover frame description for grid aesthetic` : ""}`;

    const contentUserPrompt = `Create a ${contentType.replace(/_/g, " ")} for ${brand.name} on ${engineRouter.getPlatform(mapping.engineType)}.

TOPIC: ${topic}
${rec?.angle ? `ANGLE: ${rec.angle}` : "ANGLE: Use your best editorial judgment"}
${rec?.suggestedTitle ? `SUGGESTED TITLE: ${rec.suggestedTitle}` : ""}
${rec?.priority ? `PRIORITY: ${rec.priority}` : ""}
${rec?.urgency ? `URGENCY: ${rec.urgency}` : ""}

RESEARCH DOSSIER:
${research}

${mapping.jsonStructure}

Return ONLY the JSON, no other text.`;

    const contentResult = await routeToModel(
      "drafting",
      contentSystemPrompt,
      contentUserPrompt,
      { temperature: 0.7, maxTokens: 8192 }
    );

    const parsed = contentResult.parsed as Record<string, unknown> | null;

    if (!parsed) {
      return NextResponse.json(
        {
          error: "Content generation failed — could not parse AI response",
          raw: contentResult.raw?.slice(0, 500),
        },
        { status: 500 }
      );
    }

    // ─── STEP 6: Save deliverable + assets ───

    const deliverable = await prisma.deliverable.create({
      data: {
        brandId,
        platform: mapping.platform,
        pipelineType: mapping.pipelineType,
        status: "REVIEW",
        copyMarkdown: buildCopyMarkdown(parsed, contentType),
        scriptData:
          contentType === "youtube_explainer" ||
          contentType === "quick_take" ||
          contentType === "x_thread"
            ? (parsed as Record<string, unknown> as any)
            : undefined,
        carouselData: contentType === "carousel" ? (parsed as Record<string, unknown> as any) : undefined,
        postingPlan: parsed.tags
          ? ({
              tags: parsed.tags,
              description: parsed.description,
              ...(seoAnalysis ? { seo: {
                primaryKeyword: seoAnalysis.primaryKeyword,
                secondaryKeywords: seoAnalysis.secondaryKeywords,
                searchVolumeTrend: seoAnalysis.searchVolumeTrend,
                competitionLevel: seoAnalysis.competitionLevel,
                seoTitle: seoAnalysis.seoTitle,
                metaDescription: seoAnalysis.metaDescription,
                suggestedSlug: seoAnalysis.suggestedSlug,
              }} : {}),
            } as any)
          : seoAnalysis
            ? ({ seo: {
                primaryKeyword: seoAnalysis.primaryKeyword,
                secondaryKeywords: seoAnalysis.secondaryKeywords,
                searchVolumeTrend: seoAnalysis.searchVolumeTrend,
                competitionLevel: seoAnalysis.competitionLevel,
                seoTitle: seoAnalysis.seoTitle,
                metaDescription: seoAnalysis.metaDescription,
                suggestedSlug: seoAnalysis.suggestedSlug,
              }} as any)
            : undefined,
        researchPrompt: topic,
        factDossierId: null,
      },
    });

    // Create assets from generated content
    const assets = buildAssets(parsed, contentType, deliverable.id);
    if (assets.length > 0) {
      await prisma.asset.createMany({ data: assets as any });
    }

    // Save research as NarrativeTree + FactDossier
    const tree = await prisma.narrativeTree.create({
      data: {
        title: topic,
        summary: research.slice(0, 500),
        status: "IN_PRODUCTION",
        urgency: rec?.urgency === "breaking" ? "high" : "normal",
        createdById: session.user.id,
        signalData: {
          topic,
          generatedAt: new Date().toISOString(),
          angle: rec?.angle ?? null,
          skillsUsed: skills.map((s) => s.meta.name),
          modelUsed: contentResult.model,
        } as any,
      },
    });

    await prisma.factDossier.create({
      data: {
        treeId: tree.id,
        structuredData: parsed as any,
        sources: extractSources(research),
        visualAssets: [],
        rawResearch: research,
      },
    });

    // Link deliverable to tree
    await prisma.deliverable.update({
      where: { id: deliverable.id },
      data: { treeId: tree.id },
    });

    // ─── STEP 7: Fire image generation in background ───

    fireImageGeneration(parsed, contentType, deliverable.id, brand.name, brandColorPalette).catch(
      (err) => console.error("[quick-generate] Image generation error:", err)
    );

    // ─── STEP 7b: Fire voiceover generation in background ───

    fireVoiceover(parsed, contentType, deliverable.id, brand.language ?? "English").catch(
      (err) => console.error("[quick-generate] Voiceover error:", err)
    );

    // ─── STEP 8: Log skill executions ───

    logSkillExecutions(
      skills,
      brandIdentity,
      brandVoiceExamples,
      brandPlatformSkill,
      { topic, contentType, brandId },
      deliverable.id,
      session.user.id,
      contentResult.model
    ).catch((err) =>
      console.error("[quick-generate] Skill logging error:", err)
    );

    return NextResponse.json({
      deliverableId: deliverable.id,
      treeId: tree.id,
      contentType,
      platform: mapping.platform,
      status: "REVIEW",
      skillsLoaded: skills.map((s) => s.meta.name),
      modelUsed: contentResult.model,
      brandVoiceApplied: brand.name,
      seo: seoAnalysis ?? undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Quick-generate error:", message);
    return NextResponse.json(
      { error: `Generation failed: ${message}` },
      { status: 500 }
    );
  }
}

// ─── Image Generation ───

async function fireImageGeneration(
  parsed: Record<string, unknown>,
  contentType: string,
  deliverableId: string,
  brandName: string,
  colorPalette: { colors: string[]; description: string } | null
) {
  const colorHint = colorPalette
    ? ` Use brand colors: ${colorPalette.description}.`
    : "";

  const imagePromises: Promise<void>[] = [];

  // Thumbnail generation for all content types
  const thumbs = (parsed.thumbnailBriefs as Array<{
    concept: string;
    textOverlay: string;
    colorScheme: string;
    composition: string;
  }>) ?? [];

  if (thumbs.length > 0) {
    const thumb = thumbs[0];
    imagePromises.push(
      generateAndSaveImage(
        `Professional ${contentType.replace(/_/g, " ")} thumbnail for ${brandName}: ${thumb.concept}. Text overlay: "${thumb.textOverlay}". ${thumb.composition}.${colorHint}`,
        deliverableId,
        "THUMBNAIL",
        0
      )
    );
  }

  // Carousel slide images
  if (contentType === "carousel" || contentType === "instagram_carousel") {
    const slides = (parsed.slides as Array<{
      position: number;
      visualPrompt: string;
      headline: string;
    }>) ?? [];

    for (const slide of slides.slice(0, 4)) {
      imagePromises.push(
        generateAndSaveImage(
          `Instagram carousel slide ${slide.position}: ${slide.visualPrompt}.${colorHint}`,
          deliverableId,
          "CAROUSEL_SLIDE",
          slide.position
        )
      );
    }
  }

  // Cover frame for short-form video (YouTube Shorts / Instagram Reels)
  if (contentType === "youtube_short" || contentType === "instagram_reel") {
    const title = (parsed.titles as Array<{ text: string }>)?.[0]?.text ?? "Short";
    imagePromises.push(
      generateAndSaveImage(
        `Vertical cover frame for a ${contentType.replace(/_/g, " ")} about "${title}". Bold, eye-catching, 1080x1920 aspect ratio.${colorHint}`,
        deliverableId,
        "SOCIAL_CARD",
        0
      )
    );
  }

  // Social card for X threads / singles
  if (contentType === "x_thread" || contentType === "x_single") {
    const title = (parsed.titles as Array<{ text: string }>)?.[0]?.text ?? "Thread";
    imagePromises.push(
      generateAndSaveImage(
        `Twitter/X social card header for a thread about "${title}". 1200x675, bold typography, political analysis style.${colorHint}`,
        deliverableId,
        "SOCIAL_CARD",
        0
      )
    );
  }

  // Professional header for LinkedIn
  if (contentType === "linkedin_post" || contentType === "linkedin_article") {
    const title = (parsed.titles as Array<{ text: string }>)?.[0]?.text ?? "Post";
    imagePromises.push(
      generateAndSaveImage(
        `Professional LinkedIn header image about "${title}". Clean, corporate, data-driven aesthetic. 1200x627.${colorHint}`,
        deliverableId,
        "SOCIAL_CARD",
        0
      )
    );
  }

  // Featured image for blog posts
  if (contentType === "blog_post") {
    const title = (parsed.titles as Array<{ text: string }>)?.[0]?.text ?? "Article";
    imagePromises.push(
      generateAndSaveImage(
        `Blog featured image for article about "${title}". Professional, editorial style. 1200x630.${colorHint}`,
        deliverableId,
        "IMAGE",
        0
      )
    );
  }

  if (imagePromises.length > 0) {
    const results = await Promise.allSettled(imagePromises);
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    console.log(
      `[quick-generate] Image gen: ${succeeded} succeeded, ${failed} failed`
    );
  }
}

async function generateAndSaveImage(
  prompt: string,
  deliverableId: string,
  assetType: "THUMBNAIL" | "CAROUSEL_SLIDE" | "SOCIAL_CARD" | "IMAGE",
  index: number
) {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
    });

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find(
      (p: { inlineData?: { mimeType?: string } }) =>
        p.inlineData?.mimeType?.startsWith("image/")
    );

    if (imagePart?.inlineData?.data) {
      // Update the placeholder asset with real image data
      const asset = await prisma.asset.findFirst({
        where: {
          deliverableId,
          type: assetType,
          ...(assetType === "CAROUSEL_SLIDE"
            ? { slideIndex: index }
            : {}),
        },
      });

      if (asset) {
        await prisma.asset.update({
          where: { id: asset.id },
          data: {
            url: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
            metadata: {
              ...(typeof asset.metadata === "object" && asset.metadata !== null
                ? asset.metadata
                : {}),
              generated: true,
              generatedAt: new Date().toISOString(),
            },
          },
        });
      }
    }
  } catch (err) {
    console.error(
      `[quick-generate] Image gen failed for ${assetType}-${index}:`,
      err instanceof Error ? err.message : err
    );
  }
}

// ─── Voiceover Generation ───

async function fireVoiceover(
  parsed: Record<string, unknown>,
  contentType: string,
  deliverableId: string,
  language: string
) {
  // Only generate voiceover for short-form video content
  const voiceoverTypes = ["youtube_short", "instagram_reel", "quick_take"];
  if (!voiceoverTypes.includes(contentType)) return;

  try {
    const { generateVoiceover } = await import("@/lib/yantri/elevenlabs");

    // Extract script text based on content type structure
    let scriptText = "";

    if (contentType === "quick_take") {
      // quick_take uses sections-based script
      const script = parsed.script as {
        sections?: Array<{ type: string; text: string }>;
      };
      scriptText = (script?.sections ?? []).map((s) => s.text).join(" ");
    } else {
      // youtube_short and instagram_reel use hook/segments/cta structure
      const script = parsed.script as {
        hook?: { text: string };
        segments?: Array<{ text: string }>;
        cta?: { text: string };
      };
      const parts: string[] = [];
      if (script?.hook?.text) parts.push(script.hook.text);
      for (const seg of script?.segments ?? []) {
        if (seg.text) parts.push(seg.text);
      }
      if (script?.cta?.text) parts.push(script.cta.text);
      scriptText = parts.join(" ");
    }

    if (scriptText.length < 10) {
      console.log("[quick-generate] Script too short for voiceover, skipping");
      return;
    }

    const result = await generateVoiceover(scriptText, {
      stability: 0.6,
      similarityBoost: 0.8,
    });

    // Store audio as base64 data URI (consistent with image storage)
    const audioBase64 = result.audio.toString("base64");
    const audioDataUri = `data:audio/mpeg;base64,${audioBase64}`;

    await prisma.asset.create({
      data: {
        deliverableId,
        type: "AUDIO",
        url: audioDataUri,
        promptUsed: "AI Voiceover",
        metadata: {
          voiceId: result.voiceId,
          modelId: result.modelId,
          language,
          contentType,
          scriptLength: scriptText.length,
          estimatedDurationSec: Math.round(scriptText.length / 15),
          audioSizeBytes: result.audio.length,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    console.log(
      `[quick-generate] Voiceover generated: ${result.audio.length} bytes, ~${Math.round(scriptText.length / 15)}s`
    );
  } catch (err) {
    console.error(
      `[quick-generate] Voiceover failed for ${contentType}:`,
      err instanceof Error ? err.message : err
    );
    // Non-blocking — content is still useful without voiceover
  }
}

// ─── Skill Execution Logging ───

async function logSkillExecutions(
  skills: SkillFile[],
  brandIdentity: SkillFile | null,
  brandVoiceExamples: SkillFile | null,
  brandPlatformSkill: SkillFile | null,
  context: { topic: string; contentType: string; brandId: string },
  deliverableId: string,
  userId: string,
  modelUsed: string
) {
  const allSkills = [
    ...skills,
    brandIdentity,
    brandVoiceExamples,
    brandPlatformSkill,
  ].filter((s): s is SkillFile => s !== null);

  for (const skill of allSkills) {
    try {
      const dbSkill = await prisma.skill.upsert({
        where: { path: skill.path },
        create: {
          path: skill.path,
          domain: skill.domain,
          module: skill.meta.module,
          name: skill.meta.name,
        },
        update: {},
      });

      await prisma.skillExecution.create({
        data: {
          skillId: dbSkill.id,
          deliverableId,
          brandId: context.brandId,
          platform: CONTENT_TYPE_MAP[context.contentType]?.platform,
          inputContext: context as object,
          outputSummary: { usage: "prompt_context", contentType: context.contentType },
          modelUsed,
          status: "completed",
          executedById: userId,
        },
      });
    } catch {
      // Don't let logging failure break the response
    }
  }
}

// ─── Helpers ───

function parseSafe<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (Array.isArray(value)) return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function buildCopyMarkdown(
  parsed: Record<string, unknown>,
  contentType: string
): string {
  const titles = (parsed.titles as Array<{ text: string }>) ?? [];
  const title = titles[0]?.text ?? "Untitled";
  const description = (parsed.description as string) ?? "";

  // Script-based types (youtube_explainer, quick_take, podcast_script)
  if (contentType === "youtube_explainer" || contentType === "quick_take" || contentType === "podcast_script") {
    const script = parsed.script as {
      sections?: Array<{ type: string; text: string }>;
    };
    const sections = script?.sections ?? [];
    const fullText = sections
      .map((s) => `**[${s.type.toUpperCase()}]**\n${s.text}`)
      .join("\n\n");
    return `# ${title}\n\n${fullText}\n\n---\n\n${description}`;
  }

  // Short-form video types (youtube_short, instagram_reel)
  if (contentType === "youtube_short" || contentType === "instagram_reel") {
    const script = parsed.script as {
      hook?: { text: string };
      segments?: Array<{ text: string; textOverlay?: string }>;
      cta?: { text: string };
    };
    const parts: string[] = [];
    if (script?.hook) parts.push(`**[HOOK]**\n${script.hook.text}`);
    for (const seg of script?.segments ?? []) {
      parts.push(`${seg.text}${seg.textOverlay ? `\n_Overlay: ${seg.textOverlay}_` : ""}`);
    }
    if (script?.cta) parts.push(`**[CTA]**\n${script.cta.text}`);
    return `# ${title}\n\n${parts.join("\n\n")}\n\n---\n\n${description}`;
  }

  // Thread
  if (contentType === "x_thread") {
    const tweets = (parsed.tweets as Array<{
      position: number;
      text: string;
    }>) ?? [];
    const threadText = tweets
      .map((t) => `**Tweet ${t.position}:**\n${t.text}`)
      .join("\n\n");
    return `# ${title}\n\n${threadText}`;
  }

  // Single tweet
  if (contentType === "x_single") {
    const tweets = (parsed.tweets as Array<{ text: string }>) ?? [];
    const variants = (parsed.variants as Array<{ text: string; strategy: string }>) ?? [];
    const mainTweet = tweets[0]?.text ?? "";
    const variantText = variants.map((v) => `- **${v.strategy}:** ${v.text}`).join("\n");
    return `# ${title}\n\n${mainTweet}\n\n**Variants:**\n${variantText}`;
  }

  // Carousel
  if (contentType === "carousel" || contentType === "instagram_carousel") {
    const slides = (parsed.slides as Array<{
      position: number;
      headline: string;
      bodyText: string;
    }>) ?? [];
    const slideText = slides
      .map((s) => `**Slide ${s.position}: ${s.headline}**\n${s.bodyText}`)
      .join("\n\n");
    const caption = (parsed.caption as string) ?? "";
    return `# ${title}\n\n${slideText}\n\n---\n\n**Caption:** ${caption}`;
  }

  // LinkedIn post
  if (contentType === "linkedin_post") {
    const post = parsed.post as { text?: string };
    return `# ${title}\n\n${post?.text ?? description}`;
  }

  // Article-based types (linkedin_article, blog_post)
  if (contentType === "linkedin_article" || contentType === "blog_post") {
    const article = parsed.article as {
      headline?: string;
      sections?: Array<{ heading: string; text: string }>;
    };
    const sections = article?.sections ?? [];
    const fullText = sections
      .map((s) => `## ${s.heading}\n\n${s.text}`)
      .join("\n\n");
    return `# ${article?.headline ?? title}\n\n${fullText}`;
  }

  // Newsletter
  if (contentType === "newsletter") {
    const newsletter = parsed.newsletter as {
      subject?: string;
      sections?: Array<{ heading: string; text: string }>;
      cta?: { text: string };
    };
    const sections = newsletter?.sections ?? [];
    const fullText = sections
      .map((s) => `## ${s.heading}\n\n${s.text}`)
      .join("\n\n");
    const cta = newsletter?.cta ? `\n\n**CTA:** ${newsletter.cta.text}` : "";
    return `# ${newsletter?.subject ?? title}\n\n${fullText}${cta}`;
  }

  // Community post
  if (contentType === "community_post") {
    const post = parsed.post as { text?: string };
    const poll = parsed.poll as { question?: string; options?: string[] };
    let text = `# ${title}\n\n${post?.text ?? description}`;
    if (poll?.question) {
      text += `\n\n**Poll:** ${poll.question}\n${(poll.options ?? []).map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
    }
    return text;
  }

  return `# ${title}\n\n${description}`;
}

function buildAssets(
  parsed: Record<string, unknown>,
  contentType: string,
  deliverableId: string
): AssetInput[] {
  const assets: AssetInput[] = [];

  // Thumbnail briefs → THUMBNAIL assets
  const thumbs = (parsed.thumbnailBriefs as Array<{
    concept: string;
    textOverlay: string;
    colorScheme: string;
    composition: string;
  }>) ?? [];
  thumbs.forEach((t, i) => {
    assets.push({
      deliverableId,
      type: "THUMBNAIL",
      url: `placeholder://thumbnail-${i + 1}`,
      promptUsed: `${t.concept}. Text: "${t.textOverlay}". Colors: ${t.colorScheme}. Composition: ${t.composition}.`,
      metadata: {
        concept: t.concept,
        textOverlay: t.textOverlay,
        colorScheme: t.colorScheme,
        composition: t.composition,
      },
    });
  });

  // Carousel slides → CAROUSEL_SLIDE assets
  if (contentType === "carousel" || contentType === "instagram_carousel") {
    const slides = (parsed.slides as Array<{
      position: number;
      headline: string;
      visualPrompt: string;
      textOverlay: string;
      colorHex: string;
    }>) ?? [];
    slides.forEach((s) => {
      assets.push({
        deliverableId,
        type: "CAROUSEL_SLIDE",
        url: `placeholder://slide-${s.position}`,
        promptUsed: s.visualPrompt,
        slideIndex: s.position,
        metadata: {
          headline: s.headline,
          textOverlay: s.textOverlay,
          colorHex: s.colorHex,
        },
      });
    });
  }

  // Cover frame for short-form video
  if (contentType === "youtube_short" || contentType === "instagram_reel") {
    assets.push({
      deliverableId,
      type: "SOCIAL_CARD",
      url: "placeholder://cover-frame",
      promptUsed: "Vertical cover frame for short-form video",
      metadata: { purpose: "cover_frame" },
    });
  }

  // Social card for X content
  if (contentType === "x_thread" || contentType === "x_single") {
    assets.push({
      deliverableId,
      type: "SOCIAL_CARD",
      url: "placeholder://social-card",
      promptUsed: "Twitter/X social card header",
      metadata: { purpose: "social_card" },
    });
  }

  // LinkedIn header
  if (contentType === "linkedin_post" || contentType === "linkedin_article") {
    assets.push({
      deliverableId,
      type: "SOCIAL_CARD",
      url: "placeholder://linkedin-header",
      promptUsed: "Professional LinkedIn header image",
      metadata: { purpose: "linkedin_header" },
    });
  }

  // Blog featured image
  if (contentType === "blog_post") {
    assets.push({
      deliverableId,
      type: "IMAGE",
      url: "placeholder://featured-image",
      promptUsed: "Blog featured image",
      metadata: { purpose: "featured_image" },
    });
  }

  return assets;
}

function extractSources(research: string): string[] {
  const urlRegex = /https?:\/\/[^\s)>\]]+/g;
  const matches = research.match(urlRegex) ?? [];
  return [...new Set(matches)].slice(0, 20);
}
