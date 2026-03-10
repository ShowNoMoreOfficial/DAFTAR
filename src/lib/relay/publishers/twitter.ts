/**
 * Twitter / X Publisher — X API v2 (native fetch, no SDK dependency)
 *
 * Uses OAuth 2.0 Bearer tokens stored in PlatformConnection.
 * Supports: single tweets, threads, media attachments.
 *
 * API Reference: https://developer.x.com/en/docs/x-api/tweets/manage-tweets
 */

import { prisma } from "@/lib/prisma";
import { refreshTwitterToken } from "@/lib/relay/oauth-helpers";

const X_API_BASE = "https://api.twitter.com/2";

// ─── Rate Limit Tracking ────────────────────────────────
// X API v2 allows 200 tweets per 15-min window per user.
// We track remaining calls and the reset timestamp to avoid
// hitting 429 errors mid-thread.

interface RateLimitState {
  remaining: number;
  resetAt: number; // epoch ms
}

const rateLimits = new Map<string, RateLimitState>();

function updateRateLimit(connectionId: string, headers: Headers) {
  const remaining = headers.get("x-rate-limit-remaining");
  const reset = headers.get("x-rate-limit-reset");
  if (remaining !== null && reset !== null) {
    rateLimits.set(connectionId, {
      remaining: parseInt(remaining, 10),
      resetAt: parseInt(reset, 10) * 1000,
    });
  }
}

function checkRateLimit(connectionId: string): { ok: boolean; retryAfterMs?: number } {
  const state = rateLimits.get(connectionId);
  if (!state) return { ok: true };
  if (state.remaining > 0) return { ok: true };
  const now = Date.now();
  if (now >= state.resetAt) {
    rateLimits.delete(connectionId);
    return { ok: true };
  }
  return { ok: false, retryAfterMs: state.resetAt - now };
}

// ─── Token Management ───────────────────────────────────

interface TokenPair {
  accessToken: string;
  connectionId: string;
}

async function getValidToken(connectionId: string): Promise<TokenPair> {
  const conn = await prisma.platformConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  // If the token hasn't expired, use it directly
  if (conn.tokenExpiresAt && conn.tokenExpiresAt > new Date()) {
    return { accessToken: conn.accessToken!, connectionId };
  }

  // Token expired or no expiry set — attempt refresh
  if (!conn.refreshToken) {
    throw new Error(`Twitter connection ${connectionId}: no refresh token available, re-authentication required`);
  }

  const result = await refreshTwitterToken(conn.refreshToken);

  if (!result.access_token) {
    throw new Error(`Twitter token refresh failed for connection ${connectionId}`);
  }

  // Persist the new tokens
  await prisma.platformConnection.update({
    where: { id: connectionId },
    data: {
      accessToken: result.access_token,
      refreshToken: result.refresh_token ?? conn.refreshToken,
      tokenExpiresAt: new Date(Date.now() + result.expires_in * 1000),
    },
  });

  return { accessToken: result.access_token, connectionId };
}

// ─── Core API Calls ─────────────────────────────────────

interface TweetResponse {
  data: {
    id: string;
    text: string;
  };
}

interface TweetPayload {
  text: string;
  reply?: { in_reply_to_tweet_id: string };
  media?: { media_ids: string[] };
}

async function postTweet(
  token: TokenPair,
  payload: TweetPayload
): Promise<TweetResponse> {
  const rl = checkRateLimit(token.connectionId);
  if (!rl.ok) {
    throw new Error(
      `Twitter rate limit exceeded. Retry after ${Math.ceil((rl.retryAfterMs || 0) / 1000)}s`
    );
  }

  const res = await fetch(`${X_API_BASE}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  updateRateLimit(token.connectionId, res.headers);

  if (!res.ok) {
    const errorBody = await res.text();
    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after");
      throw new Error(
        `Twitter 429 rate limited. Retry-After: ${retryAfter || "unknown"}s. Body: ${errorBody}`
      );
    }
    throw new Error(`Twitter API ${res.status}: ${errorBody}`);
  }

  return res.json();
}

// ─── Public Interface ───────────────────────────────────

export class TwitterPublisher {
  private connectionId: string;

  constructor(connectionId: string) {
    this.connectionId = connectionId;
  }

  /**
   * Publish a single tweet.
   * Returns the platform tweet ID.
   */
  async publishTweet(
    text: string,
    mediaIds?: string[]
  ): Promise<{ tweetId: string; text: string }> {
    const token = await getValidToken(this.connectionId);

    const payload: TweetPayload = { text };
    if (mediaIds && mediaIds.length > 0) {
      payload.media = { media_ids: mediaIds };
    }

    const result = await postTweet(token, payload);
    return { tweetId: result.data.id, text: result.data.text };
  }

  /**
   * Publish a thread (array of tweet texts).
   * Each subsequent tweet is a reply to the previous one.
   * Media IDs, if provided, are attached to the corresponding index.
   *
   * Returns the ID of the first tweet (thread head) and all tweet IDs.
   */
  async publishThread(
    contentArray: string[],
    mediaIds?: (string[] | undefined)[]
  ): Promise<{ threadHeadId: string; tweetIds: string[] }> {
    if (contentArray.length === 0) {
      throw new Error("Thread must contain at least one tweet");
    }

    const token = await getValidToken(this.connectionId);
    const tweetIds: string[] = [];
    let previousTweetId: string | null = null;

    for (let i = 0; i < contentArray.length; i++) {
      const payload: TweetPayload = { text: contentArray[i] };

      // Chain as replies after the first tweet
      if (previousTweetId) {
        payload.reply = { in_reply_to_tweet_id: previousTweetId };
      }

      // Attach media if provided for this index
      const tweetMediaIds = mediaIds?.[i];
      if (tweetMediaIds && tweetMediaIds.length > 0) {
        payload.media = { media_ids: tweetMediaIds };
      }

      const result = await postTweet(token, payload);
      tweetIds.push(result.data.id);
      previousTweetId = result.data.id;

      // Small delay between thread tweets to avoid rapid-fire rate limits
      if (i < contentArray.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return { threadHeadId: tweetIds[0], tweetIds };
  }

  /**
   * Delete a tweet by ID (cleanup on failure, etc.)
   */
  async deleteTweet(tweetId: string): Promise<void> {
    const token = await getValidToken(this.connectionId);

    const res = await fetch(`${X_API_BASE}/tweets/${tweetId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    if (!res.ok && res.status !== 404) {
      const errorBody = await res.text();
      throw new Error(`Twitter delete ${res.status}: ${errorBody}`);
    }
  }

  /**
   * Upload media using the v1.1 media upload endpoint.
   * X API v2 still requires v1.1 for media uploads.
   * Returns the media_id_string for use in tweet payloads.
   *
   * For images: simple upload (< 5MB)
   * For video/GIF: uses chunked INIT → APPEND → FINALIZE flow
   * (see media-handler.ts for the chunked implementation)
   */
  async uploadMedia(
    mediaBuffer: Buffer,
    mimeType: string
  ): Promise<string> {
    const token = await getValidToken(this.connectionId);
    const isChunked = mimeType.startsWith("video/") || mimeType === "image/gif";

    if (isChunked) {
      return this.chunkedUpload(token.accessToken, mediaBuffer, mimeType);
    }

    // Simple upload for images
    const formData = new FormData();
    formData.append("media_data", mediaBuffer.toString("base64"));
    formData.append("media_category", "tweet_image");

    const res = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Twitter media upload ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    return data.media_id_string;
  }

  /**
   * Chunked upload for video/GIF (INIT → APPEND → FINALIZE).
   * Twitter requires this for media > 5MB or video content.
   */
  private async chunkedUpload(
    accessToken: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<string> {
    const UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const mediaCategory = mimeType.startsWith("video/") ? "tweet_video" : "tweet_gif";

    // INIT
    const initParams = new URLSearchParams({
      command: "INIT",
      total_bytes: buffer.length.toString(),
      media_type: mimeType,
      media_category: mediaCategory,
    });

    const initRes = await fetch(`${UPLOAD_URL}?${initParams}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!initRes.ok) {
      throw new Error(`Twitter chunked INIT ${initRes.status}: ${await initRes.text()}`);
    }

    const { media_id_string } = await initRes.json();

    // APPEND — send chunks
    let segmentIndex = 0;
    for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
      const chunk = buffer.subarray(offset, offset + CHUNK_SIZE);
      const form = new FormData();
      form.append("command", "APPEND");
      form.append("media_id", media_id_string);
      form.append("segment_index", segmentIndex.toString());
      form.append("media_data", chunk.toString("base64"));

      const appendRes = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });

      if (!appendRes.ok) {
        throw new Error(
          `Twitter chunked APPEND segment ${segmentIndex}: ${appendRes.status} ${await appendRes.text()}`
        );
      }

      segmentIndex++;
    }

    // FINALIZE
    const finalizeParams = new URLSearchParams({
      command: "FINALIZE",
      media_id: media_id_string,
    });

    const finalizeRes = await fetch(`${UPLOAD_URL}?${finalizeParams}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!finalizeRes.ok) {
      throw new Error(`Twitter chunked FINALIZE ${finalizeRes.status}: ${await finalizeRes.text()}`);
    }

    const finalizeData = await finalizeRes.json();

    // For video, wait for processing to complete
    if (finalizeData.processing_info) {
      await this.waitForProcessing(accessToken, media_id_string);
    }

    return media_id_string;
  }

  /**
   * Poll STATUS until async processing completes (for video uploads).
   */
  private async waitForProcessing(
    accessToken: string,
    mediaId: string,
    maxAttempts = 30
  ): Promise<void> {
    const UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusParams = new URLSearchParams({
        command: "STATUS",
        media_id: mediaId,
      });

      const res = await fetch(`${UPLOAD_URL}?${statusParams}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Twitter media STATUS ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const info = data.processing_info;

      if (!info || info.state === "succeeded") return;
      if (info.state === "failed") {
        throw new Error(`Twitter media processing failed: ${JSON.stringify(info.error)}`);
      }

      // Wait the recommended time before checking again
      const waitSeconds = info.check_after_secs || 5;
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    }

    throw new Error("Twitter media processing timed out");
  }
}
