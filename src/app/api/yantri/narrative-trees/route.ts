import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NarrativeStatus } from "@prisma/client";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

const VALID_STATUSES = new Set<string>(Object.values(NarrativeStatus));

// ---------------------------------------------------------------------------
// GET /api/yantri/narrative-trees
// List all NarrativeTrees with node count and dossier existence.
// Query params: status (ACTIVE | MERGED | ARCHIVED)
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${[...VALID_STATUSES].join(", ")}`,
        },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {};
    if (status) where.status = status as NarrativeStatus;

    const trees = await prisma.narrativeTree.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { nodes: true, narratives: true } },
        createdBy: { select: { id: true, name: true } },
        dossier: { select: { id: true } },
        narratives: {
          select: { brandId: true, platform: true, status: true },
          take: 10,
        },
        nodes: {
          orderBy: { identifiedAt: "desc" },
          take: 3,
          select: { id: true, signalTitle: true, identifiedAt: true },
        },
      },
    });

    return NextResponse.json({ trees });
  } catch (err) {
    console.error("[narrative-trees] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load narrative trees" },
      { status: 500 }
    );
  }
}
