/**
 * Deliverable → ContentPost bridge.
 *
 * Converts an approved Deliverable (from the Yantri pipeline)
 * into a ContentPost ready for scheduling or immediate publishing.
 */

import { prisma } from "@/lib/prisma";
import type { ContentPlatform } from "@prisma/client";

/** Map Yantri ContentPlatform enum → Relay platform string */
const PLATFORM_MAP: Record<ContentPlatform, string | null> = {
  YOUTUBE: "youtube",
  X_THREAD: "x",
  X_SINGLE: "x",
  LINKEDIN: "linkedin",
  META_REEL: "instagram",
  META_CAROUSEL: "instagram",
  META_POST: "instagram",
  BLOG: null, // Not a social platform
};

/**
 * Bridge a Deliverable into a ContentPost.
 *
 * @param deliverableId - The deliverable to bridge
 * @param createdById   - The user creating the post
 * @param scheduledAt   - Optional scheduled publish time
 * @returns The new ContentPost ID
 */
export async function bridgeDeliverableToPost(
  deliverableId: string,
  createdById: string,
  scheduledAt?: Date
): Promise<string> {
  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { assets: { orderBy: { slideIndex: "asc" } }, brand: true },
  });

  if (!deliverable) {
    throw new Error(`Deliverable ${deliverableId} not found`);
  }

  if (deliverable.status !== "APPROVED" && deliverable.status !== "RELAYED") {
    throw new Error(
      `Deliverable must be APPROVED to bridge. Current status: ${deliverable.status}`
    );
  }

  const platform = PLATFORM_MAP[deliverable.platform];
  if (!platform) {
    throw new Error(
      `Platform ${deliverable.platform} cannot be bridged to a social post (blog posts are not supported)`
    );
  }

  // Extract content
  const content = extractContent(deliverable);
  const title = extractTitle(deliverable);
  const mediaUrls = deliverable.assets.map((a) => a.url);
  const metadata = extractMetadata(deliverable);

  // Create the ContentPost
  const post = await prisma.contentPost.create({
    data: {
      title,
      content,
      platform,
      brandId: deliverable.brandId,
      status: scheduledAt ? "SCHEDULED" : "DRAFT",
      scheduledAt: scheduledAt || null,
      mediaUrls: mediaUrls.length > 0 ? (mediaUrls as object) : undefined,
      metadata: Object.keys(metadata).length > 0 ? (metadata as object) : undefined,
      createdById,
    },
  });

  // Update deliverable status to RELAYED
  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { status: "RELAYED" },
  });

  return post.id;
}

function extractContent(deliverable: {
  copyMarkdown: string | null;
  scriptData: unknown;
  carouselData: unknown;
  platform: ContentPlatform;
}): string {
  // For YouTube, extract description from scriptData
  if (deliverable.platform === "YOUTUBE" && deliverable.scriptData) {
    const script = deliverable.scriptData as Record<string, unknown>;
    return (script.description as string) || deliverable.copyMarkdown || "";
  }

  return deliverable.copyMarkdown || "";
}

function extractTitle(deliverable: {
  copyMarkdown: string | null;
  scriptData: unknown;
  platform: ContentPlatform;
  brand: { name: string };
}): string {
  // YouTube: use script title
  if (deliverable.platform === "YOUTUBE" && deliverable.scriptData) {
    const script = deliverable.scriptData as Record<string, unknown>;
    if (script.title) return script.title as string;
  }

  // For other platforms, use first line or truncated copy
  const copy = deliverable.copyMarkdown || "";
  const firstLine = copy.split("\n")[0].replace(/^#+\s*/, "").trim();
  if (firstLine.length > 0) {
    return firstLine.length > 100 ? firstLine.slice(0, 100) + "..." : firstLine;
  }

  return `${deliverable.brand.name} - ${deliverable.platform}`;
}

function extractMetadata(deliverable: {
  postingPlan: unknown;
  scriptData: unknown;
  platform: ContentPlatform;
}): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  const plan = (deliverable.postingPlan ?? {}) as Record<string, unknown>;

  if (plan.hashtags) meta.hashtags = plan.hashtags;
  if (plan.timing) meta.timing = plan.timing;

  // YouTube-specific
  if (deliverable.platform === "YOUTUBE" && deliverable.scriptData) {
    const script = deliverable.scriptData as Record<string, unknown>;
    if (script.tags) meta.tags = script.tags;
    meta.privacyStatus = "public";
  }

  return meta;
}
