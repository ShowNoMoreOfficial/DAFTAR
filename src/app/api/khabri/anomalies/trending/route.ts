import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { getTrendingAnomalies } from "@/lib/khabri";

export const GET = apiHandler(async (_req: NextRequest) => {
  // Try local: detect trending anomalies from trends with velocity spikes
  try {
    const trends = await prisma.trend.findMany({
      where: { velocityScore: { gt: 5 } },
      orderBy: { velocityScore: "desc" },
      take: 5,
      include: { _count: { select: { signals: true } } },
    });

    if (trends.length > 0) {
      return NextResponse.json({
        data: trends.map((t) => ({
          id: `local-trend-${t.id}`,
          type: "ENTITY_SURGE",
          severity: (t.velocityScore ?? 0) > 8 ? "CRITICAL" : (t.velocityScore ?? 0) > 6 ? "HIGH" : "ELEVATED",
          subject: t.name,
          description: t.description ?? `High velocity trend with ${t._count.signals} signals`,
          deviation: t.velocityScore,
          baseline: 3,
          current: t.velocityScore,
          detectedAt: t.updatedAt.toISOString(),
        })),
        meta: { total: trends.length, page: 1, pageSize: 10, hasMore: false, source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local trending anomalies failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getTrendingAnomalies();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Khabri] anomalies/trending error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch trending anomalies";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
