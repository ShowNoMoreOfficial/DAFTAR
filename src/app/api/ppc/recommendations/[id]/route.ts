import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  forbidden,
  notFound,
  handleApiError,
} from "@/lib/api-utils";

/**
 * PATCH /api/ppc/recommendations/[id]
 * Mark a recommendation as applied.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!["ADMIN", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  const { id } = await params;

  try {
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
  } catch (error) {
    return handleApiError(error);
  }
}
