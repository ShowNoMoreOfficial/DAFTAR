import { prisma } from "@/lib/prisma";
import { notifyTaskStatusChanged, notifyApprovalPending } from "@/lib/notifications";
import type { TaskStatus } from "@prisma/client";

interface WorkflowStage {
  name: string;
  order: number;
  status: TaskStatus;
  approvalGate?: boolean;
  approverRole?: string;
  autoAdvanceAfterHours?: number;
}

interface EscalationRule {
  afterHours: number;
  notifyRole: string;
  action: "notify" | "auto_advance" | "reassign";
}

/**
 * Get the applicable workflow for a task based on its department
 */
export async function getWorkflowForTask(departmentId: string | null) {
  if (!departmentId) return null;

  // Try department-specific first, then fall back to default
  const workflow = await prisma.workflowTemplate.findFirst({
    where: {
      isActive: true,
      OR: [
        { departmentId, isDefault: true },
        { departmentId },
        { departmentId: null, isDefault: true },
      ],
    },
    orderBy: [{ departmentId: "desc" }, { isDefault: "desc" }],
  });

  return workflow;
}

/**
 * Determine the next status in the workflow for a given task
 */
export function getNextStage(
  stages: WorkflowStage[],
  currentStatus: TaskStatus
): WorkflowStage | null {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex((s) => s.status === currentStatus);
  if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null;
  return sorted[currentIndex + 1];
}

/**
 * Check if current stage requires approval gate
 */
export function isApprovalGate(
  stages: WorkflowStage[],
  currentStatus: TaskStatus
): boolean {
  const stage = stages.find((s) => s.status === currentStatus);
  return stage?.approvalGate === true;
}

/**
 * Process tasks that should auto-advance based on time rules
 */
export async function processAutoAdvance() {
  const workflows = await prisma.workflowTemplate.findMany({
    where: { isActive: true },
    select: { id: true, stages: true, departmentId: true },
  });

  let advancedCount = 0;

  for (const wf of workflows) {
    const stages = wf.stages as unknown as WorkflowStage[];
    const autoStages = stages.filter((s) => s.autoAdvanceAfterHours);

    for (const stage of autoStages) {
      const cutoff = new Date(
        Date.now() - (stage.autoAdvanceAfterHours! * 60 * 60 * 1000)
      );
      const nextStage = getNextStage(stages, stage.status);
      if (!nextStage) continue;

      const tasksToAdvance = await prisma.task.findMany({
        where: {
          status: stage.status,
          departmentId: wf.departmentId,
          updatedAt: { lte: cutoff },
        },
        select: { id: true, title: true, creatorId: true, assigneeId: true },
      });

      for (const task of tasksToAdvance) {
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: nextStage.status,
            ...(nextStage.status === "IN_PROGRESS" ? { startedAt: new Date() } : {}),
            ...(nextStage.status === "DONE" ? { completedAt: new Date() } : {}),
          },
        });

        await prisma.taskActivity.create({
          data: {
            taskId: task.id,
            actorId: task.creatorId,
            action: "status_changed",
            field: "status",
            oldValue: stage.status,
            newValue: nextStage.status,
          },
        });

        // Notify
        const notifyId = task.assigneeId || task.creatorId;
        notifyTaskStatusChanged(
          notifyId,
          task.title,
          task.id,
          stage.status,
          nextStage.status
        ).catch(() => {});

        advancedCount++;
      }
    }
  }

  return advancedCount;
}

/**
 * Process escalation rules — notify managers when tasks are stuck
 */
export async function processEscalations() {
  const workflows = await prisma.workflowTemplate.findMany({
    where: { isActive: true, NOT: { escalation: { equals: undefined } } },
    select: { id: true, escalation: true, departmentId: true, stages: true },
  });

  let escalationCount = 0;

  for (const wf of workflows) {
    const rules = wf.escalation as EscalationRule[] | null;
    if (!rules || rules.length === 0) continue;

    for (const rule of rules) {
      const cutoff = new Date(Date.now() - rule.afterHours * 60 * 60 * 1000);

      const stuckTasks = await prisma.task.findMany({
        where: {
          departmentId: wf.departmentId,
          status: { notIn: ["DONE", "CANCELLED"] },
          updatedAt: { lte: cutoff },
        },
        select: { id: true, title: true, assigneeId: true },
        take: 20,
      });

      if (stuckTasks.length === 0) continue;

      // Find department head to notify
      if (wf.departmentId) {
        const dept = await prisma.department.findUnique({
          where: { id: wf.departmentId },
          select: { headId: true },
        });
        if (dept?.headId) {
          for (const task of stuckTasks) {
            notifyApprovalPending(
              dept.headId,
              `${task.title} (stuck ${rule.afterHours}h+)`,
              "/pms/board"
            ).catch(() => {});
            escalationCount++;
          }
        }
      }
    }
  }

  return escalationCount;
}
