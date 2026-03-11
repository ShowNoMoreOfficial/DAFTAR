import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";
import { runLearningCycle } from "@/lib/learning-loop";

// POST /api/analytics/learning-report — Trigger learning cycle and get report
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN" && session.user.role !== "DEPT_HEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { periodStart, periodEnd } = body;

  if (!periodStart || !periodEnd) {
    return badRequest("periodStart and periodEnd are required (ISO date strings)");
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return badRequest("Invalid date format");
  }

  const result = await runLearningCycle(start, end);

  return NextResponse.json({
    success: true,
    report: result,
  });
}
