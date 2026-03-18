import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/communication/feedback/entries — list feedback entries
// ADMIN/HEAD_HR see all, others see only their own
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = req.nextUrl;
  const channelId = searchParams.get("channelId");
  const status = searchParams.get("status");
  const { page, limit, skip } = parsePagination(req);

  const isPrivileged = ["ADMIN", "HEAD_HR"].includes(session.user.role);

  const where: Record<string, unknown> = {};

  if (!isPrivileged) {
    where.userId = session.user.id;
  }

  if (channelId) where.channelId = channelId;
  if (status) where.status = status;

  const [entries, total] = await Promise.all([
    prisma.feedbackEntry.findMany({
      where,
      include: {
        channel: { select: { id: true, name: true, type: true, isAnonymous: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.feedbackEntry.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(entries, total, { page, limit, skip }));
});

// POST /api/communication/feedback/entries — submit feedback entry
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const { channelId, content } = await req.json();

  if (!channelId || !content) {
    return badRequest("Channel ID and content are required");
  }

  const channel = await prisma.feedbackChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel) return notFound("Feedback channel not found");

  if (!channel.isActive) {
    return badRequest("This feedback channel is no longer active");
  }

  const entry = await prisma.feedbackEntry.create({
    data: {
      channelId,
      content,
      userId: channel.isAnonymous ? null : session.user.id,
    },
    include: {
      channel: { select: { id: true, name: true, type: true, isAnonymous: true } },
    },
  });

  return NextResponse.json(entry, { status: 201 });
});
