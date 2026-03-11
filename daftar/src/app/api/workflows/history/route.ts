import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

// GET /api/workflows/history — Historical learning cycle data
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const limit = parseInt(searchParams.get("limit") || "10");
  const skillPath = searchParams.get("skill");

  // Get learning log history
  const where: Record<string, unknown> = {};
  if (skillPath) where.skill = { path: skillPath };

  const learningLogs = await prisma.skillLearningLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      skill: { select: { path: true, name: true, domain: true } },
    },
  });

  // Get completed tests
  const completedTests = await prisma.strategyTest.findMany({
    where: { status: "completed" },
    orderBy: { endDate: "desc" },
    take: limit,
  });

  return NextResponse.json({
    learningLogs: learningLogs.map((l) => ({
      id: l.id,
      skill: l.skill.path,
      skillName: l.skill.name,
      entry: l.entry,
      source: l.source,
      periodStart: l.periodStart,
      periodEnd: l.periodEnd,
      createdAt: l.createdAt,
    })),
    completedTests,
  });
}
