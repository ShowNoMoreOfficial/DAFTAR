import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import type { TaskStatus } from "@prisma/client";

const BOARD_COLUMNS: TaskStatus[] = [
  "CREATED",
  "ASSIGNED",
  "IN_PROGRESS",
  "REVIEW",
  "APPROVED",
  "DONE",
];

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId");

  const where: Record<string, unknown> = {};
  const { role, id: userId, primaryDepartmentId } = session.user;

  if (role === "MEMBER" || role === "CONTRACTOR") {
    where.OR = [{ assigneeId: userId }, { creatorId: userId }];
  } else if (role === "DEPT_HEAD" && primaryDepartmentId) {
    where.departmentId = departmentId || primaryDepartmentId;
  } else if (departmentId) {
    where.departmentId = departmentId;
  }

  // Exclude cancelled
  where.status = { not: "CANCELLED" };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      tags: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  const columns = BOARD_COLUMNS.map((status) => ({
    id: status,
    title: status.replace(/_/g, " "),
    tasks: tasks.filter((t) => t.status === status),
  }));

  return NextResponse.json(columns);
});
