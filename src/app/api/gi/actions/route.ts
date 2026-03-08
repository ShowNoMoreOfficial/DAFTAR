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
  const status = searchParams.get("status");
  const tier = searchParams.get("tier");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (tier) where.tier = parseInt(tier);

  // DEPT_HEAD can only see actions targeting their department members
  if (role === "DEPT_HEAD" && session.user.primaryDepartmentId) {
    const deptMembers = await prisma.user.findMany({
      where: { primaryDeptId: session.user.primaryDepartmentId },
      select: { id: true },
    });
    where.targetUserId = { in: deptMembers.map((m) => m.id) };
  }

  const [actions, stats] = await Promise.all([
    prisma.gIAutonomousAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.gIAutonomousAction.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const s of stats) {
    statusCounts[s.status] = s._count.id;
  }

  return NextResponse.json({
    actions,
    stats: {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      ...statusCounts,
    },
  });
}
