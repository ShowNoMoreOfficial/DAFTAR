import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

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
}
