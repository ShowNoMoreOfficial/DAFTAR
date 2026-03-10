/**
 * LinkedIn Publisher — LinkedIn Marketing / Community Management API
 *
 * Supports:
 *  - Text posts (personal profiles and company pages)
 *  - URL/article attachments
 *  - Image posts (via pre-registered image upload)
 *
 * API Reference: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares
 *
 * URN formats:
 *  - Personal profile: "urn:li:person:{id}"
 *  - Company page:     "urn:li:organization:{id}"
 *
 * The accountId stored in PlatformConnection should be the raw ID.
 * The config JSON can specify { "type": "organization" | "person" }
 * to determine which URN format to use. Defaults to "organization"
 * for brand accounts.
 */

import { prisma } from "@/lib/prisma";

const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";

// ─── Types ──────────────────────────────────────────────

interface LinkedInConnection {
  accessToken: string;
  authorUrn: string;
  connectionId: string;
}

interface LinkedInPostResult {
  postId: string;
  postUrn: string;
}

interface LinkedInImageUploadResult {
  imageUrn: string;
}

interface PostConfig {
  type?: "organization" | "person";
  [key: string]: unknown;
}

// ─── Token & Connection ─────────────────────────────────

async function getConnection(connectionId: string): Promise<LinkedInConnection> {
  const conn = await prisma.platformConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  if (!conn.accessToken) {
    throw new Error(`LinkedIn connection ${connectionId}: no access token, re-authentication required`);
  }

  if (!conn.accountId) {
    throw new Error(`LinkedIn connection ${connectionId}: no accountId configured`);
  }

  // LinkedIn access tokens are long-lived (60 days) and don't have a
  // standard refresh flow for the Community Management API.
  // If tokenExpiresAt is set and expired, flag it.
  if (conn.tokenExpiresAt && conn.tokenExpiresAt < new Date()) {
    throw new Error(
      `LinkedIn connection ${connectionId}: access token expired at ${conn.tokenExpiresAt.toISOString()}. ` +
      `Re-authenticate via OAuth to get a new token.`
    );
  }

  // Determine URN type from config
  const config = (conn.config as PostConfig) || {};
  const urnType = config.type || "organization";
  const authorUrn = `urn:li:${urnType}:${conn.accountId}`;

  return {
    accessToken: conn.accessToken,
    authorUrn,
    connectionId,
  };
}

// ─── LinkedIn API Headers ───────────────────────────────

function buildHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": "202401",
  };
}

// ─── Core API Calls ─────────────────────────────────────

async function linkedInFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${LINKEDIN_API_BASE}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(accessToken),
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`LinkedIn API ${res.status} ${path}: ${errorBody}`);
  }

  return res;
}

// ─── Public Interface ───────────────────────────────────

export class LinkedInPublisher {
  private connectionId: string;

  constructor(connectionId: string) {
    this.connectionId = connectionId;
  }

  /**
   * Publish a text-only post.
   * Returns the platform post ID and URN.
   */
  async publishText(text: string): Promise<LinkedInPostResult> {
    const conn = await getConnection(this.connectionId);

    const payload = {
      author: conn.authorUrn,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
    };

    const res = await linkedInFetch(conn.accessToken, "/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // LinkedIn returns the post URN in the x-restli-id header
    const postUrn = res.headers.get("x-restli-id") || "";
    const postId = postUrn.split(":").pop() || postUrn;

    return { postId, postUrn };
  }

  /**
   * Publish a post with a URL/article attachment.
   * LinkedIn will auto-generate a preview card for the URL.
   */
  async publishWithUrl(
    text: string,
    articleUrl: string,
    articleTitle?: string,
    articleDescription?: string
  ): Promise<LinkedInPostResult> {
    const conn = await getConnection(this.connectionId);

    const payload = {
      author: conn.authorUrn,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        article: {
          source: articleUrl,
          title: articleTitle || undefined,
          description: articleDescription || undefined,
        },
      },
      lifecycleState: "PUBLISHED",
    };

    const res = await linkedInFetch(conn.accessToken, "/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const postUrn = res.headers.get("x-restli-id") || "";
    const postId = postUrn.split(":").pop() || postUrn;

    return { postId, postUrn };
  }

  /**
   * Publish a post with an image.
   * The image must be uploaded first via uploadImage(), then its URN
   * is passed here.
   */
  async publishWithImage(
    text: string,
    imageUrn: string,
    altText?: string
  ): Promise<LinkedInPostResult> {
    const conn = await getConnection(this.connectionId);

    const payload = {
      author: conn.authorUrn,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        media: {
          id: imageUrn,
          title: altText || "Image",
        },
      },
      lifecycleState: "PUBLISHED",
    };

    const res = await linkedInFetch(conn.accessToken, "/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const postUrn = res.headers.get("x-restli-id") || "";
    const postId = postUrn.split(":").pop() || postUrn;

    return { postId, postUrn };
  }

  /**
   * Upload an image to LinkedIn for use in a post.
   *
   * Flow:
   *  1. Initialize upload — get the upload URL from LinkedIn
   *  2. PUT the image binary to the upload URL
   *  3. Return the image URN for use in publishWithImage()
   */
  async uploadImage(
    imageBuffer: Buffer,
    _mimeType: string
  ): Promise<LinkedInImageUploadResult> {
    const conn = await getConnection(this.connectionId);

    // Step 1: Initialize upload
    const initPayload = {
      initializeUploadRequest: {
        owner: conn.authorUrn,
      },
    };

    const initRes = await linkedInFetch(conn.accessToken, "/images?action=initializeUpload", {
      method: "POST",
      body: JSON.stringify(initPayload),
    });

    const initData = await initRes.json();
    const uploadUrl: string = initData.value.uploadUrl;
    const imageUrn: string = initData.value.image;

    // Step 2: Upload the binary
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${conn.accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(imageBuffer),
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      throw new Error(`LinkedIn image upload PUT ${uploadRes.status}: ${errBody}`);
    }

    return { imageUrn };
  }

  /**
   * Delete a post by URN.
   */
  async deletePost(postUrn: string): Promise<void> {
    const conn = await getConnection(this.connectionId);

    const encodedUrn = encodeURIComponent(postUrn);
    await linkedInFetch(conn.accessToken, `/posts/${encodedUrn}`, {
      method: "DELETE",
    });
  }

  /**
   * Convenience method for the Relay executor.
   * Takes the ContentPost content and metadata, decides the right
   * publish method, and returns the platformPostId.
   */
  async publish(
    content: string,
    metadata?: Record<string, unknown> | null,
    mediaUrns?: string[]
  ): Promise<string> {
    const articleUrl = metadata?.articleUrl as string | undefined;
    const articleTitle = metadata?.articleTitle as string | undefined;
    const articleDescription = metadata?.articleDescription as string | undefined;

    if (mediaUrns && mediaUrns.length > 0) {
      const result = await this.publishWithImage(content, mediaUrns[0], articleTitle);
      return result.postId;
    }

    if (articleUrl) {
      const result = await this.publishWithUrl(content, articleUrl, articleTitle, articleDescription);
      return result.postId;
    }

    const result = await this.publishText(content);
    return result.postId;
  }
}
