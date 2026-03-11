import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

// GET /api/yantri/dossiers
// List all FactDossiers with related tree, brand, and pipeline status info.
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const brandId = searchParams.get("brandId");
  const status = searchParams.get("status");

  const dossiers = await prisma.factDossier.findMany({
    include: {
      tree: {
        include: {
          narratives: {
            select: { brandId: true, brand: { select: { id: true, name: true } } },
            take: 1,
          },
          deliverables: {
            select: { id: true, status: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Map to UI-friendly shape
  let results = dossiers.map((d) => {
    const narrative = d.tree.narratives[0];
    const deliverable = d.tree.deliverables[0];

    return {
      id: d.id,
      topic: d.tree.title,
      status: "complete",
      createdAt: d.createdAt,
      brand: narrative?.brand ?? null,
      narrativeTreeId: d.treeId,
      hasStrategy: d.tree.narratives.length > 0,
      hasDeliverable: !!deliverable,
      deliverableStatus: deliverable?.status ?? null,
    };
  });

  // Filter by brand
  if (brandId) {
    results = results.filter((d) => d.brand?.id === brandId);
  }

  // Filter by status
  if (status === "has_strategy") {
    results = results.filter((d) => d.hasStrategy);
  } else if (status === "has_content") {
    results = results.filter((d) => d.hasDeliverable);
  } else if (status === "approved") {
    results = results.filter((d) => d.deliverableStatus === "APPROVED");
  }

  return NextResponse.json(results);
}
