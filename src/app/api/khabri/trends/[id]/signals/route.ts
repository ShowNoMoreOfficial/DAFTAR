import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (req: NextRequest, { params }) => {
  const { id: trendId } = params;
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 10;

  const signals = await prisma.signal.findMany({
    where: { trendId, isDuplicate: false },
    orderBy: { detectedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    data: signals.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content?.slice(0, 200) || null,
      source: s.source,
      sentiment: s.sentiment,
      eventType: s.eventType,
      detectedAt: s.detectedAt.toISOString(),
    })),
    meta: { total: signals.length, trendId },
  });
});
