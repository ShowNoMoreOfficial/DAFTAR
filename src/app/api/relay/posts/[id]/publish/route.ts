import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound, badRequest } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";
import { daftarEvents } from "@/lib/event-bus";

// POST /api/relay/posts/[id]/publish — Publish a post (simulated)
export async function POST(
  _req: NextRequest,
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

  const post = await prisma.contentPost.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: now,
    },
    include: {
      brand: { select: { id: true, name: true } },
      analytics: true,
    },
  });

  // Create initial analytics record
  await prisma.postAnalytics.upsert({
    where: { postId: id },
    create: { postId: id },
    update: { lastSyncedAt: now },
  });

  daftarEvents.emitEvent("post.published", {
    postId: post.id,
    title: post.title,
    platform: post.platform,
    brandId: post.brandId,
    publishedById: session.user.id,
    publishedAt: now.toISOString(),
  });

  return NextResponse.json(post);
}
