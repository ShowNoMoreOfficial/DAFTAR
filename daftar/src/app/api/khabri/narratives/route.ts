import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getNarratives } from "@/lib/khabri";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;

  // Try local DB first — NarrativeTree is the local equivalent
  try {
    const [trees, total] = await Promise.all([
      prisma.narrativeTree.findMany({
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          nodes: { select: { id: true, signalTitle: true }, take: 5 },
          _count: { select: { nodes: true, contentPieces: true } },
        },
      }),
      prisma.narrativeTree.count(),
    ]);

    if (trees.length > 0) {
      return NextResponse.json({
        data: trees.map((t) => ({
          id: t.id,
          summary: t.summary ?? t.title,
          keywords: t.nodes.map((n) => n.signalTitle).filter(Boolean).slice(0, 5),
          signalCount: t._count.nodes,
          phase: t.status === "COMPLETED" ? "RESOLUTION" : t.status === "IN_PRODUCTION" ? "PEAK" : "EMERGENCE",
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
        meta: { total, page, pageSize, hasMore: page * pageSize < total, source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local narratives query failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getNarratives(page, pageSize);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch narratives";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
