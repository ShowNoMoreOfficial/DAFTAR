import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { badRequest } from "@/lib/api-utils";

export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const body = await req.json();
  const { action: userAction } = body; // "approve", "reject", "undo"

  if (!["approve", "reject", "undo"].includes(userAction)) {
    return badRequest("Invalid action. Must be approve, reject, or undo.");
  }

  const existing = await prisma.gIAutonomousAction.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }

  if (userAction === "approve") {
    if (existing.status !== "PENDING") {
      return badRequest("Only pending actions can be approved");
    }

    // Execute the action
    const result = await executeGIAction(existing, session.user.id);

    const updated = await prisma.gIAutonomousAction.update({
      where: { id },
      data: {
        status: "EXECUTED",
        approvedById: session.user.id,
        executedAt: new Date(),
        result: result as never,
      },
    });

    return NextResponse.json(updated);
  }

  if (userAction === "reject") {
    if (existing.status !== "PENDING") {
      return badRequest("Only pending actions can be rejected");
    }

    const updated = await prisma.gIAutonomousAction.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return NextResponse.json(updated);
  }

  if (userAction === "undo") {
    if (existing.status !== "EXECUTED") {
      return badRequest("Only executed actions can be undone");
    }

    // Attempt to reverse the action
    await reverseGIAction(existing, session.user.id);

    const updated = await prisma.gIAutonomousAction.update({
      where: { id },
      data: { status: "UNDONE", undoneAt: new Date() },
    });

    return NextResponse.json(updated);
  }

  return badRequest("Unknown action");
});

// Log a TaskActivity record for GI actions
async function logTaskActivity(
  taskId: string,
  actorId: string,
  action: string,
  details: string
): Promise<void> {
  try {
    await prisma.taskActivity.create({
      data: {
        taskId,
        actorId,
        action,
        field: "gi_action",
        newValue: details,
      },
    });
  } catch {
    console.error("[GI Actions] Failed to log task activity");
  }
}

// Execute a GI autonomous action based on its type
async function executeGIAction(
  action: { actionType: string; actionData: unknown; targetEntity: string | null },
  approvedById: string
): Promise<Record<string, unknown>> {
  const data = action.actionData as Record<string, unknown>;

  switch (action.actionType) {
    case "task_reassignment": {
      const taskId = data.taskId as string;
      if (data.action === "escalate_review") {
        await prisma.task.update({
          where: { id: taskId },
          data: { status: "IN_PROGRESS", updatedAt: new Date() },
        });
        await logTaskActivity(
          taskId,
          approvedById,
          "GI_ESCALATE_REVIEW",
          "GI auto-escalated: task moved from REVIEW to IN_PROGRESS (stuck >48h)"
        );
        return { action: "escalated_review", taskId };
      }
      return { action: "no_op" };
    }

    case "deadline_extension": {
      const taskId = data.taskId as string;
      const newDueDate = data.newDueDate as string;
      const currentDueDate = data.currentDueDate as string;
      if (taskId && newDueDate) {
        await prisma.task.update({
          where: { id: taskId },
          data: { dueDate: new Date(newDueDate) },
        });
        await logTaskActivity(
          taskId,
          approvedById,
          "GI_DEADLINE_EXTENSION",
          `GI extended deadline from ${currentDueDate || "unknown"} to ${newDueDate}`
        );
        return { action: "deadline_extended", taskId, newDueDate };
      }
      return { action: "no_op" };
    }

    case "workload_rebalance": {
      const taskId = data.taskId as string;
      const newAssigneeId = data.newAssigneeId as string;
      const originalAssigneeId = data.originalAssigneeId as string;
      if (taskId && newAssigneeId) {
        await prisma.task.update({
          where: { id: taskId },
          data: { assigneeId: newAssigneeId },
        });
        await logTaskActivity(
          taskId,
          approvedById,
          "GI_WORKLOAD_REBALANCE",
          `GI reassigned task from ${originalAssigneeId || "unknown"} to ${newAssigneeId} for workload balance`
        );
        return { action: "task_reassigned", taskId, newAssigneeId };
      }
      return { action: "no_op" };
    }

    default:
      return { action: "unsupported_type" };
  }
}

// Reverse an executed GI action
async function reverseGIAction(
  action: { actionType: string; actionData: unknown; result: unknown },
  undoneById: string
): Promise<void> {
  const data = action.actionData as Record<string, unknown>;
  const result = action.result as Record<string, unknown>;

  switch (action.actionType) {
    case "task_reassignment": {
      if (result?.action === "escalated_review") {
        const taskId = data.taskId as string;
        await prisma.task.update({
          where: { id: taskId },
          data: { status: "REVIEW" },
        });
        await logTaskActivity(taskId, undoneById, "GI_UNDO_ESCALATION", "Undone: task restored to REVIEW status");
      }
      break;
    }

    case "deadline_extension": {
      const taskId = data.taskId as string;
      const currentDueDate = data.currentDueDate as string;
      if (taskId && currentDueDate) {
        await prisma.task.update({
          where: { id: taskId },
          data: { dueDate: new Date(currentDueDate) },
        });
        await logTaskActivity(taskId, undoneById, "GI_UNDO_DEADLINE", `Undone: deadline restored to ${currentDueDate}`);
      }
      break;
    }

    case "workload_rebalance": {
      const taskId = data.taskId as string;
      const originalAssigneeId = data.originalAssigneeId as string;
      if (taskId && originalAssigneeId) {
        await prisma.task.update({
          where: { id: taskId },
          data: { assigneeId: originalAssigneeId },
        });
        await logTaskActivity(taskId, undoneById, "GI_UNDO_REBALANCE", `Undone: task reassigned back to original owner`);
      }
      break;
    }
  }
}
