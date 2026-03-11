import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    include: { brand: true, trend: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(narratives);
}
