/**
 * Facebook Publisher — Facebook Graph API (via Meta Business Platform)
 *
 * Status: STUB — OAuth flow is shared with Instagram (see oauth-helpers.ts)
 * but publishing endpoints are not yet implemented.
 *
 * Once META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI env vars
 * are configured:
 *  1. Authenticate via the Meta OAuth flow
 *  2. Use Page token to post to Facebook Pages
 *
 * Required scopes: pages_manage_posts, pages_read_engagement
 *
 * API Reference:
 *   https://developers.facebook.com/docs/pages-api/posts
 */

import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────

export interface FacebookPublishResult {
  success: false;
  error: string;
  platform: "facebook";
  status: "not_configured";
}

// ─── Publish ────────────────────────────────────────────

/**
 * Publish a post to a Facebook Page.
 *
 * Currently returns a "not configured" error.
 * To implement, use the Page Posts API:
 *   POST /{page-id}/feed  (text + link posts)
 *   POST /{page-id}/photos  (photo posts)
 *   POST /{page-id}/videos  (video posts)
 */
export async function publishToFacebook(
  connectionId: string,
  _content: {
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

  if (!conn || !conn.accessToken) {
    return {
      success: false,
      error: "Facebook connection not found or missing access token. Please re-authenticate.",
      platform: "facebook",
      status: "not_configured",
    };
  }

  // TODO: Implement Facebook Graph API publishing
  // 1. Get page access token from user token
  // 2. POST /{page-id}/feed for text/link posts
  // 3. POST /{page-id}/photos for image posts
  // 4. POST /{page-id}/videos for video posts
  return {
    success: false,
    error: "Facebook publishing is not yet configured. Set META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI environment variables.",
    platform: "facebook",
    status: "not_configured",
  };
}

/**
 * Publish a Reel to Facebook.
 */
export async function publishFacebookReel(
  connectionId: string,
  _content: { videoUrl: string; description?: string }
): Promise<FacebookPublishResult> {
  void connectionId;
  return {
    success: false,
    error: "Facebook Reel publishing is not yet configured.",
    platform: "facebook",
    status: "not_configured",
  };
}
