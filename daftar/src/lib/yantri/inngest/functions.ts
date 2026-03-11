import { yantriInngest } from "./client";
import { prisma } from "@/lib/prisma";
import { routeToModel } from "@/lib/yantri/model-router";
import { analyzeGap } from "@/lib/yantri/gap-analysis";
import {
  runStrategist,
  generateStrategyFromDossier,
  persistStrategyDecisions,
} from "@/lib/yantri/strategist";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import {
  engineRouter,
  type ContentType,
} from "@/lib/yantri/engine-router";
import { factCheck, type FactDeviation } from "@/lib/yantri/fact-checker";
import { runYouTubeExplainerEngine } from "@/lib/yantri/engines/youtubeExplainer";
import { runTwitterThreadEngine } from "@/lib/yantri/engines/twitterThread";
import { runCarouselEngine } from "@/lib/yantri/engines/carousel";
import { runGenericEngine } from "@/lib/yantri/engines/generic";

type DossierEvent = {
  data: { treeId: string };
};

type TreeUpdatedEvent = {
  data: { treeId: string };
};

type PipelineRunEvent = {
  data: { contentPieceId: string };
};

// Map ContentPlatform enum → EngineRouter ContentType
const PLATFORM_TO_CONTENT_TYPE: Record<string, ContentType> = {
  YOUTUBE: "VIDEO_SCRIPT",
  X_THREAD: "TWEET_THREAD",
  X_SINGLE: "TWEET_SINGLE",
  BLOG: "BLOG_ARTICLE",
  LINKEDIN: "LINKEDIN_POST",
  META_REEL: "INSTAGRAM_REEL",
  META_CAROUSEL: "INSTAGRAM_CAROUSEL",
  META_POST: "FACEBOOK_POST",
};

// ─── factDossierSync ─────────────────────────────────────────────────────────
// Triggered by "yantri/dossier.build"
// Synthesizes a FactDossier from all nodes in a NarrativeTree.

export const factDossierSync = yantriInngest.createFunction(
  {
    id: "fact-dossier-sync",
    retries: 2,
    concurrency: { limit: 2 },
  },
  { event: "yantri/dossier.build" },
  async ({ event, step }) => {
    const { treeId } = event.data as DossierEvent["data"];

    const tree = await step.run("fetch-tree", async () => {
      const t = await prisma.narrativeTree.findUniqueOrThrow({
        where: { id: treeId },
        include: { nodes: true },
      });
      return t;
    });

    const dossierData = await step.run("synthesize-dossier", async () => {
      const signalSummary = tree.nodes
        .map(
          (
            node: {
              signalTitle: string;
              signalScore: number;
              signalData: unknown;
            },
            idx: number
          ) =>
            `Signal ${idx + 1}: "${node.signalTitle}" (score: ${node.signalScore})\n` +
            `Data: ${JSON.stringify(node.signalData)}`
        )
        .join("\n\n---\n\n");

      const systemPrompt = `You are a research synthesis engine. You have received multiple signals from a narrative tree titled "${tree.title}".

Your job: synthesize these signals into a structured FactDossier — a verified, source-attributed knowledge base that can power content generation across platforms.

OUTPUT FORMAT (respond in JSON only):
{
  "facts": [
    { "claim": "...", "source": "...", "verified": true }
  ],
  "stats": [
    { "figure": "...", "context": "...", "source": "..." }
  ],
  "quotes": [
    { "text": "...", "speaker": "...", "date": "...", "source": "..." }
  ],
  "timeline": [
    { "date": "...", "event": "...", "source": "..." }
  ],
  "sources": ["url1", "url2"]
}

RULES:
- Only include verifiable claims with clear attribution
- Prioritize recency and relevance
- Flag any conflicting data points
- Be concise and data-dense`;

      const userMessage = `Synthesize these ${tree.nodes.length} signals into a FactDossier:\n\n${signalSummary}`;

      const result = await routeToModel("research", systemPrompt, userMessage);

      let structuredData: unknown = {};
      let sources: string[] = [];

      if (result.parsed && typeof result.parsed === "object") {
        const parsed = result.parsed as Record<string, unknown>;
        sources = Array.isArray(parsed.sources)
          ? (parsed.sources as string[])
          : [];
        structuredData = parsed;
      }

      return { structuredData, sources, rawResearch: result.raw };
    });

    const dossier = await step.run("upsert-dossier", async () => {
      return await prisma.factDossier.upsert({
        where: { treeId },
        create: {
          treeId,
          structuredData: dossierData.structuredData as object,
          sources: dossierData.sources,
          visualAssets: [],
          rawResearch: dossierData.rawResearch,
        },
        update: {
          structuredData: dossierData.structuredData as object,
          sources: dossierData.sources,
          rawResearch: dossierData.rawResearch,
        },
      });
    });

    // Emit dossier.ready event to trigger strategy pipeline
    await step.sendEvent("emit-dossier-ready", {
      name: "yantri/dossier.ready",
      data: { treeId, factDossierId: dossier.id },
    });

    return { treeId, factDossierId: dossier.id, status: "dossier-synced" };
  }
);

// ─── gapAnalysisOnIngest ──────────────────────────────────────────────────
// Triggered by "yantri/tree.updated" or "yantri/tree.created"

export const gapAnalysisOnIngest = yantriInngest.createFunction(
  {
    id: "gap-analysis-on-ingest",
    retries: 2,
    concurrency: { limit: 3 },
  },
  [{ event: "yantri/tree.updated" }, { event: "yantri/tree.created" }],
  async ({ event, step }) => {
    const { treeId } = event.data as TreeUpdatedEvent["data"];

    const gapResult = await step.run("run-gap-analysis", async () => {
      return await analyzeGap(treeId);
    });

    if (!gapResult.needsNewContent) {
      return {
        treeId,
        status: "no-action-needed",
        reasoning: gapResult.reasoning,
      };
    }

    const hasDossier = await step.run("check-dossier", async () => {
      const dossier = await prisma.factDossier.findUnique({
        where: { treeId },
      });
      return !!dossier;
    });

    if (!hasDossier) {
      await step.sendEvent("trigger-dossier-build", {
        name: "yantri/dossier.build",
        data: { treeId },
      });

      return {
        treeId,
        status: "dossier-build-triggered",
        reasoning: gapResult.reasoning,
      };
    }

    const decisions = await step.run("run-strategist", async () => {
      const dossier = await prisma.factDossier.findUniqueOrThrow({
        where: { treeId },
      });

      // No isActive filter — field doesn't exist on Daftar Brand model
      const activeBrands = await prisma.brand.findMany();

      if (activeBrands.length === 0) {
        return [];
      }

      return await runStrategist({
        treeId,
        brands: activeBrands,
        dossier: {
          structuredData: dossier.structuredData,
          sources: dossier.sources,
          rawResearch: dossier.rawResearch,
        },
      });
    });

    if (decisions.length === 0) {
      return {
        treeId,
        status: "no-decisions",
        reasoning: "Strategist found no viable brand-platform combinations.",
      };
    }

    const createdPieces = await step.run("create-content-pieces", async () => {
      const pieces: { id: string; brandName: string; platform: string }[] = [];

      for (const decision of decisions) {
        const platformValue = decision.platform as
          | "YOUTUBE"
          | "X_THREAD"
          | "X_SINGLE"
          | "BLOG"
          | "LINKEDIN"
          | "META_REEL"
          | "META_CAROUSEL"
          | "META_POST";

        const piece = await prisma.contentPiece.create({
          data: {
            brandId: decision.brandId,
            treeId,
            platform: platformValue,
            status: "PLANNED",
            bodyText: `[Strategist Angle] ${decision.angle}\n\n[Reasoning] ${decision.reasoning}`,
            researchPrompt: decision.deep_research_prompt,
          },
        });

        pieces.push({
          id: piece.id,
          brandName: decision.brandName,
          platform: decision.platform,
        });
      }

      return pieces;
    });

    return {
      treeId,
      status: "content-planned",
      urgency: gapResult.urgency,
      reasoning: gapResult.reasoning,
      decisionsCount: decisions.length,
      createdPieces,
    };
  }
);

// ─── contentPiecePipeline ─────────────────────────────────────────────────
// Triggered by "yantri/pipeline.run"
// Runs the full content pipeline for a ContentPiece:
//   1. Fetch piece + brand + tree context
//   2. Build/load FactDossier (research)
//   3. Draft content via SkillOrchestrator
//   4. Fact-check with retries
//   5. Update ContentPiece with drafted content

const MAX_FACT_CHECK_RETRIES = 2;

export const contentPiecePipeline = yantriInngest.createFunction(
  {
    id: "content-piece-pipeline",
    name: "Yantri: Content Piece Pipeline",
    retries: 2,
    concurrency: { limit: 5 },
  },
  { event: "yantri/pipeline.run" },
  async ({ event, step }) => {
    const { contentPieceId } = event.data as PipelineRunEvent["data"];

    // ── Step 1: Fetch content piece with context ────────────
    const piece = await step.run("fetch-piece", async () => {
      const p = await prisma.contentPiece.findUniqueOrThrow({
        where: { id: contentPieceId },
        include: {
          brand: { select: { id: true, name: true, slug: true, config: true } },
          tree: {
            include: {
              nodes: { select: { signalTitle: true, signalScore: true, signalData: true } },
              dossier: { select: { structuredData: true, sources: true, rawResearch: true } },
            },
          },
        },
      });
      return p;
    });

    const contentType = PLATFORM_TO_CONTENT_TYPE[piece.platform] ?? "BLOG_ARTICLE";
    const brandName = piece.brand.name;

    // ── Step 2: Resolve research context ────────────────────
    const researchContext = await step.run("resolve-research", async () => {
      // If tree has a dossier, use it
      if (piece.tree?.dossier) {
        const d = piece.tree.dossier;
        const structured = typeof d.structuredData === "string"
          ? d.structuredData
          : JSON.stringify(d.structuredData, null, 2);
        return {
          dossier: structured,
          sources: (d.sources ?? []).join("\n"),
          raw: d.rawResearch ?? "",
        };
      }

      // If tree exists but no dossier, trigger dossier build and use bodyText
      if (piece.tree) {
        // Fire-and-forget dossier build for future use
        await yantriInngest.send({
          name: "yantri/dossier.build",
          data: { treeId: piece.tree.id },
        });
      }

      // Fallback: quick research via LLM
      const researchPrompt = piece.researchPrompt ??
        `Research the following topic for ${brandName} (${piece.platform} content). Be concise, data-dense, and cite sources.`;
      const result = await routeToModel("research", researchPrompt, piece.bodyText.slice(0, 3000));
      return { dossier: "", sources: "", raw: result.raw };
    });

    // Build narrative markdown from tree signals + bodyText + research
    const narrativeMarkdown = [
      `# ${piece.bodyText.slice(0, 200)}`,
      "",
      piece.tree?.nodes.map((n: { signalTitle: string; signalScore: number }) =>
        `- Signal: "${n.signalTitle}" (score: ${n.signalScore})`
      ).join("\n") ?? "",
      "",
      researchContext.dossier ? `## Research\n${researchContext.dossier}` : "",
      researchContext.raw ? `## Additional Context\n${researchContext.raw.slice(0, 2000)}` : "",
    ].filter(Boolean).join("\n");

    // ── Step 3: Route to engine and draft content ───────────
    const route = await step.run("route-engine", async () => {
      const chain = engineRouter.resolve(contentType);
      const primarySkill = engineRouter.getPrimaryDraftSkill(contentType);
      return {
        contentType,
        platform: chain.platform,
        skillPaths: chain.stages.map((s) => s.skillPath),
        primarySkill: primarySkill.skillPath,
      };
    });

    let draftContent = await step.run("draft-content", async () => {
      // Try skill-based drafting first
      const skillFileExists = await skillOrchestrator.skillExists(route.primarySkill);

      if (skillFileExists) {
        const result = await skillOrchestrator.executeSkill({
          skillPath: route.primarySkill,
          context: {
            narrative: narrativeMarkdown,
            brand: { brandName, brandSlug: piece.brand.slug, config: piece.brand.config },
            targetPlatform: route.platform,
            contentType: route.contentType,
            skillChain: route.skillPaths,
            bodyText: piece.bodyText,
          },
          brandId: piece.brandId,
          platform: route.platform,
        });

        if (result.success && result.output?.draft) {
          return result.output.draft as string;
        }
      }

      // Fallback: direct LLM call
      const systemPrompt = `You are a professional content creator for "${brandName}".
Create ${contentType.replace(/_/g, " ").toLowerCase()} content for ${route.platform}.
Use the research and narrative context provided. Be engaging, factual, and platform-appropriate.
Output the complete content ready for review.`;

      const result = await routeToModel("drafting", systemPrompt, narrativeMarkdown);
      return (result.parsed as { draft?: string })?.draft ?? result.raw;
    });

    // ── Step 4: Fact-check with retries ─────────────────────
    let factCheckPassed = false;
    let factCheckConfidence = 0;
    let deviations: FactDeviation[] = [];

    for (let attempt = 0; attempt <= MAX_FACT_CHECK_RETRIES; attempt++) {
      const factResult = await step.run(`fact-check-attempt-${attempt}`, async () => {
        return factCheck(draftContent, {
          title: piece.bodyText.slice(0, 200),
          content: narrativeMarkdown,
          source: piece.tree?.nodes[0]
            ? `signal: ${(piece.tree.nodes[0] as { signalTitle: string }).signalTitle}`
            : "content-piece",
          stakeholders: null,
          eventMarkers: null,
          detectedAt: new Date().toISOString(),
        }, {
          brandId: piece.brandId,
          deliverableId: contentPieceId,
        });
      });

      factCheckPassed = factResult.passed;
      factCheckConfidence = factResult.confidence;
      deviations = factResult.deviations;

      if (factResult.passed) break;

      // Re-draft with corrections if retries remain
      if (attempt < MAX_FACT_CHECK_RETRIES) {
        draftContent = await step.run(`redraft-attempt-${attempt + 1}`, async () => {
          const correctionPrompt = `You are a content editor for "${brandName}".
The following content failed fact-checking. Fix ALL factual deviations listed below, then return the corrected version.

DEVIATIONS:
${factResult.deviations.map((d, i) => `${i + 1}. [${d.severity}] ${d.claim}: ${d.issue}`).join("\n")}

ORIGINAL CONTENT:
${draftContent}`;

          const result = await routeToModel("drafting", correctionPrompt, "Fix the deviations and return corrected content.");
          return (result.parsed as { draft?: string })?.draft ?? result.raw;
        });
      }
    }

    // ── Step 5: Save draft and update status ────────────────
    await step.run("save-draft", async () => {
      await prisma.contentPiece.update({
        where: { id: contentPieceId },
        data: {
          status: "DRAFTED",
          bodyText: draftContent,
          postingPlan: JSON.parse(JSON.stringify({
            factCheck: { passed: factCheckPassed, confidence: factCheckConfidence, deviations: deviations.length },
            contentType: route.contentType,
            platform: route.platform,
            skillsUsed: route.skillPaths,
            draftedAt: new Date().toISOString(),
          })),
        },
      });

      // Record skill execution
      const skill = await prisma.skill.findFirst({
        where: { path: { contains: route.primarySkill } },
        select: { id: true },
      });

      if (skill) {
        await prisma.skillExecution.create({
          data: {
            skillId: skill.id,
            brandId: piece.brandId,
            platform: route.platform,
            inputContext: { contentPieceId, contentType: route.contentType },
            outputSummary: {
              contentLength: draftContent.length,
              factCheckPassed,
              factCheckConfidence,
              deviations: deviations.length,
            },
            modelUsed: "gemini",
            status: factCheckPassed ? "completed" : "partial",
          },
        });
      }
    });

    return {
      contentPieceId,
      status: "drafted",
      contentType: route.contentType,
      platform: route.platform,
      factCheckPassed,
      factCheckConfidence,
      deviationsCount: deviations.length,
      contentLength: draftContent.length,
    };
  }
);

// ─── dossierStrategyPipeline ──────────────────────────────────────────────
// Triggered by "yantri/dossier.ready"
// After a FactDossier is created/updated, run strategy for all brands,
// persist decisions as Narratives + Deliverables, emit strategy.decided.

type DossierReadyEvent = {
  data: { treeId: string; factDossierId: string };
};

export const dossierStrategyPipeline = yantriInngest.createFunction(
  {
    id: "dossier-strategy-pipeline",
    name: "Yantri: Dossier → Strategy Pipeline",
    retries: 3,
    concurrency: { limit: 2 },
  },
  { event: "yantri/dossier.ready" },
  async ({ event, step }) => {
    const { treeId, factDossierId } = event.data as DossierReadyEvent["data"];

    // Step 1: Load all brands
    const brands = await step.run("load-brands", async () => {
      return await prisma.brand.findMany({
        select: { id: true, name: true, slug: true },
      });
    });

    if (brands.length === 0) {
      return { treeId, status: "no-brands", deliverableIds: [] };
    }

    // Step 2: Generate strategy for each brand
    const allDeliverableIds: string[] = [];

    for (const brand of brands) {
      const strategyResult = await step.run(
        `strategy-${brand.slug}`,
        async () => {
          // Load brand identity skill if available
          let skillContext: string | undefined;
          try {
            const identity = await skillOrchestrator.loadSkill(
              `brand/identity/${brand.slug}/identity.md`
            );
            skillContext = identity.instructions;
          } catch {
            // No brand identity skill
          }

          return await generateStrategyFromDossier({
            factDossierId,
            brandId: brand.id,
            skillContext,
          });
        }
      );

      if (strategyResult.decisions.length === 0) continue;

      // Step 3: Persist strategy decisions as Narratives + Deliverables
      const deliverableIds = await step.run(
        `persist-strategy-${brand.slug}`,
        async () => {
          return await persistStrategyDecisions(
            treeId,
            factDossierId,
            strategyResult.decisions
          );
        }
      );

      allDeliverableIds.push(...deliverableIds);
    }

    if (allDeliverableIds.length === 0) {
      return { treeId, status: "no-decisions", deliverableIds: [] };
    }

    // Step 4: Emit strategy.decided for each deliverable
    await step.sendEvent(
      "emit-strategy-decided",
      allDeliverableIds.map((deliverableId) => ({
        name: "yantri/strategy.decided" as const,
        data: { deliverableId, treeId, factDossierId },
      }))
    );

    return {
      treeId,
      factDossierId,
      status: "strategy-decided",
      deliverableCount: allDeliverableIds.length,
      deliverableIds: allDeliverableIds,
    };
  }
);

// ─── strategyToContentPipeline ────────────────────────────────────────────
// Triggered by "yantri/strategy.decided"
// Routes a Deliverable to the appropriate engine, generates content,
// creates Assets, sets status to REVIEW, emits deliverable.created.

type StrategyDecidedEvent = {
  data: { deliverableId: string; treeId: string; factDossierId: string };
};

export const strategyToContentPipeline = yantriInngest.createFunction(
  {
    id: "strategy-to-content-pipeline",
    name: "Yantri: Strategy → Content Pipeline",
    retries: 3,
    concurrency: { limit: 5 },
  },
  { event: "yantri/strategy.decided" },
  async ({ event, step }) => {
    const { deliverableId, factDossierId } =
      event.data as StrategyDecidedEvent["data"];

    // Step 1: Load deliverable with brand and tree context
    const deliverable = await step.run("fetch-deliverable", async () => {
      return await prisma.deliverable.findUniqueOrThrow({
        where: { id: deliverableId },
        include: {
          brand: true,
          tree: {
            include: {
              dossier: { select: { structuredData: true, sources: true, rawResearch: true } },
            },
          },
        },
      });
    });

    // Extract strategy decision from postingPlan
    const strategyDecision = (
      deliverable.postingPlan as Record<string, unknown> | null
    )?.strategyDecision as Record<string, unknown> | undefined;

    const contentType = (strategyDecision?.contentType as string) ??
      (PLATFORM_TO_CONTENT_TYPE[deliverable.platform] ?? "BLOG_ARTICLE");
    const angle = (strategyDecision?.angle as string) ?? deliverable.copyMarkdown ?? "";
    const hook = (strategyDecision?.hook as string) ?? angle.slice(0, 100);
    const tone = (strategyDecision?.tone as string) ?? deliverable.brand.tone ?? "neutral";

    // Step 2: Set status to RESEARCHING
    await step.run("set-researching", async () => {
      await prisma.deliverable.update({
        where: { id: deliverableId },
        data: { status: "RESEARCHING" },
      });
    });

    // Step 3: Resolve research context from dossier
    const research = await step.run("resolve-research", async () => {
      if (deliverable.tree?.dossier) {
        const d = deliverable.tree.dossier;
        const structured = typeof d.structuredData === "string"
          ? d.structuredData
          : JSON.stringify(d.structuredData, null, 2);
        const sources = (d.sources ?? []).join("\n");
        return `## FactDossier\n${structured}\n\n## Sources\n${sources}\n\n${d.rawResearch ?? ""}`;
      }
      // Fallback: quick LLM research
      const result = await routeToModel(
        "research",
        `Research the following for ${deliverable.brand.name}. Be concise, data-dense, cite sources.`,
        angle.slice(0, 2000)
      );
      return result.raw;
    });

    // Step 4: Set status to SCRIPTING
    await step.run("set-scripting", async () => {
      await prisma.deliverable.update({
        where: { id: deliverableId },
        data: { status: "SCRIPTING" },
      });
    });

    // Step 5: Route to appropriate engine and generate content
    const voiceRules = Array.isArray(deliverable.brand.voiceRules)
      ? (deliverable.brand.voiceRules as string[]).join("; ")
      : JSON.stringify(deliverable.brand.voiceRules ?? []);

    const engineResult = await step.run("generate-content", async () => {
      const baseParams = {
        narrativeAngle: angle.slice(0, 500),
        brandName: deliverable.brand.name,
        brandTone: deliverable.brand.tone ?? "neutral",
        voiceRules,
        language: deliverable.brand.language ?? "English",
        researchResults: research.slice(0, 8000),
        trendHeadline: angle.slice(0, 150),
        hook,
        tone,
      };

      // Route to the right engine based on contentType
      switch (contentType) {
        case "VIDEO_SCRIPT": {
          const result = await runYouTubeExplainerEngine({
            ...baseParams,
            targetRuntime: "10-15",
          });
          return {
            draft: result.script.fullScript,
            scriptData: { sections: result.script.sections, runtimeEstimate: result.script.runtimeEstimate, actStructure: result.script.actStructure },
            postingPlan: { titles: result.titles, description: result.description, tags: result.tags, thumbnailBrief: result.thumbnailBrief, ...result.postingPlan },
            thumbnailBrief: result.thumbnailBrief,
            model: result.model,
          };
        }
        case "TWEET_THREAD": {
          const result = await runTwitterThreadEngine(baseParams);
          return {
            draft: result.tweets.map((t) => t.text).join("\n\n---\n\n"),
            scriptData: { tweets: result.tweets, threadLength: result.threadLength, hookArchetype: result.hookArchetype },
            postingPlan: { ...result.postingPlan, engagementStrategy: result.engagementStrategy },
            thumbnailBrief: null,
            model: result.model,
          };
        }
        case "INSTAGRAM_CAROUSEL": {
          const result = await runCarouselEngine({
            narrativeAngle: baseParams.narrativeAngle,
            brandName: baseParams.brandName,
            brandTone: baseParams.brandTone,
            voiceRules: baseParams.voiceRules,
            language: baseParams.language,
            researchResults: baseParams.researchResults,
            trendHeadline: baseParams.trendHeadline,
          });
          return {
            draft: result.caption,
            scriptData: null,
            carouselData: { slides: result.slides, narrativeArc: result.narrativeArc, slideCount: result.slideCount, hashtags: result.hashtags },
            postingPlan: { hashtags: result.hashtags },
            thumbnailBrief: null,
            model: result.model,
          };
        }
        default: {
          // Generic engine for everything else
          const resolvedContentType = engineRouter.isValidType(contentType)
            ? contentType
            : ("BLOG_ARTICLE" as ContentType);
          const result = await runGenericEngine({
            ...baseParams,
            contentType: resolvedContentType,
            platform: deliverable.platform,
            brandSlug: deliverable.brand.slug,
            brandConfig: deliverable.brand.config as Record<string, unknown> | null,
          });
          return {
            draft: result.draft,
            scriptData: null,
            postingPlan: { titles: result.titles, description: result.description, tags: result.tags, ...result.postingPlan },
            thumbnailBrief: result.thumbnailBrief,
            model: result.model,
          };
        }
      }
    });

    // Step 6: Set status to GENERATING_ASSETS
    await step.run("set-generating-assets", async () => {
      await prisma.deliverable.update({
        where: { id: deliverableId },
        data: { status: "GENERATING_ASSETS" },
      });
    });

    // Step 7: Create assets (thumbnail, visual prompts)
    await step.run("create-assets", async () => {
      if (engineResult.thumbnailBrief && typeof engineResult.thumbnailBrief === "object") {
        const tb = engineResult.thumbnailBrief as Record<string, string>;
        await prisma.asset.create({
          data: {
            deliverableId,
            type: "THUMBNAIL",
            url: "",
            promptUsed: tb.visual ?? JSON.stringify(tb),
            metadata: {
              textOverlay: tb.textOverlay,
              emotion: tb.emotion,
              colorMood: tb.colorMood,
              purpose: "auto_generated_thumbnail_brief",
            },
          },
        });
      }

      // For carousel, create slide assets
      const carouselData = (engineResult as Record<string, unknown>).carouselData as
        | { slides: Array<{ position: number; visualPrompt: string; headline: string; bodyText: string; textOverlay: string; colorHex: string; role: string }> }
        | null
        | undefined;
      if (carouselData?.slides) {
        for (const slide of carouselData.slides) {
          await prisma.asset.create({
            data: {
              deliverableId,
              type: "CAROUSEL_SLIDE",
              url: "",
              promptUsed: slide.visualPrompt,
              slideIndex: slide.position,
              metadata: {
                headline: slide.headline,
                bodyText: slide.bodyText,
                textOverlay: slide.textOverlay,
                colorHex: slide.colorHex,
                role: slide.role,
              },
            },
          });
        }
      }
    });

    // Step 8: Fact-check the draft
    let factCheckPassed = false;
    let factCheckConfidence = 0;
    let deviations: FactDeviation[] = [];
    let finalDraft = engineResult.draft;

    const FC_RETRIES = 2;
    for (let attempt = 0; attempt <= FC_RETRIES; attempt++) {
      const fcResult = await step.run(`fact-check-${attempt}`, async () => {
        return factCheck(finalDraft, {
          title: angle.slice(0, 200),
          content: research.slice(0, 3000),
          source: `dossier:${factDossierId}`,
          stakeholders: null,
          eventMarkers: null,
          detectedAt: new Date().toISOString(),
        }, {
          brandId: deliverable.brandId,
          deliverableId,
        });
      });

      factCheckPassed = fcResult.passed;
      factCheckConfidence = fcResult.confidence;
      deviations = fcResult.deviations;

      if (fcResult.passed) break;

      if (attempt < FC_RETRIES) {
        finalDraft = await step.run(`redraft-${attempt + 1}`, async () => {
          const correctionPrompt = `You are a content editor for "${deliverable.brand.name}".
Fix ALL factual deviations listed below, then return the corrected content.

DEVIATIONS:
${deviations.map((d, i) => `${i + 1}. [${d.severity}] ${d.claim}: ${d.issue}`).join("\n")}

ORIGINAL CONTENT:
${finalDraft}`;
          const result = await routeToModel("drafting", correctionPrompt, "Fix deviations and return corrected content.");
          return (result.parsed as { draft?: string })?.draft ?? result.raw;
        });
      }
    }

    // Step 9: Save final content and set to REVIEW
    await step.run("save-and-finalize", async () => {
      const updateData: Record<string, unknown> = {
        copyMarkdown: finalDraft,
        status: "REVIEW",
        postingPlan: {
          ...(engineResult.postingPlan as object),
          factCheck: {
            passed: factCheckPassed,
            confidence: factCheckConfidence,
            deviations: deviations.length,
          },
          generatedAt: new Date().toISOString(),
          modelUsed: engineResult.model,
        },
      };

      if (engineResult.scriptData) {
        updateData.scriptData = engineResult.scriptData;
      }

      const carouselData = (engineResult as Record<string, unknown>).carouselData;
      if (carouselData) {
        updateData.carouselData = carouselData;
      }

      await prisma.deliverable.update({
        where: { id: deliverableId },
        data: updateData,
      });
    });

    // Step 10: Emit deliverable.created event
    await step.sendEvent("emit-deliverable-created", {
      name: "yantri/deliverable.created",
      data: {
        deliverableId,
        brandId: deliverable.brandId,
        brandName: deliverable.brand.name,
        platform: deliverable.platform,
        contentType,
        factCheckPassed,
      },
    });

    return {
      deliverableId,
      status: "content-generated",
      contentType,
      platform: deliverable.platform,
      factCheckPassed,
      factCheckConfidence,
      deviationsCount: deviations.length,
      contentLength: finalDraft.length,
    };
  }
);
