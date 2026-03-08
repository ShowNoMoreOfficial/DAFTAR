import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, badRequest } from "@/lib/api-utils";

// GET /api/brands — List brands (filtered by user access)
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

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
}

// POST /api/brands
export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
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
}
