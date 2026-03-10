import { prisma } from "@/lib/prisma";

export interface DepartmentVelocity {
  departmentId: string;
  departmentName: string;
  completedLast14Days: number;
  dailyAverage: number;
  weeklyAverage: number;
  /** Daily completion counts for the 14-day window, oldest first */
  dailyBreakdown: { date: string; count: number }[];
}

/**
 * Calculate task completion velocity for all departments over the last 14 days.
 * Counts tasks that moved to DONE (have a completedAt within the window).
 */
export async function calculateAllVelocities(): Promise<DepartmentVelocity[]> {
  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
  });

  return Promise.all(
    departments.map((dept) =>
      calculateDepartmentVelocity(dept.id, dept.name)
    )
  );
}

/**
 * Calculate velocity for a single department.
 */
export async function calculateDepartmentVelocity(
  departmentId: string,
  departmentName?: string
): Promise<DepartmentVelocity> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Resolve name if not provided
  if (!departmentName) {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { name: true },
    });
    departmentName = dept?.name ?? "Unknown";
  }

  // Fetch all tasks completed in the window for this department
  const completedTasks = await prisma.task.findMany({
    where: {
      departmentId,
      status: "DONE",
      completedAt: { gte: windowStart },
    },
    select: { completedAt: true },
  });

  // Build daily breakdown
  const dayCounts = new Map<string, number>();
  for (let d = 0; d < 14; d++) {
    const date = new Date(windowStart.getTime() + d * 24 * 60 * 60 * 1000);
    dayCounts.set(date.toISOString().slice(0, 10), 0);
  }

  for (const task of completedTasks) {
    if (!task.completedAt) continue;
    const dateKey = task.completedAt.toISOString().slice(0, 10);
    if (dayCounts.has(dateKey)) {
      dayCounts.set(dateKey, dayCounts.get(dateKey)! + 1);
    }
  }

  const dailyBreakdown = Array.from(dayCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const total = completedTasks.length;
  const dailyAverage = Math.round((total / 14) * 10) / 10;
  const weeklyAverage = Math.round((total / 2) * 10) / 10;

  return {
    departmentId,
    departmentName,
    completedLast14Days: total,
    dailyAverage,
    weeklyAverage,
    dailyBreakdown,
  };
}

/**
 * Persist the latest velocity snapshot to DepartmentMetrics.
 * Called periodically (e.g. from a cron job or event handler).
 */
export async function syncVelocityMetrics(): Promise<void> {
  const velocities = await calculateAllVelocities();

  for (const v of velocities) {
    await prisma.departmentMetrics.upsert({
      where: { departmentId: v.departmentId },
      create: {
        departmentId: v.departmentId,
        velocity: v.weeklyAverage,
        openBlockers: 0,
      },
      update: {
        velocity: v.weeklyAverage,
        recordedAt: new Date(),
      },
    });
  }
}
