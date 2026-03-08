import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  const role = session.user.role;
  const isHR = ["ADMIN", "HEAD_HR"].includes(role);

  // Public recognitions visible to all; private ones only to sender/receiver/HR
  const recognitions = await prisma.recognition.findMany({
    where: isHR
      ? {}
      : {
          OR: [
            { isPublic: true },
            { fromUserId: session.user.id },
            { toUserId: session.user.id },
          ],
        },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Resolve user names
  const userIds = new Set<string>();
  for (const r of recognitions) {
    userIds.add(r.fromUserId);
    userIds.add(r.toUserId);
  }
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true, avatar: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  // Top recognized this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const topRecognized = await prisma.recognition.groupBy({
    by: ["toUserId"],
    where: { createdAt: { gte: monthStart } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const topUserIds = topRecognized.map((t) => t.toUserId);
  const topUsers = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, avatar: true },
  });
  const topUserMap = Object.fromEntries(topUsers.map((u) => [u.id, u]));

  return NextResponse.json({
    recognitions: recognitions.map((r) => ({
      id: r.id,
      from: userMap[r.fromUserId] || { id: r.fromUserId, name: "Unknown", avatar: null },
      to: userMap[r.toUserId] || { id: r.toUserId, name: "Unknown", avatar: null },
      category: r.category,
      message: r.message,
      isPublic: r.isPublic,
      createdAt: r.createdAt,
    })),
    topRecognized: topRecognized.map((t) => ({
      user: topUserMap[t.toUserId] || { id: t.toUserId, name: "Unknown", avatar: null },
      count: t._count.id,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { toUserId, category, message, isPublic } = await req.json();

  if (!toUserId || !category || !message) {
    return badRequest("toUserId, category, and message are required");
  }

  const validCategories = ["kudos", "teamwork", "innovation", "quality", "leadership"];
  if (!validCategories.includes(category)) {
    return badRequest(`Category must be one of: ${validCategories.join(", ")}`);
  }

  if (toUserId === session.user.id) {
    return badRequest("Cannot give recognition to yourself");
  }

  // Verify target user exists
  const targetUser = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!targetUser) return badRequest("Target user not found");

  const recognition = await prisma.recognition.create({
    data: {
      fromUserId: session.user.id,
      toUserId,
      category,
      message,
      isPublic: isPublic !== false,
    },
  });

  return NextResponse.json(recognition, { status: 201 });
}
