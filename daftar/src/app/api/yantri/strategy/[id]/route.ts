import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

// GET /api/yantri/strategy/[id]
// Returns a NarrativeTree with its FactDossier, all strategy-relevant data,
// and any existing deliverables (which represent the strategy outcomes).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  // The "id" here is a NarrativeTree ID — we return its strategy context
  const tree = await prisma.narrativeTree.findUnique({
    where: { id },
    include: {
      dossier: true,
      nodes: { orderBy: { identifiedAt: "desc" } },
      deliverables: {
        include: {
          brand: { select: { id: true, name: true } },
          assets: { orderBy: { slideIndex: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      narratives: {
        include: {
          brand: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!tree) {
    return NextResponse.json({ error: "NarrativeTree not found" }, { status: 404 });
  }

  // Determine pipeline status
  let pipelineStatus: string;
  if (tree.deliverables.some((d) => d.status === "APPROVED" || d.status === "PUBLISHED")) {
    pipelineStatus = "approved";
  } else if (tree.deliverables.some((d) => d.status === "REVIEW")) {
    pipelineStatus = "review";
  } else if (tree.deliverables.length > 0) {
    pipelineStatus = "content";
  } else if (tree.narratives.length > 0) {
    pipelineStatus = "strategy";
  } else if (tree.dossier) {
    pipelineStatus = "dossier";
  } else {
    pipelineStatus = "signal";
  }

  return NextResponse.json({
    id: tree.id,
    title: tree.title,
    summary: tree.summary,
    status: tree.status,
    urgency: tree.urgency,
    signal: {
      topic: tree.title,
      source: tree.signalId ? "khabri" : "manual",
      signalData: tree.signalData,
      createdAt: tree.createdAt,
    },
    factDossier: tree.dossier
      ? {
          id: tree.dossier.id,
          content: tree.dossier.structuredData,
          sources: tree.dossier.sources,
          status: "complete",
          createdAt: tree.dossier.createdAt,
        }
      : null,
    narratives: tree.narratives.map((n) => ({
      id: n.id,
      brandId: n.brandId,
      brandName: n.brand.name,
      platform: n.platform,
      angle: n.angle,
      formatNotes: n.formatNotes,
      status: n.status,
    })),
    deliverables: tree.deliverables.map((d) => ({
      id: d.id,
      status: d.status,
      platform: d.platform,
      pipelineType: d.pipelineType,
      brandName: d.brand?.name,
      assets: d.assets,
      createdAt: d.createdAt,
    })),
    pipelineStatus,
    createdAt: tree.createdAt,
    updatedAt: tree.updatedAt,
  });
}
