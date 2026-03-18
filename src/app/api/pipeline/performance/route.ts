import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (_req: NextRequest) => {
  const [total, incoming, inProd, completed, skipped, narrativeCount] = await Promise.all([
    prisma.narrativeTree.count(),
    prisma.narrativeTree.count({ where: { status: "INCOMING" } }),
    prisma.narrativeTree.count({ where: { status: "IN_PRODUCTION" } }),
    prisma.narrativeTree.count({ where: { status: "COMPLETED" } }),
    prisma.narrativeTree.count({ where: { status: "SKIPPED" } }),
    prisma.narrative.count(),
  ]);

  return NextResponse.json({
    total,
    incoming,
    inProduction: inProd,
    completed,
    skipped,
    totalDeliverables: narrativeCount,
    approvalRate: total > 0 ? Math.round(((completed + inProd) / total) * 100) : 0,
  });
});
