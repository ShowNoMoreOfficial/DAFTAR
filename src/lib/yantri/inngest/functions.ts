import { yantriInngest } from "./client";
import { prisma } from "@/lib/prisma";
import { routeToModel } from "@/lib/yantri/model-router";
import { analyzeGap } from "@/lib/yantri/gap-analysis";
import { runStrategist } from "@/lib/yantri/strategist";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import {
  engineRouter,
  type ContentType,
} from "@/lib/yantri/engine-router";
import { factCheck, type FactDeviation } from "@/lib/yantri/fact-checker";

// ─── Bridge helper: map ContentPiece platform → deliverable pipeline type & event ───

function mapPlatformToPipelineType(platform: string): string {
  switch (platform) {
    case "X_THREAD":
    case "X_SINGLE":
    case "LINKEDIN":
      return "viral_micro";
    case "META_CAROUSEL":
      return "carousel";
    case "YOUTUBE":
      return "cinematic";
    case "META_REEL":
      return "reel";
    default:
      return "standard";
  }
}

function getPipelineEventName(pipelineType: string): string {
  switch (pipelineType) {
    case "viral_micro":
      return "yantri/deliverable.viral-micro";
    case "carousel":
      return "yantri/deliverable.carousel";
    case "cinematic":
      return "yantri/deliverable.cinematic";
    case "reel":
      return "yantri/deliverable.reel";
    default:
      return "yantri/deliverable.viral-micro";
  }
}

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

    await step.run("upsert-dossier", async () => {
      await prisma.factDossier.upsert({
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

    return { treeId, status: "dossier-synced" };
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

    // ── Step 6: Bridge — create Deliverable and trigger pipeline ──
    const bridgeResult = await step.run("bridge-to-deliverable", async () => {
      const pipelineType = mapPlatformToPipelineType(piece.platform);
      const deliverable = await prisma.deliverable.create({
        data: {
          brandId: piece.brandId,
          treeId: piece.treeId,
          platform: piece.platform,
          pipelineType,
          status: "PLANNED",
          copyMarkdown: draftContent,
          researchPrompt: piece.researchPrompt,
        },
      });
      return { deliverableId: deliverable.id, pipelineType };
    });

    await step.sendEvent("trigger-deliverable-pipeline", {
      name: getPipelineEventName(bridgeResult.pipelineType),
      data: { deliverableId: bridgeResult.deliverableId },
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
      deliverableId: bridgeResult.deliverableId,
    };
  }
);
