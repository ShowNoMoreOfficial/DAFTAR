import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const bottlenecks = await prisma.bottleneck.findMany({
    where,
    orderBy: [{ severity: "asc" }, { detectedAt: "desc" }],
    take: 50,
  });

  // Sort by severity priority
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  bottlenecks.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  return NextResponse.json(bottlenecks);
}

export async function POST() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const detected: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    departmentId: string | null;
    taskId: string | null;
    blockedById: string | null;
    affectedIds: string[];
  }> = [];

  // 1. Tasks in REVIEW for >24 hours -> approval_delayed
  const staleReviews = await prisma.task.findMany({
    where: {
      status: "REVIEW",
      updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true, title: true, assigneeId: true, departmentId: true },
  });

  for (const task of staleReviews) {
    // Check if bottleneck already exists for this task
    const existing = await prisma.bottleneck.findFirst({
      where: { taskId: task.id, type: "approval_delayed", status: "active" },
    });
    if (!existing) {
      detected.push({
        type: "approval_delayed",
        severity: "high",
        title: `Review stale: ${task.title}`,
        description: `Task "${task.title}" has been in REVIEW status for over 24 hours.`,
        departmentId: task.departmentId,
        taskId: task.id,
        blockedById: null,
        affectedIds: task.assigneeId ? [task.assigneeId] : [],
      });
    }
  }

  // 2. Tasks overdue by >2 days -> task_blocked
  const overdueThreshold = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { notIn: ["DONE", "CANCELLED"] },
      dueDate: { lt: overdueThreshold },
    },
    select: { id: true, title: true, assigneeId: true, departmentId: true, dueDate: true },
  });

  for (const task of overdueTasks) {
    const existing = await prisma.bottleneck.findFirst({
      where: { taskId: task.id, type: "task_blocked", status: "active" },
    });
    if (!existing) {
      const daysOverdue = Math.round(
        (now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
      );
      detected.push({
        type: "task_blocked",
        severity: daysOverdue > 7 ? "critical" : "high",
        title: `Overdue: ${task.title}`,
        description: `Task "${task.title}" is ${daysOverdue} days overdue.`,
        departmentId: task.departmentId,
        taskId: task.id,
        blockedById: task.assigneeId,
        affectedIds: task.assigneeId ? [task.assigneeId] : [],
      });
    }
  }

  // 3. Users with >10 active tasks -> capacity_exceeded
  const overloadedUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      assignedTasks: { some: { status: { notIn: ["DONE", "CANCELLED"] } } },
    },
    select: {
      id: true,
      name: true,
      primaryDeptId: true,
      _count: {
        select: {
          assignedTasks: { where: { status: { notIn: ["DONE", "CANCELLED"] } } },
        },
      },
    },
  });

  for (const user of overloadedUsers) {
    if (user._count.assignedTasks > 10) {
      const existing = await prisma.bottleneck.findFirst({
        where: { blockedById: user.id, type: "capacity_exceeded", status: "active" },
      });
      if (!existing) {
        detected.push({
          type: "capacity_exceeded",
          severity: user._count.assignedTasks > 15 ? "critical" : "medium",
          title: `Overloaded: ${user.name}`,
          description: `${user.name} has ${user._count.assignedTasks} active tasks, exceeding capacity.`,
          departmentId: user.primaryDeptId,
          taskId: null,
          blockedById: user.id,
          affectedIds: [user.id],
        });
      }
    }
  }

  // 4. Tasks where assignee's dept differs from task dept and task is stale (>3 days no update)
  const staleCrossDept = await prisma.task.findMany({
    where: {
      status: { notIn: ["DONE", "CANCELLED"] },
      assigneeId: { not: null },
      departmentId: { not: null },
      updatedAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      title: true,
      departmentId: true,
      assigneeId: true,
      assignee: { select: { primaryDeptId: true, name: true } },
    },
  });

  for (const task of staleCrossDept) {
    if (
      task.assignee &&
      task.assignee.primaryDeptId &&
      task.departmentId &&
      task.assignee.primaryDeptId !== task.departmentId
    ) {
      const existing = await prisma.bottleneck.findFirst({
        where: { taskId: task.id, type: "dependency_waiting", status: "active" },
      });
      if (!existing) {
        detected.push({
          type: "dependency_waiting",
          severity: "medium",
          title: `Cross-dept stale: ${task.title}`,
          description: `Task "${task.title}" is assigned to ${task.assignee.name} from a different department and has been stale for 3+ days.`,
          departmentId: task.departmentId,
          taskId: task.id,
          blockedById: task.assigneeId,
          affectedIds: task.assigneeId ? [task.assigneeId] : [],
        });
      }
    }
  }

  // Create all detected bottlenecks
  if (detected.length > 0) {
    await prisma.bottleneck.createMany({
      data: detected.map((b) => ({
        type: b.type,
        severity: b.severity,
        title: b.title,
        description: b.description,
        departmentId: b.departmentId,
        taskId: b.taskId,
        blockedById: b.blockedById,
        affectedIds: b.affectedIds,
        status: "active",
      })),
    });
  }

  // Return all active bottlenecks
  const allActive = await prisma.bottleneck.findMany({
    where: { status: "active" },
    orderBy: { detectedAt: "desc" },
  });

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  allActive.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  return NextResponse.json({ newlyDetected: detected.length, bottlenecks: allActive });
}
