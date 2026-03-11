import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, badRequest, handleApiError } from "@/lib/api-utils";

// GET /api/users — List users (Admin, HEAD_HR only)
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (!["ADMIN", "HEAD_HR"].includes(session.user.role)) return forbidden();

  const users = await prisma.user.findMany({
    include: {
      primaryDepartment: { select: { id: true, name: true } },
      brandAccess: { include: { brand: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// POST /api/users — Invite/create user (Admin only)
export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  try {
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
  } catch (error) {
    return handleApiError(error);
  }
}
