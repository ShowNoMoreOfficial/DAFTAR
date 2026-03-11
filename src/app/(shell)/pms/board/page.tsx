import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "PMS Board" };
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { TaskStatus } from "@prisma/client";
import { KanbanBoard } from "@/components/pms/kanban-board";

const BOARD_COLUMNS: TaskStatus[] = [
  "CREATED",
  "ASSIGNED",
  "IN_PROGRESS",
  "REVIEW",
  "APPROVED",
  "DONE",
];

export default async function PMSBoardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId, primaryDepartmentId } = session.user;

  const where: Record<string, unknown> = {};

  if (role === "MEMBER" || role === "CONTRACTOR") {
    where.OR = [{ assigneeId: userId }, { creatorId: userId }];
  } else if (role === "DEPT_HEAD" && primaryDepartmentId) {
    where.departmentId = primaryDepartmentId;
  }

  where.status = { not: "CANCELLED" as TaskStatus };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      tags: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  const initialColumns = BOARD_COLUMNS.map((status) => ({
    id: status,
    title: status.replace(/_/g, " "),
    tasks: tasks
      .filter((t) => t.status === status)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate?.toISOString() ?? null,
        difficultyWeight: t.difficultyWeight,
        assignee: t.assignee,
        tags: t.tags,
        _count: t._count,
      })),
  }));

  return <KanbanBoard initialColumns={initialColumns} />;
}
