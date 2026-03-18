import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

// GET /api/workflows/active — List active strategy tests and recent executions
export const GET = apiHandler(async () => {
  const [activeTests, recentExecutions] = await Promise.all([
    prisma.strategyTest.findMany({
      where: { status: "active" },
      orderBy: { startDate: "desc" },
    }),
    prisma.skillExecution.findMany({
      orderBy: { executedAt: "desc" },
      take: 20,
      include: {
        skill: { select: { path: true, name: true, domain: true } },
      },
    }),
  ]);

  return NextResponse.json({
    activeTests,
    recentExecutions: recentExecutions.map((e) => ({
      id: e.id,
      skill: e.skill.path,
      platform: e.platform,
      score: e.performanceScore,
      durationMs: e.durationMs,
      executedAt: e.executedAt,
    })),
  });
});
