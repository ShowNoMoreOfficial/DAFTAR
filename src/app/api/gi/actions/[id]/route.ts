import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
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
    const result = await executeGIAction(existing);

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
    await reverseGIAction(existing);

    const updated = await prisma.gIAutonomousAction.update({
      where: { id },
      data: { status: "UNDONE", undoneAt: new Date() },
    });

    return NextResponse.json(updated);
  }

  return badRequest("Unknown action");
}

// Execute a GI autonomous action based on its type
async function executeGIAction(
  action: { actionType: string; actionData: unknown; targetEntity: string | null }
): Promise<Record<string, unknown>> {
  const data = action.actionData as Record<string, unknown>;

  switch (action.actionType) {
    case "task_reassignment": {
      const taskId = data.taskId as string;
      if (data.action === "escalate_review") {
        // Move task back to IN_PROGRESS for re-review
        await prisma.task.update({
          where: { id: taskId },
          data: { status: "IN_PROGRESS", updatedAt: new Date() },
        });
        return { action: "escalated_review", taskId };
      }
      return { action: "no_op" };
    }

    case "deadline_extension": {
      const taskId = data.taskId as string;
      const newDueDate = data.newDueDate as string;
      if (taskId && newDueDate) {
        await prisma.task.update({
          where: { id: taskId },
          data: { dueDate: new Date(newDueDate) },
        });
        return { action: "deadline_extended", taskId, newDueDate };
      }
      return { action: "no_op" };
    }

    case "workload_rebalance": {
      const taskId = data.taskId as string;
      const newAssigneeId = data.newAssigneeId as string;
      if (taskId && newAssigneeId) {
        await prisma.task.update({
          where: { id: taskId },
          data: { assigneeId: newAssigneeId },
        });
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
  action: { actionType: string; actionData: unknown; result: unknown }
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
      }
      break;
    }
  }
}
