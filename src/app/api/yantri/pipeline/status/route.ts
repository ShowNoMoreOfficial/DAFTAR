import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

// ---------------------------------------------------------------------------
// GET /api/yantri/pipeline/status
//
// Returns pipeline status info sourced from Deliverables (the canonical
// pipeline model used by Content Studio).  Also merges in ContentPiece counts
// so the dashboard bar reflects the full picture.
//
// Query params:
//   ?contentPieceId=xxx  — returns the specific piece's status and pipeline position
//
// Always includes aggregate stats: how many items are in each status.
// ---------------------------------------------------------------------------

// Canonical pipeline statuses shown in the dashboard
const PIPELINE_STATUSES = [
  "PLANNED",
  "RESEARCHING",
  "DRAFTED",
  "REVIEW",
  "APPROVED",
  "RELAYED",
  "PUBLISHED",
] as const;

// Pipeline step order for positional display
const PIPELINE_STEPS: Record<string, { position: number; label: string }> = {
  PLANNED: { position: 0, label: "Queued" },
  RESEARCHING: { position: 1, label: "Researching" },
  DRAFTED: { position: 2, label: "Drafted" },
  REVIEW: { position: 3, label: "In Review" },
  APPROVED: { position: 4, label: "Approved" },
  RELAYED: { position: 5, label: "Relayed to platform" },
  PUBLISHED: { position: 6, label: "Published" },
  KILLED: { position: -1, label: "Killed" },
};

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const contentPieceId = searchParams.get("contentPieceId");

  // ── Aggregate stats from Deliverables (canonical pipeline model) ───
  const [deliverableCounts, contentPieceCounts] = await Promise.all([
    prisma.deliverable.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.contentPiece.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  // Initialize all statuses to 0
  const stats: Record<string, number> = {};
  for (const s of PIPELINE_STATUSES) {
    stats[s] = 0;
  }

  // Merge deliverable counts (primary)
  for (const row of deliverableCounts) {
    if (row.status in stats) {
      stats[row.status] += row._count.id;
    }
  }

  // Merge content piece counts (secondary — only add for statuses
  // that have zero deliverables to avoid double-counting)
  for (const row of contentPieceCounts) {
    if (row.status in stats && stats[row.status] === 0) {
      stats[row.status] += row._count.id;
    }
  }

  const response: Record<string, unknown> = { stats };

  // If a specific piece was requested, include its details
  if (contentPieceId) {
    const piece = await prisma.contentPiece.findUnique({
      where: { id: contentPieceId },
      include: { brand: { select: { id: true, name: true } } },
    });

    if (!piece) {
      return NextResponse.json(
        { error: "ContentPiece not found", stats },
        { status: 404 }
      );
    }

    const stepInfo = PIPELINE_STEPS[piece.status] ?? {
      position: -1,
      label: piece.status,
    };

    response.piece = {
      id: piece.id,
      status: piece.status,
      platform: piece.platform,
      brandName: piece.brand.name,
      treeId: piece.treeId,
      hasBody: !!piece.bodyText,
      hasVisualPrompts: !!piece.visualPrompts,
      hasPostingPlan: !!piece.postingPlan,
      pipelinePosition: stepInfo.position,
      pipelineLabel: stepInfo.label,
      createdAt: piece.createdAt,
      updatedAt: piece.updatedAt,
      approvedAt: piece.approvedAt,
      publishedAt: piece.publishedAt,
    };
  }

  return NextResponse.json(response);
});
