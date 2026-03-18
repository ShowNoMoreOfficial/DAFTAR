import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

// GET /api/m/yantri/narrative-trees - redirects to real data
export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  const trees = await prisma.narrativeTree.findMany({
    where,
    include: {
      _count: { select: { narratives: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Map to the shape the old pages expect
  return NextResponse.json(trees.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    branchCount: t._count.narratives,
    signalCount: 0,
    lastUpdated: t.updatedAt.toISOString(),
    summary: t.summary,
  })));
});
