import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound, badRequest } from "@/lib/api-utils";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import { apiHandler } from "@/lib/api-handler";

// GET /api/skills/[path] — Get skill detail + learning logs + recent executions
export const GET = apiHandler(async (_req: NextRequest, { session, params }) => {
  if (!["ADMIN", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  const { path: skillPath } = params;
  const decodedPath = decodeURIComponent(skillPath);

  const skill = await prisma.skill.findUnique({
    where: { path: decodedPath },
    include: {
      learningLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      executions: {
        orderBy: { executedAt: "desc" },
        take: 20,
        select: {
          id: true,
          brandId: true,
          platform: true,
          modelUsed: true,
          durationMs: true,
          performanceScore: true,
          status: true,
          executedAt: true,
        },
      },
      _count: { select: { executions: true, learningLogs: true } },
    },
  });

  if (!skill) return notFound("Skill not found");

  // Try to load the raw file content
  let fileContent: string | null = null;
  try {
    const loaded = await skillOrchestrator.loadSkill(decodedPath);
    fileContent = loaded.rawContent;
  } catch {
    // File might not exist on disk yet
  }

  return NextResponse.json({ skill, fileContent });
});

// PATCH /api/skills/[path]/learning-log — Add manual learning log entry
export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const { path: skillPath } = params;
  const decodedPath = decodeURIComponent(skillPath);

  const body = await req.json();
  const { entry, periodStart, periodEnd } = body;

  if (!entry) return badRequest("Learning log entry is required");

  const skill = await prisma.skill.findUnique({
    where: { path: decodedPath },
  });
  if (!skill) return notFound("Skill not found");

  const log = await prisma.skillLearningLog.create({
    data: {
      skillId: skill.id,
      entry: entry as object,
      source: "manual",
      periodStart: periodStart ? new Date(periodStart) : new Date(),
      periodEnd: periodEnd ? new Date(periodEnd) : new Date(),
    },
  });

  return NextResponse.json(log);
});
