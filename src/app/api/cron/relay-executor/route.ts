import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { daftarEvents } from "@/lib/event-bus";
import { TwitterPublisher } from "@/lib/relay/publishers/twitter";
import { LinkedInPublisher } from "@/lib/relay/publishers/linkedin";
import { uploadAllMedia, uploadToYouTube } from "@/lib/relay/publishers/media-handler";

/**
 * GET /api/cron/relay-executor
 *
 * Secure cron endpoint that publishes scheduled social media posts.
 * Call via Vercel Cron, GitHub Actions, or any external scheduler.
 *
 * Flow:
 *  1. Query ContentPost WHERE status = QUEUED|SCHEDULED AND scheduledAt <= NOW
 *  2. For each post, find the PlatformConnection for (brandId, platform)
 *  3. Upload any attached media to the target platform
 *  4. Publish the content via the platform-specific publisher
 *  5. Update the post: status → PUBLISHED, store platformPostId
 *  6. On failure: status → FAILED, store errorMessage
 *
 * Security: Protected by CRON_SECRET Bearer token in production.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes — publishing can be slow

export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: {
    postId: string;
    platform: string;
    status: "PUBLISHED" | "FAILED";
    platformPostId?: string;
    error?: string;
  }[] = [];

  try {
    // ── 1. Find posts ready to publish ────────────────────
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

    // ── 2. Process each post ──────────────────────────────
    for (const post of pendingPosts) {
      // Mark as PUBLISHING to prevent double-execution by concurrent cron runs
      await prisma.contentPost.update({
        where: { id: post.id },
        data: { status: "PUBLISHING" },
      });

      try {
        // ── 2a. Find the platform connection ──────────────
        const connection = await prisma.platformConnection.findUnique({
          where: {
            brandId_platform: {
              brandId: post.brandId,
              platform: post.platform,
            },
          },
        });

        if (!connection || !connection.isActive) {
          throw new Error(
            `No active ${post.platform} connection for brand ${post.brandId}`
          );
        }

        if (!connection.accessToken) {
          throw new Error(
            `${post.platform} connection ${connection.id} has no access token. Re-authenticate via OAuth.`
          );
        }

        // ── 2b. Upload media if needed ────────────────────
        const mediaUrls = (post.mediaUrls as string[] | null) || [];
        const metadata = (post.metadata as Record<string, unknown> | null) || {};
        let uploadedMediaIds: string[] = [];

        // YouTube is special — video IS the content
        if (post.platform === "youtube" && mediaUrls.length > 0) {
          const videoId = await uploadToYouTube(
            connection.id,
            mediaUrls[0],
            post.title,
            post.content || undefined,
            (metadata.tags as string[]) || undefined,
            (metadata.privacyStatus as "public" | "unlisted" | "private") || "public"
          );

          // For YouTube, the video upload IS the publish
          await markPublished(post.id, videoId, `https://youtube.com/watch?v=${videoId}`);
          results.push({
            postId: post.id,
            platform: post.platform,
            status: "PUBLISHED",
            platformPostId: videoId,
          });

          emitPublished(post, videoId);
          continue;
        }

        // For other platforms, upload media first
        if (mediaUrls.length > 0) {
          uploadedMediaIds = await uploadAllMedia(
            post.platform,
            connection.id,
            mediaUrls
          );
        }

        // ── 2c. Publish via the correct publisher ─────────
        let platformPostId: string;
        let publishedUrl: string | undefined;

        switch (post.platform) {
          case "x": {
            const twitter = new TwitterPublisher(connection.id);
            const content = post.content || post.title;

            // Detect thread: split by double-newline or if content > 280 chars
            const tweetTexts = splitIntoTweets(content);

            if (tweetTexts.length > 1) {
              // Thread mode — distribute media across tweets if multiple
              const mediaPerTweet = distributeMedia(uploadedMediaIds, tweetTexts.length);
              const threadResult = await twitter.publishThread(tweetTexts, mediaPerTweet);
              platformPostId = threadResult.threadHeadId;
              publishedUrl = `https://x.com/i/status/${platformPostId}`;
            } else {
              const tweetResult = await twitter.publishTweet(
                tweetTexts[0],
                uploadedMediaIds.length > 0 ? uploadedMediaIds : undefined
              );
              platformPostId = tweetResult.tweetId;
              publishedUrl = `https://x.com/i/status/${platformPostId}`;
            }
            break;
          }

          case "linkedin": {
            const linkedin = new LinkedInPublisher(connection.id);
            platformPostId = await linkedin.publish(
              post.content || post.title,
              metadata,
              uploadedMediaIds.length > 0 ? uploadedMediaIds : undefined
            );
            publishedUrl = `https://www.linkedin.com/feed/update/${platformPostId}`;
            break;
          }

          case "instagram": {
            // Instagram publishing requires the Graph API
            // (create container → publish container)
            // Stubbed for now — Instagram requires business account + page token
            throw new Error("Instagram publishing not yet implemented. Use Meta Business Suite API.");
          }

          case "facebook": {
            // Facebook page publishing via Graph API
            throw new Error("Facebook publishing not yet implemented. Use Meta Graph API.");
          }

          default:
            throw new Error(`Unsupported platform: ${post.platform}`);
        }

        // ── 2d. Mark as published ─────────────────────────
        await markPublished(post.id, platformPostId, publishedUrl);

        results.push({
          postId: post.id,
          platform: post.platform,
          status: "PUBLISHED",
          platformPostId,
        });

        emitPublished(post, platformPostId);

      } catch (err) {
        // ── 2e. Mark as failed ────────────────────────────
        const errorMessage = err instanceof Error ? err.message : String(err);

        await prisma.contentPost.update({
          where: { id: post.id },
          data: {
            status: "FAILED",
            errorMessage,
          },
        });

        results.push({
          postId: post.id,
          platform: post.platform,
          status: "FAILED",
          error: errorMessage,
        });

        daftarEvents.emitEvent("post.failed", {
          postId: post.id,
          platform: post.platform,
          brandId: post.brandId,
          error: errorMessage,
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Relay executor failed", message, timestamp: now.toISOString() },
      { status: 500 }
    );
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
}

// ─── Helpers ────────────────────────────────────────────

async function markPublished(
  postId: string,
  platformPostId: string,
  publishedUrl?: string
) {
  const now = new Date();

  await prisma.contentPost.update({
    where: { id: postId },
    data: {
      status: "PUBLISHED",
      publishedAt: now,
      platformPostId,
      publishedUrl: publishedUrl || null,
      errorMessage: null,
    },
  });

  // Initialize analytics row
  await prisma.postAnalytics.upsert({
    where: { postId },
    create: { postId },
    update: { lastSyncedAt: now },
  });
}

function emitPublished(
  post: { id: string; title: string; platform: string; brandId: string; createdById: string },
  platformPostId: string
) {
  daftarEvents.emitEvent("post.published", {
    postId: post.id,
    title: post.title,
    platform: post.platform,
    brandId: post.brandId,
    publishedById: post.createdById,
    platformPostId,
    publishedAt: new Date().toISOString(),
  });
}

/**
 * Split long content into tweet-sized chunks (280 chars).
 * Splits on paragraph breaks first, then sentence boundaries,
 * then hard-wraps as a last resort.
 */
function splitIntoTweets(content: string): string[] {
  const MAX_LEN = 280;

  if (content.length <= MAX_LEN) return [content];

  // Try splitting on double-newline (explicit thread markers)
  const paragraphs = content.split(/\n{2,}/).filter((p) => p.trim());
  if (paragraphs.length > 1 && paragraphs.every((p) => p.length <= MAX_LEN)) {
    return paragraphs;
  }

  // Fall back to sentence-level splitting
  const tweets: string[] = [];
  let current = "";

  const sentences = content.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if (sentence.length > MAX_LEN) {
      // Push current buffer if non-empty
      if (current.trim()) {
        tweets.push(current.trim());
        current = "";
      }
      // Hard-wrap the long sentence
      for (let i = 0; i < sentence.length; i += MAX_LEN) {
        tweets.push(sentence.slice(i, i + MAX_LEN));
      }
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= MAX_LEN) {
      current = candidate;
    } else {
      if (current.trim()) tweets.push(current.trim());
      current = sentence;
    }
  }

  if (current.trim()) tweets.push(current.trim());

  return tweets;
}

/**
 * Distribute media IDs across tweets in a thread.
 * Twitter allows up to 4 images per tweet.
 * If there are more media than tweets, stack on the first tweet.
 */
function distributeMedia(
  mediaIds: string[],
  tweetCount: number
): (string[] | undefined)[] {
  if (mediaIds.length === 0) return new Array(tweetCount).fill(undefined);

  const result: (string[] | undefined)[] = new Array(tweetCount).fill(undefined);

  if (mediaIds.length <= 4) {
    // All media on the first tweet
    result[0] = mediaIds;
  } else {
    // Distribute evenly, max 4 per tweet
    let mediaIdx = 0;
    for (let i = 0; i < tweetCount && mediaIdx < mediaIds.length; i++) {
      const chunk = mediaIds.slice(mediaIdx, mediaIdx + 4);
      if (chunk.length > 0) {
        result[i] = chunk;
        mediaIdx += chunk.length;
      }
    }
  }

  return result;
}
