import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound, badRequest, handleApiError } from "@/lib/api-utils";
import type { TaskStatus } from "@prisma/client";
import { notifyTaskStatusChanged, notifyDeliverableReady } from "@/lib/notifications";
import { recordActivity, checkTaskAchievements, checkSpeedAchievements, checkQualityAchievements } from "@/lib/gamification";
import { daftarEvents } from "@/lib/event-bus";

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

  try {
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

  // Emit GI event when task moves to REVIEW
  if (status === "REVIEW") {
    daftarEvents.emitEvent("PMS_TASK_NEEDS_REVIEW", {
      taskId: id,
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId,
      assigneeName: updated.assignee?.name || "Unassigned",
      departmentId: task.departmentId,
    });
  }

  // Emit generic status change event
  daftarEvents.emitEvent("PMS_TASK_STATUS_CHANGED", {
    taskId: id,
    oldStatus: task.status,
    newStatus: status,
    actorId: session.user.id,
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
    const priorityMultiplier: Record<string, number> = {
      URGENT: 2,
      HIGH: 1.5,
      MEDIUM: 1,
      LOW: 0.8,
    };
    const multiplier = priorityMultiplier[task.priority] ?? 1;
    const xp = Math.round(task.difficultyWeight * 10 * multiplier);
    recordActivity(task.assigneeId, xp).catch(() => {});
    checkTaskAchievements(task.assigneeId).catch(() => {});
    checkSpeedAchievements(task.assigneeId, task.startedAt, updated.completedAt as Date | null).catch(() => {});
  }

  // Quality achievement check on approval
  if (status === "APPROVED" && task.assigneeId) {
    checkQualityAchievements(task.assigneeId).catch(() => {});
  }

  // Update credibility score on task completion
  if (status === "DONE" && task.assigneeId) {
    const isOnTime = task.dueDate ? new Date() <= task.dueDate : true;
    const score = await prisma.credibilityScore.upsert({
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

    // Recalculate all score components
    const totalCompleted = score.tasksCompleted;
    const totalOnTime = score.tasksOnTime;
    const reliability = totalCompleted > 0 ? (totalOnTime / totalCompleted) * 100 : 50;

    // Quality: ratio of tasks approved without revision (REVIEW→APPROVED, not REVIEW→IN_PROGRESS→REVIEW→APPROVED)
    const approvedDirectly = await prisma.taskActivity.count({
      where: {
        actorId: task.assigneeId,
        action: "status_changed",
        field: "status",
        oldValue: "REVIEW",
        newValue: "APPROVED",
      },
    });
    const revisionsCount = await prisma.taskActivity.count({
      where: {
        task: { assigneeId: task.assigneeId },
        action: "status_changed",
        field: "status",
        oldValue: "REVIEW",
        newValue: "IN_PROGRESS",
      },
    });
    const totalReviewed = approvedDirectly + revisionsCount;
    const quality = totalReviewed > 0 ? (approvedDirectly / totalReviewed) * 100 : 50;

    // Consistency: based on how regularly tasks are completed over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCompletions = await prisma.task.findMany({
      where: {
        assigneeId: task.assigneeId,
        status: "DONE",
        completedAt: { gte: thirtyDaysAgo },
      },
      select: { completedAt: true },
    });
    let consistency = 50;
    if (recentCompletions.length >= 3) {
      const dates = recentCompletions
        .map((t) => t.completedAt?.getTime() || 0)
        .sort((a, b) => a - b);
      const gaps = dates.slice(1).map((d, i) => d - dates[i]);
      const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
      const variance = gaps.reduce((s, g) => s + Math.pow(g - avgGap, 2), 0) / gaps.length;
      const stdDevDays = Math.sqrt(variance) / (1000 * 60 * 60 * 24);
      // Lower stddev = more consistent = higher score (cap at 100)
      consistency = Math.min(100, Math.max(0, 100 - stdDevDays * 10));
    }

    const overallScore = Math.round((reliability + quality + consistency) / 3 * 10) / 10;

    await prisma.credibilityScore.update({
      where: { userId: task.assigneeId },
      data: {
        reliability: Math.round(reliability * 10) / 10,
        quality: Math.round(quality * 10) / 10,
        consistency: Math.round(consistency * 10) / 10,
        overallScore,
      },
    });
  }

  return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
