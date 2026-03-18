import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/departments/:id
export const GET = apiHandler(async (_req: NextRequest, { session, params }) => {
  const { id } = params;

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        },
      },
      primaryUsers: {
        select: { id: true, name: true, email: true, avatar: true, role: true },
      },
      projects: {
        select: { id: true, name: true, status: true, _count: { select: { members: true } } },
      },
      _count: { select: { members: true, primaryUsers: true, projects: true } },
    },
  });

  if (!department) return notFound("Department not found");

  return NextResponse.json(department);
});

// PATCH /api/departments/:id
export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = params;
  const body = await req.json();
  const { name, type, description, headId, config } = body;

  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) return notFound("Department not found");

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (type !== undefined) data.type = type;
  if (description !== undefined) data.description = description;
  if (headId !== undefined) data.headId = headId || null;
  if (config !== undefined) data.config = config;

  const department = await prisma.department.update({
    where: { id },
    data,
    include: {
      _count: { select: { members: true, primaryUsers: true } },
    },
  });

  return NextResponse.json(department);
});

// DELETE /api/departments/:id
export const DELETE = apiHandler(async (_req: NextRequest, { session, params }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = params;

  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) return notFound("Department not found");

  // Remove department members first
  await prisma.departmentMember.deleteMany({ where: { departmentId: id } });
  await prisma.department.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
