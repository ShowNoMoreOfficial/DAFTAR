import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

/**
 * GET /api/ppc/campaigns/[id]/metrics
 * Fetch daily metrics for a campaign. Supports ?days=30 (default 30).
 */
export const GET = apiHandler(async (req: NextRequest, { session, params }) => {
  const { id } = params;
  const days = Math.min(parseInt(req.nextUrl.searchParams.get("days") || "30"), 90);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const campaign = await prisma.pPCCampaign.findUnique({ where: { id } });
  if (!campaign) return notFound("Campaign not found");

  const metrics = await prisma.pPCDailyMetric.findMany({
    where: {
      campaignId: id,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
  });

  // Compute totals
  const totals = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      conversions: acc.conversions + m.conversions,
      spend: acc.spend + m.spend,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
  );

  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;

  return NextResponse.json({
    metrics,
    totals: {
      ...totals,
      ctr: Math.round(avgCtr * 100) / 100,
      cpc: Math.round(avgCpc * 100) / 100,
    },
  });
});

/**
 * POST /api/ppc/campaigns/[id]/metrics
 * Add or update daily metrics for a campaign.
 */
export const POST = apiHandler(async (req: NextRequest, { session, params }) => {
  if (!["ADMIN", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  const { id } = params;

  const campaign = await prisma.pPCCampaign.findUnique({ where: { id } });
  if (!campaign) return notFound("Campaign not found");

  const body = await req.json();
  const { date, impressions, clicks, conversions, spend } = body;

  if (!date) return badRequest("date is required");

  const metricDate = new Date(date);
  const imp = impressions || 0;
  const clk = clicks || 0;
  const spd = spend || 0;
  const ctr = imp > 0 ? (clk / imp) * 100 : 0;
  const cpc = clk > 0 ? spd / clk : 0;
  const cpm = imp > 0 ? (spd / imp) * 1000 : 0;

  const metric = await prisma.pPCDailyMetric.upsert({
    where: {
      campaignId_date: { campaignId: id, date: metricDate },
    },
    create: {
      campaignId: id,
      date: metricDate,
      impressions: imp,
      clicks: clk,
      conversions: conversions || 0,
      spend: spd,
      ctr,
      cpc,
      cpm,
    },
    update: {
      impressions: imp,
      clicks: clk,
      conversions: conversions || 0,
      spend: spd,
      ctr,
      cpc,
      cpm,
    },
  });

  return NextResponse.json(metric, { status: 201 });
});
