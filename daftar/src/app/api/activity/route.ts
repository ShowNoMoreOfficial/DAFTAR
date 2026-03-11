import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 30);

  const where: Record<string, unknown> = {};

  // Scope by role
  const { role, primaryDepartmentId } = session.user;
  if (role === "MEMBER" || role === "CONTRACTOR") {
    where.actorId = session.user.id;
  } else if (role === "DEPT_HEAD" && primaryDepartmentId) {
    where.task = { departmentId: primaryDepartmentId };
  }
  // ADMIN, HEAD_HR see all

  const activities = await prisma.taskActivity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: { select: { id: true, name: true, avatar: true } },
      task: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(activities);
}
