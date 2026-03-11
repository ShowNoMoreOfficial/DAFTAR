/**
 * Instagram Publisher — Instagram Graph API (via Meta Business Platform)
 *
 * Status: STUB — OAuth flow is ready (see oauth-helpers.ts) but
 * publishing endpoints are not yet implemented.
 *
 * Once META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI env vars
 * are configured:
 *  1. Authenticate via the Instagram OAuth flow
 *  2. Use Graph API to create media containers
 *  3. Publish containers
 *
 * Required scopes: instagram_basic, instagram_content_publish,
 *   pages_show_list, pages_read_engagement
 *
 * API Reference:
 *   https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────

export interface InstagramPublishResult {
  success: false;
  error: string;
  platform: "instagram";
  status: "not_configured";
}

// ─── Publish ────────────────────────────────────────────

/**
 * Publish a post to Instagram.
 *
 * Currently returns a "not configured" error.
 * To implement, add the Media Container → Publish flow:
 *   POST /{ig-user-id}/media  (create container)
 *   POST /{ig-user-id}/media_publish  (publish container)
 */
export async function publishToInstagram(
  connectionId: string,
  _content: {
    caption?: string;
    imageUrl?: string;
    videoUrl?: string;
    carouselUrls?: string[];
    postType?: "image" | "video" | "carousel" | "reel";
  }
): Promise<InstagramPublishResult> {
  // Verify connection exists
  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
  });

  if (!conn || !conn.accessToken) {
    return {
      success: false,
      error: "Instagram connection not found or missing access token. Please re-authenticate.",
      platform: "instagram",
      status: "not_configured",
    };
  }

  // TODO: Implement Instagram Graph API publishing
  // 1. Create media container via POST /{ig-user-id}/media
  // 2. Check container status via GET /{container-id}?fields=status_code
  // 3. Publish via POST /{ig-user-id}/media_publish
  return {
    success: false,
    error: "Instagram publishing is not yet configured. Set META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI environment variables.",
    platform: "instagram",
    status: "not_configured",
  };
}

/**
 * Publish a Story to Instagram.
 */
export async function publishInstagramStory(
  connectionId: string,
  _content: { imageUrl?: string; videoUrl?: string }
): Promise<InstagramPublishResult> {
  void connectionId;
  return {
    success: false,
    error: "Instagram Story publishing is not yet configured.",
    platform: "instagram",
    status: "not_configured",
  };
}

/**
 * Publish a Reel to Instagram.
 */
export async function publishInstagramReel(
  connectionId: string,
  _content: { videoUrl: string; caption?: string; coverUrl?: string }
): Promise<InstagramPublishResult> {
  void connectionId;
  return {
    success: false,
    error: "Instagram Reel publishing is not yet configured.",
    platform: "instagram",
    status: "not_configured",
  };
}
