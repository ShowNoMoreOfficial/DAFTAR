import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/users — List users (Admin, HEAD_HR only)
export const GET = apiHandler(async (_req, { session }) => {
  if (!["ADMIN", "HEAD_HR"].includes(session.user.role)) return forbidden();

  const users = await prisma.user.findMany({
    include: {
      primaryDepartment: { select: { id: true, name: true } },
      brandAccess: { include: { brand: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
});

// POST /api/users — Invite/create user (Admin only)
export const POST = apiHandler(async (req, { session }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const body = await req.json();
  const { email, name, role, primaryDeptId } = body;

  if (!email || !name || !role) {
    return badRequest("email, name, and role are required");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return badRequest("User with this email already exists");
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role,
      primaryDeptId: primaryDeptId || null,
      isActive: false, // Activated on first OAuth login
    },
  });

  return NextResponse.json(user, { status: 201 });
});
