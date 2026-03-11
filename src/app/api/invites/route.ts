import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, badRequest, handleApiError } from "@/lib/api-utils";

// GET /api/invites — list all invites (admin/HR only)
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (!["ADMIN", "HEAD_HR"].includes(session.user.role)) return forbidden();

  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(invites);
}

// POST /api/invites — create a new invite
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (!["ADMIN", "HEAD_HR"].includes(session.user.role)) return forbidden();

  try {
  const body = await req.json();
  const { email, role, departmentId } = body;

  if (!email || !email.includes("@")) {
    return badRequest("Valid email is required");
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return badRequest("A user with this email already exists");
  }

  // Check for pending invite to same email
  const existingInvite = await prisma.invite.findFirst({
    where: { email, status: "PENDING" },
  });
  if (existingInvite) {
    return badRequest("A pending invite already exists for this email");
  }

  // Expiry: 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.invite.create({
    data: {
      email: email.toLowerCase().trim(),
      role: role || "MEMBER",
      departmentId: departmentId || null,
      invitedById: session.user.id,
      expiresAt,
    },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  // Create the User stub so OAuth signIn callback allows login
  await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name: email.split("@")[0],
      role: role || "MEMBER",
      primaryDeptId: departmentId || null,
      isActive: false,
    },
  });

  return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/invites — revoke an invite
export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (!["ADMIN", "HEAD_HR"].includes(session.user.role)) return forbidden();

  const body = await req.json();
  const { id, action } = body;

  if (!id || action !== "revoke") {
    return badRequest("id and action='revoke' are required");
  }

  const invite = await prisma.invite.findUnique({ where: { id } });
  if (!invite || invite.status !== "PENDING") {
    return badRequest("Invite not found or not pending");
  }

  const updated = await prisma.invite.update({
    where: { id },
    data: { status: "REVOKED" },
  });

  // Also deactivate the user stub if they haven't signed in yet
  await prisma.user.updateMany({
    where: { email: invite.email, isActive: false },
    data: { isActive: false },
  });

  return NextResponse.json(updated);
}
