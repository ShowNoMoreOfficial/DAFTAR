/**
 * Shared publish executor — used by both the cron job and the immediate publish endpoint.
 *
 * Extracts the per-post publish logic so it can be called from:
 *  - POST /api/relay/posts/[id]/publish  (immediate publish)
 *  - GET  /api/cron/relay-executor       (scheduled cron)
 */

import { prisma } from "@/lib/prisma";
import { daftarEvents } from "@/lib/event-bus";
import { TwitterPublisher } from "@/lib/relay/publishers/twitter";
import { LinkedInPublisher } from "@/lib/relay/publishers/linkedin";
import { uploadAllMedia, uploadToYouTube } from "@/lib/relay/publishers/media-handler";
import { publishToInstagram } from "@/lib/relay/publishers/instagram";
import { publishToFacebook } from "@/lib/relay/publishers/facebook";

export interface PublishResult {
  status: "PUBLISHED" | "FAILED";
  platformPostId?: string;
  publishedUrl?: string;
  error?: string;
}

/**
 * Execute real publishing for a single ContentPost.
 *
 * 1. Marks the post as PUBLISHING
 * 2. Finds the PlatformConnection
 * 3. Uploads media
 * 4. Calls the platform-specific publisher
 * 5. Marks PUBLISHED or FAILED
 */
export async function executePublish(postId: string): Promise<PublishResult> {
  // Load the post
  const post = await prisma.contentPost.findUnique({ where: { id: postId } });
  if (!post) {
    return { status: "FAILED", error: `Post ${postId} not found` };
  }

  // Mark as PUBLISHING to prevent double-execution
  await prisma.contentPost.update({
    where: { id: postId },
    data: { status: "PUBLISHING" },
  });

  try {
    // Find the platform connection
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
        `${post.platform} connection has no access token. Re-authenticate via OAuth.`
      );
    }

    // Upload media if needed
    const mediaUrls = (post.mediaUrls as string[] | null) || [];
    const metadata = (post.metadata as Record<string, unknown> | null) || {};
    let uploadedMediaIds: string[] = [];

    // YouTube: video upload IS the publish
    if (post.platform === "youtube" && mediaUrls.length > 0) {
      const videoId = await uploadToYouTube(
        connection.id,
        mediaUrls[0],
        post.title,
        post.content || undefined,
        (metadata.tags as string[]) || undefined,
        (metadata.privacyStatus as "public" | "unlisted" | "private") || "public"
      );

      await markPublished(post.id, videoId, `https://youtube.com/watch?v=${videoId}`);
      emitPublished(post, videoId);

      return {
        status: "PUBLISHED",
        platformPostId: videoId,
        publishedUrl: `https://youtube.com/watch?v=${videoId}`,
      };
    }

    // For other platforms, upload media first
    if (mediaUrls.length > 0) {
      uploadedMediaIds = await uploadAllMedia(
        post.platform,
        connection.id,
        mediaUrls
      );
    }

    // Publish via the correct publisher
    let platformPostId: string;
    let publishedUrl: string | undefined;

    switch (post.platform) {
      case "x": {
        const twitter = new TwitterPublisher(connection.id);
        const content = post.content || post.title;

        const tweetTexts = splitIntoTweets(content);

        if (tweetTexts.length > 1) {
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
        const igContent: Parameters<typeof publishToInstagram>[1] = {
          caption: post.content || post.title,
        };

        if (mediaUrls.length > 1) {
          igContent.postType = "carousel";
          igContent.carouselUrls = mediaUrls;
        } else if (mediaUrls.length === 1) {
          const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(mediaUrls[0]);
          if (isVideo) {
            igContent.postType = "reel";
            igContent.videoUrl = mediaUrls[0];
          } else {
            igContent.postType = "image";
            igContent.imageUrl = mediaUrls[0];
          }
        }

        const igResult = await publishToInstagram(connection.id, igContent);
        if (!igResult.success) {
          throw new Error(igResult.error || "Instagram publish failed");
        }
        platformPostId = igResult.platformPostId!;
        publishedUrl = igResult.publishedUrl;
        break;
      }

      case "facebook": {
        const fbContent: Parameters<typeof publishToFacebook>[1] = {
          message: post.content || post.title,
        };

        if (mediaUrls.length > 0) {
          const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(mediaUrls[0]);
          if (isVideo) {
            fbContent.postType = "video";
            fbContent.videoUrl = mediaUrls[0];
          } else {
            fbContent.postType = "photo";
            fbContent.imageUrl = mediaUrls[0];
          }
        }

        if (metadata.link) {
          fbContent.link = metadata.link as string;
        }

        const fbResult = await publishToFacebook(connection.id, fbContent);
        if (!fbResult.success) {
          throw new Error(fbResult.error || "Facebook publish failed");
        }
        platformPostId = fbResult.platformPostId!;
        publishedUrl = fbResult.publishedUrl;
        break;
      }

      default:
        throw new Error(`Unsupported platform: ${post.platform}`);
    }

    // Mark as published
    await markPublished(post.id, platformPostId, publishedUrl);
    emitPublished(post, platformPostId);

    return { status: "PUBLISHED", platformPostId, publishedUrl };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    await prisma.contentPost.update({
      where: { id: postId },
      data: { status: "FAILED", errorMessage },
    });

    daftarEvents.emitEvent("post.failed", {
      postId: post.id,
      platform: post.platform,
      brandId: post.brandId,
      error: errorMessage,
    });

    return { status: "FAILED", error: errorMessage };
  }
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
export function splitIntoTweets(content: string): string[] {
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
      if (current.trim()) {
        tweets.push(current.trim());
        current = "";
      }
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
 */
export function distributeMedia(
  mediaIds: string[],
  tweetCount: number
): (string[] | undefined)[] {
  if (mediaIds.length === 0) return new Array(tweetCount).fill(undefined);

  const result: (string[] | undefined)[] = new Array(tweetCount).fill(undefined);

  if (mediaIds.length <= 4) {
    result[0] = mediaIds;
  } else {
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
