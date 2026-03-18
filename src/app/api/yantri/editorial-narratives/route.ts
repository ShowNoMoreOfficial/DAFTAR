import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const brandId = searchParams.get("brandId");
  const platform = searchParams.get("platform");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (brandId) where.brandId = brandId;
  if (platform) where.platform = platform;

  const narratives = await prisma.editorialNarrative.findMany({
    where,
    include: { trend: true },
    orderBy: { createdAt: "desc" },
  });

  // Fetch brands for all narratives (no brand relation on EditorialNarrative)
  const uniqueBrandIds = [...new Set(narratives.map((n) => n.brandId))];
  const brands = await prisma.brand.findMany({
    where: { id: { in: uniqueBrandIds } },
  });
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  const results = narratives.map((n) => ({
    ...n,
    brand: brandMap.get(n.brandId) ?? null,
  }));

  return NextResponse.json(results);
});
