import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

/**
 * PATCH /api/ppc/recommendations/[id]
 * Mark a recommendation as applied.
 */
export const PATCH = apiHandler(async (_req: NextRequest, { session, params }) => {
  if (!["ADMIN", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  const { id } = params;

  const rec = await prisma.pPCRecommendation.findUnique({ where: { id } });
  if (!rec) return notFound("Recommendation not found");

  const updated = await prisma.pPCRecommendation.update({
    where: { id },
    data: {
      applied: true,
      appliedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
});
