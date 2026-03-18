import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/departments
export const GET = apiHandler(async (_req, { session }) => {
  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { members: true, primaryUsers: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(departments);
});

// POST /api/departments — Create department (Admin only)
export const POST = apiHandler(async (req, { session }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const body = await req.json();
  const { name, type, description } = body;

  if (!name || !type) return badRequest("name and type are required");

  const department = await prisma.department.create({
    data: { name, type, description },
  });

  return NextResponse.json(department, { status: 201 });
});
