import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const challenge = await prisma.microChallenge.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { value: "desc" },
        take: 10,
      },
    },
  });

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  return NextResponse.json(challenge);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const { value, taskId } = await req.json();

  if (value === undefined || value === null) {
    return badRequest("value is required");
  }

  const challenge = await prisma.microChallenge.findUnique({ where: { id } });
  if (!challenge || !challenge.isActive) {
    return NextResponse.json({ error: "Challenge not found or inactive" }, { status: 404 });
  }

  if (new Date() > challenge.endsAt) {
    return NextResponse.json({ error: "Challenge has ended" }, { status: 410 });
  }

  const entry = await prisma.challengeEntry.upsert({
    where: {
      challengeId_userId: {
        challengeId: id,
        userId: session.user.id,
      },
    },
    create: {
      challengeId: id,
      userId: session.user.id,
      value: Number(value),
      taskId: taskId || null,
    },
    update: {
      value: Number(value),
      taskId: taskId || null,
      submittedAt: new Date(),
    },
  });

  // Update current record if this is the best entry
  const currentRecord = challenge.currentRecord as { value: number } | null;
  if (!currentRecord || Number(value) > currentRecord.value) {
    await prisma.microChallenge.update({
      where: { id },
      data: {
        currentRecord: {
          userId: session.user.id,
          value: Number(value),
          recordedAt: new Date().toISOString(),
        },
      },
    });
  }

  return NextResponse.json(entry, { status: 201 });
}
