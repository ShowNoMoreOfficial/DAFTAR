import { prisma } from "@/lib/prisma";
import { daftarEvents } from "@/lib/event-bus";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link || null,
      metadata: input.metadata || null,
    },
  });

  daftarEvents.emitEvent("notification.created", {
    notificationId: notification.id,
    userId: input.userId,
    type: input.type,
  });

  return notification;
}

export async function notifyTaskAssigned(
  assigneeId: string,
  taskTitle: string,
  taskId: string,
  assignerName: string
) {
  return createNotification({
    userId: assigneeId,
    type: "TASK_ASSIGNED",
    title: "New task assigned",
    message: `${assignerName} assigned you "${taskTitle}"`,
    link: `/tasks`,
    metadata: { taskId },
  });
}

export async function notifyTaskStatusChanged(
  userId: string,
  taskTitle: string,
  taskId: string,
  oldStatus: string,
  newStatus: string
) {
  return createNotification({
    userId,
    type: "TASK_STATUS_CHANGED",
    title: "Task status updated",
    message: `"${taskTitle}" moved from ${oldStatus} to ${newStatus}`,
    link: `/pms/board`,
    metadata: { taskId, oldStatus, newStatus },
  });
}

export async function notifyTaskComment(
  userId: string,
  taskTitle: string,
  taskId: string,
  commenterName: string
) {
  return createNotification({
    userId,
    type: "TASK_COMMENT",
    title: "New comment",
    message: `${commenterName} commented on "${taskTitle}"`,
    link: `/tasks`,
    metadata: { taskId },
  });
}

export async function notifyApprovalPending(
  userId: string,
  itemTitle: string,
  link: string
) {
  return createNotification({
    userId,
    type: "APPROVAL_PENDING",
    title: "Approval needed",
    message: `"${itemTitle}" is waiting for your review`,
    link,
  });
}
