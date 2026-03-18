import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId") || session.user.primaryDepartmentId;
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = {
    createdAt: { gte: since },
  };
  if (departmentId) where.departmentId = departmentId;

  // Task stats
  const [totalTasks, completedTasks, overdueTasks, tasksByStatus, tasksByPriority] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: "DONE" } }),
    prisma.task.count({
      where: {
        ...where,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where,
      _count: true,
    }),
  ]);

  // Average completion time (for done tasks)
  const doneTasks = await prisma.task.findMany({
    where: { ...where, status: "DONE", completedAt: { not: null } },
    select: { createdAt: true, completedAt: true },
  });

  const avgCompletionMs = doneTasks.length > 0
    ? doneTasks.reduce((sum, t) => sum + (t.completedAt!.getTime() - t.createdAt.getTime()), 0) / doneTasks.length
    : 0;
  const avgCompletionHours = Math.round(avgCompletionMs / (1000 * 60 * 60) * 10) / 10;

  // Completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    totalTasks,
    completedTasks,
    overdueTasks,
    completionRate,
    avgCompletionHours,
    tasksByStatus: tasksByStatus.map((s) => ({ status: s.status, count: s._count })),
    tasksByPriority: tasksByPriority.map((p) => ({ priority: p.priority, count: p._count })),
  });
});
