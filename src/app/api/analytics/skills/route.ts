import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { skillOrchestrator } from "@/lib/skill-orchestrator";

// GET /api/analytics/skills — Skill performance dashboard
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const skillPath = searchParams.get("skill");
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  if (skillPath) {
    // Single skill detail
    const perf = await skillOrchestrator.getSkillPerformance(skillPath);
    const recentExecutions = await prisma.skillExecution.findMany({
      where: {
        skill: { path: skillPath },
        executedAt: { gte: since },
      },
      orderBy: { executedAt: "desc" },
      take: 20,
      select: {
        id: true,
        platform: true,
        performanceScore: true,
        durationMs: true,
        executedAt: true,
      },
    });

    const learningLogs = await prisma.skillLearningLog.findMany({
      where: { skill: { path: skillPath } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      skillPath,
      performance: perf,
      recentExecutions,
      learningLogs,
    });
  }

  // All skills overview
  const skills = await prisma.skill.findMany({
    include: {
      _count: { select: { executions: true, learningLogs: true } },
    },
    orderBy: { path: "asc" },
  });

  const skillStats = await Promise.all(
    skills.map(async (s) => {
      const perf = await skillOrchestrator.getSkillPerformance(s.path);
      return {
        path: s.path,
        domain: s.domain,
        name: s.name,
        totalExecutions: s._count.executions,
        learningLogEntries: s._count.learningLogs,
        ...perf,
      };
    })
  );

  return NextResponse.json({ skills: skillStats, period: { days } });
}
