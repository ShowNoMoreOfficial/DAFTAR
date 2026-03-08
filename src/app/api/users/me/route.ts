import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

// GET /api/users/me — Current user profile
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      primaryDepartment: true,
      brandAccess: { include: { brand: true } },
      sidebarPreference: true,
    },
  });

  return NextResponse.json(user);
}

// PATCH /api/users/me — Update current user profile
export async function PATCH(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { name } = body as { name?: string };

  const data: Record<string, unknown> = {};
  if (name && name.trim().length > 0) data.name = name.trim();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json(user);
}
