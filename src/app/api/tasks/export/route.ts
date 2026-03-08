import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden } from "@/lib/api-utils";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { role, primaryDepartmentId } = session.user;
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const where: Record<string, unknown> = {};

  if (role === "MEMBER" || role === "CONTRACTOR") {
    where.assigneeId = session.user.id;
  } else if (role === "DEPT_HEAD" && primaryDepartmentId) {
    where.departmentId = primaryDepartmentId;
  } else if (role === "CLIENT") {
    return forbidden();
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
    include: {
      assignee: { select: { name: true } },
      department: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  const csv = toCSV(tasks as unknown as Record<string, unknown>[], [
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "assignee", label: "Assignee", format: (v) => (v as { name: string } | null)?.name ?? "" },
    { key: "department", label: "Department", format: (v) => (v as { name: string } | null)?.name ?? "" },
    { key: "brand", label: "Brand", format: (v) => (v as { name: string } | null)?.name ?? "" },
    { key: "dueDate", label: "Due Date", format: (v) => v ? new Date(v as string).toISOString().split("T")[0] : "" },
    { key: "startedAt", label: "Started At", format: (v) => v ? new Date(v as string).toISOString().split("T")[0] : "" },
    { key: "completedAt", label: "Completed At", format: (v) => v ? new Date(v as string).toISOString().split("T")[0] : "" },
    { key: "createdAt", label: "Created At", format: (v) => new Date(v as string).toISOString().split("T")[0] },
  ]);

  return csvResponse(csv, `tasks-${new Date().toISOString().split("T")[0]}.csv`);
}
