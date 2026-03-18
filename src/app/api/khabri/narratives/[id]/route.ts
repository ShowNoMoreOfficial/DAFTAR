import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { getNarrativeTree } from "@/lib/khabri";

export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params;

  // Try local DB first
  try {
    const tree = await prisma.narrativeTree.findUnique({
      where: { id },
      include: {
        nodes: { orderBy: { identifiedAt: "asc" } },
        dossier: true,
        contentPieces: { select: { id: true, platform: true, status: true } },
      },
    });

    if (tree) {
      return NextResponse.json({
        data: {
          id: tree.id,
          summary: tree.summary ?? tree.title,
          keywords: tree.nodes.map((n) => n.signalTitle).filter(Boolean),
          phase: tree.status === "COMPLETED" ? "RESOLUTION" : tree.status === "IN_PRODUCTION" ? "PEAK" : "EMERGENCE",
          signals: tree.nodes.map((n) => ({
            id: n.id,
            title: n.signalTitle,
            data: n.signalData,
            type: n.nodeType,
            identifiedAt: n.identifiedAt.toISOString(),
          })),
          dossier: tree.dossier
            ? {
                facts: tree.dossier.structuredData,
                sources: tree.dossier.sources,
                createdAt: tree.dossier.createdAt.toISOString(),
              }
            : null,
          contentPieces: tree.contentPieces,
          createdAt: tree.createdAt.toISOString(),
          updatedAt: tree.updatedAt.toISOString(),
        },
        meta: { source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local narrative lookup failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getNarrativeTree(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch narrative";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
