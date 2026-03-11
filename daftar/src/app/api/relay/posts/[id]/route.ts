import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound, badRequest } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";

// GET /api/relay/posts/[id] — Get single post with analytics
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const post = await prisma.contentPost.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true } },
      analytics: true,
    },
  });

  if (!post) return notFound("Post not found");

  // Role-based access check
  const { role, id: userId, accessibleBrandIds } = session.user;
  if (role === "CLIENT" && !accessibleBrandIds.includes(post.brandId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if ((role === "MEMBER" || role === "CONTRACTOR") && post.createdById !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(post);
}

// PATCH /api/relay/posts/[id] — Update a post
export async function PATCH(
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

  // Only creator or ADMIN can update
  if (session.user.role !== "ADMIN" && existing.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, platform, status, scheduledAt, mediaUrls, metadata } = body;

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  if (platform !== undefined) data.platform = platform;
  if (status !== undefined) data.status = status;
  if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  if (mediaUrls !== undefined) data.mediaUrls = mediaUrls;
  if (metadata !== undefined) data.metadata = metadata;

  const post = await prisma.contentPost.update({
    where: { id },
    data,
    include: {
      brand: { select: { id: true, name: true } },
      analytics: true,
    },
  });

  return NextResponse.json(post);
}

// DELETE /api/relay/posts/[id] — Delete a draft or scheduled post
export async function DELETE(
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

  // Only creator or ADMIN can delete
  if (session.user.role !== "ADMIN" && existing.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Can only delete DRAFT or SCHEDULED posts
  if (!["DRAFT", "SCHEDULED"].includes(existing.status)) {
    return badRequest("Only draft or scheduled posts can be deleted");
  }

  await prisma.contentPost.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
