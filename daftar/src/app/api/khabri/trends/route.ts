import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getTrends } from "@/lib/khabri";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 25;

  // Try local DB first
  try {
    const [localTrends, total] = await Promise.all([
      prisma.trend.findMany({
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { signals: true } } },
      }),
      prisma.trend.count(),
    ]);

    if (localTrends.length > 0) {
      return NextResponse.json({
        data: localTrends.map((t, i) => ({
          id: t.id,
          rank: (page - 1) * pageSize + i + 1,
          topic: t.name,
          score: t.velocityScore ?? 0,
          category: t.lifecycle,
          region: null,
          momentum: t.velocityScore,
          sourceCount: t._count.signals,
          firstSeen: t.createdAt.toISOString(),
          lastUpdated: t.updatedAt.toISOString(),
        })),
        meta: { total, page, pageSize, hasMore: page * pageSize < total, source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local trends query failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getTrends(page, pageSize);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch trends";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
