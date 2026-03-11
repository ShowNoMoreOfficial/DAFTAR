import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId") || session.user.primaryDepartmentId;

  // Get team members for the department
  const memberFilter: Record<string, unknown> = {};
  if (departmentId) {
    memberFilter.departments = { some: { departmentId } };
  }

  const users = await prisma.user.findMany({
    where: { ...memberFilter, isActive: true, role: { in: ["MEMBER", "CONTRACTOR", "DEPT_HEAD"] } },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      assignedTasks: {
        where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "REVIEW"] } },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          difficultyWeight: true,
          dueDate: true,
        },
      },
      credibilityScore: {
        select: {
          overallScore: true,
          tasksCompleted: true,
          tasksOnTime: true,
          tasksLate: true,
        },
      },
    },
  });

  const workload = users.map((user) => {
    const activeTasks = user.assignedTasks;
    const totalWeight = activeTasks.reduce((sum, t) => sum + t.difficultyWeight, 0);
    const overdueTasks = activeTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date()
    );

    return {
      user: { id: user.id, name: user.name, avatar: user.avatar, role: user.role },
      activeTasks: activeTasks.length,
      totalWeight,
      overdueTasks: overdueTasks.length,
      tasksByStatus: {
        assigned: activeTasks.filter((t) => t.status === "ASSIGNED").length,
        inProgress: activeTasks.filter((t) => t.status === "IN_PROGRESS").length,
        review: activeTasks.filter((t) => t.status === "REVIEW").length,
      },
      credibility: user.credibilityScore,
    };
  });

  // Sort by total weight descending (most loaded first)
  workload.sort((a, b) => b.totalWeight - a.totalWeight);

  return NextResponse.json(workload);
}
