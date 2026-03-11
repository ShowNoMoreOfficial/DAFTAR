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

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Scope to department for DEPT_HEAD
  const deptFilter: Record<string, unknown> =
    role === "DEPT_HEAD" && session.user.primaryDepartmentId
      ? { departmentId: session.user.primaryDepartmentId }
      : {};

  const [
    activeTasks,
    completedLast30,
    totalLast30,
    overdueTasks,
    completedWithTime,
    deptBreakdown,
  ] = await Promise.all([
    // Active tasks (not DONE, not CANCELLED)
    prisma.task.count({
      where: { ...deptFilter, status: { notIn: ["DONE", "CANCELLED"] } },
    }),
    // Completed in last 30 days
    prisma.task.count({
      where: { ...deptFilter, status: "DONE", completedAt: { gte: thirtyDaysAgo } },
    }),
    // Total tasks created in last 30 days
    prisma.task.count({
      where: { ...deptFilter, createdAt: { gte: thirtyDaysAgo } },
    }),
    // Overdue tasks
    prisma.task.count({
      where: {
        ...deptFilter,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { lt: now },
      },
    }),
    // Completed tasks with time data for avg completion time
    prisma.task.findMany({
      where: {
        ...deptFilter,
        status: "DONE",
        completedAt: { gte: thirtyDaysAgo },
        startedAt: { not: null },
      },
      select: { startedAt: true, completedAt: true },
    }),
    // Department breakdown
    prisma.department.findMany({
      where: role === "DEPT_HEAD" && session.user.primaryDepartmentId
        ? { id: session.user.primaryDepartmentId }
        : undefined,
      select: {
        id: true,
        name: true,
        tasks: {
          select: { status: true, dueDate: true, completedAt: true, createdAt: true },
        },
      },
    }),
  ]);

  // Avg completion time in hours
  let avgCompletionHours = 0;
  if (completedWithTime.length > 0) {
    const totalHours = completedWithTime.reduce((sum, t) => {
      const start = t.startedAt!.getTime();
      const end = t.completedAt!.getTime();
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0);
    avgCompletionHours = Math.round((totalHours / completedWithTime.length) * 10) / 10;
  }

  const completionRate =
    totalLast30 > 0 ? Math.round((completedLast30 / totalLast30) * 100) : 0;

  // Department breakdown
  const departments = deptBreakdown.map((dept) => {
    const active = dept.tasks.filter(
      (t) => !["DONE", "CANCELLED"].includes(t.status)
    ).length;
    const completedInPeriod = dept.tasks.filter(
      (t) => t.status === "DONE" && t.completedAt && t.completedAt >= thirtyDaysAgo
    ).length;
    const totalInPeriod = dept.tasks.filter(
      (t) => t.createdAt >= thirtyDaysAgo
    ).length;
    const overdue = dept.tasks.filter(
      (t) =>
        !["DONE", "CANCELLED"].includes(t.status) &&
        t.dueDate &&
        t.dueDate < now
    ).length;
    return {
      id: dept.id,
      name: dept.name,
      activeTasks: active,
      completed30d: completedInPeriod,
      completionRate: totalInPeriod > 0 ? Math.round((completedInPeriod / totalInPeriod) * 100) : 0,
      overdue,
    };
  });

  // Top bottlenecks: tasks in REVIEW for >24hrs
  const reviewBottlenecks = await prisma.task.findMany({
    where: {
      ...deptFilter,
      status: "REVIEW",
      updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true, title: true, assigneeId: true, departmentId: true, updatedAt: true },
    take: 5,
  });

  // Team capacity overview
  const teamCapacity = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["MEMBER", "DEPT_HEAD", "CONTRACTOR"] },
      ...(role === "DEPT_HEAD" && session.user.primaryDepartmentId
        ? { primaryDeptId: session.user.primaryDepartmentId }
        : {}),
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      _count: {
        select: {
          assignedTasks: {
            where: { status: { notIn: ["DONE", "CANCELLED"] } },
          },
        },
      },
    },
    orderBy: { assignedTasks: { _count: "desc" } },
    take: 20,
  });

  return NextResponse.json({
    kpis: {
      activeTasks,
      completionRate,
      avgCompletionHours,
      overdueTasks,
    },
    departments,
    reviewBottlenecks: reviewBottlenecks.map((t) => ({
      id: t.id,
      title: t.title,
      type: "approval_delayed",
      severity: "high",
      staleHours: Math.round((now.getTime() - t.updatedAt.getTime()) / (1000 * 60 * 60)),
    })),
    teamCapacity: teamCapacity.map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      activeTaskCount: u._count.assignedTasks,
    })),
  });
}
