import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, badRequest, notFound } from "@/lib/api-utils";

// POST /api/brands/:id/platforms — Add platform to brand
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const body = await req.json();
  const { platform, config } = body;

  if (!platform) return badRequest("platform is required");

  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) return notFound("Brand not found");

  const existing = await prisma.brandPlatform.findUnique({
    where: { brandId_platform: { brandId: id, platform } },
  });

  if (existing) {
    // Update existing platform
    const updated = await prisma.brandPlatform.update({
      where: { id: existing.id },
      data: { config: config || existing.config, isActive: true },
    });
    return NextResponse.json(updated);
  }

  const brandPlatform = await prisma.brandPlatform.create({
    data: {
      brandId: id,
      platform,
      config: config || null,
    },
  });

  return NextResponse.json(brandPlatform, { status: 201 });
}
