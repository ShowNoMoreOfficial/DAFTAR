import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import { hasPermission } from "@/lib/permissions";

// PATCH /api/relay/calendar/[id] — Update a calendar entry
export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  const existing = await prisma.contentCalendarEntry.findUnique({ where: { id } });
  if (!existing) return notFound("Calendar entry not found");

  // Only creator or ADMIN can update
  if (session.user.role !== "ADMIN" && existing.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, platform, deliverableType, date, assigneeId, status, metadata, postId } = body;

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (platform !== undefined) data.platform = platform;
  if (deliverableType !== undefined) data.deliverableType = deliverableType;
  if (date !== undefined) data.date = new Date(date);
  if (assigneeId !== undefined) data.assigneeId = assigneeId;
  if (status !== undefined) data.status = status;
  if (metadata !== undefined) data.metadata = metadata;
  if (postId !== undefined) data.postId = postId;

  const entry = await prisma.contentCalendarEntry.update({
    where: { id },
    data,
  });

  return NextResponse.json(entry);
});

// DELETE /api/relay/calendar/[id] — Delete a calendar entry
export const DELETE = apiHandler(async (_req: NextRequest, { session, params }) => {
  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  const existing = await prisma.contentCalendarEntry.findUnique({ where: { id } });
  if (!existing) return notFound("Calendar entry not found");

  // Only creator or ADMIN can delete
  if (session.user.role !== "ADMIN" && existing.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.contentCalendarEntry.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
