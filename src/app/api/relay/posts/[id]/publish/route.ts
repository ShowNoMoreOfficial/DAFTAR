import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound, badRequest } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";
import { executePublish } from "@/lib/relay/publish-executor";

export const maxDuration = 60; // Allow time for media uploads

// POST /api/relay/posts/[id]/publish — Publish or schedule a post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.contentPost.findUnique({ where: { id } });
  if (!existing) return notFound("Post not found");

  // Only creator or ADMIN can publish
  if (session.user.role !== "ADMIN" && existing.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Can only publish DRAFT, QUEUED, or SCHEDULED posts
  if (!["DRAFT", "QUEUED", "SCHEDULED"].includes(existing.status)) {
    return badRequest(`Cannot publish a post with status "${existing.status}"`);
  }

  const now = new Date();
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // No body is fine - publish immediately
  }

  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt as string) : existing.scheduledAt;

  // If scheduledAt is in the future, set to SCHEDULED
  if (scheduledAt && scheduledAt > now) {
    const post = await prisma.contentPost.update({
      where: { id },
      data: {
        status: "SCHEDULED",
        scheduledAt,
      },
      include: {
        brand: { select: { id: true, name: true } },
        analytics: true,
      },
    });

    return NextResponse.json(post);
  }

  // Publish now via real platform publishers
  try {
    const result = await executePublish(id);

    if (result.status === "FAILED") {
      return NextResponse.json(
        { error: result.error, status: "FAILED" },
        { status: 502 }
      );
    }

    const post = await prisma.contentPost.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true } },
        analytics: true,
      },
    });

    return NextResponse.json(post);
  } catch (err) {
    await prisma.contentPost.update({
      where: { id },
      data: { status: "FAILED", errorMessage: String(err) },
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
