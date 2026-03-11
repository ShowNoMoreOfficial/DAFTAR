import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden } from "@/lib/api-utils";
import type { Role } from "@prisma/client";

/**
 * GET /api/hoccr/intelligence/charts
 *
 * Returns real time-series data for:
 * - Company Velocity: tasks completed per week over the last 8 weeks
 * - Department Capacity: percentage workload per department
 */
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const allowedRoles: Role[] = ["ADMIN", "HEAD_HR", "DEPT_HEAD"];
  if (!allowedRoles.includes(session.user.role as Role)) {
    return forbidden();
  }

  const now = new Date();

  // ── Company Velocity: real tasks completed per week ──────────
  const companyVelocity: { week: string; tasks: number }[] = [];

  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const count = await prisma.task.count({
      where: {
        status: "DONE",
        completedAt: { gte: weekStart, lt: weekEnd },
      },
    });

    companyVelocity.push({
      week: weekEnd.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      tasks: count,
    });
  }

  // ── Department Capacity: open tasks / headcount ──────────────
  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
  });

  const departmentCapacity = await Promise.all(
    departments.map(async (dept) => {
      const headcount = await prisma.user.count({
        where: { primaryDeptId: dept.id },
      });

      const openTasks = await prisma.task.count({
        where: {
          departmentId: dept.id,
          status: { in: ["CREATED", "ASSIGNED", "IN_PROGRESS", "REVIEW"] },
        },
      });

      // Capacity = open tasks per person (scaled to 0–100)
      // 5 open tasks per person = 100% capacity
      const capacity =
        headcount > 0
          ? Math.min(100, Math.round((openTasks / headcount / 5) * 100))
          : 0;

      return { department: dept.name, capacity, headcount };
    })
  );

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
}
