/**
 * Deliverable Pipelines — Platform-Specific Agentic Workflows
 */

import { yantriInngest } from "./client";
import { prisma } from "@/lib/prisma";
import { routeToModel } from "@/lib/yantri/model-router";
import { runViralMicroEngine } from "@/lib/yantri/engines/viralMicro";
import { runCarouselEngine } from "@/lib/yantri/engines/carousel";
import { runCinematicEngine } from "@/lib/yantri/engines/cinematic";
import { generateVisualPrompts } from "@/lib/yantri/engines/nanoBanana";
import { generateEmbedding, findSimilarTree } from "@/lib/yantri/embeddings";
import { getBrandColorMood } from "@/lib/yantri/brand-voice";
import { generateVoiceover } from "@/lib/yantri/elevenlabs";

type DeliverableEvent = {
  data: { deliverableId: string };
};

async function resolveResearch(
  deliverableId: string,
  treeId: string | null,
  bodyText: string,
  brandName: string,
  platform: string,
  researchPrompt: string | null
): Promise<string> {
  if (treeId) {
    const dossier = await prisma.factDossier.findUnique({ where: { treeId } });
    if (dossier) {
      const structured = typeof dossier.structuredData === "string"
        ? dossier.structuredData
        : JSON.stringify(dossier.structuredData, null, 2);
      const sources = (dossier.sources ?? []).join("\n");
      return `## FactDossier\n${structured}\n\n## Sources\n${sources}\n\n${dossier.rawResearch ?? ""}`;
    }
  }

  const systemPrompt = researchPrompt ||
    `You are a rapid research assistant for ${brandName}. Gather key facts, statistics, and context. Be concise and data-dense. Cite sources where possible.\n\nPLATFORM: ${platform}`;

  const result = await routeToModel("research", systemPrompt, `Research the following:\n\n${bodyText.slice(0, 2000)}`);
  return result.raw;
}

async function autoCluster(
  deliverableId: string,
  angleText: string,
  platform: string,
  brandId: string
): Promise<string | null> {
  const embedding = await generateEmbedding(angleText);
  const similarTree = await findSimilarTree(embedding, prisma);

  if (similarTree) {
    await prisma.narrativeNode.create({
      data: {
        treeId: similarTree.id,
        signalTitle: angleText.slice(0, 150),
        signalScore: 0,
        signalData: { source: "deliverable-pipeline", angle: angleText, platform, brandId },
      },
    });
    await prisma.deliverable.update({ where: { id: deliverableId }, data: { treeId: similarTree.id } });
    return similarTree.id;
  }

  // Resolve a system user for automated tree creation
  const systemUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  const systemUserId = systemUser?.id ?? "system";

  const newTree = await prisma.narrativeTree.create({
    data: {
      title: angleText.slice(0, 200),
      summary: `Auto-clustered from deliverable pipeline: ${platform}`,
      embedding: JSON.stringify(embedding),
      createdById: systemUserId,
      nodes: {
        create: {
          signalTitle: angleText.slice(0, 150),
          signalScore: 0,
          signalData: { source: "deliverable-pipeline", angle: angleText, platform, brandId },
        },
      },
    },
  });

  await prisma.deliverable.update({ where: { id: deliverableId }, data: { treeId: newTree.id } });
  return newTree.id;
}

export const viralMicroPipeline = yantriInngest.createFunction(
  { id: "viral-micro-pipeline", retries: 2, concurrency: { limit: 5 } },
  { event: "yantri/deliverable.viral-micro" },
  async ({ event, step }) => {
    const { deliverableId } = event.data as DeliverableEvent["data"];

    const deliverable = await step.run("fetch-deliverable", async () => {
      return await prisma.deliverable.findUniqueOrThrow({ where: { id: deliverableId }, include: { brand: true } });
    });

    const treeId = await step.run("auto-cluster", async () => {
      if (deliverable.treeId) return deliverable.treeId;
      return await autoCluster(deliverableId, deliverable.copyMarkdown?.slice(0, 1000) ?? "", deliverable.platform, deliverable.brandId);
    });

    await step.run("set-researching", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "RESEARCHING" } });
    });

    const research = await step.run("research", async () => {
      return await resolveResearch(deliverableId, treeId, deliverable.copyMarkdown ?? "", deliverable.brand.name, deliverable.platform, deliverable.researchPrompt);
    });

    await step.run("set-scripting", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "SCRIPTING" } });
    });

    const viralResult = await step.run("generate-viral-content", async () => {
      const voiceRules = Array.isArray(deliverable.brand.voiceRules)
        ? (deliverable.brand.voiceRules as string[]).join("; ")
        : JSON.stringify(deliverable.brand.voiceRules ?? []);

      const platformTarget = deliverable.platform === "LINKEDIN" ? "linkedin"
        : deliverable.platform === "X_SINGLE" || deliverable.platform === "X_THREAD" ? "x"
        : ("both" as const);

      return await runViralMicroEngine({
        narrativeAngle: deliverable.copyMarkdown?.slice(0, 500) ?? "",
        brandName: deliverable.brand.name,
        brandTone: deliverable.brand.tone ?? "neutral",
        voiceRules,
        language: deliverable.brand.language ?? "English",
        researchResults: research,
        trendHeadline: deliverable.copyMarkdown?.slice(0, 150) ?? "",
        targetPlatform: platformTarget,
      });
    });

    await step.run("set-generating-assets", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "GENERATING_ASSETS" } });
    });

    await step.run("generate-visual", async () => {
      const visualResult = await generateVisualPrompts({
        narrativeAngle: deliverable.copyMarkdown?.slice(0, 500) ?? "",
        platform: deliverable.platform.toLowerCase(),
        brandName: deliverable.brand.name,
        emotion: "curiosity",
        colorMood: getBrandColorMood(deliverable.brand.name, "bold, high contrast"),
        generatedContent: viralResult.primaryPost,
        researchData: research,
      });

      if (viralResult.imagePrompt) {
        await prisma.asset.create({
          data: {
            deliverableId,
            type: "IMAGE",
            url: "",
            promptUsed: viralResult.imagePrompt,
            metadata: { thumbnailPrompt: visualResult.thumbnailPrompt, socialCardPrompt: visualResult.socialCardPrompt },
          },
        });
      }
      return { model: visualResult.model };
    });

    await step.run("save-and-finalize", async () => {
      await prisma.deliverable.update({
        where: { id: deliverableId },
        data: { copyMarkdown: viralResult.primaryPost, postingPlan: viralResult.postingPlan as object, status: "REVIEW" },
      });
    });

    return { deliverableId, status: "viral-micro-complete", platform: viralResult.platform };
  }
);

export const carouselPipeline = yantriInngest.createFunction(
  { id: "carousel-pipeline", retries: 2, concurrency: { limit: 3 } },
  { event: "yantri/deliverable.carousel" },
  async ({ event, step }) => {
    const { deliverableId } = event.data as DeliverableEvent["data"];

    const deliverable = await step.run("fetch-deliverable", async () => {
      return await prisma.deliverable.findUniqueOrThrow({ where: { id: deliverableId }, include: { brand: true } });
    });

    const treeId = await step.run("auto-cluster", async () => {
      if (deliverable.treeId) return deliverable.treeId;
      return await autoCluster(deliverableId, deliverable.copyMarkdown?.slice(0, 1000) ?? "", deliverable.platform, deliverable.brandId);
    });

    await step.run("set-researching", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "RESEARCHING" } });
    });

    const research = await step.run("research", async () => {
      return await resolveResearch(deliverableId, treeId, deliverable.copyMarkdown ?? "", deliverable.brand.name, deliverable.platform, deliverable.researchPrompt);
    });

    await step.run("set-scripting", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "SCRIPTING" } });
    });

    const carouselResult = await step.run("generate-carousel", async () => {
      const voiceRules = Array.isArray(deliverable.brand.voiceRules)
        ? (deliverable.brand.voiceRules as string[]).join("; ")
        : JSON.stringify(deliverable.brand.voiceRules ?? []);

      return await runCarouselEngine({
        narrativeAngle: deliverable.copyMarkdown?.slice(0, 500) ?? "",
        brandName: deliverable.brand.name,
        brandTone: deliverable.brand.tone ?? "neutral",
        voiceRules,
        language: deliverable.brand.language ?? "English",
        researchResults: research,
        trendHeadline: deliverable.copyMarkdown?.slice(0, 150) ?? "",
      });
    });

    await step.run("set-generating-assets", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "GENERATING_ASSETS" } });
    });

    await step.run("create-slide-assets", async () => {
      for (const slide of carouselResult.slides) {
        await prisma.asset.create({
          data: {
            deliverableId,
            type: "CAROUSEL_SLIDE",
            url: "",
            promptUsed: slide.visualPrompt,
            slideIndex: slide.position,
            metadata: { headline: slide.headline, bodyText: slide.bodyText, textOverlay: slide.textOverlay, role: slide.role, colorHex: slide.colorHex },
          },
        });
      }
    });

    await step.run("generate-carousel-thumbnail", async () => {
      const visualResult = await generateVisualPrompts({
        narrativeAngle: deliverable.copyMarkdown?.slice(0, 500) ?? "",
        platform: "meta",
        brandName: deliverable.brand.name,
        emotion: "curiosity",
        colorMood: getBrandColorMood(deliverable.brand.name, "bold, scroll-stopping, high contrast"),
        generatedContent: carouselResult.caption,
        researchData: research,
      });

      await prisma.asset.create({
        data: {
          deliverableId,
          type: "THUMBNAIL",
          url: "",
          promptUsed: visualResult.thumbnailPrompt,
          metadata: { socialCardPrompt: visualResult.socialCardPrompt, nanoBananaAngles: JSON.parse(JSON.stringify(visualResult.nanoBananaAngles)), purpose: "carousel_cover_image" },
        },
      });
    });

    await step.run("save-and-finalize", async () => {
      await prisma.deliverable.update({
        where: { id: deliverableId },
        data: {
          copyMarkdown: carouselResult.caption,
          carouselData: { slides: carouselResult.slides, narrativeArc: carouselResult.narrativeArc, slideCount: carouselResult.slideCount, hashtags: carouselResult.hashtags },
          status: "REVIEW",
        },
      });
    });

    return { deliverableId, status: "carousel-complete", slideCount: carouselResult.slideCount };
  }
);

export const cinematicPipeline = yantriInngest.createFunction(
  { id: "cinematic-pipeline", retries: 2, concurrency: { limit: 2 } },
  { event: "yantri/deliverable.cinematic" },
  async ({ event, step }) => {
    const { deliverableId } = event.data as DeliverableEvent["data"];

    const deliverable = await step.run("fetch-deliverable", async () => {
      return await prisma.deliverable.findUniqueOrThrow({ where: { id: deliverableId }, include: { brand: true } });
    });

    const treeId = await step.run("auto-cluster", async () => {
      if (deliverable.treeId) return deliverable.treeId;
      return await autoCluster(deliverableId, deliverable.copyMarkdown?.slice(0, 1000) ?? "", deliverable.platform, deliverable.brandId);
    });

    await step.run("set-researching", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "RESEARCHING" } });
    });

    const research = await step.run("research", async () => {
      return await resolveResearch(deliverableId, treeId, deliverable.copyMarkdown ?? "", deliverable.brand.name, deliverable.platform, deliverable.researchPrompt);
    });

    if (treeId) {
      const hasDossier = await step.run("check-dossier", async () => {
        const d = await prisma.factDossier.findUnique({ where: { treeId: treeId! } });
        return !!d;
      });
      if (!hasDossier) {
        await step.invoke("build-dossier", { function: "fact-dossier-sync", data: { treeId } });
      }
    }

    await step.run("set-scripting", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "SCRIPTING" } });
    });

    const cinematicResult = await step.run("generate-cinematic", async () => {
      const voiceRules = Array.isArray(deliverable.brand.voiceRules)
        ? (deliverable.brand.voiceRules as string[]).join("; ")
        : JSON.stringify(deliverable.brand.voiceRules ?? []);

      return await runCinematicEngine({
        narrativeAngle: deliverable.copyMarkdown?.slice(0, 500) ?? "",
        brandName: deliverable.brand.name,
        brandTone: deliverable.brand.tone ?? "neutral",
        voiceRules,
        language: deliverable.brand.language ?? "English",
        researchResults: research,
        trendHeadline: deliverable.copyMarkdown?.slice(0, 150) ?? "",
        targetRuntime: "10-15",
      });
    });

    await step.run("generate-voiceover", async () => {
      const cleanScript = cinematicResult.script.fullScript
        .replace(/\[(?:GRAPHIC|MUSIC|SFX|CUT|TRANSITION|B-ROLL)[^\]]*\]/gi, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (!cleanScript) return;
      const result = await generateVoiceover(cleanScript);
      await prisma.asset.create({
        data: {
          deliverableId, type: "AUDIO", url: "",
          metadata: { voiceId: result.voiceId, modelId: result.modelId, sectionCount: cinematicResult.script.sections.length, runtimeEstimate: cinematicResult.script.runtimeEstimate, audioSizeBytes: result.audio.length },
        },
      });
    });

    await step.run("set-storyboarding", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "STORYBOARDING" } });
    });

    await step.run("create-storyboard-assets", async () => {
      for (const frame of cinematicResult.storyboard) {
        await prisma.asset.create({
          data: { deliverableId, type: "IMAGE", url: "", promptUsed: frame.visualPrompt, slideIndex: frame.frameNumber, metadata: { shotType: frame.shotType, timestamp: frame.timestamp, duration: frame.duration, description: frame.description, transitionTo: frame.transitionTo } },
        });
      }
      for (const broll of cinematicResult.brollAssets) {
        await prisma.asset.create({
          data: { deliverableId, type: "BROLL", url: "", promptUsed: broll.generationPrompt, metadata: { description: broll.description, duration: broll.duration, placement: broll.placementTimestamp, style: broll.style } },
        });
      }
    });

    await step.run("set-generating-assets", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "GENERATING_ASSETS" } });
    });

    await step.run("generate-thumbnail", async () => {
      const visualResult = await generateVisualPrompts({
        narrativeAngle: deliverable.copyMarkdown?.slice(0, 500) ?? "",
        platform: "youtube",
        brandName: deliverable.brand.name,
        emotion: "curiosity",
        colorMood: getBrandColorMood(deliverable.brand.name, "dark editorial, high contrast"),
        generatedContent: cinematicResult.script.fullScript.slice(0, 3000),
        researchData: research,
      });
      await prisma.asset.create({
        data: { deliverableId, type: "THUMBNAIL", url: "", promptUsed: visualResult.thumbnailPrompt, metadata: { socialCardPrompt: visualResult.socialCardPrompt, nanoBananaAngles: JSON.parse(JSON.stringify(visualResult.nanoBananaAngles)) } },
      });
    });

    await step.run("save-and-finalize", async () => {
      await prisma.deliverable.update({
        where: { id: deliverableId },
        data: {
          copyMarkdown: cinematicResult.script.fullScript,
          scriptData: { sections: cinematicResult.script.sections, runtimeEstimate: cinematicResult.script.runtimeEstimate, actStructure: cinematicResult.script.actStructure },
          postingPlan: cinematicResult.postingPlan as object,
          status: "REVIEW",
        },
      });
    });

    return { deliverableId, status: "cinematic-complete", runtime: cinematicResult.script.runtimeEstimate, storyboardFrames: cinematicResult.storyboard.length, brollAssets: cinematicResult.brollAssets.length };
  }
);

export const reelPipeline = yantriInngest.createFunction(
  { id: "reel-pipeline", retries: 2, concurrency: { limit: 3 } },
  { event: "yantri/deliverable.reel" },
  async ({ event, step }) => {
    const { deliverableId } = event.data as DeliverableEvent["data"];

    const deliverable = await step.run("fetch-deliverable", async () => {
      return await prisma.deliverable.findUniqueOrThrow({ where: { id: deliverableId }, include: { brand: true } });
    });

    const treeId = await step.run("auto-cluster", async () => {
      if (deliverable.treeId) return deliverable.treeId;
      return await autoCluster(deliverableId, deliverable.copyMarkdown?.slice(0, 1000) ?? "", deliverable.platform, deliverable.brandId);
    });

    await step.run("set-researching", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "RESEARCHING" } });
    });

    const research = await step.run("research", async () => {
      return await resolveResearch(deliverableId, treeId, deliverable.copyMarkdown ?? "", deliverable.brand.name, deliverable.platform, deliverable.researchPrompt);
    });

    await step.run("set-scripting", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "SCRIPTING" } });
    });

    const reelResult = await step.run("generate-reel-content", async () => {
      const voiceRules = Array.isArray(deliverable.brand.voiceRules)
        ? (deliverable.brand.voiceRules as string[]).join("; ")
        : JSON.stringify(deliverable.brand.voiceRules ?? []);

      const { buildContentGenerationPrompt } = await import("@/lib/yantri/prompts");
      const { systemPrompt, userMessage } = await buildContentGenerationPrompt(
        "META_REEL",
        deliverable.copyMarkdown?.slice(0, 500) ?? "",
        "reel",
        deliverable.brand.name,
        deliverable.brand.tone ?? "neutral",
        voiceRules,
        deliverable.brand.language ?? "English",
        research,
        deliverable.copyMarkdown?.slice(0, 150) ?? ""
      );

      const result = await routeToModel("drafting", systemPrompt, userMessage, { temperature: 0.5 });
      if (!result.parsed) throw new Error(`ReelPipeline: model returned unparseable response. Raw: ${result.raw.slice(0, 300)}`);
      return result.parsed as Record<string, unknown>;
    });

    await step.run("set-generating-assets", async () => {
      await prisma.deliverable.update({ where: { id: deliverableId }, data: { status: "GENERATING_ASSETS" } });
    });

    await step.run("generate-reel-voiceover", async () => {
      const content = reelResult.content as Record<string, unknown> | undefined;
      const scriptText = (content?.script as string) ?? "";
      if (!scriptText.trim()) return;
      const cleanScript = scriptText.replace(/\[(?:TEXT OVERLAY|MUSIC|SFX|CUT|TRANSITION)[^\]]*\]/gi, "").replace(/\n{3,}/g, "\n\n").trim();
      if (!cleanScript) return;
      const result = await generateVoiceover(cleanScript, { stability: 0.6, similarityBoost: 0.8 });
      await prisma.asset.create({
        data: { deliverableId, type: "AUDIO", url: "", metadata: { voiceId: result.voiceId, modelId: result.modelId, purpose: "reel_voiceover", duration: (content?.duration as string) ?? "30-60 seconds", audioSizeBytes: result.audio.length } },
      });
    });

    await step.run("generate-reel-thumbnail", async () => {
      const visualResult = await generateVisualPrompts({
        narrativeAngle: deliverable.copyMarkdown?.slice(0, 500) ?? "",
        platform: "meta",
        brandName: deliverable.brand.name,
        emotion: "curiosity",
        colorMood: getBrandColorMood(deliverable.brand.name, "bold, scroll-stopping, high contrast"),
        generatedContent: JSON.stringify(reelResult.content ?? {}),
        researchData: research,
      });
      await prisma.asset.create({
        data: { deliverableId, type: "THUMBNAIL", url: "", promptUsed: visualResult.thumbnailPrompt, metadata: { socialCardPrompt: visualResult.socialCardPrompt, nanoBananaAngles: JSON.parse(JSON.stringify(visualResult.nanoBananaAngles)), purpose: "reel_cover_image" } },
      });
    });

    await step.run("save-and-finalize", async () => {
      const content = reelResult.content as Record<string, unknown> | undefined;
      const postingPlan = reelResult.postingPlan as object | undefined;
      await prisma.deliverable.update({
        where: { id: deliverableId },
        data: {
          copyMarkdown: (content?.script as string) ?? JSON.stringify(content),
          scriptData: { textOverlays: content?.text_overlays ?? [], duration: content?.duration ?? null, musicMood: content?.music_mood ?? null, type: "reel" },
          postingPlan: postingPlan ?? {},
          status: "REVIEW",
        },
      });
    });

    return { deliverableId, status: "reel-complete" };
  }
);
