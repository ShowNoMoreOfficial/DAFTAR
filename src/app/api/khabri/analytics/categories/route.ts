import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { getCategoryDistribution } from "@/lib/khabri";

export const GET = apiHandler(async (req: NextRequest) => {
  const hours = Number(req.nextUrl.searchParams.get("hours")) || 24;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Try local DB: aggregate signal event types as categories
  try {
    const grouped = await prisma.signal.groupBy({
      by: ["eventType"],
      where: { detectedAt: { gte: cutoff }, eventType: { not: null } },
      _count: { id: true },
    });

    if (grouped.length > 0) {
      const total = grouped.reduce((s, g) => s + g._count.id, 0);
      const uncategorizedCount = await prisma.signal.count({
        where: { detectedAt: { gte: cutoff }, eventType: null },
      });

      return NextResponse.json({
        data: {
          categories: grouped.map((g) => ({
            name: g.eventType,
            category: g.eventType,
            count: g._count.id,
            percentage: Math.round((g._count.id / (total + uncategorizedCount)) * 100),
          })),
          total: total + uncategorizedCount,
          uncategorized: uncategorizedCount,
        },
        meta: { total: grouped.length, page: 1, pageSize: 100, hasMore: false, source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local categories query failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getCategoryDistribution(hours);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Khabri] analytics/categories error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch category distribution";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
