import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

// GET /api/yantri/stats — Dashboard stats
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const [
    totalTrees,
    incomingTrees,
    inProductionTrees,
    completedTrees,
    totalNarratives,
    totalBrands,
    recentTrees,
  ] = await Promise.all([
    prisma.narrativeTree.count(),
    prisma.narrativeTree.count({ where: { status: "INCOMING" } }),
    prisma.narrativeTree.count({ where: { status: "IN_PRODUCTION" } }),
    prisma.narrativeTree.count({ where: { status: "COMPLETED" } }),
    prisma.narrative.count(),
    prisma.brand.count(),
    prisma.narrativeTree.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { narratives: true } },
      },
    }),
  ]);

  return NextResponse.json({
    trees: {
      total: totalTrees,
      incoming: incomingTrees,
      inProduction: inProductionTrees,
      completed: completedTrees,
    },
    deliverables: totalNarratives,
    brands: totalBrands,
    recentActivity: recentTrees.map((t) => ({
      id: t.id,
      action: t.status === "INCOMING" ? "signal_received" :
              t.status === "IN_PRODUCTION" ? "in_production" :
              t.status === "COMPLETED" ? "completed" :
              t.status === "SKIPPED" ? "skipped" : "updated",
      title: t.title,
      urgency: t.urgency,
      createdBy: t.createdBy.name,
      deliverableCount: t._count.narratives,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
