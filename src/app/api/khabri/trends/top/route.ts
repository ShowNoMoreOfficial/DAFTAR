import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { getTopTrends } from "@/lib/khabri";

export const GET = apiHandler(async (req: NextRequest) => {
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 10;

  // Try local DB first
  try {
    const localTrends = await prisma.trend.findMany({
      orderBy: { velocityScore: "desc" },
      take: limit,
      include: { _count: { select: { signals: true } } },
    });

    if (localTrends.length > 0) {
      return NextResponse.json({
        data: localTrends.map((t, i) => ({
          id: t.id,
          rank: i + 1,
          topic: t.name,
          score: t.velocityScore ?? 0,
          category: t.lifecycle,
          region: null,
          momentum: t.velocityScore,
          sourceCount: t._count.signals,
          firstSeen: t.createdAt.toISOString(),
          lastUpdated: t.updatedAt.toISOString(),
        })),
        meta: { total: localTrends.length, page: 1, pageSize: limit, hasMore: false, source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local top trends query failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getTopTrends(limit);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Khabri] trends/top error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch top trends";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
