import { prisma } from "@/lib/prisma";
import { daftarEvents } from "@/lib/event-bus";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link || null,
      metadata: input.metadata as never || undefined,
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

export async function notifyTaskOverdue(
  userId: string,
  taskTitle: string,
  taskId: string
) {
  return createNotification({
    userId,
    type: "TASK_OVERDUE",
    title: "Task overdue",
    message: `"${taskTitle}" is past its due date`,
    link: `/tasks`,
    metadata: { taskId },
  });
}

export async function notifyDeliverableReady(
  clientUserId: string,
  taskTitle: string,
  taskId: string
) {
  return createNotification({
    userId: clientUserId,
    type: "DELIVERABLE_READY",
    title: "Deliverable ready",
    message: `"${taskTitle}" has been approved and is ready for review`,
    link: `/brands`,
    metadata: { taskId },
  });
}

export async function notifyInvoiceSent(
  clientUserId: string,
  invoiceNumber: string,
  invoiceId: string,
  amount: string
) {
  return createNotification({
    userId: clientUserId,
    type: "SYSTEM",
    title: "Invoice received",
    message: `Invoice ${invoiceNumber} for ${amount} has been sent to you`,
    link: `/finance`,
    metadata: { invoiceId },
  });
}

export async function notifyInvoicePaid(
  creatorId: string,
  invoiceNumber: string,
  invoiceId: string
) {
  return createNotification({
    userId: creatorId,
    type: "SYSTEM",
    title: "Invoice paid",
    message: `Invoice ${invoiceNumber} has been marked as paid`,
    link: `/finance`,
    metadata: { invoiceId },
  });
}

/**
 * Check for overdue tasks and send notifications.
 * Call from /api/cron/overdue-check endpoint.
 */
export async function checkOverdueTasks() {
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { notIn: ["DONE", "CANCELLED"] },
      dueDate: { lt: new Date() },
    },
    select: {
      id: true,
      title: true,
      assigneeId: true,
      creatorId: true,
    },
  });

  const sent: string[] = [];

  for (const task of overdueTasks) {
    const userId = task.assigneeId || task.creatorId;

    // Avoid duplicate overdue notifications (check last 24h)
    const recent = await prisma.notification.findFirst({
      where: {
        userId,
        type: "TASK_OVERDUE",
        metadata: { path: ["taskId"], equals: task.id },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!recent) {
      await notifyTaskOverdue(userId, task.title, task.id);
      sent.push(task.id);
    }
  }

  return { checked: overdueTasks.length, notified: sent.length };
}
