import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { getSignals } from "@/lib/khabri";

function mapLocalSignal(s: {
  id: string;
  title: string;
  content: string | null;
  source: string;
  sourceCredibility: number | null;
  eventType: string | null;
  stakeholders: unknown;
  sentiment: string | null;
  detectedAt: Date;
  trend: { name: string; lifecycle: string };
}) {
  return {
    id: s.id,
    title: s.title,
    content: s.content,
    source: s.source,
    category: s.eventType ?? s.trend.lifecycle,
    isEnriched: s.sourceCredibility !== null,
    entities: Array.isArray(s.stakeholders)
      ? (s.stakeholders as Array<{ name: string; type: string; salience?: number }>).map((e) => ({
          name: e.name,
          type: e.type || "person",
          salience: e.salience ?? 0.5,
        }))
      : [],
    sentiment: s.sentiment
      ? { label: s.sentiment.toUpperCase(), score: s.sentiment === "positive" ? 0.5 : s.sentiment === "negative" ? -0.5 : 0 }
      : undefined,
    createdAt: s.detectedAt.toISOString(),
    publishedAt: s.detectedAt.toISOString(),
  };
}

export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 25;

  // Try local DB first
  try {
    const [localSignals, total] = await Promise.all([
      prisma.signal.findMany({
        where: { isDuplicate: false },
        orderBy: { detectedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { trend: { select: { name: true, lifecycle: true } } },
      }),
      prisma.signal.count({ where: { isDuplicate: false } }),
    ]);

    if (localSignals.length > 0) {
      return NextResponse.json({
        data: localSignals.map(mapLocalSignal),
        meta: { total, page, pageSize, hasMore: page * pageSize < total, source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local signals query failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getSignals(page, pageSize);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch signals";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
