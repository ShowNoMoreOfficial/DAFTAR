import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden } from "@/lib/api-utils";

// GET /api/gi/tiers
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const tiers = await prisma.gITierAssignment.findMany();
  return NextResponse.json(tiers);
}

// PATCH /api/gi/tiers — Update tier for an action type
export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const body = await req.json();
  const { id, tier } = body as { id: string; tier: number };

  if (!id || typeof tier !== "number" || tier < 1 || tier > 4) {
    return NextResponse.json(
      { error: "Invalid request. Provide id (string) and tier (1-4)." },
      { status: 400 }
    );
  }

  const updated = await prisma.gITierAssignment.update({
    where: { id },
    data: { tier },
  });

  return NextResponse.json(updated);
}
