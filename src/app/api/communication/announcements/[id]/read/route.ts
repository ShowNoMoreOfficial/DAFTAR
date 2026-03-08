import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

// POST /api/communication/announcements/[id]/read — mark announcement as read
export async function POST(
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
}
