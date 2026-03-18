import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/brands — List brands (filtered by user access)
export const GET = apiHandler(async (_req, { session }) => {
  const where =
    session.user.role === "ADMIN"
      ? {}
      : {
          userAccess: {
            some: { userId: session.user.id },
          },
        };

  const brands = await prisma.brand.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      platforms: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(brands);
});

// POST /api/brands
export const POST = apiHandler(async (req, { session }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const body = await req.json();
  const { name, slug, clientId } = body;
  if (!name || !slug || !clientId) {
    return badRequest("name, slug, and clientId are required");
  }

  const brand = await prisma.brand.create({
    data: { name, slug, clientId },
  });

  return NextResponse.json(brand, { status: 201 });
});
