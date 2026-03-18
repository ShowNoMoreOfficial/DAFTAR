import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { computeCapacity } from "@/lib/hoccr/capacity-engine";
import type { TaskPriority } from "@prisma/client";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
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
      primaryDepartment: { select: { id: true, name: true } },
      assignedTasks: {
        where: { status: { notIn: ["DONE", "CANCELLED"] } },
        select: { id: true, priority: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const capacityData = users.map((user) => {
    const result = computeCapacity(
      user.id,
      user.assignedTasks as { id: string; priority: TaskPriority }[]
    );
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      departmentId: user.primaryDeptId,
      departmentName: user.primaryDepartment?.name ?? null,
      activeTaskCount: result.activeTaskCount,
      utilizationPct: result.capacityLoad,
      breakdown: result.breakdown,
      status: result.status === "critical" ? "overloaded" : result.status,
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
});
