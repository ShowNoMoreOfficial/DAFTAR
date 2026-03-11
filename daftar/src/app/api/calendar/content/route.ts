import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

// GET /api/calendar/content — Returns approved deliverables for calendar display
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");
  const platform = searchParams.get("platform");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: { in: ["APPROVED", "COMPLETED"] },
  };

  if (brandId) where.brandId = brandId;
  if (platform) where.platform = platform;

  if (startDate || endDate) {
    where.updatedAt = {};
    if (startDate) where.updatedAt.gte = new Date(startDate);
    if (endDate) where.updatedAt.lte = new Date(endDate);
  }

  const deliverables = await prisma.deliverable.findMany({
    where,
    select: {
      id: true,
      platform: true,
      pipelineType: true,
      status: true,
      updatedAt: true,
      tree: { select: { title: true } },
      brand: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 100,
  });

  const items = deliverables.map((d) => ({
    id: d.id,
    title: d.tree?.title ?? `${d.pipelineType} deliverable`,
    date: d.updatedAt.toISOString(),
    platform: d.platform,
    status: d.status.toLowerCase(),
    contentType: d.pipelineType,
    deliverableId: d.id,
    brand: d.brand?.name ?? null,
  }));

  return NextResponse.json(items);
}
