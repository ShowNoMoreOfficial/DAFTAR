import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { checkTier, createPendingAction } from "./tier-guard";

interface ActionResult {
  success: boolean;
  action: string;
  details: string;
  needsApproval?: boolean;
}

// ─── Reassign Task ──────────────────────────────────────

export async function reassignTask(
  taskIdentifier: string,
  personName: string,
  actorId: string
): Promise<ActionResult> {
  // Find the task by fuzzy title match or ID
  const task = await prisma.task.findFirst({
    where: {
      OR: [
        { id: taskIdentifier },
        { title: { contains: taskIdentifier, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      title: true,
      assignee: { select: { id: true, name: true } },
    },
  });

  if (!task) {
    return { success: false, action: "reassign", details: `Couldn't find a task matching "${taskIdentifier}".` };
  }

  // Find the target person
  const person = await prisma.user.findFirst({
    where: { name: { contains: personName, mode: "insensitive" }, isActive: true },
    select: { id: true, name: true },
  });

  if (!person) {
    return { success: false, action: "reassign", details: `Couldn't find a user named "${personName}".` };
  }

  // Check tier
  const tierCheck = await checkTier("task_reassignment");

  if (!tierCheck.allowed) {
    // Tier 1 or 2 — create pending action
    await createPendingAction({
      actionType: "task_reassignment",
      tier: tierCheck.tier,
      description: `Reassign "${task.title}" from ${task.assignee?.name || "Unassigned"} to ${person.name}`,
      targetUserId: person.id,
      targetEntity: `task:${task.id}`,
      actionData: {
        taskId: task.id,
        newAssigneeId: person.id,
        originalAssigneeId: task.assignee?.id ?? null,
        action: "reassign",
      } as Prisma.InputJsonValue,
      reasoning: `User requested reassignment via GI chat`,
    });

    if (tierCheck.tier === 1) {
      return {
        success: true,
        action: "reassign",
        details: `I noticed "${task.title}" could be reassigned to ${person.name}. Currently assigned to ${task.assignee?.name || "no one"}.`,
      };
    }

    return {
      success: true,
      action: "reassign",
      needsApproval: true,
      details: `I've queued a reassignment of "${task.title}" to ${person.name}. It needs your approval in Admin > GI > Actions.`,
    };
  }

  // Tier 3 or 4 — execute directly
  const oldAssignee = task.assignee?.name || "Unassigned";
  await prisma.task.update({
    where: { id: task.id },
    data: { assigneeId: person.id },
  });

  try {
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        actorId,
        action: "GI_REASSIGN",
        field: "assigneeId",
        oldValue: oldAssignee,
        newValue: person.name || person.id,
      },
    });
  } catch {
    // Non-critical
  }

  return {
    success: true,
    action: "reassign",
    details: `Done. I've reassigned "${task.title}" from ${oldAssignee} to ${person.name}.`,
  };
}

// ─── Extend Deadline ────────────────────────────────────

export async function extendDeadline(
  taskIdentifier: string,
  days: number,
  actorId: string
): Promise<ActionResult> {
  const task = await prisma.task.findFirst({
    where: {
      OR: [
        { id: taskIdentifier },
        { title: { contains: taskIdentifier, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, dueDate: true },
  });

  if (!task) {
    return { success: false, action: "extend_deadline", details: `Couldn't find a task matching "${taskIdentifier}".` };
  }

  if (!task.dueDate) {
    return { success: false, action: "extend_deadline", details: `"${task.title}" has no due date to extend.` };
  }

  const tierCheck = await checkTier("deadline_extension");
  const newDate = new Date(task.dueDate.getTime() + days * 24 * 60 * 60 * 1000);
  const newDateStr = newDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  if (!tierCheck.allowed) {
    await createPendingAction({
      actionType: "deadline_extension",
      tier: tierCheck.tier,
      description: `Extend deadline for "${task.title}" by ${days} days to ${newDateStr}`,
      targetEntity: `task:${task.id}`,
      actionData: {
        taskId: task.id,
        currentDueDate: task.dueDate.toISOString(),
        newDueDate: newDate.toISOString(),
        extensionDays: days,
      } as Prisma.InputJsonValue,
      reasoning: `User requested deadline extension via GI chat`,
    });

    return {
      success: true,
      action: "extend_deadline",
      needsApproval: tierCheck.tier === 2,
      details: tierCheck.tier === 1
        ? `"${task.title}" is due ${task.dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}. Extending by ${days} days would move it to ${newDateStr}.`
        : `I've queued a deadline extension for "${task.title}" to ${newDateStr}. Needs approval in Admin > GI > Actions.`,
    };
  }

  await prisma.task.update({
    where: { id: task.id },
    data: { dueDate: newDate },
  });

  try {
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        actorId,
        action: "GI_DEADLINE_EXTENSION",
        field: "dueDate",
        oldValue: task.dueDate.toISOString(),
        newValue: newDate.toISOString(),
      },
    });
  } catch {
    // Non-critical
  }

  return {
    success: true,
    action: "extend_deadline",
    details: `Extended. "${task.title}" new deadline is **${newDateStr}**.`,
  };
}

// ─── Create Task ────────────────────────────────────────

export async function createTask(
  title: string,
  creatorId: string,
  options?: { description?: string; assigneeName?: string; priority?: string }
): Promise<ActionResult> {
  let assigneeId: string | undefined;

  if (options?.assigneeName) {
    const person = await prisma.user.findFirst({
      where: { name: { contains: options.assigneeName, mode: "insensitive" }, isActive: true },
      select: { id: true, name: true },
    });
    if (person) assigneeId = person.id;
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: options?.description || null,
      status: assigneeId ? "ASSIGNED" : "CREATED",
      priority: (options?.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") || "MEDIUM",
      creatorId,
      assigneeId: assigneeId || null,
    },
  });

  const assignMsg = assigneeId ? ` and assigned it` : "";
  return {
    success: true,
    action: "create_task",
    details: `Created "${task.title}"${assignMsg}. It's in your ${task.status === "ASSIGNED" ? "ASSIGNED" : "TODO"} column.`,
  };
}

// ─── Start Pipeline ─────────────────────────────────────

export async function startPipeline(
  topic: string,
  creatorId: string,
  brandName?: string
): Promise<ActionResult> {
  let brandId: string | undefined;

  if (brandName) {
    const brand = await prisma.brand.findFirst({
      where: { name: { contains: brandName, mode: "insensitive" } },
      select: { id: true },
    });
    if (brand) brandId = brand.id;
  }

  const tree = await prisma.narrativeTree.create({
    data: {
      title: topic,
      status: "INCOMING",
      urgency: "normal",
      createdById: creatorId,
      nodes: {
        create: {
          nodeType: "SIGNAL",
          signalTitle: topic,
          signalData: { source: "gi", description: `Pipeline initiated via GI for topic: ${topic}` },
          signalScore: 50,
        },
      },
    },
  });

  // Link deliverable placeholder if brand specified
  if (brandId) {
    await prisma.deliverable.create({
      data: {
        brandId,
        treeId: tree.id,
        platform: "YOUTUBE",
        status: "PLANNED",
        pipelineType: "standard",
      },
    });
  }

  return {
    success: true,
    action: "start_pipeline",
    details: `Started a content pipeline for "${topic}". Narrative tree created${brandId ? " with deliverable placeholder" : ""}. The pipeline will progress through research, scripting, and production stages.`,
  };
}

// ─── Suggest Topics ─────────────────────────────────────

export async function suggestTopics(brandName?: string): Promise<ActionResult> {
  // Get recent signals not yet linked to narratives
  const recentSignals = await prisma.signal.findMany({
    where: {
      isDuplicate: false,
      detectedAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    },
    select: {
      title: true,
      eventType: true,
      sentiment: true,
      trend: { select: { name: true, lifecycle: true, velocityScore: true } },
    },
    orderBy: { detectedAt: "desc" },
    take: 20,
  });

  // Get existing narrative titles to avoid duplicates
  const existingTitles = await prisma.narrativeTree.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
    select: { title: true },
  });
  const existingSet = new Set(existingTitles.map((t) => t.title.toLowerCase()));

  // Filter to signals not already covered
  const fresh = recentSignals.filter(
    (s) => !existingSet.has(s.title.toLowerCase())
  );

  if (fresh.length === 0) {
    return {
      success: true,
      action: "suggest_topics",
      details: brandName
        ? `No uncovered signals found for ${brandName} in the last 3 days. All recent topics have been picked up.`
        : "No uncovered signals in the last 3 days. The team has been on top of things!",
    };
  }

  // Pick top 3 by trend velocity
  const top = fresh
    .sort((a, b) => (b.trend?.velocityScore || 0) - (a.trend?.velocityScore || 0))
    .slice(0, 3);

  const suggestions = top.map((s, i) => {
    const trend = s.trend ? ` (trend: ${s.trend.name}, ${s.trend.lifecycle})` : "";
    return `${i + 1}. **${s.title}**${trend}`;
  });

  return {
    success: true,
    action: "suggest_topics",
    details: `Based on recent signals, here are the top topics to cover${brandName ? ` for ${brandName}` : ""}:\n\n${suggestions.join("\n")}\n\nWant me to start a pipeline for any of these?`,
  };
}
