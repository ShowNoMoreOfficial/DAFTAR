import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { levelFromXp, xpForNextLevel, xpInCurrentLevel } from "@/lib/gamification";

export const GET = apiHandler(async (_req, { session }) => {
  const userId = session.user.id;

  const [streak, achievements, recentUnlocks] = await Promise.all([
    prisma.userStreak.findUnique({ where: { userId } }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    }),
    prisma.userAchievement.findMany({
      where: { userId, notified: false },
      include: { achievement: true },
    }),
  ]);

  // Mark new unlocks as notified
  if (recentUnlocks.length > 0) {
    await prisma.userAchievement.updateMany({
      where: { id: { in: recentUnlocks.map((u) => u.id) } },
      data: { notified: true },
    });
  }

  const totalXp = streak?.totalXp ?? 0;
  const level = streak?.level ?? 1;

  return NextResponse.json({
    totalXp,
    level,
    xpInLevel: xpInCurrentLevel(totalXp),
    xpNeeded: xpForNextLevel(level),
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    achievements: achievements.map((ua) => ({
      key: ua.achievement.key,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      category: ua.achievement.category,
      points: ua.achievement.points,
      unlockedAt: ua.unlockedAt,
    })),
    newUnlocks: recentUnlocks.map((u) => ({
      name: u.achievement.name,
      icon: u.achievement.icon,
      points: u.achievement.points,
    })),
  });
});
