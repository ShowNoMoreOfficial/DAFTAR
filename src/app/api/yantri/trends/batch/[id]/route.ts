import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const batch = await prisma.trendBatch.findUnique({
    where: { id },
    include: {
      trends: {
        orderBy: { rank: "asc" },
        include: {
          editorialNarratives: {
            include: { brand: true },
            orderBy: { priority: "asc" },
          },
        },
      },
    },
  });
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(batch);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
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
}

// Reset batch: delete editorial narratives and reset trend statuses so Yantri can re-run
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
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
}
