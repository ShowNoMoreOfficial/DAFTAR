import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

const CAPACITY_THRESHOLD = 40; // max weighted capacity per user

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId");

  const userFilter: Record<string, unknown> = {
    isActive: true,
    role: { in: ["MEMBER", "DEPT_HEAD", "CONTRACTOR"] },
  };

  if (departmentId) {
    userFilter.primaryDeptId = departmentId;
  } else if (role === "DEPT_HEAD" && session.user.primaryDepartmentId) {
    userFilter.primaryDeptId = session.user.primaryDepartmentId;
  }

  const users = await prisma.user.findMany({
    where: userFilter,
    select: {
      id: true,
      name: true,
      avatar: true,
      primaryDeptId: true,
      assignedTasks: {
        where: { status: { notIn: ["DONE", "CANCELLED"] } },
        select: { id: true, difficultyWeight: true, priority: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const capacityData = users.map((user) => {
    const activeTaskCount = user.assignedTasks.length;
    const totalWeight = user.assignedTasks.reduce(
      (sum, t) => sum + t.difficultyWeight,
      0
    );
    const utilizationPct = Math.min(
      Math.round((totalWeight / CAPACITY_THRESHOLD) * 100),
      150
    );

    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      departmentId: user.primaryDeptId,
      activeTaskCount,
      totalWeight,
      utilizationPct,
      status:
        utilizationPct > 90
          ? "overloaded"
          : utilizationPct > 70
          ? "busy"
          : "available",
    };
  });

  // Sort: available first for recommendations
  const recommended = [...capacityData]
    .filter((u) => u.status === "available")
    .sort((a, b) => a.utilizationPct - b.utilizationPct)
    .slice(0, 5);

  return NextResponse.json({
    capacity: capacityData,
    recommended,
    summary: {
      totalUsers: capacityData.length,
      available: capacityData.filter((u) => u.status === "available").length,
      busy: capacityData.filter((u) => u.status === "busy").length,
      overloaded: capacityData.filter((u) => u.status === "overloaded").length,
    },
  });
}
