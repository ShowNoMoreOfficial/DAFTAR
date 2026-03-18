import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

/**
 * GET /api/ppc/overview
 * Aggregated PPC KPIs: active campaigns, total spend, avg CTR,
 * conversions, spend-by-platform, daily trend.
 */
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  if (!["ADMIN", "DEPT_HEAD", "MEMBER", "FINANCE"].includes(session.user.role)) {
    return forbidden();
  }

  const days = Math.min(parseInt(req.nextUrl.searchParams.get("days") || "30"), 90);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [campaigns, metrics, allCampaigns] = await Promise.all([
    prisma.pPCCampaign.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, platform: true, brandId: true },
    }),
    prisma.pPCDailyMetric.findMany({
      where: { date: { gte: since } },
      include: {
        campaign: {
          select: { platform: true, brandId: true, brand: { select: { name: true } } },
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.pPCCampaign.count(),
  ]);

  // Totals
  const totalSpend = metrics.reduce((s, m) => s + m.spend, 0);
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Spend by platform
  const spendByPlatform: Record<string, number> = {};
  for (const m of metrics) {
    const plat = m.campaign.platform;
    spendByPlatform[plat] = (spendByPlatform[plat] || 0) + m.spend;
  }

  // Spend by brand
  const spendByBrand: Record<string, { name: string; spend: number }> = {};
  for (const m of metrics) {
    const bId = m.campaign.brandId;
    if (!spendByBrand[bId]) {
      spendByBrand[bId] = { name: m.campaign.brand.name, spend: 0 };
    }
    spendByBrand[bId].spend += m.spend;
  }

  // Daily trend
  const dailyTrend: Record<string, { spend: number; clicks: number; impressions: number }> = {};
  for (const m of metrics) {
    const dateKey = m.date.toISOString().split("T")[0];
    if (!dailyTrend[dateKey]) {
      dailyTrend[dateKey] = { spend: 0, clicks: 0, impressions: 0 };
    }
    dailyTrend[dateKey].spend += m.spend;
    dailyTrend[dateKey].clicks += m.clicks;
    dailyTrend[dateKey].impressions += m.impressions;
  }

  return NextResponse.json({
    activeCampaigns: campaigns.length,
    totalCampaigns: allCampaigns,
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalClicks,
    totalImpressions,
    totalConversions,
    avgCtr: Math.round(avgCtr * 100) / 100,
    spendByPlatform,
    spendByBrand: Object.values(spendByBrand).sort((a, b) => b.spend - a.spend),
    dailyTrend: Object.entries(dailyTrend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  });
});
