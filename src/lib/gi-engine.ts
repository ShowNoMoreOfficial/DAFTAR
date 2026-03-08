import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────

export interface GIInsight {
  id: string;
  type: "nudge" | "info" | "alert" | "celebration" | "suggestion";
  priority: "low" | "medium" | "high";
  title: string;
  message: string;
  action?: { label: string; href: string };
  context: string;
  expiresAt?: Date;
}

export interface GIEngineContext {
  module: string;
  view: string;
  entityId: string | null;
  userRole: Role;
}

// ─── In-memory cache ────────────────────────────────────

interface CacheEntry {
  insights: GIInsight[];
  expiresAt: number;
}

const insightsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

function getCacheKey(userId: string, ctx: GIEngineContext): string {
  return `${userId}:${ctx.module}:${ctx.view}:${ctx.entityId ?? "none"}`;
}

export function clearInsightsCache(): void {
  insightsCache.clear();
}

// ─── Main entry point ───────────────────────────────────

export async function generateInsights(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const cacheKey = getCacheKey(userId, context);
  const cached = insightsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.insights;
  }

  const generators: Promise<GIInsight[]>[] = [];

  // Always generate personal task nudges
  generators.push(generateTaskNudges(userId, context));
  generators.push(generateOverdueWarnings(userId, context));
  generators.push(generateCelebrations(userId, context));

  // Role-gated generators
  const isLeader = (["ADMIN", "HEAD_HR", "DEPT_HEAD"] as Role[]).includes(context.userRole);
  if (isLeader) {
    generators.push(generateApprovalAlerts(userId, context));
    generators.push(generateWorkloadInfo(userId, context));
  }

  // Leaderboard nudge (available to all, but based on credibility)
  generators.push(generateLeaderboardNudge(userId, context));

  // Toddler-level generators
  generators.push(generateStreakNudge(userId, context));
  if (isLeader) {
    generators.push(generateRebalanceSuggestion(userId, context));
    generators.push(generateBottleneckDetection(userId, context));
  }

  // Context-specific generators
  if (context.module === "daftar" && context.view === "dashboard") {
    generators.push(generateDashboardContext(userId, context));
  }
  if (context.module === "pms" && context.view === "board") {
    generators.push(generateBoardContext(userId, context));
  }

  const results = await Promise.all(generators);
  const insights = results
    .flat()
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  insightsCache.set(cacheKey, {
    insights,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return insights;
}

// ─── Generator: Task Nudges ─────────────────────────────

async function generateTaskNudges(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  try {
    const [dueTodayCount, activeCount] = await Promise.all([
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { notIn: ["DONE", "CANCELLED"] },
          dueDate: { gte: startOfDay, lt: endOfDay },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { in: ["ASSIGNED", "IN_PROGRESS", "REVIEW"] },
        },
      }),
    ]);

    if (dueTodayCount > 0) {
      insights.push({
        id: `task-due-today-${userId}`,
        type: "nudge",
        priority: dueTodayCount >= 3 ? "high" : "medium",
        title: "Tasks Due Today",
        message: `You have ${dueTodayCount} task${dueTodayCount !== 1 ? "s" : ""} due today. Stay focused!`,
        action: { label: "View tasks", href: "/pms?filter=due-today" },
        context: context.module,
      });
    }

    if (activeCount === 0) {
      insights.push({
        id: `no-active-tasks-${userId}`,
        type: "info",
        priority: "low",
        title: "All Clear",
        message: "You have no active tasks. Check the board for new assignments.",
        action: { label: "Open board", href: "/pms" },
        context: context.module,
      });
    }
  } catch {
    // Non-critical: silently skip
  }

  return insights;
}

// ─── Generator: Overdue Warnings ────────────────────────

async function generateOverdueWarnings(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { lt: new Date() },
      },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    if (overdueTasks.length > 0) {
      const oldest = overdueTasks[0];
      const daysOverdue = oldest.dueDate
        ? Math.floor((Date.now() - oldest.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      insights.push({
        id: `overdue-warning-${userId}`,
        type: "alert",
        priority: "high",
        title: "Overdue Tasks",
        message:
          overdueTasks.length === 1
            ? `"${oldest.title}" is overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}. Prioritize this to protect your credibility score.`
            : `${overdueTasks.length} tasks are overdue. The oldest is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} late. Address these first.`,
        action: { label: "View overdue", href: "/pms?filter=overdue" },
        context: context.module,
      });
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Celebrations ────────────────────────────

async function generateCelebrations(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const completedThisWeek = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: "DONE",
        completedAt: { gte: weekAgo },
      },
    });

    if (completedThisWeek >= 10) {
      insights.push({
        id: `celebration-10-${userId}`,
        type: "celebration",
        priority: "low",
        title: "Outstanding Week!",
        message: `You completed ${completedThisWeek} tasks this week! You're on fire.`,
        context: context.module,
      });
    } else if (completedThisWeek >= 5) {
      insights.push({
        id: `celebration-5-${userId}`,
        type: "celebration",
        priority: "low",
        title: "Great Progress!",
        message: `You completed ${completedThisWeek} tasks this week. Keep the momentum going!`,
        context: context.module,
      });
    }

    // Check for quality: tasks that went to APPROVED without cycling back
    const approvedFirstTry = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: ["APPROVED", "DONE"] },
        completedAt: { gte: weekAgo },
      },
    });

    if (approvedFirstTry >= 3 && completedThisWeek >= 3) {
      insights.push({
        id: `quality-celebration-${userId}`,
        type: "celebration",
        priority: "low",
        title: "Quality Work!",
        message: `${approvedFirstTry} tasks approved this week — great quality!`,
        context: context.module,
      });
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Approval Alerts (DEPT_HEAD+) ────────────

async function generateApprovalAlerts(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    // Get user's department to find tasks needing review
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryDeptId: true },
    });

    if (user?.primaryDeptId) {
      const reviewCount = await prisma.task.count({
        where: {
          departmentId: user.primaryDeptId,
          status: "REVIEW",
        },
      });

      if (reviewCount > 0) {
        insights.push({
          id: `approval-pending-${userId}`,
          type: "alert",
          priority: reviewCount >= 5 ? "high" : "medium",
          title: "Pending Reviews",
          message: `${reviewCount} item${reviewCount !== 1 ? "s" : ""} waiting for your review/approval.`,
          action: { label: "Review queue", href: "/pms?filter=review" },
          context: context.module,
        });
      }
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Workload Info (DEPT_HEAD+) ──────────────

async function generateWorkloadInfo(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryDeptId: true },
    });

    if (user?.primaryDeptId) {
      const [activeTeamTasks, overdueTeamTasks] = await Promise.all([
        prisma.task.count({
          where: {
            departmentId: user.primaryDeptId,
            status: { in: ["ASSIGNED", "IN_PROGRESS", "REVIEW"] },
          },
        }),
        prisma.task.count({
          where: {
            departmentId: user.primaryDeptId,
            status: { notIn: ["DONE", "CANCELLED"] },
            dueDate: { lt: new Date() },
          },
        }),
      ]);

      if (activeTeamTasks > 0 || overdueTeamTasks > 0) {
        const parts: string[] = [`Your team has ${activeTeamTasks} active task${activeTeamTasks !== 1 ? "s" : ""}`];
        if (overdueTeamTasks > 0) {
          parts.push(`${overdueTeamTasks} ${overdueTeamTasks === 1 ? "is" : "are"} overdue`);
        }
        insights.push({
          id: `workload-info-${userId}`,
          type: "info",
          priority: overdueTeamTasks > 0 ? "medium" : "low",
          title: "Team Workload",
          message: parts.join(", ") + ".",
          action: { label: "View workload", href: "/pms/workload" },
          context: context.module,
        });
      }
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Leaderboard Nudge ───────────────────────

async function generateLeaderboardNudge(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    // Get all credibility scores, sorted descending
    const scores = await prisma.credibilityScore.findMany({
      orderBy: { overallScore: "desc" },
      select: { userId: true, overallScore: true, tasksCompleted: true },
      take: 20,
    });

    if (scores.length === 0) return insights;

    const rank = scores.findIndex((s) => s.userId === userId);
    if (rank === -1) return insights;

    const userScore = scores[rank];
    const position = rank + 1;

    if (position <= 3) {
      insights.push({
        id: `leaderboard-top-${userId}`,
        type: "celebration",
        priority: "low",
        title: "Top Performer!",
        message: `You're ranked #${position} on the leaderboard with a score of ${Math.round(userScore.overallScore)}. Keep it up!`,
        action: { label: "View leaderboard", href: "/leaderboard" },
        context: context.module,
      });
    } else if (position <= 5) {
      const thirdPlace = scores[2];
      const gap = Math.round(thirdPlace.overallScore - userScore.overallScore);
      insights.push({
        id: `leaderboard-close-${userId}`,
        type: "nudge",
        priority: "low",
        title: "Almost There!",
        message: `You're ranked #${position}. Just ${gap} points from the top 3!`,
        action: { label: "View leaderboard", href: "/leaderboard" },
        context: context.module,
      });
    } else if (position > 5) {
      insights.push({
        id: `leaderboard-rank-${userId}`,
        type: "info",
        priority: "low",
        title: "Your Ranking",
        message: `You're ranked #${position} on the leaderboard. Complete tasks on time to climb up!`,
        action: { label: "View leaderboard", href: "/leaderboard" },
        context: context.module,
      });
    }
  } catch {
    // Non-critical: credibility scores may not exist yet
  }

  return insights;
}

// ─── Generator: Dashboard Context ───────────────────────

async function generateDashboardContext(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const [totalActive, completedThisWeek, totalOverdue] = await Promise.all([
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { in: ["ASSIGNED", "IN_PROGRESS", "REVIEW"] },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: "DONE",
          completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { notIn: ["DONE", "CANCELLED"] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    insights.push({
      id: `dashboard-overview-${userId}`,
      type: "info",
      priority: "low",
      title: "Your Overview",
      message: `${totalActive} active tasks, ${completedThisWeek} completed this week${totalOverdue > 0 ? `, ${totalOverdue} overdue` : ""}. ${totalOverdue === 0 ? "You're on track!" : "Focus on overdue items first."}`,
      context: context.module,
    });
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Board Context ───────────────────────────

async function generateBoardContext(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    // Count tasks in review status for the department
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryDeptId: true },
    });

    const deptFilter = user?.primaryDeptId
      ? { departmentId: user.primaryDeptId }
      : { assigneeId: userId };

    const [reviewCount, inProgressCount, assignedCount] = await Promise.all([
      prisma.task.count({
        where: { ...deptFilter, status: "REVIEW" },
      }),
      prisma.task.count({
        where: { ...deptFilter, status: "IN_PROGRESS" },
      }),
      prisma.task.count({
        where: { ...deptFilter, status: "ASSIGNED" },
      }),
    ]);

    if (reviewCount > 0) {
      insights.push({
        id: `board-review-${userId}`,
        type: "nudge",
        priority: reviewCount >= 5 ? "medium" : "low",
        title: "Review Column",
        message: `Review column has ${reviewCount} item${reviewCount !== 1 ? "s" : ""} waiting. ${reviewCount >= 5 ? "Consider clearing the queue." : ""}`,
        context: context.module,
      });
    }

    if (assignedCount > 0 && inProgressCount === 0) {
      insights.push({
        id: `board-start-work-${userId}`,
        type: "suggestion",
        priority: "low",
        title: "Get Started",
        message: `You have ${assignedCount} assigned task${assignedCount !== 1 ? "s" : ""} but nothing in progress. Pick one and start working!`,
        context: context.module,
      });
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Streak Nudge (Toddler) ─────────────────

async function generateStreakNudge(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const streak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!streak) return insights;

    const lastDate = streak.lastActivityAt.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    if (lastDate !== today && streak.currentStreak >= 3) {
      insights.push({
        id: `streak-save-${userId}`,
        type: "nudge",
        priority: "medium",
        title: "Keep Your Streak!",
        message: `You have a ${streak.currentStreak}-day streak. Complete a task today to keep it alive!`,
        action: { label: "View tasks", href: "/pms" },
        context: context.module,
      });
    }

    if (streak.currentStreak >= 7 && lastDate === today) {
      insights.push({
        id: `streak-celebrate-${userId}`,
        type: "celebration",
        priority: "low",
        title: `${streak.currentStreak}-Day Streak!`,
        message: `You're on a ${streak.currentStreak}-day streak. Level ${streak.level} with ${streak.totalXp} XP total!`,
        action: { label: "Achievements", href: "/pms/gamification" },
        context: context.module,
      });
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Rebalance Suggestion (Toddler, DEPT_HEAD+) ──

async function generateRebalanceSuggestion(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryDeptId: true },
    });

    if (!user?.primaryDeptId) return insights;

    const members = await prisma.user.findMany({
      where: { primaryDeptId: user.primaryDeptId, isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            assignedTasks: { where: { status: { notIn: ["DONE", "CANCELLED"] } } },
          },
        },
      },
    });

    if (members.length < 2) return insights;

    const loads = members.map((m) => ({ name: m.name, count: m._count.assignedTasks }));
    const max = Math.max(...loads.map((l) => l.count));
    const min = Math.min(...loads.map((l) => l.count));

    if (max - min >= 5) {
      const overloaded = loads.find((l) => l.count === max);
      const underloaded = loads.find((l) => l.count === min);

      insights.push({
        id: `rebalance-${userId}`,
        type: "suggestion",
        priority: "medium",
        title: "Workload Imbalance",
        message: `${overloaded?.name} has ${max} tasks while ${underloaded?.name} has ${min}. Consider redistributing.`,
        action: { label: "View workload", href: "/pms/workload" },
        context: context.module,
      });
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Bottleneck Detection (Toddler, DEPT_HEAD+) ──

async function generateBottleneckDetection(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryDeptId: true },
    });

    const deptFilter = user?.primaryDeptId
      ? { departmentId: user.primaryDeptId }
      : {};

    // Tasks stuck in REVIEW for > 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const stuckInReview = await prisma.task.count({
      where: {
        ...deptFilter,
        status: "REVIEW",
        updatedAt: { lt: twoDaysAgo },
      },
    });

    if (stuckInReview > 0) {
      insights.push({
        id: `bottleneck-review-${userId}`,
        type: "alert",
        priority: stuckInReview >= 3 ? "high" : "medium",
        title: "Review Bottleneck",
        message: `${stuckInReview} task${stuckInReview !== 1 ? "s" : ""} stuck in review for 2+ days. This is slowing delivery.`,
        action: { label: "Clear reviews", href: "/pms?filter=review" },
        context: context.module,
      });
    }

    // Tasks stuck in IN_PROGRESS for > 5 days
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const stuckInProgress = await prisma.task.count({
      where: {
        ...deptFilter,
        status: "IN_PROGRESS",
        updatedAt: { lt: fiveDaysAgo },
      },
    });

    if (stuckInProgress > 0) {
      insights.push({
        id: `bottleneck-progress-${userId}`,
        type: "alert",
        priority: "medium",
        title: "Stalled Tasks",
        message: `${stuckInProgress} task${stuckInProgress !== 1 ? "s have" : " has"} been in progress for 5+ days without updates.`,
        action: { label: "Investigate", href: "/pms" },
        context: context.module,
      });
    }
  } catch {
    // Non-critical
  }

  return insights;
}
