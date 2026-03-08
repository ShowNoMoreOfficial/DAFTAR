import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { isActive: true };
  if (category) where.category = category;

  const learnings = await prisma.gILearningLog.findMany({
    where,
    orderBy: [{ confidence: "desc" }, { lastObserved: "desc" }],
    take: 100,
  });

  // Group by category
  const byCategory: Record<string, typeof learnings> = {};
  for (const l of learnings) {
    if (!byCategory[l.category]) byCategory[l.category] = [];
    byCategory[l.category].push(l);
  }

  return NextResponse.json({
    learnings,
    byCategory,
    stats: {
      totalLearnings: learnings.length,
      categories: Object.keys(byCategory).length,
      avgConfidence: learnings.length > 0
        ? Math.round((learnings.reduce((s, l) => s + l.confidence, 0) / learnings.length) * 100)
        : 0,
      totalObservations: learnings.reduce((s, l) => s + l.observations, 0),
    },
  });
}
