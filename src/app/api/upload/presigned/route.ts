import { NextRequest, NextResponse } from "next/server";
import { badRequest } from "@/lib/api-utils";
import { getPresignedUploadUrl } from "@/lib/storage/s3-client";
import { apiHandler } from "@/lib/api-handler";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "application/pdf",
]);

/**
 * POST /api/upload/presigned
 * Body: { filename: string, contentType: string, size: number, folder?: string }
 * Returns: { key, url, publicUrl }
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { filename, contentType, size, folder } = body;

  if (!filename || !contentType) {
    return badRequest("filename and contentType are required");
  }

  if (typeof size === "number" && size > MAX_FILE_SIZE) {
    return badRequest(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (!ALLOWED_TYPES.has(contentType)) {
    return badRequest(`File type "${contentType}" is not allowed`);
  }

  const result = await getPresignedUploadUrl(
    filename,
    contentType,
    folder || "uploads"
  );

  return NextResponse.json(result);
});
