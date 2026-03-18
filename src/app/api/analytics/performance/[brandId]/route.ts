import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

// GET /api/analytics/performance/:brandId — Brand-specific performance
export const GET = apiHandler(async (req: NextRequest, { params }) => {
  const { brandId } = params;
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform");
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = {
    brandId,
    publishedAt: { gte: since },
  };
  if (platform) where.platform = platform;

  const records = await prisma.contentPerformance.findMany({
    where,
    orderBy: { publishedAt: "desc" },
  });

  // Aggregate stats
  const totalPieces = records.length;
  const avgBenchmarkDelta =
    records.reduce((sum, r) => sum + (r.benchmarkDelta || 0), 0) / (totalPieces || 1);

  const tierCounts: Record<string, number> = {};
  for (const r of records) {
    const tier = r.performanceTier || "unscored";
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  }

  const platformBreakdown: Record<string, number> = {};
  for (const r of records) {
    platformBreakdown[r.platform] = (platformBreakdown[r.platform] || 0) + 1;
  }

  return NextResponse.json({
    brandId,
    period: { days, since: since.toISOString() },
    totalPieces,
    avgBenchmarkDelta: Math.round(avgBenchmarkDelta * 100) / 100,
    tierCounts,
    platformBreakdown,
    records,
  });
});
