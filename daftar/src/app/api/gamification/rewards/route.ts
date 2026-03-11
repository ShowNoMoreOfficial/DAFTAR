import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const rewards = await prisma.variableReward.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { claimed: false, expiresAt: { gte: new Date() } },
        { claimed: false, expiresAt: null },
        { claimed: true },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(rewards);
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { rewardId } = await req.json();
  if (!rewardId) return badRequest("rewardId is required");

  const reward = await prisma.variableReward.findFirst({
    where: { id: rewardId, userId: session.user.id, claimed: false },
  });

  if (!reward) {
    return NextResponse.json({ error: "Reward not found or already claimed" }, { status: 404 });
  }

  // Check expiry
  if (reward.expiresAt && reward.expiresAt < new Date()) {
    return NextResponse.json({ error: "Reward has expired" }, { status: 410 });
  }

  const updated = await prisma.variableReward.update({
    where: { id: rewardId },
    data: { claimed: true },
  });

  // Award XP if reward has points
  if (reward.points > 0) {
    await prisma.userStreak.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        totalXp: reward.points,
        level: 1,
      },
      update: {
        totalXp: { increment: reward.points },
      },
    });
  }

  return NextResponse.json(updated);
}
