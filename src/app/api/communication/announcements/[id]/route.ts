import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, notFound } from "@/lib/api-utils";

// GET /api/communication/announcements/[id] — single announcement with full details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      _count: { select: { readBy: true } },
      readBy: {
        where: { userId: session.user.id },
        select: { readAt: true },
      },
    },
  });

  if (!announcement) return notFound("Announcement not found");

  return NextResponse.json({
    ...announcement,
    readCount: announcement._count.readBy,
    isRead: announcement.readBy.length > 0,
    readAt: announcement.readBy[0]?.readAt ?? null,
    _count: undefined,
    readBy: undefined,
  });
}

// PATCH /api/communication/announcements/[id] — update announcement (author or ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) return notFound("Announcement not found");

  const isAuthor = announcement.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isAuthor && !isAdmin) return forbidden();

  const body = await req.json();
  const { title, content, priority, departmentId, isPinned, expiresAt } = body;

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(priority !== undefined && { priority }),
      ...(departmentId !== undefined && { departmentId }),
      ...(isPinned !== undefined && { isPinned }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/communication/announcements/[id] — delete announcement (author or ADMIN only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) return notFound("Announcement not found");

  const isAuthor = announcement.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isAuthor && !isAdmin) return forbidden();

  await prisma.announcement.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
