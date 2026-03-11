import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { callGemini, callGeminiResearch } from "@/lib/yantri/gemini";

/**
 * POST /api/yantri/quick-generate
 *
 * Synchronous content generation — bypasses Inngest.
 * Takes a topic, researches it, generates content, saves deliverable + assets.
 *
 * Body: {
 *   topic: string,
 *   brandId: string,
 *   contentType: "youtube_explainer" | "x_thread" | "carousel" | "quick_take"
 * }
 */

// ─── Content-type definitions ───

interface ContentTypeConfig {
  platform: "YOUTUBE" | "X_THREAD" | "META_CAROUSEL" | "YOUTUBE";
  pipelineType: string;
  generatePrompt: (brand: BrandContext, research: string, topic: string) => string;
}

interface BrandContext {
  name: string;
  tone: string;
  language: string;
  voiceRules: string[];
  editorialCovers: string[];
}

const CONTENT_TYPES: Record<string, ContentTypeConfig> = {
  youtube_explainer: {
    platform: "YOUTUBE",
    pipelineType: "cinematic",
    generatePrompt: buildYouTubeExplainerPrompt,
  },
  x_thread: {
    platform: "X_THREAD",
    pipelineType: "viral_micro",
    generatePrompt: buildXThreadPrompt,
  },
  carousel: {
    platform: "META_CAROUSEL",
    pipelineType: "carousel",
    generatePrompt: buildCarouselPrompt,
  },
  quick_take: {
    platform: "YOUTUBE",
    pipelineType: "cinematic",
    generatePrompt: buildQuickTakePrompt,
  },
};

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, brandId, contentType } = await request.json();

    if (!topic || !brandId || !contentType) {
      return NextResponse.json(
        { error: "topic, brandId, and contentType are required" },
        { status: 400 }
      );
    }

    const config = CONTENT_TYPES[contentType];
    if (!config) {
      return NextResponse.json(
        { error: `Invalid contentType. Must be one of: ${Object.keys(CONTENT_TYPES).join(", ")}` },
        { status: 400 }
      );
    }

    // Load brand
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const brandCtx: BrandContext = {
      name: brand.name,
      tone: brand.tone ?? "neutral",
      language: brand.language ?? "English",
      voiceRules: parseSafe(brand.voiceRules, []),
      editorialCovers: parseSafe(brand.editorialCovers, []),
    };

    // ─── Step 1: Research via Gemini (with web grounding) ───
    const researchPrompt = `You are a senior political and economic research analyst.
Research this topic thoroughly: "${topic}"

Provide a comprehensive research dossier including:
- Key facts and verified data points
- Timeline of events (with dates)
- Key stakeholders and their positions
- Statistics and numbers (with sources)
- Different perspectives and viewpoints
- Geopolitical implications (especially for India)
- Context and background needed to understand the story

Be thorough, factual, and cite sources where possible.
Return your findings as a well-structured report.`;

    const research = await callGeminiResearch(
      "You are a thorough research analyst. Provide factual, well-sourced research.",
      researchPrompt
    );

    if (!research || research.trim().length < 100) {
      return NextResponse.json(
        { error: "Research phase failed — Gemini returned insufficient data" },
        { status: 500 }
      );
    }

    // ─── Step 2: Generate content via Gemini (JSON mode) ───
    const contentPrompt = config.generatePrompt(brandCtx, research, topic);

    const { parsed, raw } = await callGemini(
      `You are a world-class content strategist and writer for ${brandCtx.name}. Return ONLY valid JSON.`,
      contentPrompt,
      { temperature: 0.7, maxOutputTokens: 65536 }
    );

    if (!parsed) {
      return NextResponse.json(
        { error: "Content generation failed — could not parse AI response", raw: raw?.slice(0, 500) },
        { status: 500 }
      );
    }

    // ─── Step 3: Save deliverable + assets ───
    const deliverable = await prisma.deliverable.create({
      data: {
        brandId,
        platform: config.platform,
        pipelineType: config.pipelineType,
        status: "REVIEW",
        copyMarkdown: buildCopyMarkdown(parsed, contentType),
        scriptData: contentType === "youtube_explainer" || contentType === "quick_take" ? parsed : undefined,
        carouselData: contentType === "carousel" ? parsed : undefined,
        postingPlan: parsed.tags
          ? { tags: parsed.tags, description: parsed.description }
          : undefined,
        researchPrompt: topic,
        factDossierId: null,
      },
    });

    // Create assets from generated content
    const assets = buildAssets(parsed, contentType, deliverable.id);
    if (assets.length > 0) {
      await prisma.asset.createMany({ data: assets });
    }

    // Also save the research as a NarrativeTree + FactDossier for reuse
    const tree = await prisma.narrativeTree.create({
      data: {
        title: topic,
        summary: research.slice(0, 500),
        status: "IN_PRODUCTION",
        urgency: "normal",
        createdById: session.user.id,
        signalData: { topic, generatedAt: new Date().toISOString() },
      },
    });

    await prisma.factDossier.create({
      data: {
        treeId: tree.id,
        structuredData: parsed,
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

    return NextResponse.json({
      deliverableId: deliverable.id,
      treeId: tree.id,
      contentType,
      platform: config.platform,
      status: "REVIEW",
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

// ─── Prompt Builders ───

function buildYouTubeExplainerPrompt(brand: BrandContext, research: string, topic: string): string {
  return `Based on the following research, create a 10-15 minute YouTube Explainer video script for ${brand.name}.

BRAND VOICE:
- Tone: ${brand.tone}
- Language: ${brand.language}
- Voice rules: ${brand.voiceRules.join("; ")}

TOPIC: ${topic}

RESEARCH:
${research}

Create a complete content package with this EXACT JSON structure:
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

IMPORTANT:
- Each script section "text" field should contain the ACTUAL script text the host reads aloud
- The hook must be a provocative opening — NOT "today we're going to discuss..."
- Use The Squirrels signature phrases naturally
- Every claim must be backed by data from the research
- Visual notes should be specific B-roll/graphic suggestions
- Titles must be optimized for YouTube CTR
- Return ONLY the JSON, no other text`;
}

function buildXThreadPrompt(brand: BrandContext, research: string, topic: string): string {
  return `Based on the following research, create an X (Twitter) thread for ${brand.name}.

BRAND VOICE:
- Tone: ${brand.tone}
- Language: ${brand.language}
- Voice rules: ${brand.voiceRules.join("; ")}

TOPIC: ${topic}

RESEARCH:
${research}

Create a complete thread with this EXACT JSON structure:
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

IMPORTANT:
- 8-12 tweets total
- Each tweet MUST be under 280 characters
- Hook tweet must stop the scroll — provocative claim or surprising fact
- Include data in at least 3 tweets
- Last tweet is engagement CTA (question + follow prompt)
- Return ONLY the JSON`;
}

function buildCarouselPrompt(brand: BrandContext, research: string, topic: string): string {
  return `Based on the following research, create an Instagram/Meta carousel post for ${brand.name}.

BRAND VOICE:
- Tone: ${brand.tone}
- Language: ${brand.language}
- Voice rules: ${brand.voiceRules.join("; ")}

TOPIC: ${topic}

RESEARCH:
${research}

Create a carousel with this EXACT JSON structure:
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

IMPORTANT:
- 8-10 slides
- Each slide must have strong visual design direction
- Hook slide must stop the scroll
- Data slides should present ONE clear stat per slide
- CTA slide drives saves, shares, follows
- Return ONLY the JSON`;
}

function buildQuickTakePrompt(brand: BrandContext, research: string, topic: string): string {
  return `Based on the following research, create a 2-5 minute Quick Take video script for ${brand.name}.

BRAND VOICE:
- Tone: ${brand.tone}
- Language: ${brand.language}
- Voice rules: ${brand.voiceRules.join("; ")}

TOPIC: ${topic}

RESEARCH:
${research}

Create a quick take with this EXACT JSON structure:
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

IMPORTANT:
- This is a SHORT opinion piece — more editorial, less research depth
- The host should have a clear, strong take
- Max 5 minutes runtime
- More conversational than a full explainer
- Return ONLY the JSON`;
}

// ─── Helpers ───

function parseSafe<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (Array.isArray(value)) return value as T;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return fallback;
}

function buildCopyMarkdown(parsed: Record<string, unknown>, contentType: string): string {
  const titles = (parsed.titles as Array<{ text: string }>) ?? [];
  const title = titles[0]?.text ?? "Untitled";
  const description = (parsed.description as string) ?? "";

  if (contentType === "youtube_explainer" || contentType === "quick_take") {
    const script = parsed.script as { sections?: Array<{ type: string; text: string }> };
    const sections = script?.sections ?? [];
    const fullText = sections.map((s) => `**[${s.type.toUpperCase()}]**\n${s.text}`).join("\n\n");
    return `# ${title}\n\n${fullText}\n\n---\n\n${description}`;
  }

  if (contentType === "x_thread") {
    const tweets = (parsed.tweets as Array<{ position: number; text: string }>) ?? [];
    const threadText = tweets.map((t) => `**Tweet ${t.position}:**\n${t.text}`).join("\n\n");
    return `# ${title}\n\n${threadText}`;
  }

  if (contentType === "carousel") {
    const slides = (parsed.slides as Array<{ position: number; headline: string; bodyText: string }>) ?? [];
    const slideText = slides.map((s) => `**Slide ${s.position}: ${s.headline}**\n${s.bodyText}`).join("\n\n");
    const caption = (parsed.caption as string) ?? "";
    return `# ${title}\n\n${slideText}\n\n---\n\n**Caption:** ${caption}`;
  }

  return `# ${title}\n\n${description}`;
}

function buildAssets(
  parsed: Record<string, unknown>,
  contentType: string,
  deliverableId: string
): Prisma.AssetCreateManyInput[] {
  const assets: Prisma.AssetCreateManyInput[] = [];

  // Thumbnail briefs → THUMBNAIL assets
  const thumbs = (parsed.thumbnailBriefs as Array<{ concept: string; textOverlay: string; colorScheme: string; composition: string }>) ?? [];
  thumbs.forEach((t, i) => {
    assets.push({
      deliverableId,
      type: "THUMBNAIL",
      url: `placeholder://thumbnail-${i + 1}`,
      promptUsed: `${t.concept}. Text: "${t.textOverlay}". Colors: ${t.colorScheme}. Composition: ${t.composition}.`,
      metadata: { concept: t.concept, textOverlay: t.textOverlay, colorScheme: t.colorScheme, composition: t.composition },
    });
  });

  // Carousel slides → CAROUSEL_SLIDE assets
  if (contentType === "carousel") {
    const slides = (parsed.slides as Array<{ position: number; headline: string; visualPrompt: string; textOverlay: string; colorHex: string }>) ?? [];
    slides.forEach((s) => {
      assets.push({
        deliverableId,
        type: "CAROUSEL_SLIDE",
        url: `placeholder://slide-${s.position}`,
        promptUsed: s.visualPrompt,
        slideIndex: s.position,
        metadata: { headline: s.headline, textOverlay: s.textOverlay, colorHex: s.colorHex },
      });
    });
  }

  return assets;
}

function extractSources(research: string): string[] {
  const urlRegex = /https?:\/\/[^\s)>\]]+/g;
  const matches = research.match(urlRegex) ?? [];
  return [...new Set(matches)].slice(0, 20);
}
