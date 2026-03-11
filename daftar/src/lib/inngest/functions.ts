import { inngest } from "./client";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import { prisma } from "@/lib/prisma";
import { daftarEvents } from "@/lib/event-bus";
import type { Prisma } from "@prisma/client";

// ═══════════════════════════════════════════════════════════
// 1. PROCESS SIGNAL — Khabri Intelligence Enrichment
// ═══════════════════════════════════════════════════════════
// Triggered when a raw signal is ingested from Khabri.
// Runs multiple skill-based enrichment steps, each durable
// (automatically retried on failure by Inngest).

export const processSignal = inngest.createFunction(
  {
    id: "process-signal",
    name: "Process & Enrich Signal",
    // Retry up to 3 times with exponential backoff
    retries: 3,
  },
  { event: "khabri/signal.process" },
  async ({ event, step }) => {
    const { signalId, trendId, source, title } = event.data;

    // Step 1: Run credibility scoring skill
    // Each step.run is individually retryable — if the skill
    // orchestrator fails mid-way, only the failed step reruns.
    const credibility = await step.run(
      "score-credibility",
      async () => {
        const result = await skillOrchestrator.executeSkill({
          skillPath: "signals/detection/source-credibility-scoring.md",
          context: { signal: { title, source } },
        });
        return result.output as { score: number; tier: string };
      }
    );

    // Step 2: Run geo-relevance mapping
    const geoRelevance = await step.run(
      "map-geo-relevance",
      async () => {
        const result = await skillOrchestrator.executeSkill({
          skillPath: "signals/analysis/geo-relevance-mapping.md",
          context: { signal: { title, source } },
        });
        return result.output as Record<string, unknown>;
      }
    );

    // Step 3: Run event detection to classify the signal
    const eventType = await step.run(
      "detect-event-type",
      async () => {
        const result = await skillOrchestrator.executeSkill({
          skillPath: "signals/detection/event-detection.md",
          context: { signal: { title, source } },
        });
        return result.output as { eventType: string };
      }
    );

    // Step 4: Persist enrichment results back to the database
    await step.run("persist-enrichment", async () => {
      await prisma.signal.update({
        where: { id: signalId },
        data: {
          sourceCredibility: credibility.score,
          geoRelevance: geoRelevance as unknown as Prisma.InputJsonValue,
          eventType: eventType.eventType,
        },
      });

      // Touch the parent trend's updatedAt
      await prisma.trend.update({
        where: { id: trendId },
        data: { updatedAt: new Date() },
      });
    });

    // Step 5: Check escalation level and emit event if urgent
    await step.run("check-escalation", async () => {
      const result = await skillOrchestrator.executeSkill({
        skillPath: "signals/analysis/escalation-assessment.md",
        context: {
          signal: { title, source },
          credibility,
          geoRelevance,
        },
      });

      const escalation = result.output as { level: string };

      // If escalation is high, promote the signal for narrative
      if (
        escalation.level === "BREAKING" ||
        escalation.level === "CRISIS"
      ) {
        daftarEvents.emitEvent("signal.ready_for_narrative", {
          signalId,
          trendId,
          escalationLevel: escalation.level,
        });
      }
    });

    return {
      signalId,
      enriched: true,
      credibilityScore: credibility.score,
      eventType: eventType.eventType,
    };
  }
);

// ═══════════════════════════════════════════════════════════
// 2. GENERATE DELIVERABLE — Yantri Content Pipeline
// ═══════════════════════════════════════════════════════════
// Triggered when a narrative is approved and deliverables
// need to be produced for multiple platforms.
// Multi-step pipeline: Draft → Asset Gen → Finalize.

export const generateDeliverable = inngest.createFunction(
  {
    id: "generate-deliverable",
    name: "Generate Platform Deliverables",
    retries: 2,
    // Concurrency limit: don't overwhelm LLM APIs
    concurrency: [{ limit: 3 }],
  },
  { event: "yantri/deliverable.generate" },
  async ({ event, step }) => {
    const { narrativeTreeId, brandId, platforms, narrativeMarkdown } =
      event.data;

    // Step 1: Load brand identity for voice calibration
    // This ensures every deliverable matches the brand's tone.
    const brandContext = await step.run(
      "load-brand-context",
      async () => {
        const brand = await prisma.brand.findUnique({
          where: { id: brandId },
          select: { name: true, slug: true, config: true },
        });
        if (!brand) throw new Error(`Brand ${brandId} not found`);

        // Load brand voice skill if it exists
        try {
          const identity = await skillOrchestrator.loadSkill(
            `brand/identity/${brand.slug}/identity.md`
          );
          return {
            brandName: brand.name,
            brandSlug: brand.slug,
            voiceInstructions: identity.instructions,
          };
        } catch {
          return {
            brandName: brand.name,
            brandSlug: brand.slug,
            voiceInstructions: null,
          };
        }
      }
    );

    // Step 2: Generate drafts for each platform in parallel
    // Inngest handles each as a separate durable step.
    const drafts: Record<string, string> = {};
    for (const platform of platforms) {
      const draft = await step.run(
        `draft-${platform.toLowerCase()}`,
        async () => {
          // Map platform to the appropriate skill file
          const skillMap: Record<string, string> = {
            YOUTUBE: "platforms/youtube/title-engineering.md",
            X_THREAD: "platforms/x-twitter/thread-architecture.md",
            X_SINGLE: "platforms/x-twitter/tweet-crafting.md",
            META_REEL: "platforms/meta/reel-production.md",
            META_CAROUSEL: "platforms/meta/carousel-design.md",
            LINKEDIN: "platforms/linkedin/professional-tone-calibration.md",
            BLOG: "narrative/editorial/narrative-arc-construction.md",
          };

          const skillPath =
            skillMap[platform] || "narrative/editorial/narrative-arc-construction.md";

          const result = await skillOrchestrator.executeSkill({
            skillPath,
            context: {
              narrative: narrativeMarkdown,
              brand: brandContext,
              targetPlatform: platform,
            },
            brandId,
            platform: platform.toLowerCase(),
          });

          return (result.output as { draft: string }).draft || narrativeMarkdown;
        }
      );
      drafts[platform] = draft;
    }

    // Step 3: Generate visual assets (thumbnails, carousel slides)
    // In production, this would call DALL-E / Midjourney / internal tools.
    const assets = await step.run("generate-assets", async () => {
      const assetManifest: Record<string, string[]> = {};
      for (const platform of platforms) {
        if (platform === "YOUTUBE") {
          assetManifest[platform] = ["thumbnail_16x9.png", "end_screen.png"];
        } else if (platform === "META_CAROUSEL") {
          assetManifest[platform] = [
            "slide_1.png",
            "slide_2.png",
            "slide_3.png",
          ];
        } else if (platform === "META_REEL") {
          assetManifest[platform] = ["reel_cover.png"];
        } else {
          assetManifest[platform] = [];
        }
      }
      return assetManifest;
    });

    // Step 4: Finalize — persist deliverables to database
    const deliverableIds = await step.run("finalize", async () => {
      const ids: string[] = [];

      for (const platform of platforms) {
        // Record content performance entry for tracking
        const perf = await prisma.contentPerformance.create({
          data: {
            deliverableId: `${narrativeTreeId}-${platform}`,
            brandId,
            platform: platform.toLowerCase(),
            publishedAt: null, // Not published yet
            metrics: {},
            skillsUsed: [],
            narrativeAngle: narrativeMarkdown.slice(0, 200),
            hookType: "data-first",
            performanceTier: null,
          },
        });
        ids.push(perf.id);
      }

      return ids;
    });

    // Emit event for downstream consumers (Relay scheduling, GI tracking)
    daftarEvents.emitEvent("yantri.deliverables.ready", {
      narrativeTreeId,
      brandId,
      platforms,
      deliverableCount: platforms.length,
    });

    return {
      narrativeTreeId,
      deliverableCount: platforms.length,
      deliverableIds,
      drafts: Object.keys(drafts),
      assets,
    };
  }
);

// ═══════════════════════════════════════════════════════════
// 3. PUBLISH POST — Relay Distribution
// ═══════════════════════════════════════════════════════════
// Triggered when a deliverable is ready to go live.
// Handles scheduling, API calls, and post-publish tracking.

export const publishPost = inngest.createFunction(
  {
    id: "publish-post",
    name: "Publish to Platform",
    retries: 3,
    // If scheduled for the future, Inngest sleeps until then
  },
  { event: "relay/post.publish" },
  async ({ event, step }) => {
    const { postId, platform, brandId, content, scheduledAt } = event.data;

    // Step 1: If scheduled for later, sleep until the target time.
    // Inngest handles this durably — even across server restarts.
    if (scheduledAt) {
      const targetTime = new Date(scheduledAt);
      const now = new Date();
      if (targetTime > now) {
        await step.sleepUntil("wait-for-schedule", targetTime);
      }
    }

    // Step 2: Load platform connection credentials
    const connection = await step.run(
      "load-platform-connection",
      async () => {
        const conn = await prisma.platformConnection.findFirst({
          where: {
            platform: platform.toLowerCase(),
            brand: { id: brandId },
            isActive: true,
          },
          select: {
            id: true,
            platform: true,
            accessToken: true,
            accountId: true,
          },
        });
        if (!conn) {
          throw new Error(
            `No active ${platform} connection for brand ${brandId}`
          );
        }
        return conn;
      }
    );

    // Step 3: Call the platform API to publish
    // In production, this dispatches to platform-specific adapters.
    const publishResult = await step.run(
      "call-platform-api",
      async () => {
        // Simulate platform API call
        // In production: switch on platform, call Twitter/YouTube/Meta APIs
        const platformId = `${platform.toLowerCase()}_${Date.now()}`;

        return {
          success: true,
          platformPostId: platformId,
          publishedAt: new Date().toISOString(),
          url: `https://${platform.toLowerCase()}.com/post/${platformId}`,
        };
      }
    );

    // Step 4: Update the post record in our database
    await step.run("update-post-record", async () => {
      await prisma.contentPost.update({
        where: { id: postId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(publishResult.publishedAt),
          platformPostId: publishResult.platformPostId,
        },
      });
    });

    // Step 5: Emit event for analytics tracking
    // The learning loop will pick this up for performance attribution.
    daftarEvents.emitEvent("content.published", {
      postId,
      platform,
      brandId,
      platformPostId: publishResult.platformPostId,
    });

    return {
      postId,
      platform,
      published: true,
      platformPostId: publishResult.platformPostId,
      url: publishResult.url,
    };
  }
);
