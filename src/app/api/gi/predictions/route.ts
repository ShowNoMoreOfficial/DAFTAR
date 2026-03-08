import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const activeOnly = searchParams.get("active") !== "false";

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
  };

  return NextResponse.json({ predictions, stats });
}
