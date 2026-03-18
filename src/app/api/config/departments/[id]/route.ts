import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params;

  const department = await prisma.department.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      config: true,
      workflows: {
        select: { id: true, name: true, stages: true, isDefault: true, isActive: true },
      },
    },
  });

  if (!department) return notFound("Department not found");
  return NextResponse.json(department);
});

export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) return notFound("Department not found");

  const body = await req.json();
  const { config } = body;

  const department = await prisma.department.update({
    where: { id },
    data: { config },
    select: {
      id: true,
      name: true,
      type: true,
      config: true,
    },
  });

  return NextResponse.json(department);
});
