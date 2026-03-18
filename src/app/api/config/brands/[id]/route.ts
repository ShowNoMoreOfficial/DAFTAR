import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params;

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
});

export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
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
});
