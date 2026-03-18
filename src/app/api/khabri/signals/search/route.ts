import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/api-utils";
import { searchSignals } from "@/lib/khabri";

export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q");
  if (!query) return badRequest("Missing search query parameter 'q'");

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 25;

  // Try local DB first
  try {
    const [localSignals, total] = await Promise.all([
      prisma.signal.findMany({
        where: {
          isDuplicate: false,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { detectedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { trend: { select: { name: true, lifecycle: true } } },
      }),
      prisma.signal.count({
        where: {
          isDuplicate: false,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    if (localSignals.length > 0) {
      return NextResponse.json({
        data: localSignals.map((s) => ({
          id: s.id,
          title: s.title,
          content: s.content,
          source: s.source,
          category: s.eventType ?? s.trend.lifecycle,
          isEnriched: s.sourceCredibility !== null,
          sentiment: s.sentiment
            ? { label: s.sentiment.toUpperCase(), score: 0 }
            : undefined,
          createdAt: s.detectedAt.toISOString(),
          publishedAt: s.detectedAt.toISOString(),
        })),
        meta: { total, page, pageSize, hasMore: page * pageSize < total, source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local signal search failed:", err);
  }

  // Fallback to external API
  try {
    const result = await searchSignals(query, page, pageSize);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to search signals";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
