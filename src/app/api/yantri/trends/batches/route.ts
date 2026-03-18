import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async () => {
  const batches = await prisma.trendBatch.findMany({
    orderBy: { importedAt: "desc" },
    include: {
      trends: {
        orderBy: { rank: "asc" },
        include: { narratives: { select: { id: true } } },
      },
    },
  });
  return NextResponse.json(batches);
});
