/**
 * Facebook Publisher — Meta Graph API v19.0
 *
 * Supports:
 *  - Text + link posts to Facebook Pages (/{page-id}/feed)
 *  - Photo posts (/{page-id}/photos)
 *  - Reels / video posts (3-phase upload: start → binary upload → finish)
 *
 * Auth: Uses page access tokens stored in PlatformConnection.config.pageAccessToken.
 * Page tokens derived from long-lived user tokens are never-expiring.
 *
 * Ported from standalone Relay repo, adapted for Daftar's PlatformConnection model.
 *
 * Required env: META_APP_ID, META_APP_SECRET
 * Required scopes: pages_manage_posts, pages_read_engagement
 *
 * API Reference: https://developers.facebook.com/docs/pages-api/posts
 */

import { prisma } from "@/lib/prisma";
import { getMetaPageToken, handleMetaApiError } from "@/lib/relay/meta";

const META_GRAPH_URL = "https://graph.facebook.com/v19.0";

// ─── Types ──────────────────────────────────────────────

export interface FacebookPublishResult {
  success: boolean;
  platformPostId?: string;
  publishedUrl?: string;
  error?: string;
  platform: "facebook";
}

// ─── Text / Link Post ───────────────────────────────────

/**
 * Publish a text or link post to a Facebook Page.
 */
export async function publishToFacebook(
  connectionId: string,
  content: {
    message?: string;
    link?: string;
    imageUrl?: string;
    videoUrl?: string;
    postType?: "text" | "link" | "photo" | "video";
  }
): Promise<FacebookPublishResult> {
  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
  });

  if (!conn) {
    return {
      success: false,
      error: "Facebook connection not found. Please re-authenticate.",
      platform: "facebook",
    };
  }

  const pageToken = getMetaPageToken(conn);
  const pageId = conn.accountId;

  if (!pageId) {
    return {
      success: false,
      error: "No Facebook Page ID configured. Re-authenticate via OAuth.",
      platform: "facebook",
    };
  }

  try {
    // Photo post
    if (content.postType === "photo" && content.imageUrl) {
      const res = await fetch(`${META_GRAPH_URL}/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: content.imageUrl,
          caption: content.message || "",
          access_token: pageToken,
        }),
      });

      if (!res.ok) {
        const body = await handleMetaApiError(res, connectionId);
        return { success: false, error: `Facebook photo post failed: ${body}`, platform: "facebook" };
      }

      const data = await res.json();
      return {
        success: true,
        platformPostId: data.post_id || data.id,
        publishedUrl: `https://facebook.com/${data.post_id || data.id}`,
        platform: "facebook",
      };
    }

    // Video / Reel post — delegate to Reels API
    if ((content.postType === "video" && content.videoUrl) || content.videoUrl) {
      return publishFacebookReel(connectionId, {
        videoUrl: content.videoUrl!,
        description: content.message,
      });
    }

    // Text / link post
    const postData: Record<string, string> = {
      access_token: pageToken,
    };
    if (content.message) postData.message = content.message;
    if (content.link) postData.link = content.link;

    const res = await fetch(`${META_GRAPH_URL}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    if (!res.ok) {
      const body = await handleMetaApiError(res, connectionId);
      return { success: false, error: `Facebook post failed: ${body}`, platform: "facebook" };
    }

    const data = await res.json();
    return {
      success: true,
      platformPostId: data.id,
      publishedUrl: `https://facebook.com/${data.id}`,
      platform: "facebook",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      platform: "facebook",
    };
  }
}

// ─── Reels (Video) ──────────────────────────────────────

/**
 * Publish a Reel/video to Facebook using the 3-phase Reels upload API.
 *
 * Flow:
 *  1. POST /{page-id}/video_reels (upload_phase: start) → get video_id
 *  2. POST to rupload.facebook.com with binary video data
 *  3. POST /{page-id}/video_reels (upload_phase: finish) → publish
 */
export async function publishFacebookReel(
  connectionId: string,
  content: { videoUrl: string; description?: string }
): Promise<FacebookPublishResult> {
  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
  });

  if (!conn) {
    return { success: false, error: "Facebook connection not found.", platform: "facebook" };
  }

  const pageToken = getMetaPageToken(conn);
  const pageId = conn.accountId;

  if (!pageId) {
    return { success: false, error: "No Facebook Page ID configured.", platform: "facebook" };
  }

  try {
    // Download video from URL
    const videoRes = await fetch(content.videoUrl);
    if (!videoRes.ok) {
      return { success: false, error: `Failed to download video: ${videoRes.status}`, platform: "facebook" };
    }
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    // Phase 1: Start upload
    const startRes = await fetch(`${META_GRAPH_URL}/${pageId}/video_reels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "start",
        access_token: pageToken,
      }),
    });

    if (!startRes.ok) {
      const body = await handleMetaApiError(startRes, connectionId);
      return { success: false, error: `FB Reels start failed: ${body}`, platform: "facebook" };
    }

    const { video_id: videoId } = await startRes.json();

    // Phase 2: Upload binary
    const uploadRes = await fetch(
      `https://rupload.facebook.com/video-upload/v19.0/${videoId}`,
      {
        method: "POST",
        headers: {
          Authorization: `OAuth ${pageToken}`,
          "Content-Type": "application/octet-stream",
          offset: "0",
          file_size: String(videoBuffer.length),
        },
        body: videoBuffer,
      }
    );

    if (!uploadRes.ok) {
      const body = await uploadRes.text();
      return { success: false, error: `FB Reels binary upload failed: ${body}`, platform: "facebook" };
    }

    // Phase 3: Finish and publish
    const finishRes = await fetch(`${META_GRAPH_URL}/${pageId}/video_reels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "finish",
        video_id: videoId,
        video_state: "PUBLISHED",
        description: content.description || "",
        access_token: pageToken,
      }),
    });

    if (!finishRes.ok) {
      const body = await handleMetaApiError(finishRes, connectionId);
      return { success: false, error: `FB Reels finish failed: ${body}`, platform: "facebook" };
    }

    return {
      success: true,
      platformPostId: videoId,
      publishedUrl: `https://facebook.com/reel/${videoId}`,
      platform: "facebook",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      platform: "facebook",
    };
  }
}
