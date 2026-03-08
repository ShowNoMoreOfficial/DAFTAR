import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get credibility score
  const score = await prisma.credibilityScore.findUnique({
    where: { userId },
  });

  // Get task stats for breakdown
  const [totalTasks, doneTasks, recentTasks] = await Promise.all([
    prisma.task.count({ where: { assigneeId: userId } }),
    prisma.task.count({ where: { assigneeId: userId, status: "DONE" } }),
    prisma.task.findMany({
      where: { assigneeId: userId, status: "DONE" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        dueDate: true,
        updatedAt: true,
        difficultyWeight: true,
        priority: true,
      },
    }),
  ]);

  // Get streak data
  const streak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  // Compute on-time percentage
  const onTimePct =
    score && score.tasksCompleted > 0
      ? Math.round((score.tasksOnTime / score.tasksCompleted) * 100)
      : 0;

  // Determine recent task delivery status
  const recentDeliveries = recentTasks.map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.dueDate?.toISOString() || null,
    completedAt: t.updatedAt.toISOString(),
    onTime: t.dueDate ? t.updatedAt <= t.dueDate : true,
    weight: t.difficultyWeight,
    priority: t.priority,
  }));

  return NextResponse.json({
    score: score
      ? {
          reliability: Math.round(score.reliability),
          quality: Math.round(score.quality),
          consistency: Math.round(score.consistency),
          overall: Math.round(score.overallScore),
          tasksCompleted: score.tasksCompleted,
          tasksOnTime: score.tasksOnTime,
          tasksLate: score.tasksLate,
          onTimePct,
        }
      : {
          reliability: 50,
          quality: 50,
          consistency: 50,
          overall: 50,
          tasksCompleted: 0,
          tasksOnTime: 0,
          tasksLate: 0,
          onTimePct: 0,
        },
    stats: {
      totalTasks,
      doneTasks,
      inProgressTasks: totalTasks - doneTasks,
    },
    streak: streak
      ? {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          totalXp: streak.totalXp,
          level: streak.level,
        }
      : { currentStreak: 0, longestStreak: 0, totalXp: 0, level: 1 },
    recentDeliveries,
  });
}
