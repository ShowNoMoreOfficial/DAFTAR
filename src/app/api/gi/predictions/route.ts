import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { generateInsights } from "@/lib/gi-engine";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const activeOnly = searchParams.get("active") !== "false";
  const refresh = searchParams.get("refresh") === "true";

  // Trigger prediction generation if requested
  if (refresh) {
    try {
      await generateInsights(session.user.id, {
        module: "dashboard",
        view: "predictions",
        entityId: null,
        userRole: session.user.role,
      });
    } catch {
      // Silent failure — predictions are best-effort
    }
  }

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (activeOnly) where.isActive = true;

  // Scope to department for DEPT_HEAD
  if (role === "DEPT_HEAD" && session.user.primaryDepartmentId) {
    where.OR = [
      { departmentId: session.user.primaryDepartmentId },
      { targetUserId: session.user.id },
    ];
  }

  const predictions = await prisma.gIPrediction.findMany({
    where,
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  // Aggregate stats
  const stats = {
    total: predictions.length,
    critical: predictions.filter((p) => p.severity === "critical").length,
    high: predictions.filter((p) => p.severity === "high").length,
    medium: predictions.filter((p) => p.severity === "medium").length,
    avgConfidence: predictions.length > 0
      ? Math.round((predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length) * 100)
      : 0,
    withAccuracy: predictions.filter((p) => p.accuracy !== null).length,
    avgAccuracy: (() => {
      const withAcc = predictions.filter((p) => p.accuracy !== null);
      return withAcc.length > 0
        ? Math.round((withAcc.reduce((s, p) => s + (p.accuracy ?? 0), 0) / withAcc.length) * 100)
        : null;
    })(),
    predictionTypes: [...new Set(predictions.map((p) => p.type))],
    methodology: {
      deadline_risk: "Compares estimated hours (historical pace x difficulty weight) against remaining time before deadline.",
      capacity_crunch: "Counts tasks due next week vs. 4-week average throughput; alerts when upcoming load exceeds 150% of average.",
      burnout_risk: "Flags team members with 10+ active tasks, sentiment below 2.5, and declining quality scores.",
    },
  };

  return NextResponse.json({ predictions, stats });
});

// POST /api/gi/predictions — Trigger fresh prediction generation
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const insights = await generateInsights(session.user.id, {
    module: "dashboard",
    view: "predictions",
    entityId: null,
    userRole: session.user.role,
  });

  // Count new predictions generated in this run
  const recentPredictions = await prisma.gIPrediction.findMany({
    where: {
      isActive: true,
      createdAt: { gte: new Date(Date.now() - 60 * 1000) }, // last 60 seconds
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    generated: true,
    insightsCount: insights.length,
    newPredictions: recentPredictions.length,
    predictions: recentPredictions,
  });
});
