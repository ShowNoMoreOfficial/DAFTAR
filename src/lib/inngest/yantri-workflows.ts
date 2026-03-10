/**
 * Yantri Master Pipeline — Inngest Durable Workflow
 *
 * Multi-step, fault-tolerant pipeline that orchestrates deliverable
 * generation from a narrative tree:
 *
 *   1. route-engines    → Determine skill chain via EngineRouter
 *   2. draft-content    → Execute primary skill via SkillOrchestrator
 *   3. fact-check       → Verify against signal source (max 2 retries)
 *   4. save-and-notify  → Persist to ClientDeliverable, set IN_REVIEW
 *   5. alert-pms        → Emit YANTRI_DELIVERABLE_READY event
 *
 * Each step is individually durable — if step 3 fails, only step 3
 * reruns. Inngest handles retries, timeouts, and crash recovery.
 */

import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { daftarEvents } from "@/lib/event-bus";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import {
  engineRouter,
  type ContentType,
} from "@/lib/yantri/engine-router";
import {
  factCheck,
  type SignalContext,
  type FactCheckResult,
} from "@/lib/yantri/fact-checker";
import type { Prisma } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────

const MAX_FACT_CHECK_RETRIES = 2;

// ─── The Pipeline ─────────────────────────────────────────

export const generateDeliverableV2 = inngest.createFunction(
  {
    id: "generate-deliverable-v2",
    name: "Yantri: Generate Deliverable (Full Pipeline)",
    retries: 2,
    concurrency: [{ limit: 3 }],
  },
  { event: "yantri/deliverable.generate" },
  async ({ event, step }) => {
    const { narrativeTreeId, brandId, platforms, narrativeMarkdown } =
      event.data;

    // ═══════════════════════════════════════════════════════
    // STEP 1: Route Engines
    // Determine the skill chain for each requested platform.
    // ═══════════════════════════════════════════════════════

    const routingPlan = await step.run("route-engines", async () => {
      const routes: Array<{
        platform: string;
        contentType: ContentType;
        skillPaths: string[];
        primarySkill: string;
      }> = [];

      for (const platform of platforms) {
        // Map Inngest platform strings to engine router ContentType
        const contentType = mapPlatformToContentType(platform);

        if (!engineRouter.isValidType(contentType)) {
          console.warn(
            `[yantri] Unknown content type for platform "${platform}", using BLOG_ARTICLE fallback`
          );
        }

        const resolvedType = engineRouter.isValidType(contentType)
          ? contentType
          : ("BLOG_ARTICLE" as ContentType);

        const skillPaths = engineRouter.getSkillPaths(resolvedType);
        const primarySkill = engineRouter.getPrimaryDraftSkill(resolvedType);

        routes.push({
          platform,
          contentType: resolvedType,
          skillPaths,
          primarySkill: primarySkill.skillPath,
        });
      }

      return routes;
    });

    // ═══════════════════════════════════════════════════════
    // STEP 1.5: Load brand context (voice, identity)
    // ═══════════════════════════════════════════════════════

    const brandContext = await step.run("load-brand-context", async () => {
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        select: { name: true, slug: true, config: true },
      });
      if (!brand) throw new Error(`Brand ${brandId} not found`);

      let voiceInstructions: string | null = null;
      try {
        const identity = await skillOrchestrator.loadSkill(
          `brand/identity/${brand.slug}/identity.md`
        );
        voiceInstructions = identity.instructions;
      } catch {
        // No brand identity skill — use generic voice
      }

      return {
        brandName: brand.name,
        brandSlug: brand.slug,
        config: brand.config as Record<string, unknown> | null,
        voiceInstructions,
      };
    });

    // ═══════════════════════════════════════════════════════
    // STEP 1.6: Load signal context (for fact-checking)
    // ═══════════════════════════════════════════════════════

    const signalContext = await step.run(
      "load-signal-context",
      async () => {
        // Try to find a signal linked to this narrative tree
        // via the narrative markdown or related content
        const signal = await prisma.signal.findFirst({
          where: {
            title: {
              contains: narrativeMarkdown.slice(0, 80),
              mode: "insensitive",
            },
          },
          select: {
            title: true,
            content: true,
            source: true,
            stakeholders: true,
            eventMarkers: true,
            detectedAt: true,
          },
          orderBy: { detectedAt: "desc" },
        });

        if (signal) {
          return {
            title: signal.title,
            content: signal.content,
            source: signal.source,
            stakeholders: signal.stakeholders as Record<string, unknown> | null,
            eventMarkers: signal.eventMarkers as Record<string, unknown> | null,
            detectedAt: signal.detectedAt.toISOString(),
          } satisfies SignalContext;
        }

        // Fallback: use the narrative markdown itself as the source of truth
        return {
          title: narrativeMarkdown.slice(0, 200),
          content: narrativeMarkdown,
          source: "narrative-tree",
          stakeholders: null,
          eventMarkers: null,
          detectedAt: new Date().toISOString(),
        } satisfies SignalContext;
      }
    );

    // ═══════════════════════════════════════════════════════
    // STEP 2 + 3: Draft and fact-check each platform
    // For each platform: draft → fact-check → retry if needed
    // ═══════════════════════════════════════════════════════

    const deliverables: Array<{
      platform: string;
      contentType: ContentType;
      content: string;
      factCheckResult: FactCheckResult;
      skillsUsed: string[];
    }> = [];

    for (const route of routingPlan) {
      // ── STEP 2: Draft content ───────────────────────────
      let draftContent = await step.run(
        `draft-${route.platform.toLowerCase()}`,
        async () => {
          const result = await skillOrchestrator.executeSkill({
            skillPath: route.primarySkill,
            context: {
              narrative: narrativeMarkdown,
              brand: brandContext,
              targetPlatform: route.platform,
              contentType: route.contentType,
              skillChain: route.skillPaths,
            },
            brandId,
            platform: engineRouter.getPlatform(route.contentType),
          });

          if (!result.success) {
            throw new Error(
              `Draft generation failed for ${route.platform}: ${result.error}`
            );
          }

          return (
            (result.output as { draft?: string }).draft ??
            narrativeMarkdown
          );
        }
      );

      // ── STEP 3: Fact-check with retry loop ─────────────
      let attempt = 0;
      let factResult: FactCheckResult | null = null;

      while (attempt <= MAX_FACT_CHECK_RETRIES) {
        factResult = await step.run(
          `fact-check-${route.platform.toLowerCase()}-attempt-${attempt}`,
          async () => {
            return factCheck(draftContent, signalContext, {
              brandId,
              deliverableId: `${narrativeTreeId}-${route.platform}`,
            });
          }
        );

        if (factResult.passed) break;

        // If fact-check failed and we have retries left, re-draft
        if (attempt < MAX_FACT_CHECK_RETRIES) {
          draftContent = await step.run(
            `redraft-${route.platform.toLowerCase()}-attempt-${attempt + 1}`,
            async () => {
              // Re-generate with the deviations as correction context
              const result = await skillOrchestrator.executeSkill({
                skillPath: route.primarySkill,
                context: {
                  narrative: narrativeMarkdown,
                  brand: brandContext,
                  targetPlatform: route.platform,
                  contentType: route.contentType,
                  previousDraft: draftContent,
                  factCheckDeviations: factResult!.deviations,
                  instructions:
                    "Rewrite the draft fixing ALL factual deviations listed. " +
                    "Only use facts present in the source signal.",
                },
                brandId,
                platform: engineRouter.getPlatform(route.contentType),
              });

              return (
                (result.output as { draft?: string }).draft ??
                draftContent
              );
            }
          );
        }

        attempt++;
      }

      deliverables.push({
        platform: route.platform,
        contentType: route.contentType,
        content: draftContent,
        factCheckResult: factResult!,
        skillsUsed: route.skillPaths,
      });
    }

    // ═══════════════════════════════════════════════════════
    // STEP 4: Save and Notify
    // Persist each deliverable to the database with IN_REVIEW.
    // ═══════════════════════════════════════════════════════

    const savedIds = await step.run("save-and-notify", async () => {
      const ids: string[] = [];

      for (const d of deliverables) {
        // Create a ClientDeliverable record
        const deliverable = await prisma.clientDeliverable.create({
          data: {
            clientId: brandId, // brand acts as the client scope
            brandId,
            title: `${brandContext.brandName} — ${d.contentType.replace(/_/g, " ")}`,
            description: d.content.slice(0, 500),
            type: mapContentTypeToDeliverableType(d.contentType),
            status: "ready_for_review",
          },
        });
        ids.push(deliverable.id);

        // Also create a ContentPerformance entry for learning loop tracking
        await prisma.contentPerformance.create({
          data: {
            deliverableId: deliverable.id,
            brandId,
            platform: engineRouter.getPlatform(d.contentType),
            metrics: {} as Prisma.InputJsonValue,
            skillsUsed: d.skillsUsed,
            narrativeAngle: d.content.slice(0, 200),
            hookType: inferHookType(d.content),
            performanceTier: null,
          },
        });

        // Record each skill execution for audit trail
        await prisma.skillExecution.create({
          data: {
            skillId: await getOrCreateSkillId(d.skillsUsed[0] ?? "unknown"),
            deliverableId: deliverable.id,
            brandId,
            platform: engineRouter.getPlatform(d.contentType),
            inputContext: {
              narrativeTreeId,
              contentType: d.contentType,
            } as Prisma.InputJsonValue,
            outputSummary: {
              contentLength: d.content.length,
              factCheckPassed: d.factCheckResult.passed,
              factCheckConfidence: d.factCheckResult.confidence,
              deviations: d.factCheckResult.flagged,
            } as Prisma.InputJsonValue,
            modelUsed: "mock-llm",
            status: d.factCheckResult.passed ? "completed" : "partial",
          },
        });
      }

      return ids;
    });

    // ═══════════════════════════════════════════════════════
    // STEP 5: Alert PMS
    // Emit event so GI can notify the assigned editor.
    // ═══════════════════════════════════════════════════════

    await step.run("alert-pms", async () => {
      daftarEvents.emitEvent("YANTRI_DELIVERABLE_READY", {
        narrativeTreeId,
        brandId,
        brandName: brandContext.brandName,
        deliverableIds: savedIds,
        platforms: deliverables.map((d) => d.platform),
        contentTypes: deliverables.map((d) => d.contentType),
        factCheckSummary: {
          allPassed: deliverables.every((d) => d.factCheckResult.passed),
          totalDeviations: deliverables.reduce(
            (sum, d) => sum + d.factCheckResult.flagged,
            0
          ),
        },
      });

      // Also emit the legacy event for backward compatibility
      daftarEvents.emitEvent("yantri.deliverables.ready", {
        narrativeTreeId,
        brandId,
        platforms: deliverables.map((d) => d.platform),
        deliverableCount: deliverables.length,
      });
    });

    // ─── Return summary ───────────────────────────────────

    return {
      narrativeTreeId,
      brandId,
      deliverableCount: deliverables.length,
      deliverableIds: savedIds,
      results: deliverables.map((d) => ({
        platform: d.platform,
        contentType: d.contentType,
        factCheckPassed: d.factCheckResult.passed,
        factCheckConfidence: d.factCheckResult.confidence,
        deviations: d.factCheckResult.flagged,
        contentLength: d.content.length,
      })),
    };
  }
);

// ─── Helpers ──────────────────────────────────────────────

function mapPlatformToContentType(platform: string): ContentType {
  const map: Record<string, ContentType> = {
    YOUTUBE: "VIDEO_SCRIPT",
    YOUTUBE_SHORT: "VIDEO_SHORT",
    X_THREAD: "TWEET_THREAD",
    X_SINGLE: "TWEET_SINGLE",
    X: "TWEET_SINGLE",
    META_REEL: "INSTAGRAM_REEL",
    META_CAROUSEL: "INSTAGRAM_CAROUSEL",
    INSTAGRAM_REEL: "INSTAGRAM_REEL",
    INSTAGRAM_CAROUSEL: "INSTAGRAM_CAROUSEL",
    INSTAGRAM_STORY: "INSTAGRAM_STORY",
    LINKEDIN: "LINKEDIN_POST",
    LINKEDIN_ARTICLE: "LINKEDIN_ARTICLE",
    FACEBOOK: "FACEBOOK_POST",
    BLOG: "BLOG_ARTICLE",
    IMAGE: "IMAGE_ASSET",
    PODCAST: "PODCAST_SCRIPT",
  };

  return map[platform.toUpperCase()] ?? ("BLOG_ARTICLE" as ContentType);
}

function mapContentTypeToDeliverableType(ct: ContentType): string {
  const map: Record<string, string> = {
    VIDEO_SCRIPT: "video",
    VIDEO_SHORT: "video",
    TWEET_SINGLE: "social_post",
    TWEET_THREAD: "social_post",
    INSTAGRAM_REEL: "video",
    INSTAGRAM_CAROUSEL: "graphic",
    INSTAGRAM_STORY: "graphic",
    LINKEDIN_POST: "social_post",
    LINKEDIN_ARTICLE: "article",
    FACEBOOK_POST: "social_post",
    BLOG_ARTICLE: "article",
    IMAGE_ASSET: "graphic",
    PODCAST_SCRIPT: "video",
  };
  return map[ct] ?? "social_post";
}

function inferHookType(content: string): string {
  const first50 = content.slice(0, 50).toLowerCase();
  if (first50.includes("?")) return "question";
  if (/\d/.test(first50)) return "data-first";
  if (first50.includes("!")) return "exclamation";
  return "statement";
}

async function getOrCreateSkillId(skillPath: string): Promise<string> {
  const existing = await prisma.skill.findUnique({
    where: { path: skillPath },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.skill.create({
    data: {
      path: skillPath,
      domain: skillPath.split("/")[0] ?? "unknown",
      module: "yantri",
      name: skillPath.split("/").pop()?.replace(".md", "") ?? skillPath,
    },
  });
  return created.id;
}
