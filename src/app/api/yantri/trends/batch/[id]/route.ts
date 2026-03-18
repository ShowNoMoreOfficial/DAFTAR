import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (_request, { params }) => {
  const { id } = params;
  const batch = await prisma.trendBatch.findUnique({
    where: { id },
    include: {
      trends: {
        orderBy: { rank: "asc" },
        include: {
          narratives: {
            orderBy: { priority: "asc" },
          },
        },
      },
    },
  });
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(batch);
});

export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = params;
  // Delete editorial narratives for all trends in this batch
  const trends = await prisma.importedTrend.findMany({
    where: { batchId: id },
    select: { id: true },
  });
  const trendIds = trends.map((t) => t.id);

  await prisma.editorialNarrative.deleteMany({ where: { trendId: { in: trendIds } } });
  await prisma.importedTrend.deleteMany({ where: { batchId: id } });
  await prisma.trendBatch.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});

// Reset batch: delete editorial narratives and reset trend statuses so Yantri can re-run
export const PUT = apiHandler(async (_request, { params }) => {
  const { id } = params;
  const trends = await prisma.importedTrend.findMany({
    where: { batchId: id },
    select: { id: true },
  });
  const trendIds = trends.map((t) => t.id);

  await prisma.editorialNarrative.deleteMany({ where: { trendId: { in: trendIds } } });
  await prisma.importedTrend.updateMany({
    where: { batchId: id },
    data: { status: "pending", skipReason: null },
  });

  return NextResponse.json({ ok: true });
});
