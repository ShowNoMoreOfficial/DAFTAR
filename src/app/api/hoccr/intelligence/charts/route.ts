import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { forbidden } from "@/lib/api-utils";
import type { Role } from "@prisma/client";

/**
 * GET /api/hoccr/intelligence/charts
 *
 * Returns real time-series data for:
 * - Company Velocity: tasks completed per week over the last 8 weeks
 * - Department Capacity: percentage workload per department
 */
export const GET = apiHandler(async (_req, { session }) => {
  const allowedRoles: Role[] = ["ADMIN", "HEAD_HR", "DEPT_HEAD"];
  if (!allowedRoles.includes(session.user.role as Role)) {
    return forbidden();
  }

  const now = new Date();

  // ── Company Velocity: batch query all completed tasks in last 8 weeks ──
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 8 * 7);

  const completedTasks = await prisma.task.findMany({
    where: {
      status: "DONE",
      completedAt: { gte: eightWeeksAgo, lt: now },
    },
    select: { completedAt: true },
  });

  const companyVelocity: { week: string; tasks: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const count = completedTasks.filter(
      (t) => t.completedAt! >= weekStart && t.completedAt! < weekEnd
    ).length;

    companyVelocity.push({
      week: weekEnd.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      tasks: count,
    });
  }

  // ── Department Capacity: batch query headcount + open tasks ──
  const [departments, headcountByDept, openTasksByDept] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true } }),
    prisma.user.groupBy({
      by: ["primaryDeptId"],
      _count: { id: true },
    }),
    prisma.task.groupBy({
      by: ["departmentId"],
      where: {
        status: { in: ["CREATED", "ASSIGNED", "IN_PROGRESS", "REVIEW"] },
      },
      _count: { id: true },
    }),
  ]);

  const headcountMap = new Map(
    headcountByDept
      .filter((h) => h.primaryDeptId != null)
      .map((h) => [h.primaryDeptId!, h._count.id])
  );
  const openTasksMap = new Map(
    openTasksByDept
      .filter((t) => t.departmentId != null)
      .map((t) => [t.departmentId!, t._count.id])
  );

  const departmentCapacity = departments.map((dept) => {
    const headcount = headcountMap.get(dept.id) ?? 0;
    const openTasks = openTasksMap.get(dept.id) ?? 0;
    const capacity =
      headcount > 0
        ? Math.min(100, Math.round((openTasks / headcount / 5) * 100))
        : 0;
    return { department: dept.name, capacity, headcount };
  });

  // ── Summary ──────────────────────────────────────────────────
  const totalVelocity = companyVelocity.reduce((s, w) => s + w.tasks, 0);
  const avgWeeklyVelocity = Math.round(totalVelocity / companyVelocity.length);
  const lastWeek = companyVelocity[companyVelocity.length - 1]?.tasks ?? 0;
  const prevWeek = companyVelocity[companyVelocity.length - 2]?.tasks ?? 0;

  const avgCapacity =
    departmentCapacity.length > 0
      ? Math.round(
          departmentCapacity.reduce((s, d) => s + d.capacity, 0) /
            departmentCapacity.length
        )
      : 0;

  return NextResponse.json({
    companyVelocity,
    departmentCapacity,
    summary: {
      avgWeeklyVelocity,
      velocityTrend: lastWeek > prevWeek ? "up" : lastWeek < prevWeek ? "down" : "stable",
      avgCapacity,
      overloadedDepts: departmentCapacity.filter((d) => d.capacity > 85).length,
    },
  });
});
