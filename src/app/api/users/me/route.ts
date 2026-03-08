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
