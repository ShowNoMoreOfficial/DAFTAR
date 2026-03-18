import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

/**
 * POST /api/credibility/recalculate
 * Recalculate credibility scores for all active users.
 * Admin-only.
 */
export const POST = apiHandler(async () => {
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { notIn: ["CLIENT"] } },
    select: { id: true },
  });

  let updated = 0;

  for (const { id: userId } of users) {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId, status: "DONE" },
      select: { dueDate: true, completedAt: true, difficultyWeight: true },
    });

    if (tasks.length === 0) continue;

    let onTime = 0;
    let late = 0;
    let totalWeight = 0;
    let onTimeWeight = 0;

    for (const t of tasks) {
      totalWeight += t.difficultyWeight;
      if (t.dueDate && t.completedAt) {
        if (t.completedAt <= t.dueDate) {
          onTime++;
          onTimeWeight += t.difficultyWeight;
        } else {
          late++;
        }
      } else {
        onTime++; // No due date counts as on-time
        onTimeWeight += t.difficultyWeight;
      }
    }

    const reliability = tasks.length > 0 ? Math.min(100, (onTime / tasks.length) * 100) : 50;

    // Quality: weighted by difficulty
    const quality = totalWeight > 0 ? Math.min(100, (onTimeWeight / totalWeight) * 100) : 50;

    // Consistency: based on recent 30-day activity spread
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTasks = await prisma.task.count({
      where: { assigneeId: userId, status: "DONE", completedAt: { gte: thirtyDaysAgo } },
    });

    const consistency = Math.min(100, recentTasks * 5); // 20 tasks/month = 100

    const overallScore = Math.round(reliability * 0.4 + quality * 0.35 + consistency * 0.25);

    await prisma.credibilityScore.upsert({
      where: { userId },
      create: {
        userId,
        reliability,
        quality,
        consistency,
        overallScore,
        tasksCompleted: tasks.length,
        tasksOnTime: onTime,
        tasksLate: late,
      },
      update: {
        reliability,
        quality,
        consistency,
        overallScore,
        tasksCompleted: tasks.length,
        tasksOnTime: onTime,
        tasksLate: late,
      },
    });

    updated++;
  }

  return NextResponse.json({ ok: true, usersUpdated: updated });
}, { requireAdmin: true });
