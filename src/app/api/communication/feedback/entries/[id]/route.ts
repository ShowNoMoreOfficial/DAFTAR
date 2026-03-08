import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, notFound, badRequest } from "@/lib/api-utils";

// PATCH /api/communication/feedback/entries/[id] — update entry (respond, change status)
// ADMIN/HEAD_HR only for response
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const isPrivileged = ["ADMIN", "HEAD_HR"].includes(session.user.role);
  if (!isPrivileged) return forbidden();

  const { id } = await params;

  const entry = await prisma.feedbackEntry.findUnique({
    where: { id },
  });

  if (!entry) return notFound("Feedback entry not found");

  const { status, response } = await req.json();

  if (!status && !response) {
    return badRequest("Provide status or response to update");
  }

  const updated = await prisma.feedbackEntry.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(response !== undefined && {
        response,
        respondedBy: session.user.id,
        respondedAt: new Date(),
      }),
    },
    include: {
      channel: { select: { id: true, name: true, type: true, isAnonymous: true } },
    },
  });

  return NextResponse.json(updated);
}
