import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const brand = await prisma.brand.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      config: true,
      platforms: {
        select: { id: true, platform: true, config: true, isActive: true },
      },
    },
  });

  if (!brand) return notFound("Brand not found");
  return NextResponse.json(brand);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) return notFound("Brand not found");

  const body = await req.json();
  const { config } = body;

  const brand = await prisma.brand.update({
    where: { id },
    data: { config },
    select: {
      id: true,
      name: true,
      slug: true,
      config: true,
    },
  });

  return NextResponse.json(brand);
}
