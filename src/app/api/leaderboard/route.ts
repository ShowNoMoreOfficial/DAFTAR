import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const period = searchParams.get("period") || "30";
  const days = parseInt(period);

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get completed tasks per user in the period
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["MEMBER", "CONTRACTOR", "DEPT_HEAD"] } },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      primaryDepartment: { select: { name: true } },
      credibilityScore: true,
      assignedTasks: {
        where: {
          status: "DONE",
          completedAt: { gte: since },
        },
        select: {
          id: true,
          difficultyWeight: true,
          completedAt: true,
          createdAt: true,
          dueDate: true,
        },
      },
    },
  });

  const leaderboard = users.map((user) => {
    const completedTasks = user.assignedTasks;
    const totalPoints = completedTasks.reduce((sum, t) => sum + t.difficultyWeight, 0);
    const onTimeTasks = completedTasks.filter(
      (t) => !t.dueDate || (t.completedAt && t.completedAt <= t.dueDate)
    ).length;

    // Calculate streak: consecutive days with at least one completed task
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasCompletion = completedTasks.some((t) => {
        if (!t.completedAt) return false;
        return new Date(t.completedAt).toDateString() === checkDate.toDateString();
      });
      if (hasCompletion) streak++;
      else if (i > 0) break; // Streak broken
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        department: user.primaryDepartment?.name || null,
      },
      points: totalPoints,
      tasksCompleted: completedTasks.length,
      onTimeTasks,
      streak,
      credibilityScore: user.credibilityScore?.overallScore || 50,
    };
  });

  // Sort by points descending
  leaderboard.sort((a, b) => b.points - a.points);

  // Assign ranks
  const ranked = leaderboard.map((entry, i) => ({
    rank: i + 1,
    ...entry,
  }));

  return NextResponse.json(ranked);
});
