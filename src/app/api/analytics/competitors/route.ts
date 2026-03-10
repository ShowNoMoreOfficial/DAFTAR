import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { skillOrchestrator } from "@/lib/skill-orchestrator";

// GET /api/analytics/competitors — Competitive benchmarking
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const brandId = searchParams.get("brandId");
  const platform = searchParams.get("platform");
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get our performance data for benchmarking context
  const where: Record<string, unknown> = {
    publishedAt: { gte: since },
  };
  if (brandId) where.brandId = brandId;
  if (platform) where.platform = platform;

  const ourPerformance = await prisma.contentPerformance.findMany({
    where,
    orderBy: { publishedAt: "desc" },
  });

  // Run benchmarking skill
  const result = await skillOrchestrator.executeSkill({
    skillPath: "analytics/performance/benchmarking.md",
    context: {
      period: { days, since: since.toISOString() },
      brandId,
      platform,
      ourMetrics: {
        totalPieces: ourPerformance.length,
        avgBenchmarkDelta:
          ourPerformance.reduce((s, r) => s + (r.benchmarkDelta || 0), 0) /
          (ourPerformance.length || 1),
        tierDistribution: ourPerformance.reduce(
          (acc, r) => {
            const tier = r.performanceTier || "unscored";
            acc[tier] = (acc[tier] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    },
    brandId: brandId || undefined,
    platform: platform || undefined,
  });

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    benchmarking: result.success ? result.output : null,
    ourContentCount: ourPerformance.length,
  });
}
