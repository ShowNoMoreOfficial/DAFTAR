import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { routeToModel } from "@/lib/yantri/model-router";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBrandVoiceBlock, getBrandColorPalette } from "@/lib/yantri/brand-voice";
import { engineRouter, type ContentType } from "@/lib/yantri/engine-router";
import { SkillOrchestrator, type SkillFile } from "@/lib/skill-orchestrator";

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
  platform: "YOUTUBE" | "X_THREAD" | "META_CAROUSEL";
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

// ─── Content Type Mapping ───

const CONTENT_TYPE_MAP: Record<string, ContentTypeMapping> = {
  youtube_explainer: {
    engineType: "VIDEO_SCRIPT",
    platform: "YOUTUBE",
    pipelineType: "cinematic",
    jsonStructure: YOUTUBE_EXPLAINER_STRUCTURE,
  },
  x_thread: {
    engineType: "TWEET_THREAD",
    platform: "X_THREAD",
    pipelineType: "viral_micro",
    jsonStructure: X_THREAD_STRUCTURE,
  },
  carousel: {
    engineType: "INSTAGRAM_CAROUSEL",
    platform: "META_CAROUSEL",
    pipelineType: "carousel",
    jsonStructure: CAROUSEL_STRUCTURE,
  },
  quick_take: {
    engineType: "VIDEO_SHORT",
    platform: "YOUTUBE",
    pipelineType: "cinematic",
    jsonStructure: QUICK_TAKE_STRUCTURE,
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
    const skillPaths = engineRouter.getSkillPaths(mapping.engineType);

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

    const brandColorPalette = getBrandColorPalette(brand.name);

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

    const researchResult = await routeToModel(
      "research",
      researchSystemPrompt,
      researchUserPrompt
    );
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

Apply every skill instruction above to produce exceptional content. Don't just write — think editorially.
Use the hook engineering principles. Use the title engineering formulas. Use the narrative arc structure.
Every choice should be deliberate and backed by the skill frameworks above.`;

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
      { temperature: 0.7, maxTokens: 65536 }
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
          ? ({ tags: parsed.tags, description: parsed.description } as any)
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
  if (contentType === "carousel") {
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
  assetType: "THUMBNAIL" | "CAROUSEL_SLIDE",
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

  if (contentType === "youtube_explainer" || contentType === "quick_take") {
    const script = parsed.script as {
      sections?: Array<{ type: string; text: string }>;
    };
    const sections = script?.sections ?? [];
    const fullText = sections
      .map((s) => `**[${s.type.toUpperCase()}]**\n${s.text}`)
      .join("\n\n");
    return `# ${title}\n\n${fullText}\n\n---\n\n${description}`;
  }

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

  if (contentType === "carousel") {
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
  if (contentType === "carousel") {
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

  return assets;
}

function extractSources(research: string): string[] {
  const urlRegex = /https?:\/\/[^\s)>\]]+/g;
  const matches = research.match(urlRegex) ?? [];
  return [...new Set(matches)].slice(0, 20);
}
