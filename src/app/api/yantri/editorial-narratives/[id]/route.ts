import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (_request, { params }) => {
  const { id } = params;
  const narrative = await prisma.editorialNarrative.findUnique({
    where: { id },
    include: { trend: true },
  });
  if (!narrative) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const brand = await prisma.brand.findUnique({ where: { id: narrative.brandId } });

  return NextResponse.json({ ...narrative, brand });
});

export const PUT = apiHandler(async (request, { params }) => {
  const { id } = params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.researchResults !== undefined) data.researchResults = body.researchResults;
  if (body.finalContent !== undefined) data.finalContent = body.finalContent;
  if (body.angle !== undefined) data.angle = body.angle;
  if (body.platform !== undefined) data.platform = body.platform;
  if (body.brandId !== undefined) data.brandId = body.brandId;
  if (body.packageData !== undefined) data.packageData = body.packageData;

  const narrative = await prisma.editorialNarrative.update({
    where: { id },
    data,
    include: { trend: true },
  });

  const brand = await prisma.brand.findUnique({ where: { id: narrative.brandId } });

  // Log status changes
  if (body.status) {
    await prisma.editorialLog.create({
      data: {
        action: body.status === "killed" ? "killed" : body.status === "published" ? "published" : "override",
        reasoning: body.reason || `Status changed to ${body.status}`,
        trendHeadline: narrative.trend.headline,
        narrativeAngle: narrative.angle,
        platform: narrative.platform,
        brandName: brand?.name ?? "Unknown Brand",
      },
    });
  }

  return NextResponse.json({ ...narrative, brand });
});
