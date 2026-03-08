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

  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
  });

  const departmentScores = await Promise.all(
    departments.map(async (dept) => {
      // 1. Avg sentiment score (weighted 30%) - scale 1-5, normalize to 0-100
      const currentSentiments = await prisma.sentimentEntry.findMany({
        where: { departmentId: dept.id, createdAt: { gte: currentPeriodStart } },
        select: { score: true },
      });
      const previousSentiments = await prisma.sentimentEntry.findMany({
        where: {
          departmentId: dept.id,
          createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
        },
        select: { score: true },
      });

      const avgSentiment =
        currentSentiments.length > 0
          ? currentSentiments.reduce((s, e) => s + e.score, 0) / currentSentiments.length
          : 3;
      const sentimentScore = ((avgSentiment - 1) / 4) * 100; // normalize 1-5 to 0-100

      const prevAvgSentiment =
        previousSentiments.length > 0
          ? previousSentiments.reduce((s, e) => s + e.score, 0) / previousSentiments.length
          : 3;
      const prevSentimentScore = ((prevAvgSentiment - 1) / 4) * 100;

      // 2. Engagement metric average (weighted 25%)
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

      const currentEngagement = await prisma.engagementMetric.findMany({
        where: { departmentId: dept.id, period: currentMonth },
        select: { overallScore: true },
      });
      const previousEngagement = await prisma.engagementMetric.findMany({
        where: { departmentId: dept.id, period: prevMonthStr },
        select: { overallScore: true },
      });

      const engagementScore =
        currentEngagement.length > 0
          ? currentEngagement.reduce((s, e) => s + e.overallScore, 0) / currentEngagement.length
          : 50;
      const prevEngagementScore =
        previousEngagement.length > 0
          ? previousEngagement.reduce((s, e) => s + e.overallScore, 0) / previousEngagement.length
          : 50;

      // 3. Recognition frequency (weighted 20%)
      const currentRecognitions = await prisma.recognition.count({
        where: {
          createdAt: { gte: currentPeriodStart },
          toUserId: {
            in: (
              await prisma.departmentMember.findMany({
                where: { departmentId: dept.id },
                select: { userId: true },
              })
            ).map((m) => m.userId),
          },
        },
      });
      const previousRecognitions = await prisma.recognition.count({
        where: {
          createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
          toUserId: {
            in: (
              await prisma.departmentMember.findMany({
                where: { departmentId: dept.id },
                select: { userId: true },
              })
            ).map((m) => m.userId),
          },
        },
      });

      const memberCount = await prisma.departmentMember.count({
        where: { departmentId: dept.id },
      });

      // Recognition score: recognitions per member, capped at 100
      const recognitionScore = memberCount > 0
        ? Math.min((currentRecognitions / memberCount) * 20, 100)
        : 0;
      const prevRecognitionScore = memberCount > 0
        ? Math.min((previousRecognitions / memberCount) * 20, 100)
        : 0;

      // 4. Collaboration score (weighted 15%) - cross-dept task participation
      const deptMembers = await prisma.departmentMember.findMany({
        where: { departmentId: dept.id },
        select: { userId: true },
      });
      const deptMemberIds = deptMembers.map((m) => m.userId);

      const crossDeptTasks = await prisma.task.count({
        where: {
          assigneeId: { in: deptMemberIds },
          departmentId: { not: dept.id },
          createdAt: { gte: currentPeriodStart },
          status: { notIn: ["CANCELLED"] },
        },
      });
      const totalTasks = await prisma.task.count({
        where: {
          assigneeId: { in: deptMemberIds },
          createdAt: { gte: currentPeriodStart },
          status: { notIn: ["CANCELLED"] },
        },
      });

      const collaborationScore = totalTasks > 0
        ? Math.min((crossDeptTasks / totalTasks) * 200, 100)
        : 50;

      const prevCrossDeptTasks = await prisma.task.count({
        where: {
          assigneeId: { in: deptMemberIds },
          departmentId: { not: dept.id },
          createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
          status: { notIn: ["CANCELLED"] },
        },
      });
      const prevTotalTasks = await prisma.task.count({
        where: {
          assigneeId: { in: deptMemberIds },
          createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
          status: { notIn: ["CANCELLED"] },
        },
      });
      const prevCollaborationScore = prevTotalTasks > 0
        ? Math.min((prevCrossDeptTasks / prevTotalTasks) * 200, 100)
        : 50;

      // 5. Retention indicator (weighted 10%) - consistent activity
      const activeDaysMetrics = await prisma.engagementMetric.findMany({
        where: { departmentId: dept.id, period: currentMonth },
        select: { activeDays: true },
      });
      const avgActiveDays =
        activeDaysMetrics.length > 0
          ? activeDaysMetrics.reduce((s, e) => s + e.activeDays, 0) / activeDaysMetrics.length
          : 10;
      const retentionScore = Math.min((avgActiveDays / 22) * 100, 100);

      const prevActiveDaysMetrics = await prisma.engagementMetric.findMany({
        where: { departmentId: dept.id, period: prevMonthStr },
        select: { activeDays: true },
      });
      const prevAvgActiveDays =
        prevActiveDaysMetrics.length > 0
          ? prevActiveDaysMetrics.reduce((s, e) => s + e.activeDays, 0) / prevActiveDaysMetrics.length
          : 10;
      const prevRetentionScore = Math.min((prevAvgActiveDays / 22) * 100, 100);

      // Compute overall culture score
      const overallScore = Math.round(
        sentimentScore * 0.3 +
        engagementScore * 0.25 +
        recognitionScore * 0.2 +
        collaborationScore * 0.15 +
        retentionScore * 0.1
      );

      const prevOverallScore = Math.round(
        prevSentimentScore * 0.3 +
        prevEngagementScore * 0.25 +
        prevRecognitionScore * 0.2 +
        prevCollaborationScore * 0.15 +
        prevRetentionScore * 0.1
      );

      const trend = overallScore > prevOverallScore
        ? "up"
        : overallScore < prevOverallScore
        ? "down"
        : "stable";

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        overallScore,
        prevOverallScore,
        trend,
        memberCount,
        breakdown: {
          sentiment: Math.round(sentimentScore),
          engagement: Math.round(engagementScore),
          recognition: Math.round(recognitionScore),
          collaboration: Math.round(collaborationScore),
          retention: Math.round(retentionScore),
        },
      };
    })
  );

  // Org-wide culture score
  const orgScore =
    departmentScores.length > 0
      ? Math.round(
          departmentScores.reduce((s, d) => s + d.overallScore, 0) / departmentScores.length
        )
      : 0;

  // Flags
  const decliningDepts = departmentScores.filter((d) => d.trend === "down");
  const lowCultureDepts = departmentScores.filter((d) => d.overallScore < 40);
  const engagementDrops = departmentScores.filter(
    (d) => d.breakdown.engagement < 40 && d.prevOverallScore > d.overallScore
  );

  // Unrecognized performers: users with high task completion but low recognition received
  const allMembers = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["MEMBER", "DEPT_HEAD"] } },
    select: {
      id: true,
      name: true,
      avatar: true,
      primaryDeptId: true,
      _count: {
        select: {
          assignedTasks: {
            where: { status: "DONE", completedAt: { gte: currentPeriodStart } },
          },
        },
      },
    },
  });

  const performersWithRecognition = await Promise.all(
    allMembers
      .filter((m) => m._count.assignedTasks >= 5)
      .map(async (m) => {
        const recognitionsReceived = await prisma.recognition.count({
          where: { toUserId: m.id, createdAt: { gte: currentPeriodStart } },
        });
        return {
          userId: m.id,
          name: m.name,
          avatar: m.avatar,
          departmentId: m.primaryDeptId,
          tasksCompleted: m._count.assignedTasks,
          recognitionsReceived,
        };
      })
  );

  const unrecognizedPerformers = performersWithRecognition
    .filter((p) => p.recognitionsReceived === 0)
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
    .slice(0, 10);

  return NextResponse.json({
    orgScore,
    departments: departmentScores,
    trends: {
      declining: decliningDepts.map((d) => d.departmentName),
      lowCulture: lowCultureDepts.map((d) => d.departmentName),
      engagementDrops: engagementDrops.map((d) => d.departmentName),
    },
    flags: [
      ...decliningDepts.map((d) => ({
        type: "declining_culture",
        message: `${d.departmentName} culture score declined from ${d.prevOverallScore} to ${d.overallScore}`,
        departmentId: d.departmentId,
        severity: d.overallScore < 40 ? "high" : "medium",
      })),
      ...engagementDrops.map((d) => ({
        type: "engagement_drop",
        message: `${d.departmentName} engagement dropped to ${d.breakdown.engagement}%`,
        departmentId: d.departmentId,
        severity: "medium" as const,
      })),
      ...lowCultureDepts.map((d) => ({
        type: "low_culture",
        message: `${d.departmentName} has a critically low culture score of ${d.overallScore}`,
        departmentId: d.departmentId,
        severity: "high" as const,
      })),
    ],
    unrecognizedPerformers,
  });
}
