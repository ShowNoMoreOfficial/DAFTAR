import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

/**
 * GET /api/ppc/campaigns
 * List campaigns with optional filters: status, brandId, platform, dateFrom, dateTo
 */
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const role = session.user.role;
  if (!["ADMIN", "DEPT_HEAD", "MEMBER", "FINANCE"].includes(role)) return forbidden();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const brandId = searchParams.get("brandId");
  const platform = searchParams.get("platform");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (brandId) where.brandId = brandId;
  if (platform) where.platform = platform;
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    where.startDate = dateFilter;
  }

  const campaigns = await prisma.pPCCampaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { dailyMetrics: true, recommendations: true } },
    },
  });

  return NextResponse.json(campaigns);
});

/**
 * POST /api/ppc/campaigns
 * Create a new PPC campaign.
 */
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  if (!["ADMIN", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  const body = await req.json();
  const {
    name,
    brandId,
    platform,
    objective,
    status,
    dailyBudget,
    totalBudget,
    startDate,
    endDate,
    targeting,
    adCopy,
    notes,
    externalId,
  } = body;

  if (!name || !brandId || !platform || !objective) {
    return badRequest("name, brandId, platform, and objective are required");
  }

  const campaign = await prisma.pPCCampaign.create({
    data: {
      name,
      brandId,
      platform,
      objective,
      status: status || "DRAFT",
      dailyBudget: dailyBudget ? parseFloat(dailyBudget) : null,
      totalBudget: totalBudget ? parseFloat(totalBudget) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      targeting: targeting || null,
      adCopy: adCopy || null,
      notes: notes || null,
      externalId: externalId || null,
      createdById: session.user.id,
    },
    include: {
      brand: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
});
