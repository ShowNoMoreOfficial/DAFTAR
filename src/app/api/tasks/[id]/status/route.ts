import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound, badRequest } from "@/lib/api-utils";
import type { TaskStatus } from "@prisma/client";
import { notifyTaskStatusChanged, notifyDeliverableReady } from "@/lib/notifications";
import { recordActivity, checkTaskAchievements } from "@/lib/gamification";

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  CREATED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["REVIEW", "ASSIGNED", "CANCELLED"],
  REVIEW: ["APPROVED", "IN_PROGRESS"],
  APPROVED: ["DONE", "IN_PROGRESS"],
  DONE: [],
  CANCELLED: ["CREATED"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const { status } = await req.json();

  if (!status) return badRequest("Status is required");

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound("Task not found");

  const allowed = VALID_TRANSITIONS[task.status];
  if (!allowed.includes(status as TaskStatus)) {
    return badRequest(`Cannot transition from ${task.status} to ${status}`);
  }

  const data: Record<string, unknown> = { status };

  if (status === "IN_PROGRESS" && !task.startedAt) {
    data.startedAt = new Date();
  }
  if (status === "DONE") {
    data.completedAt = new Date();
  }

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.taskActivity.create({
    data: {
      taskId: id,
      actorId: session.user.id,
      action: "status_changed",
      field: "status",
      oldValue: task.status,
      newValue: status,
    },
  });

  // Notify relevant users about status change
  const notifyUserId =
    session.user.id === task.creatorId ? task.assigneeId : task.creatorId;
  if (notifyUserId && notifyUserId !== session.user.id) {
    notifyTaskStatusChanged(notifyUserId, task.title, task.id, task.status, status).catch(() => {});
  }

  // Notify client when task is approved (deliverable ready)
  if (status === "APPROVED" && task.brandId) {
    const brand = await prisma.brand.findUnique({
      where: { id: task.brandId },
      include: { client: { select: { userId: true } } },
    });
    if (brand?.client?.userId) {
      notifyDeliverableReady(brand.client.userId, task.title, task.id).catch(() => {});
    }
  }

  // Gamification: record activity and check achievements on completion
  if (status === "DONE" && task.assigneeId) {
    const xp = task.difficultyWeight * 10;
    recordActivity(task.assigneeId, xp).catch(() => {});
    checkTaskAchievements(task.assigneeId).catch(() => {});
  }

  // Update credibility score on task completion
  if (status === "DONE" && task.assigneeId) {
    const isOnTime = task.dueDate ? new Date() <= task.dueDate : true;
    await prisma.credibilityScore.upsert({
      where: { userId: task.assigneeId },
      create: {
        userId: task.assigneeId,
        tasksCompleted: 1,
        tasksOnTime: isOnTime ? 1 : 0,
        tasksLate: isOnTime ? 0 : 1,
        reliability: isOnTime ? 55 : 45,
      },
      update: {
        tasksCompleted: { increment: 1 },
        tasksOnTime: isOnTime ? { increment: 1 } : undefined,
        tasksLate: isOnTime ? undefined : { increment: 1 },
      },
    });
  }

  return NextResponse.json(updated);
}
