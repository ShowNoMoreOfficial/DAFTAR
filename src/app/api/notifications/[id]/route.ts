import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// PATCH /api/notifications/[id] — mark single notification as read/unread
export const PATCH = apiHandler(async (req, { session, params }) => {
  const { id } = params;

  const body = await req.json();
  const { isRead } = body as { isRead?: boolean };

  if (typeof isRead !== "boolean") {
    return badRequest("Provide isRead as boolean");
  }

  const notification = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!notification) return notFound("Notification not found");

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead },
  });

  return NextResponse.json(updated);
});

// DELETE /api/notifications/[id] — delete a notification
export const DELETE = apiHandler(async (_req, { session, params }) => {
  const { id } = params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!notification) return notFound("Notification not found");

  await prisma.notification.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
