import { prisma } from "@/lib/prisma";
import { daftarEvents } from "@/lib/event-bus";
import { calculateUserCapacity } from "./capacity-engine";
import { createNotification } from "@/lib/notifications";

const BURNOUT_CAPACITY_THRESHOLD = 95;
const SENTIMENT_DECREMENT = 0.3; // deduct from 0–10 scale

interface OverduePayload {
  taskId: string;
  assigneeId: string;
  taskTitle: string;
  timestamp: string;
}

/**
 * Handle PMS_TASK_OVERDUE events.
 * 1. Calculate the assignee's capacity load.
 * 2. If overloaded (>95%), reduce sentiment score.
 * 3. Notify the department manager with capacity math.
 */
async function handleTaskOverdue(payload: OverduePayload) {
  const { taskId, assigneeId, taskTitle } = payload;
  if (!assigneeId) return;

  // 1. Compute capacity
  const capacity = await calculateUserCapacity(assigneeId);

  if (capacity.capacityLoad <= BURNOUT_CAPACITY_THRESHOLD) return;

  // 2. Fetch the employee's profile and user info
  const user = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: {
      name: true,
      primaryDeptId: true,
      employeeProfile: { select: { id: true, sentimentScore: true } },
    },
  });
  if (!user) return;

  const currentSentiment = user.employeeProfile?.sentimentScore ?? 5.0;
  const newSentiment = Math.max(0, currentSentiment - SENTIMENT_DECREMENT);

  // 3. Reduce sentiment score
  if (user.employeeProfile) {
    await prisma.employeeProfile.update({
      where: { id: user.employeeProfile.id },
      data: { sentimentScore: newSentiment },
    });
  }

  // 4. Find the department manager
  if (!user.primaryDeptId) return;

  const deptHead = await prisma.user.findFirst({
    where: {
      primaryDeptId: user.primaryDeptId,
      role: "DEPT_HEAD",
      isActive: true,
    },
    select: { id: true, name: true },
  });

  const managerIds: string[] = [];
  if (deptHead) managerIds.push(deptHead.id);

  // Also notify any ADMIN
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
    take: 3,
  });
  for (const a of admins) {
    if (!managerIds.includes(a.id)) managerIds.push(a.id);
  }

  // 5. Build the capacity breakdown string
  const breakdownLines = capacity.breakdown
    .filter((b) => b.count > 0)
    .map((b) => `${b.count} ${b.priority} (${b.weight}%)`)
    .join(", ");

  const message =
    `${user.name} has an overdue task "${taskTitle}" and is at ` +
    `${capacity.capacityLoad}% capacity (${capacity.activeTaskCount} active tasks: ${breakdownLines}). ` +
    `Sentiment dropped to ${newSentiment.toFixed(1)}/10. ` +
    `Consider reassigning ${capacity.breakdown.find((b) => b.priority === "LOW")?.count || 0} LOW-priority ` +
    `and ${capacity.breakdown.find((b) => b.priority === "MEDIUM")?.count || 0} MEDIUM-priority tasks ` +
    `to reduce load below ${BURNOUT_CAPACITY_THRESHOLD}%.`;

  // 6. Notify each manager
  for (const managerId of managerIds) {
    await createNotification({
      userId: managerId,
      type: "GI_SUGGESTION",
      title: `Burnout risk: ${user.name}`,
      message,
      link: "/hoccr/operations",
      metadata: {
        source: "culture-monitor",
        assigneeId,
        taskId,
        capacityLoad: capacity.capacityLoad,
        sentimentScore: newSentiment,
      },
    });
  }

  // 7. Create an announcement if capacity is extreme (>120%)
  if (capacity.capacityLoad > 120) {
    await prisma.announcement.create({
      data: {
        title: `Workload alert: ${user.name} at ${capacity.capacityLoad}% capacity`,
        content: message,
        type: "urgent",
        priority: "HIGH",
        scope: "department",
        scopeId: user.primaryDeptId,
        authorId: deptHead?.id ?? admins[0]?.id ?? assigneeId,
        departmentId: user.primaryDeptId,
      },
    });
  }

  // 8. Emit event for GI and other listeners
  daftarEvents.emitEvent("hoccr.burnout_risk_detected", {
    assigneeId,
    assigneeName: user.name,
    capacityLoad: capacity.capacityLoad,
    sentimentScore: newSentiment,
    taskId,
    departmentId: user.primaryDeptId,
  });
}

interface TaskStatusPayload {
  taskId: string;
  oldStatus: string;
  newStatus: string;
  actorId: string;
}

/**
 * Handle PMS_TASK_STATUS_CHANGED events — boost sentiment on task completion.
 * On-time completion: +0.2 sentiment
 * Early completion (1+ day before deadline): +0.3 sentiment
 */
async function handleTaskCompleted(payload: TaskStatusPayload) {
  if (payload.newStatus !== "DONE") return;

  const task = await prisma.task.findUnique({
    where: { id: payload.taskId },
    select: { assigneeId: true, dueDate: true, completedAt: true },
  });
  if (!task?.assigneeId) return;

  const user = await prisma.user.findUnique({
    where: { id: task.assigneeId },
    select: {
      primaryDeptId: true,
      employeeProfile: { select: { id: true, sentimentScore: true } },
    },
  });
  if (!user?.employeeProfile) return;

  const currentSentiment = user.employeeProfile.sentimentScore ?? 5.0;
  const now = new Date();
  const isOnTime = !task.dueDate || now <= task.dueDate;

  if (!isOnTime) return; // No boost for late completions

  // Early completion: 1+ day before deadline → bigger boost
  const isEarly = task.dueDate && (task.dueDate.getTime() - now.getTime()) > 24 * 60 * 60 * 1000;
  const boost = isEarly ? 0.3 : 0.2;
  const newSentiment = Math.min(10, currentSentiment + boost);

  await prisma.employeeProfile.update({
    where: { id: user.employeeProfile.id },
    data: { sentimentScore: newSentiment },
  });
}

/**
 * Register the culture monitor on the event bus.
 * Call this from instrumentation.ts on server startup.
 */
export function registerCultureMonitor() {
  daftarEvents.on("PMS_TASK_OVERDUE", (payload: OverduePayload) => {
    handleTaskOverdue(payload).catch((err) => {
      console.error("[culture-monitor] Failed to handle overdue event:", err);
    });
  });

  // Positive sentiment tracking: boost on task completion
  daftarEvents.on("PMS_TASK_STATUS_CHANGED", (payload: TaskStatusPayload) => {
    handleTaskCompleted(payload).catch((err) => {
      console.error("[culture-monitor] Failed to handle task completed event:", err);
    });
  });
}
