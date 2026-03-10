import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import path from "path";

const BUCKET = process.env.S3_BUCKET!;
const REGION = process.env.S3_REGION || "auto";
const ENDPOINT = process.env.S3_ENDPOINT; // e.g. Cloudflare R2 endpoint
const PUBLIC_URL_BASE = process.env.S3_PUBLIC_URL; // CDN / public bucket URL

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // required for R2 / MinIO
});

/**
 * Build a unique object key preserving the original extension.
 * Format: `{folder}/{uuid}{ext}`
 */
function buildKey(filename: string, folder = "uploads"): string {
  const ext = path.extname(filename).toLowerCase();
  return `${folder}/${randomUUID()}${ext}`;
}

/**
 * Generate a presigned PUT URL for direct client-side uploads.
 * Returns the key and URL — the client PUTs the file body to the URL.
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  folder = "uploads",
  expiresIn = 600 // 10 minutes
): Promise<{ key: string; url: string; publicUrl: string }> {
  const key = buildKey(filename, folder);

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn });
  const publicUrl = PUBLIC_URL_BASE
    ? `${PUBLIC_URL_BASE.replace(/\/$/, "")}/${key}`
    : url.split("?")[0];

  return { key, url, publicUrl };
}

/**
 * Upload a Buffer directly from the server (e.g. AI-generated images).
 * Returns the stored key and public URL.
 */
export async function uploadBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder = "uploads"
): Promise<{ key: string; publicUrl: string }> {
  const key = buildKey(filename, folder);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicUrl = PUBLIC_URL_BASE
    ? `${PUBLIC_URL_BASE.replace(/\/$/, "")}/${key}`
    : `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return { key, publicUrl };
}

/**
 * Delete a file by its object key.
 */
export async function deleteFile(fileKey: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
    })
  );
}

/**
 * Generate a presigned GET URL for private files.
 */
export async function getPresignedDownloadUrl(
  fileKey: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

export { s3, BUCKET };
