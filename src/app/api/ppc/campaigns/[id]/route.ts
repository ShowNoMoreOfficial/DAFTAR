import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  forbidden,
  notFound,
  handleApiError,
} from "@/lib/api-utils";

/**
 * GET /api/ppc/campaigns/[id]
 * Fetch a single campaign with metrics summary.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  try {
    const campaign = await prisma.pPCCampaign.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        dailyMetrics: { orderBy: { date: "desc" }, take: 30 },
        recommendations: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!campaign) return notFound("Campaign not found");

    return NextResponse.json(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/ppc/campaigns/[id]
 * Update campaign fields or status.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!["ADMIN", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.pPCCampaign.findUnique({ where: { id } });
    if (!existing) return notFound("Campaign not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.status !== undefined) data.status = body.status;
    if (body.dailyBudget !== undefined) data.dailyBudget = body.dailyBudget ? parseFloat(body.dailyBudget) : null;
    if (body.totalBudget !== undefined) data.totalBudget = body.totalBudget ? parseFloat(body.totalBudget) : null;
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.targeting !== undefined) data.targeting = body.targeting;
    if (body.adCopy !== undefined) data.adCopy = body.adCopy;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.externalId !== undefined) data.externalId = body.externalId;
    if (body.objective !== undefined) data.objective = body.objective;
    if (body.platform !== undefined) data.platform = body.platform;

    const campaign = await prisma.pPCCampaign.update({
      where: { id },
      data,
      include: {
        brand: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/ppc/campaigns/[id]
 * Delete a campaign (ADMIN only, DRAFT only).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = await params;

  try {
    const campaign = await prisma.pPCCampaign.findUnique({ where: { id } });
    if (!campaign) return notFound("Campaign not found");

    await prisma.pPCCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
