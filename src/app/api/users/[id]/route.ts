import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, notFound } from "@/lib/api-utils";

// GET /api/users/:id
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;
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
}

// PATCH /api/users/:id — Update user (Admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = await params;
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
}

// DELETE /api/users/:id — Deactivate user (Admin only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(user);
}
