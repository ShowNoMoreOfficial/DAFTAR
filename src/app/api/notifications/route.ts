import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import type { NotificationType } from "@prisma/client";

// GET /api/notifications — fetch current user's notifications with pagination & filters
export const GET = apiHandler(async (req, { session }) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 50);
  const type = searchParams.get("type") as NotificationType | null;
  const isReadParam = searchParams.get("isRead");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (type) {
    where.type = type;
  }

  if (isReadParam === "true") {
    where.isRead = true;
  } else if (isReadParam === "false") {
    where.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  return NextResponse.json({
    notifications,
    unreadCount,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// PATCH /api/notifications — mark notifications as read
export const PATCH = apiHandler(async (req, { session }) => {
  const body = await req.json();
  const { ids, markAllRead } = body as {
    ids?: string[];
    markAllRead?: boolean;
  };

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (!ids || ids.length === 0) {
    return badRequest("Provide notification ids or markAllRead");
  }

  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId: session.user.id,
    },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
});
