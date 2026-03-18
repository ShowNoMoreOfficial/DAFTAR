import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// POST /api/communication/feedback/entries/[id] — upvote a feedback entry
export const POST = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params;

  const entry = await prisma.feedbackEntry.findUnique({ where: { id } });
  if (!entry) return notFound("Feedback entry not found");

  const updated = await prisma.feedbackEntry.update({
    where: { id },
    data: { upvotes: { increment: 1 } },
  });

  return NextResponse.json({ upvotes: updated.upvotes });
});

// PATCH /api/communication/feedback/entries/[id] — update entry (respond, change status)
// ADMIN/HEAD_HR only for response
export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  const isPrivileged = ["ADMIN", "HEAD_HR"].includes(session.user.role);
  if (!isPrivileged) return forbidden();

  const { id } = params;

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
});
