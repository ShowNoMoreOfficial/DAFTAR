import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest, forbidden, handleApiError } from "@/lib/api-utils";

// GET /api/communication/feedback/channels — list active feedback channels
export async function GET(_req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const channels = await prisma.feedbackChannel.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { entries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(channels);
}

// POST /api/communication/feedback/channels — create channel (ADMIN, HEAD_HR only)
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const allowedRoles = ["ADMIN", "HEAD_HR"];
  if (!allowedRoles.includes(session.user.role)) {
    return forbidden();
  }

  try {
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
  } catch (error) {
    return handleApiError(error);
  }
}
