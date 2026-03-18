import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId");
  const period = searchParams.get("period") || getCurrentPeriod();

  const where: Record<string, unknown> = { period };

  if (departmentId) {
    where.departmentId = departmentId;
  } else if (role === "DEPT_HEAD" && session.user.primaryDepartmentId) {
    where.departmentId = session.user.primaryDepartmentId;
  }

  const metrics = await prisma.engagementMetric.findMany({
    where,
    orderBy: { overallScore: "desc" },
  });

  // Resolve user info
  const userIds = metrics.map((m) => m.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatar: true, primaryDeptId: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  // Group by department
  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
  });
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  // Aggregate by department
  const deptMetrics: Record<
    string,
    {
      departmentId: string;
      departmentName: string;
      avgOverallScore: number;
      avgTaskCompletion: number;
      avgCollaboration: number;
      avgActiveDays: number;
      userCount: number;
    }
  > = {};

  for (const m of metrics) {
    const user = userMap[m.userId];
    const deptId = m.departmentId || user?.primaryDeptId || "unassigned";
    const deptName = deptMap[deptId] || "Unassigned";

    if (!deptMetrics[deptId]) {
      deptMetrics[deptId] = {
        departmentId: deptId,
        departmentName: deptName,
        avgOverallScore: 0,
        avgTaskCompletion: 0,
        avgCollaboration: 0,
        avgActiveDays: 0,
        userCount: 0,
      };
    }
    deptMetrics[deptId].avgOverallScore += m.overallScore;
    deptMetrics[deptId].avgTaskCompletion += m.taskCompletionRate;
    deptMetrics[deptId].avgCollaboration += m.collaborationScore;
    deptMetrics[deptId].avgActiveDays += m.activeDays;
    deptMetrics[deptId].userCount += 1;
  }

  // Compute averages
  for (const d of Object.values(deptMetrics)) {
    if (d.userCount > 0) {
      d.avgOverallScore = Math.round((d.avgOverallScore / d.userCount) * 10) / 10;
      d.avgTaskCompletion = Math.round((d.avgTaskCompletion / d.userCount) * 10) / 10;
      d.avgCollaboration = Math.round((d.avgCollaboration / d.userCount) * 10) / 10;
      d.avgActiveDays = Math.round(d.avgActiveDays / d.userCount);
    }
  }

  return NextResponse.json({
    period,
    departments: Object.values(deptMetrics),
    individuals: metrics.map((m) => ({
      ...m,
      user: userMap[m.userId] || { id: m.userId, name: "Unknown" },
    })),
  });
});

export const POST = apiHandler(async (_req: NextRequest, { session }) => {
  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const period = getCurrentPeriod();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get all active users
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["MEMBER", "DEPT_HEAD", "CONTRACTOR"] } },
    select: { id: true, primaryDeptId: true },
  });

  const results = [];

  for (const user of users) {
    // Task data
    const [totalAssigned, completed, activeDays] = await Promise.all([
      prisma.task.count({
        where: { assigneeId: user.id, createdAt: { gte: monthStart } },
      }),
      prisma.task.count({
        where: {
          assigneeId: user.id,
          status: "DONE",
          completedAt: { gte: monthStart },
        },
      }),
      prisma.taskActivity.findMany({
        where: { actorId: user.id, createdAt: { gte: monthStart } },
        select: { createdAt: true },
        distinct: ["createdAt"],
      }),
    ]);

    const taskCompletionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

    // Unique active days
    const uniqueDays = new Set(
      activeDays.map((a) => a.createdAt.toISOString().slice(0, 10))
    );

    // Recognition data
    const [given, received] = await Promise.all([
      prisma.recognition.count({
        where: { fromUserId: user.id, createdAt: { gte: monthStart } },
      }),
      prisma.recognition.count({
        where: { toUserId: user.id, createdAt: { gte: monthStart } },
      }),
    ]);

    // Collaboration score: based on cross-user activity (comments on others' tasks)
    const commentsOnOthers = await prisma.taskComment.count({
      where: {
        authorId: user.id,
        createdAt: { gte: monthStart },
        task: { assigneeId: { not: user.id } },
      },
    });
    const collaborationScore = Math.min(commentsOnOthers * 10, 100);

    // Overall score
    const overallScore = Math.round(
      taskCompletionRate * 0.4 +
        collaborationScore * 0.25 +
        Math.min(uniqueDays.size * 5, 100) * 0.2 +
        Math.min((given + received) * 10, 100) * 0.15
    );

    const data = {
      userId: user.id,
      departmentId: user.primaryDeptId,
      period,
      taskCompletionRate,
      avgResponseTime: 0,
      collaborationScore,
      activeDays: uniqueDays.size,
      recognitionsGiven: given,
      recognitionsReceived: received,
      overallScore,
      computedAt: now,
    };

    const metric = await prisma.engagementMetric.upsert({
      where: { userId_period: { userId: user.id, period } },
      create: data,
      update: data,
    });

    results.push(metric);
  }

  return NextResponse.json({
    period,
    computed: results.length,
    message: `Engagement metrics computed for ${results.length} users.`,
  });
});
