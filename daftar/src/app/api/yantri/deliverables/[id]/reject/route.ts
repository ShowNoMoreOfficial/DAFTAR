import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

// POST /api/yantri/deliverables/[id]/reject
// Reject a deliverable with a reason.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({ where: { id } });
  if (!deliverable) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }

  if (deliverable.status === "KILLED") {
    return NextResponse.json({ error: "Deliverable already rejected" }, { status: 400 });
  }

  let body: { reason?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (!body.reason) {
    return badRequest("reason is required when rejecting a deliverable");
  }

  // Store rejection reason in postingPlan JSON (reusing existing field for metadata)
  const existingMeta = (deliverable.postingPlan as Record<string, unknown>) ?? {};
  const rejectionHistory = (existingMeta.rejections as unknown[]) ?? [];
  rejectionHistory.push({
    reason: body.reason,
    rejectedBy: session.user.id,
    rejectedAt: new Date().toISOString(),
  });

  const updated = await prisma.deliverable.update({
    where: { id },
    data: {
      status: "KILLED",
      postingPlan: JSON.parse(JSON.stringify({ ...existingMeta, rejections: rejectionHistory })),
    },
    include: {
      brand: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}
