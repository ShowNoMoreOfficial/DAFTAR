import { NextRequest, NextResponse } from "next/server";
import { forbidden } from "@/lib/api-utils";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import { apiHandler } from "@/lib/api-handler";

// GET /api/skills/performance — Skill performance leaderboard
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  if (!["ADMIN", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  const { searchParams } = new URL(req.url);
  const skillPath = searchParams.get("skillPath") ?? undefined;

  const performance = await skillOrchestrator.getSkillPerformance(skillPath);

  // Sort by total executions descending
  performance.sort((a, b) => b.totalExecutions - a.totalExecutions);

  return NextResponse.json({
    performance,
    total: performance.length,
  });
});
