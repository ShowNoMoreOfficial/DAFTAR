import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, badRequest, notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// POST /api/brands/:id/platforms — Add platform to brand
export const POST = apiHandler(async (req: NextRequest, { session, params }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = params;
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
});
