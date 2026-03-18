import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/clients
export const GET = apiHandler(async (_req, { session }) => {
  if (!["ADMIN", "FINANCE"].includes(session.user.role)) return forbidden();

  const clients = await prisma.client.findMany({
    include: { brands: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
});

// POST /api/clients
export const POST = apiHandler(async (req, { session }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const body = await req.json();
  const { name, email, company } = body;
  if (!name) return badRequest("name is required");

  const client = await prisma.client.create({
    data: { name, email, company },
  });

  return NextResponse.json(client, { status: 201 });
});
