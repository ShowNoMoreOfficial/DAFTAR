import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id: trendId } = await params;
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
}
