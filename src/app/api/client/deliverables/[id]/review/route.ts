import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// POST /api/client/deliverables/[id]/review
export const POST = apiHandler(async (req: NextRequest, { session, params }) => {
  if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") {
    return forbidden();
  }

  const { id } = params;

  // Find the deliverable
  const deliverable = await prisma.clientDeliverable.findUnique({
    where: { id },
  });

  if (!deliverable) return notFound("Deliverable not found");

  // Verify client ownership via brand -> client -> userId
  if (session.user.role === "CLIENT") {
    const brand = await prisma.brand.findUnique({
      where: { id: deliverable.brandId },
      include: { client: { select: { userId: true } } },
    });

    if (!brand || brand.client.userId !== session.user.id) {
      return forbidden();
    }
  }

  const body = await req.json();
  const { action, feedback } = body;

  if (!action || !["approve", "request_revision"].includes(action)) {
    return badRequest("action must be 'approve' or 'request_revision'");
  }

  if (action === "approve") {
    const updated = await prisma.clientDeliverable.update({
      where: { id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: session.user.id,
        feedback: feedback || null,
      },
    });
    return NextResponse.json(updated);
  }

  // request_revision
  if (!feedback) {
    return badRequest("feedback is required when requesting revision");
  }

  const updated = await prisma.clientDeliverable.update({
    where: { id },
    data: {
      status: "revision_requested",
      feedback,
    },
  });

  return NextResponse.json(updated);
});
