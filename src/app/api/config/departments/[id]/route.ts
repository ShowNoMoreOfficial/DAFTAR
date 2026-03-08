import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

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
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
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
}
