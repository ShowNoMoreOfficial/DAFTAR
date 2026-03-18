import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (_req: NextRequest) => {
  const trees = await prisma.narrativeTree.findMany({
    where: { status: { in: ["INCOMING", "EVALUATING", "APPROVED", "IN_PRODUCTION"] } },
    include: {
      narratives: {
        select: { id: true, platform: true, status: true, brandId: true },
      },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(trees.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    urgency: t.urgency,
    createdBy: t.createdBy.name,
    createdAt: t.createdAt.toISOString(),
    deliverables: t.narratives.length,
    platforms: [...new Set(t.narratives.map((n) => n.platform))],
  })));
});
