import { prisma } from "@/lib/prisma";
import type { TaskPriority } from "@prisma/client";

/**
 * Priority-based workload weights.
 * Each active task contributes this percentage to total capacity load.
 */
const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  URGENT: 40,
  HIGH: 25,
  MEDIUM: 15,
  LOW: 10,
};

const MAX_CAPACITY = 150;

export interface CapacityResult {
  userId: string;
  activeTaskCount: number;
  capacityLoad: number; // 0–150%
  breakdown: { priority: TaskPriority; count: number; weight: number }[];
  status: "available" | "busy" | "overloaded" | "critical";
}

/**
 * Calculate real-time capacity load for a single user.
 * Fetches all non-terminal tasks assigned to the user and weighs by priority.
 */
export async function calculateUserCapacity(
  userId: string
): Promise<CapacityResult> {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { notIn: ["DONE", "CANCELLED"] },
    },
    select: { id: true, priority: true },
  });

  return computeCapacity(userId, tasks);
}

/**
 * Pure computation — accepts pre-fetched tasks for testability
 * and reuse from the culture monitor (avoids double-fetching).
 */
export function computeCapacity(
  userId: string,
  tasks: { id: string; priority: TaskPriority }[]
): CapacityResult {
  const countsByPriority: Record<TaskPriority, number> = {
    URGENT: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  for (const task of tasks) {
    countsByPriority[task.priority]++;
  }

  let rawLoad = 0;
  const breakdown: CapacityResult["breakdown"] = [];

  for (const [priority, count] of Object.entries(countsByPriority)) {
    const p = priority as TaskPriority;
    const weight = count * PRIORITY_WEIGHTS[p];
    rawLoad += weight;
    breakdown.push({ priority: p, count, weight });
  }

  const capacityLoad = Math.min(rawLoad, MAX_CAPACITY);

  let status: CapacityResult["status"];
  if (capacityLoad > 95) status = "critical";
  else if (capacityLoad > 80) status = "overloaded";
  else if (capacityLoad > 50) status = "busy";
  else status = "available";

  return {
    userId,
    activeTaskCount: tasks.length,
    capacityLoad,
    breakdown,
    status,
  };
}

/**
 * Calculate capacity for all active members, optionally filtered by department.
 */
export async function calculateDepartmentCapacity(
  departmentId?: string
): Promise<CapacityResult[]> {
  const userFilter: Record<string, unknown> = {
    isActive: true,
    role: { in: ["MEMBER", "DEPT_HEAD", "CONTRACTOR"] },
  };
  if (departmentId) userFilter.primaryDeptId = departmentId;

  const users = await prisma.user.findMany({
    where: userFilter,
    select: {
      id: true,
      assignedTasks: {
        where: { status: { notIn: ["DONE", "CANCELLED"] } },
        select: { id: true, priority: true },
      },
    },
  });

  return users.map((u) => computeCapacity(u.id, u.assignedTasks));
}
