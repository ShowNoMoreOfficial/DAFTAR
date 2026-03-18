import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// POST /api/communication/announcements/[id]/read — mark announcement as read
export const POST = apiHandler(async (_req: NextRequest, { session, params }) => {
  const { id } = params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) return notFound("Announcement not found");

  const read = await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId: id,
        userId: session.user.id,
      },
    },
    create: {
      announcementId: id,
      userId: session.user.id,
    },
    update: {},
  });

  return NextResponse.json(read, { status: 201 });
});
