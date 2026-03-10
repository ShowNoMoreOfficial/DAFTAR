/**
 * Media Handler — Downloads from S3/URLs and uploads to social platforms.
 *
 * Social networks require media to be uploaded to their own servers
 * before referencing it in a post. This module:
 *
 *  1. Downloads a media file from an S3 URL (or any HTTP URL) to a Buffer
 *  2. Detects the MIME type from the URL or Content-Type header
 *  3. Provides platform-specific upload wrappers that call the correct
 *     chunked upload sequence for each network
 *
 * Supported platforms:
 *  - Twitter/X: v1.1 media upload (simple or chunked INIT/APPEND/FINALIZE)
 *  - YouTube:   Resumable upload via YouTube Data API v3
 *  - LinkedIn:  Image init + PUT binary upload
 */

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { TwitterPublisher } from "./twitter";
import { LinkedInPublisher } from "./linkedin";

// ─── S3 Client (lazy singleton) ─────────────────────────

let _s3: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return _s3;
}

// ─── MIME Detection ─────────────────────────────────────

const EXTENSION_MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".webm": "video/webm",
};

function guessMimeType(url: string, contentType?: string | null): string {
  if (contentType && contentType !== "application/octet-stream") {
    return contentType;
  }
  const pathPart = new URL(url).pathname;
  const ext = pathPart.substring(pathPart.lastIndexOf(".")).toLowerCase();
  return EXTENSION_MIME_MAP[ext] || "application/octet-stream";
}

// ─── Download ───────────────────────────────────────────

/**
 * Parse an S3 URL into bucket + key.
 * Supports:
 *  - s3://bucket/key
 *  - https://bucket.s3.region.amazonaws.com/key
 *  - https://s3.region.amazonaws.com/bucket/key
 */
function parseS3Url(url: string): { bucket: string; key: string } | null {
  // s3:// protocol
  if (url.startsWith("s3://")) {
    const [bucket, ...keyParts] = url.slice(5).split("/");
    return { bucket, key: keyParts.join("/") };
  }

  // Virtual-hosted style: https://bucket.s3.region.amazonaws.com/key
  const virtualMatch = url.match(
    /^https?:\/\/(.+?)\.s3[.-][\w-]+\.amazonaws\.com\/(.+)$/
  );
  if (virtualMatch) {
    return { bucket: virtualMatch[1], key: decodeURIComponent(virtualMatch[2]) };
  }

  // Path style: https://s3.region.amazonaws.com/bucket/key
  const pathMatch = url.match(
    /^https?:\/\/s3[.-][\w-]+\.amazonaws\.com\/([^/]+)\/(.+)$/
  );
  if (pathMatch) {
    return { bucket: pathMatch[1], key: decodeURIComponent(pathMatch[2]) };
  }

  return null;
}

/**
 * Download a file from S3 or a public HTTP URL into a Buffer.
 * Returns the buffer and detected MIME type.
 */
export async function downloadMedia(
  url: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const s3Info = parseS3Url(url);

  if (s3Info) {
    // Download from S3 using the SDK
    const s3 = getS3Client();
    const command = new GetObjectCommand({
      Bucket: s3Info.bucket,
      Key: s3Info.key,
    });

    const response = await s3.send(command);
    const bodyStream = response.Body;

    if (!bodyStream) {
      throw new Error(`S3 returned empty body for ${url}`);
    }

    // Convert the stream to a Buffer
    const chunks: Uint8Array[] = [];
    // @ts-expect-error — AWS SDK body is async iterable
    for await (const chunk of bodyStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const mimeType = guessMimeType(url, response.ContentType);

    return { buffer, mimeType };
  }

  // Fall back to HTTP fetch for non-S3 URLs
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download media from ${url}: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = guessMimeType(url, res.headers.get("content-type"));

  return { buffer, mimeType };
}

// ─── Platform Upload Wrappers ───────────────────────────

/**
 * Upload media to Twitter/X.
 * Uses the TwitterPublisher's upload method which handles
 * simple upload (images < 5MB) or chunked INIT/APPEND/FINALIZE
 * (videos, GIFs, or large images).
 *
 * Returns the media_id_string to attach to a tweet.
 */
export async function uploadToTwitter(
  connectionId: string,
  mediaUrl: string
): Promise<string> {
  const { buffer, mimeType } = await downloadMedia(mediaUrl);
  const publisher = new TwitterPublisher(connectionId);
  return publisher.uploadMedia(buffer, mimeType);
}

/**
 * Upload media to LinkedIn.
 * LinkedIn only supports image uploads through the REST API.
 * Video uploads require the Marketing API (separate permission).
 *
 * Returns the image URN (e.g., "urn:li:image:xxx").
 */
export async function uploadToLinkedIn(
  connectionId: string,
  mediaUrl: string
): Promise<string> {
  const { buffer, mimeType } = await downloadMedia(mediaUrl);

  if (!mimeType.startsWith("image/")) {
    throw new Error(
      `LinkedIn REST API only supports image uploads. Got: ${mimeType}. ` +
      `Video uploads require the LinkedIn Marketing API.`
    );
  }

  const publisher = new LinkedInPublisher(connectionId);
  const result = await publisher.uploadImage(buffer, mimeType);
  return result.imageUrn;
}

/**
 * Upload a video to YouTube via the Data API v3 resumable upload.
 *
 * Flow:
 *  1. POST to initiate a resumable upload session → get upload URI
 *  2. PUT the video binary to the upload URI in chunks
 *  3. Returns the YouTube video ID
 *
 * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and a valid
 * access token in PlatformConnection.
 */
export async function uploadToYouTube(
  connectionId: string,
  mediaUrl: string,
  title: string,
  description?: string,
  tags?: string[],
  privacyStatus: "public" | "unlisted" | "private" = "public"
): Promise<string> {
  const { buffer, mimeType } = await downloadMedia(mediaUrl);

  if (!mimeType.startsWith("video/")) {
    throw new Error(`YouTube only accepts video uploads. Got: ${mimeType}`);
  }

  // Get the connection for the access token
  const conn = await (await import("@/lib/prisma")).prisma.platformConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  if (!conn.accessToken) {
    throw new Error(`YouTube connection ${connectionId}: no access token`);
  }

  // Token refresh check
  if (conn.tokenExpiresAt && conn.tokenExpiresAt < new Date()) {
    if (!conn.refreshToken) {
      throw new Error(`YouTube connection ${connectionId}: token expired, no refresh token`);
    }
    const { refreshYouTubeToken } = await import("@/lib/relay/oauth-helpers");
    const refreshed = await refreshYouTubeToken(conn.refreshToken);

    await (await import("@/lib/prisma")).prisma.platformConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: refreshed.access_token,
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    });

    conn.accessToken = refreshed.access_token;
  }

  // Step 1: Initiate resumable upload
  const metadata = {
    snippet: {
      title,
      description: description || "",
      tags: tags || [],
      categoryId: "22", // People & Blogs (default)
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": buffer.length.toString(),
        "X-Upload-Content-Type": mimeType,
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const errBody = await initRes.text();
    throw new Error(`YouTube upload init ${initRes.status}: ${errBody}`);
  }

  const uploadUri = initRes.headers.get("location");
  if (!uploadUri) {
    throw new Error("YouTube upload init did not return a Location header");
  }

  // Step 2: Upload the video binary
  // For files < 64MB, single PUT is fine.
  // For larger files, chunked resumable upload would be needed.
  const CHUNK_SIZE = 16 * 1024 * 1024; // 16MB chunks

  if (buffer.length <= CHUNK_SIZE) {
    // Single-shot upload
    const uploadRes = await fetch(uploadUri, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${conn.accessToken}`,
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
      },
      body: new Uint8Array(buffer),
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      throw new Error(`YouTube video upload ${uploadRes.status}: ${errBody}`);
    }

    const videoData = await uploadRes.json();
    return videoData.id;
  }

  // Chunked resumable upload for large videos
  let offset = 0;
  let videoId = "";

  while (offset < buffer.length) {
    const end = Math.min(offset + CHUNK_SIZE, buffer.length);
    const chunk = buffer.subarray(offset, end);
    const isLast = end === buffer.length;

    const chunkRes = await fetch(uploadUri, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${conn.accessToken}`,
        "Content-Type": mimeType,
        "Content-Length": chunk.length.toString(),
        "Content-Range": `bytes ${offset}-${end - 1}/${buffer.length}`,
      },
      body: new Uint8Array(chunk),
    });

    if (isLast) {
      if (!chunkRes.ok) {
        const errBody = await chunkRes.text();
        throw new Error(`YouTube final chunk ${chunkRes.status}: ${errBody}`);
      }
      const videoData = await chunkRes.json();
      videoId = videoData.id;
    } else if (chunkRes.status !== 308) {
      // 308 Resume Incomplete is the expected response for non-final chunks
      const errBody = await chunkRes.text();
      throw new Error(`YouTube chunk upload unexpected ${chunkRes.status}: ${errBody}`);
    }

    offset = end;
  }

  return videoId;
}

// ─── Batch Upload Helper ────────────────────────────────

/**
 * Upload multiple media files for a single post.
 * Returns platform-specific media IDs/URNs.
 */
export async function uploadAllMedia(
  platform: string,
  connectionId: string,
  mediaUrls: string[]
): Promise<string[]> {
  if (!mediaUrls || mediaUrls.length === 0) return [];

  const results: string[] = [];

  for (const url of mediaUrls) {
    switch (platform) {
      case "x":
        results.push(await uploadToTwitter(connectionId, url));
        break;
      case "linkedin":
        results.push(await uploadToLinkedIn(connectionId, url));
        break;
      case "youtube":
        // YouTube videos are uploaded as the post itself, not as attachments.
        // This will be handled by the executor directly.
        throw new Error("YouTube media should be uploaded via uploadToYouTube(), not uploadAllMedia()");
      default:
        throw new Error(`Media upload not yet supported for platform: ${platform}`);
    }
  }

  return results;
}
