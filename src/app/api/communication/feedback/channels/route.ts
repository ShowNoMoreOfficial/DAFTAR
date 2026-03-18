import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/communication/feedback/channels — list active feedback channels
export const GET = apiHandler(async (_req: NextRequest, _ctx) => {
  const channels = await prisma.feedbackChannel.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { entries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(channels);
});

// POST /api/communication/feedback/channels — create channel (ADMIN, HEAD_HR only)
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const allowedRoles = ["ADMIN", "HEAD_HR"];
  if (!allowedRoles.includes(session.user.role)) {
    return forbidden();
  }

  const { name, description, type, isAnonymous } = await req.json();

  if (!name) {
    return badRequest("Channel name is required");
  }

  const channel = await prisma.feedbackChannel.create({
    data: {
      name,
      description: description || null,
      type: type || "suggestion",
      isAnonymous: isAnonymous ?? true,
    },
  });

  return NextResponse.json(channel, { status: 201 });
});
