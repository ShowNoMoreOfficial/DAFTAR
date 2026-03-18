import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getLeaderboard } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId");

  if (departmentId) {
    // Get users in this department
    const deptUsers = await prisma.user.findMany({
      where: { primaryDeptId: departmentId, isActive: true },
      select: { id: true },
    });
    const userIds = deptUsers.map((u) => u.id);

    const streaks = await prisma.userStreak.findMany({
      where: { userId: { in: userIds } },
      orderBy: { totalXp: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true, primaryDeptId: true } },
      },
    });

    return NextResponse.json(
      streaks.map((s, i) => ({
        rank: i + 1,
        user: s.user,
        totalXp: s.totalXp,
        level: s.level,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
      }))
    );
  }

  const leaderboard = await getLeaderboard(20);
  return NextResponse.json(leaderboard);
});
