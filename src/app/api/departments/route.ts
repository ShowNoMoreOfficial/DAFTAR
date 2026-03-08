import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, badRequest } from "@/lib/api-utils";

// GET /api/departments
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { members: true, primaryUsers: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(departments);
}

// POST /api/departments — Create department (Admin only)
export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const body = await req.json();
  const { name, type, description } = body;

  if (!name || !type) return badRequest("name and type are required");

  const department = await prisma.department.create({
    data: { name, type, description },
  });

  return NextResponse.json(department, { status: 201 });
}
