import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, notFound } from "@/lib/api-utils";

// PUT /api/brands/:id/platforms/:platformId — Update platform config
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; platformId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const { id, platformId } = await params;

  const bp = await prisma.brandPlatform.findFirst({
    where: { id: platformId, brandId: id },
  });
  if (!bp) return notFound("Brand platform not found");

  const body = await req.json();
  const { config, isActive } = body;

  const updated = await prisma.brandPlatform.update({
    where: { id: platformId },
    data: {
      ...(config !== undefined && { config }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/brands/:id/platforms/:platformId — Remove platform from brand
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; platformId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const { id, platformId } = await params;

  const bp = await prisma.brandPlatform.findFirst({
    where: { id: platformId, brandId: id },
  });
  if (!bp) return notFound("Brand platform not found");

  await prisma.brandPlatform.delete({ where: { id: platformId } });

  return NextResponse.json({ success: true });
}
