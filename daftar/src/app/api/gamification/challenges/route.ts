import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const now = new Date();
  const challenges = await prisma.microChallenge.findMany({
    where: { isActive: true, endsAt: { gte: now } },
    include: {
      entries: {
        orderBy: { value: "desc" },
        take: 5,
      },
    },
    orderBy: { endsAt: "asc" },
  });

  return NextResponse.json(challenges);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || !["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(session.user.role)) {
    return unauthorized();
  }

  const { title, description, type, metric, targetValue, departmentId, startsAt, endsAt, bonusPoints } =
    await req.json();

  if (!title || !type || !metric || !startsAt || !endsAt) {
    return badRequest("Missing required fields");
  }

  const challenge = await prisma.microChallenge.create({
    data: {
      title,
      description: description || "",
      type,
      metric,
      targetValue: targetValue || null,
      departmentId: departmentId || null,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      bonusPoints: bonusPoints || 25,
    },
  });

  return NextResponse.json(challenge, { status: 201 });
}
