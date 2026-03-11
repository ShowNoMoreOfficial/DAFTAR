import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
  });

  // 1. Department interaction map
  // Find tasks where assignee is from a different dept than the task's department
  const crossDeptTasks = await prisma.task.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      assigneeId: { not: null },
      departmentId: { not: null },
    },
    select: {
      departmentId: true,
      assignee: {
        select: {
          primaryDeptId: true,
        },
      },
    },
  });

  // Build interaction counts between departments
  const interactionMap: Record<string, Record<string, number>> = {};
  for (const dept of departments) {
    interactionMap[dept.id] = {};
    for (const other of departments) {
      if (dept.id !== other.id) {
        interactionMap[dept.id][other.id] = 0;
      }
    }
  }

  for (const task of crossDeptTasks) {
    const taskDeptId = task.departmentId;
    const assigneeDeptId = task.assignee?.primaryDeptId;
    if (taskDeptId && assigneeDeptId && taskDeptId !== assigneeDeptId) {
      if (interactionMap[taskDeptId]?.[assigneeDeptId] !== undefined) {
        interactionMap[taskDeptId][assigneeDeptId]++;
      }
      if (interactionMap[assigneeDeptId]?.[taskDeptId] !== undefined) {
        interactionMap[assigneeDeptId][taskDeptId]++;
      }
    }
  }

  // Also count project members across departments
  const projects = await prisma.project.findMany({
    where: { status: "active" },
    select: {
      deptId: true,
      members: {
        select: {
          user: {
            select: { primaryDeptId: true },
          },
        },
      },
    },
  });

  for (const project of projects) {
    const projectDeptId = project.deptId;
    for (const member of project.members) {
      const memberDeptId = member.user.primaryDeptId;
      if (memberDeptId && projectDeptId !== memberDeptId) {
        if (interactionMap[projectDeptId]?.[memberDeptId] !== undefined) {
          interactionMap[projectDeptId][memberDeptId]++;
        }
      }
    }
  }

  // Format interaction map for response
  const interactions: {
    fromDeptId: string;
    fromDeptName: string;
    toDeptId: string;
    toDeptName: string;
    strength: number;
  }[] = [];

  const deptNameMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const seen = new Set<string>();

  for (const fromId of Object.keys(interactionMap)) {
    for (const toId of Object.keys(interactionMap[fromId])) {
      const key = [fromId, toId].sort().join("-");
      if (!seen.has(key)) {
        seen.add(key);
        const strength = interactionMap[fromId][toId];
        if (strength > 0) {
          interactions.push({
            fromDeptId: fromId,
            fromDeptName: deptNameMap[fromId] || fromId,
            toDeptId: toId,
            toDeptName: deptNameMap[toId] || toId,
            strength,
          });
        }
      }
    }
  }

  interactions.sort((a, b) => b.strength - a.strength);

  // 2. Cross-dept bottlenecks
  const crossDeptBottlenecks = await prisma.crossDeptDependency.findMany({
    where: { status: { in: ["waiting", "escalated"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bottlenecksWithNames = crossDeptBottlenecks.map((b: any) => ({
    ...b,
    fromDeptName: deptNameMap[b.fromDeptId] || b.fromDeptId,
    toDeptName: deptNameMap[b.toDeptId] || b.toDeptId,
  }));

  // 3. Dependency health
  const totalDependencies = await prisma.crossDeptDependency.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });
  const resolvedDependencies = await prisma.crossDeptDependency.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: "resolved",
    },
  });
  const escalatedDependencies = await prisma.crossDeptDependency.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: "escalated",
    },
  });

  const dependencyHealth = {
    total: totalDependencies,
    resolved: resolvedDependencies,
    escalated: escalatedDependencies,
    resolutionRate: totalDependencies > 0
      ? Math.round((resolvedDependencies / totalDependencies) * 100)
      : 100,
  };

  // 4. Resource sharing patterns
  // Find users who work across multiple departments
  const multiDeptUsers = await prisma.departmentMember.groupBy({
    by: ["userId"],
    _count: { departmentId: true },
    having: { departmentId: { _count: { gt: 1 } } },
  });

  // Batch-load users and their departments in 2 queries instead of 2N
  const multiDeptUserIds = multiDeptUsers.slice(0, 10).map((e) => e.userId);
  const [multiDeptUserData, multiDeptMemberships] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: multiDeptUserIds } },
      select: { id: true, name: true, avatar: true },
    }),
    prisma.departmentMember.findMany({
      where: { userId: { in: multiDeptUserIds } },
      select: {
        userId: true,
        department: { select: { id: true, name: true } },
      },
    }),
  ]);

  const userMap = new Map(multiDeptUserData.map((u) => [u.id, u]));
  const userDeptMap = new Map<string, { id: string; name: string }[]>();
  for (const m of multiDeptMemberships) {
    const existing = userDeptMap.get(m.userId) ?? [];
    existing.push({ id: m.department.id, name: m.department.name });
    userDeptMap.set(m.userId, existing);
  }

  const sharedResources = multiDeptUsers.slice(0, 10).map((entry) => {
    const user = userMap.get(entry.userId) ?? null;
    return {
      user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
      departments: userDeptMap.get(entry.userId) ?? [],
      deptCount: entry._count.departmentId,
    };
  });

  // Identify departments with least collaboration
  const leastCollaborating = departments
    .map((dept) => {
      const totalInteractions = Object.values(interactionMap[dept.id] || {}).reduce(
        (s, v) => s + v,
        0
      );
      return { departmentId: dept.id, departmentName: dept.name, totalInteractions };
    })
    .sort((a, b) => a.totalInteractions - b.totalInteractions)
    .slice(0, 3);

  return NextResponse.json({
    departments: departments.map((d) => ({ id: d.id, name: d.name })),
    interactionMap: interactions,
    crossDeptBottlenecks: bottlenecksWithNames,
    dependencyHealth,
    resourceSharing: sharedResources.filter((r) => r.user),
    leastCollaborating,
  });
}
