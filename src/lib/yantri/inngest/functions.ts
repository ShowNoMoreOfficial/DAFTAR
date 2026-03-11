import { yantriInngest } from "./client";
import { prisma } from "@/lib/prisma";
import { routeToModel } from "@/lib/yantri/model-router";
import { analyzeGap } from "@/lib/yantri/gap-analysis";
import { runStrategist } from "@/lib/yantri/strategist";

type DossierEvent = {
  data: { treeId: string };
};

type TreeUpdatedEvent = {
  data: { treeId: string };
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
// Triggered by "yantri/tree.updated"

export const gapAnalysisOnIngest = yantriInngest.createFunction(
  {
    id: "gap-analysis-on-ingest",
    retries: 2,
    concurrency: { limit: 3 },
  },
  { event: "yantri/tree.updated" },
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
