import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

// GET /api/gi/tiers
export const GET = apiHandler(async (_req, { session }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const tiers = await prisma.gITierAssignment.findMany();
  return NextResponse.json(tiers);
});

// PATCH /api/gi/tiers — Update tier for an action type
export const PATCH = apiHandler(async (req: NextRequest, { session }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

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
});
