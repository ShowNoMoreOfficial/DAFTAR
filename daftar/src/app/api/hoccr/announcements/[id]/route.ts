import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      readBy: { select: { userId: true, readAt: true } },
    },
  });

  if (!announcement) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  // Mark as read for current user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alreadyRead = announcement.readBy.some((r: any) => r.userId === session.user.id);
  if (!alreadyRead) {
    await prisma.announcementRead.create({
      data: {
        announcementId: id,
        userId: session.user.id,
      },
    });
  }

  // Resolve author
  const author = await prisma.user.findUnique({
    where: { id: announcement.authorId },
    select: { id: true, name: true, avatar: true },
  });

  return NextResponse.json({
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    type: announcement.type,
    scope: announcement.scope,
    scopeId: announcement.scopeId,
    authorId: announcement.authorId,
    author: author || { id: announcement.authorId, name: "Unknown", avatar: null },
    isPinned: announcement.isPinned,
    expiresAt: announcement.expiresAt,
    readCount: announcement.readBy.length + (alreadyRead ? 0 : 1),
    isRead: true,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  // Only author or ADMIN can update
  if (announcement.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, type, scope, scopeId, isPinned, expiresAt } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (type !== undefined) updateData.type = type;
  if (scope !== undefined) updateData.scope = scope;
  if (scopeId !== undefined) updateData.scopeId = scopeId;
  if (isPinned !== undefined) updateData.isPinned = isPinned;
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

  // Keep departmentId in sync with scope
  if (scope === "department" && scopeId) {
    updateData.departmentId = scopeId;
  } else if (scope && scope !== "department") {
    updateData.departmentId = null;
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  // Only author or ADMIN can delete
  if (announcement.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.announcement.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
