import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, badRequest } from "@/lib/api-utils";

// GET /api/clients
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (!["ADMIN", "FINANCE"].includes(session.user.role)) return forbidden();

  const clients = await prisma.client.findMany({
    include: { brands: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

// POST /api/clients
export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const body = await req.json();
  const { name, email, company } = body;
  if (!name) return badRequest("name is required");

  const client = await prisma.client.create({
    data: { name, email, company },
  });

  return NextResponse.json(client, { status: 201 });
}
