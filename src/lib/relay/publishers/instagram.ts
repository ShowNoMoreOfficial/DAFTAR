/**
 * Instagram Publisher — Meta Graph API v19.0
 *
 * Supports:
 *  - Image posts (single image via public URL)
 *  - Reels (video via public URL + container polling)
 *  - Carousel posts (multiple images/videos)
 *
 * Auth: Uses page access tokens stored in PlatformConnection.config.pageAccessToken.
 * The IG Business Account ID is stored in PlatformConnection.accountId.
 *
 * Ported from standalone Relay repo, adapted for Daftar's PlatformConnection model.
 *
 * Required env: META_APP_ID, META_APP_SECRET
 * Required scopes: instagram_basic, instagram_content_publish,
 *   pages_show_list, pages_read_engagement
 *
 * API Reference:
 *   https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

import { prisma } from "@/lib/prisma";
import { getMetaPageToken, handleMetaApiError } from "@/lib/relay/meta";

const META_GRAPH_URL = "https://graph.facebook.com/v19.0";

// ─── Types ──────────────────────────────────────────────

export interface InstagramPublishResult {
  success: boolean;
  platformPostId?: string;
  publishedUrl?: string;
  error?: string;
  platform: "instagram";
}

// ─── Image Post ─────────────────────────────────────────

/**
 * Publish a post to Instagram.
 *
 * For images: Creates a container with image_url → publishes immediately.
 * For videos/reels: Creates a container with video_url → polls until processed → publishes.
 * For carousels: Creates child containers → creates carousel container → publishes.
 */
export async function publishToInstagram(
  connectionId: string,
  content: {
    caption?: string;
    imageUrl?: string;
    videoUrl?: string;
    carouselUrls?: string[];
    postType?: "image" | "video" | "carousel" | "reel";
  }
): Promise<InstagramPublishResult> {
  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
  });

  if (!conn) {
    return { success: false, error: "Instagram connection not found.", platform: "instagram" };
  }

  const pageToken = getMetaPageToken(conn);
  const igUserId = conn.accountId;

  if (!igUserId) {
    return {
      success: false,
      error: "No Instagram Business Account ID configured. Re-authenticate via Facebook OAuth.",
      platform: "instagram",
    };
  }

  try {
    // Carousel post
    if (content.postType === "carousel" && content.carouselUrls?.length) {
      return publishCarousel(connectionId, igUserId, pageToken, content.caption || "", content.carouselUrls);
    }

    // Reel / video post
    if ((content.postType === "reel" || content.postType === "video") && content.videoUrl) {
      return publishInstagramReel(connectionId, {
        videoUrl: content.videoUrl,
        caption: content.caption,
      });
    }

    // Image post
    if (content.imageUrl) {
      const createRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: content.imageUrl,
          caption: content.caption || "",
          access_token: pageToken,
        }),
      });

      if (!createRes.ok) {
        const body = await handleMetaApiError(createRes, connectionId);
        return { success: false, error: `IG image container failed: ${body}`, platform: "instagram" };
      }

      const { id: creationId } = await createRes.json();

      // Images are usually ready immediately, but poll just in case
      await pollContainerStatus(creationId, pageToken);

      const publishRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: pageToken,
        }),
      });

      if (!publishRes.ok) {
        const body = await handleMetaApiError(publishRes, connectionId);
        return { success: false, error: `IG publish failed: ${body}`, platform: "instagram" };
      }

      const { id: mediaId } = await publishRes.json();
      return {
        success: true,
        platformPostId: mediaId,
        publishedUrl: `https://instagram.com/p/${mediaId}`,
        platform: "instagram",
      };
    }

    return { success: false, error: "No image or video URL provided.", platform: "instagram" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      platform: "instagram",
    };
  }
}

// ─── Story ──────────────────────────────────────────────

/**
 * Publish a Story to Instagram.
 */
export async function publishInstagramStory(
  connectionId: string,
  content: { imageUrl?: string; videoUrl?: string }
): Promise<InstagramPublishResult> {
  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
  });

  if (!conn) {
    return { success: false, error: "Instagram connection not found.", platform: "instagram" };
  }

  const pageToken = getMetaPageToken(conn);
  const igUserId = conn.accountId;

  if (!igUserId) {
    return { success: false, error: "No IG Business Account ID.", platform: "instagram" };
  }

  try {
    const mediaData: Record<string, string> = {
      media_type: "STORIES",
      access_token: pageToken,
    };

    if (content.videoUrl) {
      mediaData.video_url = content.videoUrl;
    } else if (content.imageUrl) {
      mediaData.image_url = content.imageUrl;
    } else {
      return { success: false, error: "No image or video URL for Story.", platform: "instagram" };
    }

    const createRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mediaData),
    });

    if (!createRes.ok) {
      const body = await handleMetaApiError(createRes, connectionId);
      return { success: false, error: `IG Story container failed: ${body}`, platform: "instagram" };
    }

    const { id: creationId } = await createRes.json();
    await pollContainerStatus(creationId, pageToken);

    const publishRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: creationId, access_token: pageToken }),
    });

    if (!publishRes.ok) {
      const body = await handleMetaApiError(publishRes, connectionId);
      return { success: false, error: `IG Story publish failed: ${body}`, platform: "instagram" };
    }

    const { id: mediaId } = await publishRes.json();
    return { success: true, platformPostId: mediaId, platform: "instagram" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), platform: "instagram" };
  }
}

// ─── Reel ───────────────────────────────────────────────

/**
 * Publish a Reel to Instagram.
 *
 * Flow:
 *  1. Create media container with media_type=REELS + video_url (must be publicly accessible)
 *  2. Poll container status until FINISHED
 *  3. Publish the container
 */
export async function publishInstagramReel(
  connectionId: string,
  content: { videoUrl: string; caption?: string; coverUrl?: string }
): Promise<InstagramPublishResult> {
  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
  });

  if (!conn) {
    return { success: false, error: "Instagram connection not found.", platform: "instagram" };
  }

  const pageToken = getMetaPageToken(conn);
  const igUserId = conn.accountId;

  if (!igUserId) {
    return { success: false, error: "No IG Business Account ID.", platform: "instagram" };
  }

  try {
    // 1. Create media container
    const containerData: Record<string, string> = {
      media_type: "REELS",
      video_url: content.videoUrl,
      caption: content.caption || "",
      access_token: pageToken,
    };
    if (content.coverUrl) {
      containerData.cover_url = content.coverUrl;
    }

    const createRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(containerData),
    });

    if (!createRes.ok) {
      const body = await handleMetaApiError(createRes, connectionId);
      return { success: false, error: `IG Reel container failed: ${body}`, platform: "instagram" };
    }

    const { id: creationId } = await createRes.json();

    // 2. Poll until ready
    await pollContainerStatus(creationId, pageToken);

    // 3. Publish
    const publishRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: pageToken,
      }),
    });

    if (!publishRes.ok) {
      const body = await handleMetaApiError(publishRes, connectionId);
      return { success: false, error: `IG Reel publish failed: ${body}`, platform: "instagram" };
    }

    const { id: mediaId } = await publishRes.json();
    return {
      success: true,
      platformPostId: mediaId,
      publishedUrl: `https://instagram.com/reel/${mediaId}`,
      platform: "instagram",
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), platform: "instagram" };
  }
}

// ─── Carousel ───────────────────────────────────────────

async function publishCarousel(
  connectionId: string,
  igUserId: string,
  pageToken: string,
  caption: string,
  urls: string[]
): Promise<InstagramPublishResult> {
  try {
    // Create child containers
    const childIds: string[] = [];
    for (const url of urls.slice(0, 10)) { // IG carousel max 10 items
      const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(url);
      const childData: Record<string, string> = {
        is_carousel_item: "true",
        access_token: pageToken,
      };
      if (isVideo) {
        childData.media_type = "VIDEO";
        childData.video_url = url;
      } else {
        childData.image_url = url;
      }

      const res = await fetch(`${META_GRAPH_URL}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(childData),
      });

      if (!res.ok) {
        const body = await handleMetaApiError(res, connectionId);
        return { success: false, error: `IG carousel child failed: ${body}`, platform: "instagram" };
      }

      const { id } = await res.json();
      await pollContainerStatus(id, pageToken);
      childIds.push(id);
    }

    // Create carousel container
    const carouselRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: childIds.join(","),
        caption,
        access_token: pageToken,
      }),
    });

    if (!carouselRes.ok) {
      const body = await handleMetaApiError(carouselRes, connectionId);
      return { success: false, error: `IG carousel container failed: ${body}`, platform: "instagram" };
    }

    const { id: carouselId } = await carouselRes.json();

    // Publish
    const publishRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: carouselId, access_token: pageToken }),
    });

    if (!publishRes.ok) {
      const body = await handleMetaApiError(publishRes, connectionId);
      return { success: false, error: `IG carousel publish failed: ${body}`, platform: "instagram" };
    }

    const { id: mediaId } = await publishRes.json();
    return {
      success: true,
      platformPostId: mediaId,
      publishedUrl: `https://instagram.com/p/${mediaId}`,
      platform: "instagram",
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), platform: "instagram" };
  }
}

// ─── Container Polling ──────────────────────────────────

/**
 * Poll IG container status until FINISHED or ERROR.
 *
 * Uses exponential backoff: 2s → 3s → 4.5s → ... capped at 10s.
 * Max wait ~4 minutes (24 attempts) to stay within Vercel's 5-min limit.
 */
async function pollContainerStatus(containerId: string, accessToken: string) {
  const maxAttempts = 24;
  let delay = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${META_GRAPH_URL}/${containerId}?fields=status_code,status&access_token=${accessToken}`
    );
    const data = await res.json();

    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") {
      throw new Error(
        `IG container processing failed: ${data.status || JSON.stringify(data)}`
      );
    }

    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 10000);
  }

  throw new Error(
    "IG container processing timed out (~4 min). For large videos, use scheduled publishing."
  );
}
