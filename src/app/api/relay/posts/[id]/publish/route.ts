import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound, badRequest } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";
import { daftarEvents } from "@/lib/event-bus";

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

  // Otherwise, publish now (simulated)
  const post = await prisma.contentPost.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: now,
      platformPostId: `sim_${id}_${Date.now()}`, // simulated platform post ID
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
