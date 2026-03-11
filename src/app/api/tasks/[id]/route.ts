import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound, handleApiError } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, avatar: true, email: true } },
      creator: { select: { id: true, name: true, avatar: true } },
      department: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      tags: { select: { name: true } },
      comments: {
        include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { actor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!task) return notFound("Task not found");
  return NextResponse.json(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, priority, assigneeId, departmentId, brandId, projectId, dueDate, difficultyWeight } = body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return notFound("Task not found");

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;
    if (departmentId !== undefined) data.departmentId = departmentId;
    if (brandId !== undefined) data.brandId = brandId;
    if (projectId !== undefined) data.projectId = projectId;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (difficultyWeight !== undefined) data.difficultyWeight = difficultyWeight;

    // Track changes for activity log
    const changes: { field: string; oldValue: string; newValue: string }[] = [];
    for (const [key, value] of Object.entries(data)) {
      const oldVal = (existing as Record<string, unknown>)[key];
      if (oldVal !== value) {
        changes.push({ field: key, oldValue: String(oldVal ?? ""), newValue: String(value ?? "") });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    // Log activities
    if (changes.length > 0) {
      await prisma.taskActivity.createMany({
        data: changes.map((c) => ({
          taskId: id,
          actorId: session.user.id,
          action: "updated",
          field: c.field,
          oldValue: c.oldValue,
          newValue: c.newValue,
        })),
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return notFound("Task not found");

    // Only creator or admin can delete
    if (task.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
