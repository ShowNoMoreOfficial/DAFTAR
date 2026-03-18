import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/users/:id
export const GET = apiHandler(async (_req, { session, params }) => {
  const { id } = params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      primaryDepartment: true,
      departments: { include: { department: true } },
      brandAccess: { include: { brand: true } },
    },
  });

  if (!user) return notFound("User not found");
  return NextResponse.json(user);
});

// PATCH /api/users/:id — Update user (Admin only)
export const PATCH = apiHandler(async (req, { session, params }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = params;
  const body = await req.json();
  const { name, role, primaryDeptId, isActive } = body;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(primaryDeptId !== undefined && { primaryDeptId }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(user);
});

// DELETE /api/users/:id — Deactivate user (Admin only)
export const DELETE = apiHandler(async (_req, { session, params }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = params;
  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(user);
});
