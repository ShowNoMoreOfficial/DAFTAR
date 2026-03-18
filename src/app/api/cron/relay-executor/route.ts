import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executePublish } from "@/lib/relay/publish-executor";
import { apiHandler } from "@/lib/api-handler";

/**
 * GET /api/cron/relay-executor
 *
 * Secure cron endpoint that publishes scheduled social media posts.
 * Call via Vercel Cron, GitHub Actions, or any external scheduler.
 *
 * Flow:
 *  1. Query ContentPost WHERE status = QUEUED|SCHEDULED AND scheduledAt <= NOW
 *  2. For each post, call executePublish() which handles:
 *     - Finding the PlatformConnection
 *     - Uploading media to the target platform
 *     - Publishing via the platform-specific publisher
 *     - Updating status to PUBLISHED or FAILED
 *
 * Security: Protected by CRON_SECRET Bearer token in production.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes — publishing can be slow

export const GET = apiHandler(async () => {
  const now = new Date();
  const results: {
    postId: string;
    platform: string;
    status: "PUBLISHED" | "FAILED";
    platformPostId?: string;
    error?: string;
  }[] = [];

  // -- Find posts ready to publish --
  const pendingPosts = await prisma.contentPost.findMany({
    where: {
      status: { in: ["QUEUED", "SCHEDULED"] },
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: 50, // Process in batches to avoid timeout
  });

  if (pendingPosts.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: "No posts ready to publish",
      timestamp: now.toISOString(),
    });
  }

  // -- Process each post --
  for (const post of pendingPosts) {
    const result = await executePublish(post.id);
    results.push({
      postId: post.id,
      platform: post.platform,
      status: result.status,
      platformPostId: result.platformPostId,
      error: result.error,
    });
  }

  const published = results.filter((r) => r.status === "PUBLISHED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;

  return NextResponse.json({
    success: true,
    processed: results.length,
    published,
    failed,
    results,
    timestamp: now.toISOString(),
  });
}, { requireCronSecret: true });
