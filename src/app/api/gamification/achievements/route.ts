import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (_req, { session }) => {
  const userId = session.user.id;

  const [all, unlocked] = await Promise.all([
    prisma.achievement.findMany({ where: { isActive: true }, orderBy: { category: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);

  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  return NextResponse.json(
    all.map((a) => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
    }))
  );
});
