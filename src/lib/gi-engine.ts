import { prisma } from "@/lib/prisma";
import type { Role, Prisma } from "@prisma/client";

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

  // Toddler: Task sequencing and content scheduling
  generators.push(generateTaskSequencing(userId, context));
  if (context.module === "relay") {
    generators.push(generateContentSchedulingInsight(userId, context));
  }

  // Adolescent: Pattern recognition, team intelligence, personalized motivation
  generators.push(generateVelocityTrend(userId, context));
  generators.push(generateQualityTrend(userId, context));
  if (isLeader) {
    generators.push(generateTeamCorrelation(userId, context));
    generators.push(generateCrossDeptInsight(userId, context));
  }
  generators.push(generatePersonalizedMotivation(userId, context));

  // Adult: Predictive analytics, autonomous actions, self-optimization
  generators.push(generateDeadlineRiskPrediction(userId, context));
  generators.push(generateCapacityCrunchPrediction(userId, context));
  if (isLeader) {
    generators.push(generateBurnoutRiskPrediction(userId, context));
    generators.push(generateAutonomousActionSuggestions(userId, context));
  }
  generators.push(generateSelfOptimizingInsights(userId, context));

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

// ─── Generator: Task Sequencing (Toddler) ───────────────

async function generateTaskSequencing(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const activeTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        status: true,
        difficultyWeight: true,
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 10,
    });

    if (activeTasks.length < 2) return insights;

    const now = new Date();
    const urgentNotStarted = activeTasks.find(
      (t) =>
        t.status === "ASSIGNED" &&
        (t.priority === "URGENT" ||
          t.priority === "HIGH" ||
          (t.dueDate && t.dueDate < now))
    );

    const inProgressCount = activeTasks.filter((t) => t.status === "IN_PROGRESS").length;

    if (urgentNotStarted && inProgressCount > 0) {
      const dueLabel = urgentNotStarted.dueDate
        ? urgentNotStarted.dueDate < now
          ? " (overdue)"
          : ` (due ${urgentNotStarted.dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`
        : "";

      insights.push({
        id: `sequencing-urgent-${userId}`,
        type: "suggestion",
        priority: "high",
        title: "Priority Sequencing",
        message: `"${urgentNotStarted.title}" is ${urgentNotStarted.priority}${dueLabel} but hasn't been started. Consider switching to this task.`,
        action: { label: "View task", href: `/pms?task=${urgentNotStarted.id}` },
        context: context.module,
      });
    }

    if (inProgressCount >= 4) {
      insights.push({
        id: `sequencing-wip-${userId}`,
        type: "nudge",
        priority: "medium",
        title: "Focus Mode",
        message: `You have ${inProgressCount} tasks in progress. Try finishing 1-2 before starting more — multitasking reduces quality.`,
        action: { label: "View board", href: "/pms/board" },
        context: context.module,
      });
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Content Scheduling Insight (Toddler) ────

async function generateContentSchedulingInsight(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const scheduledPosts = await prisma.contentPost.count({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: now, lte: nextWeek },
      },
    });

    const allScheduled = await prisma.contentPost.findMany({
      where: {
        status: { in: ["SCHEDULED", "QUEUED"] },
        scheduledAt: { gte: now, lte: nextWeek },
      },
      select: { scheduledAt: true },
    });

    const scheduledDays = new Set(
      allScheduled
        .filter((p: { scheduledAt: Date | null }) => p.scheduledAt)
        .map((p: { scheduledAt: Date | null }) => p.scheduledAt!.toISOString().slice(0, 10))
    );

    let gapDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      if (d.getDay() !== 0 && !scheduledDays.has(d.toISOString().slice(0, 10))) {
        gapDays++;
      }
    }

    if (gapDays >= 3) {
      insights.push({
        id: `content-gaps-${userId}`,
        type: "alert",
        priority: "medium",
        title: "Content Gaps",
        message: `${gapDays} weekdays in the next 7 days have no scheduled content. Consider filling the queue.`,
        action: { label: "Content calendar", href: "/relay/calendar" },
        context: context.module,
      });
    }

    if (scheduledPosts > 0) {
      insights.push({
        id: `content-scheduled-${userId}`,
        type: "info",
        priority: "low",
        title: "Upcoming Posts",
        message: `${scheduledPosts} post${scheduledPosts !== 1 ? "s" : ""} scheduled for this week.`,
        action: { label: "View queue", href: "/relay/queue" },
        context: context.module,
      });
    }

    const failedPosts = await prisma.contentPost.count({
      where: { status: "FAILED" },
    });

    if (failedPosts > 0) {
      insights.push({
        id: `content-failed-${userId}`,
        type: "alert",
        priority: "high",
        title: "Failed Posts",
        message: `${failedPosts} post${failedPosts !== 1 ? "s" : ""} failed to publish. Review and retry.`,
        action: { label: "View failed", href: "/relay/queue?status=FAILED" },
        context: context.module,
      });
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Velocity Trend (Adolescent) ──────────────

async function generateVelocityTrend(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [thisWeek, lastWeek] = await Promise.all([
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: "DONE",
          completedAt: { gte: thisWeekStart },
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: "DONE",
          completedAt: { gte: lastWeekStart, lt: thisWeekStart },
        },
      }),
    ]);

    if (lastWeek > 0) {
      const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

      if (change >= 50 && thisWeek >= 3) {
        insights.push({
          id: `velocity-up-${userId}`,
          type: "celebration",
          priority: "low",
          title: "Velocity Surge",
          message: `Your output is up ${change}% this week (${thisWeek} vs ${lastWeek} last week). Impressive acceleration!`,
          context: context.module,
        });
      } else if (change <= -40 && lastWeek >= 3) {
        insights.push({
          id: `velocity-down-${userId}`,
          type: "nudge",
          priority: "medium",
          title: "Velocity Dip",
          message: `Your completion rate dropped ${Math.abs(change)}% this week (${thisWeek} vs ${lastWeek} last week). Anything blocking you?`,
          action: { label: "View tasks", href: "/pms" },
          context: context.module,
        });

        // Log the pattern for historical tracking
        await logPattern(userId, null, "velocity_trend", `Velocity dropped ${Math.abs(change)}% week-over-week`, {
          thisWeek,
          lastWeek,
          change,
          period: thisWeekStart.toISOString().slice(0, 10),
        }, change <= -60 ? "warning" : "info");
      }
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Quality Trend (Adolescent) ───────────────

async function generateQualityTrend(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { in: ["DONE", "APPROVED"] },
        completedAt: { gte: thirtyDaysAgo },
      },
      select: { completedAt: true, dueDate: true, priority: true },
      orderBy: { completedAt: "desc" },
      take: 20,
    });

    if (recentTasks.length < 5) return insights;

    // Split into two halves and compare on-time rates
    const mid = Math.floor(recentTasks.length / 2);
    const recentHalf = recentTasks.slice(0, mid);
    const olderHalf = recentTasks.slice(mid);

    const onTimeRate = (tasks: typeof recentTasks) => {
      const withDue = tasks.filter((t) => t.dueDate);
      if (withDue.length === 0) return 100;
      const onTime = withDue.filter((t) => t.completedAt && t.dueDate && t.completedAt <= t.dueDate).length;
      return Math.round((onTime / withDue.length) * 100);
    };

    const recentRate = onTimeRate(recentHalf);
    const olderRate = onTimeRate(olderHalf);
    const diff = recentRate - olderRate;

    if (diff >= 20 && recentRate >= 80) {
      insights.push({
        id: `quality-improving-${userId}`,
        type: "celebration",
        priority: "low",
        title: "Quality Improving",
        message: `Your on-time delivery rate improved from ${olderRate}% to ${recentRate}% recently. Consistency pays off!`,
        action: { label: "View credibility", href: "/credibility" },
        context: context.module,
      });
    } else if (diff <= -20 && recentRate < 60) {
      insights.push({
        id: `quality-declining-${userId}`,
        type: "alert",
        priority: "medium",
        title: "Delivery Quality Declining",
        message: `Your on-time rate dropped from ${olderRate}% to ${recentRate}%. Consider fewer concurrent tasks or earlier starts.`,
        action: { label: "View tasks", href: "/pms" },
        context: context.module,
      });

      await logPattern(userId, null, "quality_trend", `On-time rate declining: ${olderRate}% → ${recentRate}%`, {
        recentRate,
        olderRate,
        taskCount: recentTasks.length,
      }, "warning");
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Team Correlation (Adolescent, DEPT_HEAD+) ──

async function generateTeamCorrelation(
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

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get team members and their recent performance
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
        credibilityScore: {
          select: { overallScore: true },
        },
      },
    });

    if (members.length < 3) return insights;

    // Find team members with declining credibility and high workload
    const atRisk = members.filter(
      (m) =>
        m.credibilityScore &&
        m.credibilityScore.overallScore < 40 &&
        m._count.assignedTasks >= 5
    );

    if (atRisk.length > 0) {
      const names = atRisk.map((m) => m.name?.split(" ")[0]).join(", ");
      insights.push({
        id: `team-atrisk-${userId}`,
        type: "alert",
        priority: "high",
        title: "Team Members At Risk",
        message: `${names} ${atRisk.length === 1 ? "has" : "have"} low credibility scores with high workloads. Consider a 1:1 check-in or workload rebalance.`,
        action: { label: "View workload", href: "/pms/workload" },
        context: context.module,
      });
    }

    // Check for team velocity — compare total completions this vs last week
    const [thisWeekTeam, lastWeekTeam] = await Promise.all([
      prisma.task.count({
        where: {
          departmentId: user.primaryDeptId,
          status: "DONE",
          completedAt: { gte: weekAgo },
        },
      }),
      prisma.task.count({
        where: {
          departmentId: user.primaryDeptId,
          status: "DONE",
          completedAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            lt: weekAgo,
          },
        },
      }),
    ]);

    if (lastWeekTeam > 0 && thisWeekTeam > 0) {
      const teamChange = Math.round(((thisWeekTeam - lastWeekTeam) / lastWeekTeam) * 100);
      if (teamChange <= -30 && lastWeekTeam >= 5) {
        insights.push({
          id: `team-velocity-drop-${userId}`,
          type: "alert",
          priority: "medium",
          title: "Team Velocity Drop",
          message: `Department output fell ${Math.abs(teamChange)}% this week (${thisWeekTeam} vs ${lastWeekTeam} completions). Investigate blockers or capacity issues.`,
          action: { label: "View operations", href: "/hoccr/operations" },
          context: context.module,
        });

        await logPattern(null, user.primaryDeptId, "velocity_trend",
          `Team velocity dropped ${Math.abs(teamChange)}%`,
          { thisWeekTeam, lastWeekTeam, teamChange }, "warning"
        );
      }
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Cross-Department Intelligence (Adolescent) ──

async function generateCrossDeptInsight(
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

    // Check for cross-department dependencies that are stalled
    const stalledDeps = await prisma.crossDeptDependency.count({
      where: {
        OR: [
          { fromDeptId: user.primaryDeptId },
          { toDeptId: user.primaryDeptId },
        ],
        status: { in: ["waiting", "escalated"] },
        createdAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      },
    });

    if (stalledDeps > 0) {
      insights.push({
        id: `crossdept-stalled-${userId}`,
        type: "alert",
        priority: stalledDeps >= 3 ? "high" : "medium",
        title: "Cross-Department Blockers",
        message: `${stalledDeps} cross-department ${stalledDeps === 1 ? "dependency is" : "dependencies are"} stalled for 3+ days. This may cascade into delays.`,
        action: { label: "View operations", href: "/hoccr/operations" },
        context: context.module,
      });
    }

    // Check for departments that your team frequently collaborates with
    const recentDeps = await prisma.crossDeptDependency.findMany({
      where: {
        OR: [
          { fromDeptId: user.primaryDeptId },
          { toDeptId: user.primaryDeptId },
        ],
        status: "resolved",
        resolvedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { fromDeptId: true, toDeptId: true },
    });

    if (recentDeps.length >= 5) {
      // Find the most frequent collaborator department
      const deptCounts = new Map<string, number>();
      for (const dep of recentDeps) {
        const otherDept = dep.fromDeptId === user.primaryDeptId ? dep.toDeptId : dep.fromDeptId;
        deptCounts.set(otherDept, (deptCounts.get(otherDept) || 0) + 1);
      }

      const topDept = [...deptCounts.entries()].sort((a, b) => b[1] - a[1])[0];
      if (topDept && topDept[1] >= 3) {
        const dept = await prisma.department.findUnique({
          where: { id: topDept[0] },
          select: { name: true },
        });

        if (dept) {
          insights.push({
            id: `crossdept-collab-${userId}`,
            type: "info",
            priority: "low",
            title: "Frequent Collaborator",
            message: `Your team frequently depends on ${dept.name} (${topDept[1]} resolved dependencies this month). Consider a regular sync meeting.`,
            context: context.module,
          });
        }
      }
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Personalized Motivation (Adolescent) ─────

async function generatePersonalizedMotivation(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    // Get or create motivation profile
    let profile = await prisma.gIMotivationProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Create default profile
      profile = await prisma.gIMotivationProfile.create({
        data: { userId },
      });
    }

    const streak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    const credibility = await prisma.credibilityScore.findUnique({
      where: { userId },
      select: { overallScore: true, tasksCompleted: true },
    });

    // Personalized nudge based on tone preference and current state
    const tone = profile.preferredTone;
    const motivators = (profile.motivators as string[]) || [];

    // Achievement-motivated users get milestone tracking
    if (motivators.includes("achievement") && credibility) {
      const milestones = [10, 25, 50, 100, 250, 500];
      const nextMilestone = milestones.find((m) => m > credibility.tasksCompleted);
      if (nextMilestone) {
        const remaining = nextMilestone - credibility.tasksCompleted;
        if (remaining <= 3 && remaining > 0) {
          const msg = tone === "competitive"
            ? `Just ${remaining} more task${remaining !== 1 ? "s" : ""} to hit ${nextMilestone}! Race to the finish.`
            : tone === "encouraging"
            ? `You're so close to ${nextMilestone} completed tasks — only ${remaining} to go! You've got this.`
            : `${remaining} task${remaining !== 1 ? "s" : ""} away from the ${nextMilestone}-task milestone.`;

          insights.push({
            id: `motivation-milestone-${userId}`,
            type: "nudge",
            priority: "low",
            title: "Milestone Approaching",
            message: msg,
            action: { label: "View tasks", href: "/pms" },
            context: context.module,
          });
        }
      }
    }

    // Streak-focused encouragement
    if (streak && streak.currentStreak >= 5) {
      const msg = tone === "competitive"
        ? `${streak.currentStreak}-day streak! Can you beat your record of ${streak.longestStreak}?`
        : tone === "direct"
        ? `Streak: ${streak.currentStreak} days. Record: ${streak.longestStreak}.`
        : `Amazing ${streak.currentStreak}-day streak! ${streak.currentStreak >= streak.longestStreak ? "You're setting a new personal record!" : `Your best is ${streak.longestStreak} — keep pushing!`}`;

      if (streak.currentStreak >= streak.longestStreak) {
        insights.push({
          id: `motivation-streak-record-${userId}`,
          type: "celebration",
          priority: "low",
          title: "New Personal Record!",
          message: msg,
          action: { label: "Achievements", href: "/pms/gamification" },
          context: context.module,
        });
      }
    }

    // Recognition-motivated: check recent recognitions received
    if (motivators.includes("recognition")) {
      const recentRecognitions = await prisma.recognition.count({
        where: {
          toUserId: userId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (recentRecognitions > 0) {
        insights.push({
          id: `motivation-recognition-${userId}`,
          type: "celebration",
          priority: "low",
          title: "Recognized!",
          message: `You received ${recentRecognitions} recognition${recentRecognitions !== 1 ? "s" : ""} this week. Your colleagues appreciate your work!`,
          action: { label: "View culture", href: "/hoccr/culture" },
          context: context.module,
        });
      }
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Deadline Risk Prediction (Adult) ──────────

async function generateDeadlineRiskPrediction(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    // Get user's active tasks with deadlines
    const activeTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        dueDate: { not: null },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        startedAt: true,
        difficultyWeight: true,
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    if (activeTasks.length === 0) return insights;

    // Calculate average completion time from historical data
    const completedTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: "DONE",
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: { startedAt: true, completedAt: true, difficultyWeight: true },
      orderBy: { completedAt: "desc" },
      take: 20,
    });

    if (completedTasks.length < 3) return insights;

    // Calculate avg hours per difficulty unit
    let totalHoursPerUnit = 0;
    let count = 0;
    for (const t of completedTasks) {
      if (t.startedAt && t.completedAt) {
        const hours = (t.completedAt.getTime() - t.startedAt.getTime()) / (1000 * 60 * 60);
        const weight = t.difficultyWeight || 1;
        totalHoursPerUnit += hours / weight;
        count++;
      }
    }
    const avgHoursPerUnit = count > 0 ? totalHoursPerUnit / count : 24;

    const now = new Date();
    const atRisk: string[] = [];

    for (const task of activeTasks) {
      if (!task.dueDate) continue;
      const hoursRemaining = (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const estimatedHours = avgHoursPerUnit * (task.difficultyWeight || 1);
      const riskRatio = estimatedHours / Math.max(hoursRemaining, 1);

      if (riskRatio > 0.8 && hoursRemaining > 0) {
        atRisk.push(task.title);
        const confidence = Math.min(riskRatio / 2, 0.95);

        // Create prediction record
        await createPrediction(
          "deadline_risk",
          confidence,
          riskRatio > 1.5 ? "high" : "medium",
          `Deadline risk: ${task.title}`,
          `Based on historical pace (${Math.round(avgHoursPerUnit)}h per unit), this ${task.difficultyWeight || 1}-weight task needs ~${Math.round(estimatedHours)}h but only ${Math.round(hoursRemaining)}h remain.`,
          { taskId: task.id, estimatedHours, hoursRemaining, riskRatio },
          userId,
          null,
          `task:${task.id}`,
          task.dueDate
        );
      }
    }

    if (atRisk.length > 0) {
      insights.push({
        id: `predict-deadline-${userId}`,
        type: "alert",
        priority: atRisk.length >= 3 ? "high" : "medium",
        title: "Deadline Risk Detected",
        message: atRisk.length === 1
          ? `"${atRisk[0]}" is at risk of missing its deadline based on your historical pace. Consider starting early or requesting an extension.`
          : `${atRisk.length} tasks are at risk of missing deadlines based on your completion patterns. Prioritize or request extensions.`,
        action: { label: "View tasks", href: "/pms?filter=at-risk" },
        context: context.module,
      });
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Capacity Crunch Prediction (Adult) ────────

async function generateCapacityCrunchPrediction(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Count tasks due next week
    const upcomingDue = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { gte: now, lte: nextWeek },
      },
    });

    // Get average weekly throughput
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const completedLast4Weeks = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: "DONE",
        completedAt: { gte: fourWeeksAgo },
      },
    });

    const weeklyAvg = completedLast4Weeks / 4;

    if (upcomingDue > weeklyAvg * 1.5 && upcomingDue >= 5) {
      const overloadPct = Math.round(((upcomingDue - weeklyAvg) / Math.max(weeklyAvg, 1)) * 100);

      insights.push({
        id: `predict-capacity-${userId}`,
        type: "alert",
        priority: overloadPct > 100 ? "high" : "medium",
        title: "Capacity Crunch Predicted",
        message: `You have ${upcomingDue} tasks due next week, but your average is ${Math.round(weeklyAvg)}/week. That's ${overloadPct}% above your capacity. Consider delegating or reprioritizing.`,
        action: { label: "View schedule", href: "/pms" },
        context: context.module,
      });

      await createPrediction(
        "capacity_crunch",
        Math.min(overloadPct / 200, 0.95),
        overloadPct > 100 ? "high" : "medium",
        `Capacity crunch next week for user`,
        `${upcomingDue} tasks due vs ${Math.round(weeklyAvg)} weekly average`,
        { upcomingDue, weeklyAvg, overloadPct },
        userId, null, null, nextWeek
      );
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Burnout Risk Prediction (Adult, DEPT_HEAD+) ──

async function generateBurnoutRiskPrediction(
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

    // Get team members with high workload AND declining engagement
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
        credibilityScore: {
          select: { overallScore: true, quality: true },
        },
      },
    });

    for (const member of members) {
      if (member._count.assignedTasks < 8) continue;

      // Check for declining sentiment
      const recentSentiment = await prisma.sentimentEntry.findMany({
        where: { userId: member.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { score: true },
      });

      const avgSentiment = recentSentiment.length > 0
        ? recentSentiment.reduce((s, e) => s + e.score, 0) / recentSentiment.length
        : 3;

      // Check for patterns: high workload + low sentiment + declining quality
      const qualityScore = member.credibilityScore?.quality ?? 50;
      const burnoutRisk = member._count.assignedTasks >= 10 && avgSentiment < 2.5 && qualityScore < 40;

      if (burnoutRisk) {
        insights.push({
          id: `predict-burnout-${member.id}`,
          type: "alert",
          priority: "high",
          title: "Burnout Risk Detected",
          message: `${member.name?.split(" ")[0]} shows signs of burnout: ${member._count.assignedTasks} active tasks, low sentiment, declining quality. Consider a check-in and workload reduction.`,
          context: context.module,
        });

        await createPrediction(
          "burnout_risk",
          0.75,
          "critical",
          `Burnout risk: ${member.name}`,
          `High workload (${member._count.assignedTasks} tasks), low sentiment (${avgSentiment.toFixed(1)}), declining quality (${qualityScore})`,
          { memberId: member.id, taskCount: member._count.assignedTasks, avgSentiment, qualityScore },
          member.id, user.primaryDeptId, `user:${member.id}`,
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        );
      }
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Autonomous Action Suggestions (Adult, DEPT_HEAD+) ──

async function generateAutonomousActionSuggestions(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    // Check for pending autonomous actions that need approval
    const pendingActions = await prisma.gIAutonomousAction.findMany({
      where: {
        status: "PENDING",
        tier: 2, // Tier 2 = suggest with one-tap approve
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (pendingActions.length > 0) {
      insights.push({
        id: `gi-actions-pending-${userId}`,
        type: "suggestion",
        priority: pendingActions.length >= 3 ? "high" : "medium",
        title: "GI Actions Awaiting Approval",
        message: `${pendingActions.length} suggested action${pendingActions.length !== 1 ? "s" : ""} from GI are waiting for your approval. Review and approve to keep operations flowing.`,
        action: { label: "Review actions", href: "/admin/gi/actions" },
        context: context.module,
      });
    }

    // Check for recently executed autonomous actions (Tier 3)
    const recentAutoActions = await prisma.gIAutonomousAction.findMany({
      where: {
        status: "EXECUTED",
        tier: 3,
        executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { executedAt: "desc" },
      take: 3,
    });

    if (recentAutoActions.length > 0) {
      insights.push({
        id: `gi-auto-executed-${userId}`,
        type: "info",
        priority: "low",
        title: "GI Auto-Actions",
        message: `GI automatically handled ${recentAutoActions.length} action${recentAutoActions.length !== 1 ? "s" : ""} in the last 24h. Review for accuracy.`,
        action: { label: "View log", href: "/admin/gi/actions?status=executed" },
        context: context.module,
      });
    }

    // Generate new autonomous action suggestions based on detected issues
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryDeptId: true },
    });

    if (user?.primaryDeptId) {
      // Check for review bottleneck > 48h — suggest auto-reassignment
      const staleReviews = await prisma.task.findMany({
        where: {
          departmentId: user.primaryDeptId,
          status: "REVIEW",
          updatedAt: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        select: { id: true, title: true, assigneeId: true },
        take: 5,
      });

      if (staleReviews.length >= 2) {
        // Check tier assignment for this action type
        const tierConfig = await prisma.gITierAssignment.findUnique({
          where: { actionType: "task_reassignment" },
        });

        const tier = tierConfig?.tier ?? 2;

        // Create action record
        for (const task of staleReviews.slice(0, 3)) {
          const existing = await prisma.gIAutonomousAction.findFirst({
            where: {
              targetEntity: `task:${task.id}`,
              status: "PENDING",
            },
          });

          if (!existing) {
            await prisma.gIAutonomousAction.create({
              data: {
                actionType: "task_reassignment",
                tier,
                description: `Reassign review of "${task.title}" — stuck for 48+ hours`,
                targetUserId: task.assigneeId,
                targetEntity: `task:${task.id}`,
                actionData: { taskId: task.id, action: "escalate_review" },
                reasoning: "Task has been in REVIEW status for over 48 hours without progress. Auto-escalation can prevent cascading delays.",
                expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
              },
            });
          }
        }
      }

      // ── Deadline extension: tasks at risk of missing due date ──
    {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const atRiskTasks = await prisma.task.findMany({
        where: {
          departmentId: user.primaryDeptId,
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
          dueDate: {
            gt: new Date(),
            lt: tomorrow,
          },
        },
        select: { id: true, title: true, assigneeId: true, status: true, dueDate: true },
        take: 5,
      });

      if (atRiskTasks.length > 0) {
        const tierConfig = await prisma.gITierAssignment.findUnique({
          where: { actionType: "deadline_extension" },
        });
        const tier = tierConfig?.tier ?? 2;

        for (const task of atRiskTasks.slice(0, 3)) {
          const existing = await prisma.gIAutonomousAction.findFirst({
            where: {
              targetEntity: `task:${task.id}`,
              actionType: "deadline_extension",
              status: "PENDING",
            },
          });

          if (!existing && task.dueDate) {
            const newDueDate = new Date(task.dueDate.getTime() + 48 * 60 * 60 * 1000);
            await prisma.gIAutonomousAction.create({
              data: {
                actionType: "deadline_extension",
                tier,
                description: `Extend deadline for "${task.title}" — due in <24h but still ${task.status === "ASSIGNED" ? "not started" : "in progress"}`,
                targetUserId: task.assigneeId,
                targetEntity: `task:${task.id}`,
                actionData: {
                  taskId: task.id,
                  currentDueDate: task.dueDate.toISOString(),
                  newDueDate: newDueDate.toISOString(),
                },
                reasoning: `Task "${task.title}" is due within 24 hours but is still in ${task.status} status. A 48-hour extension prevents a missed deadline.`,
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
              },
            });

            insights.push({
              id: `gi-deadline-risk-${task.id}`,
              type: "suggestion",
              priority: "high",
              title: "Deadline at Risk",
              message: `"${task.title}" is due within 24 hours but hasn't been completed. GI suggests a 48h extension.`,
              action: { label: "Review action", href: "/admin/gi/actions" },
              context: context.module,
            });
          }
        }
      }
    }

    // ── Workload rebalance: detect team imbalance ──
    {
      const taskCounts = await prisma.task.groupBy({
        by: ["assigneeId"],
        where: {
          departmentId: user.primaryDeptId,
          status: { in: ["ASSIGNED", "IN_PROGRESS", "REVIEW"] },
          assigneeId: { not: null },
        },
        _count: { id: true },
      });

      if (taskCounts.length >= 2) {
        const counts = taskCounts.map((t) => t._count.id);
        const sorted = [...counts].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const overloaded = taskCounts.filter(
          (t) => t._count.id >= median * 3 && t._count.id >= 6
        );
        const underloaded = taskCounts
          .filter((t) => t._count.id <= Math.max(median, 1))
          .sort((a, b) => a._count.id - b._count.id);

        if (overloaded.length > 0 && underloaded.length > 0) {
          const tierConfig = await prisma.gITierAssignment.findUnique({
            where: { actionType: "workload_rebalance" },
          });
          const tier = tierConfig?.tier ?? 2;

          for (const heavy of overloaded.slice(0, 2)) {
            if (!heavy.assigneeId) continue;
            const light = underloaded[0];
            if (!light?.assigneeId) continue;

            // Find the lowest-priority task to move
            const taskToMove = await prisma.task.findFirst({
              where: {
                assigneeId: heavy.assigneeId,
                status: { in: ["ASSIGNED", "IN_PROGRESS"] },
              },
              orderBy: { priority: "asc" },
              select: { id: true, title: true },
            });

            if (!taskToMove) continue;

            const existing = await prisma.gIAutonomousAction.findFirst({
              where: {
                targetEntity: `task:${taskToMove.id}`,
                actionType: "workload_rebalance",
                status: "PENDING",
              },
            });

            if (!existing) {
              await prisma.gIAutonomousAction.create({
                data: {
                  actionType: "workload_rebalance",
                  tier,
                  description: `Reassign "${taskToMove.title}" to balance workload (${heavy._count.id} tasks vs team median ${median})`,
                  targetUserId: heavy.assigneeId,
                  targetEntity: `task:${taskToMove.id}`,
                  actionData: {
                    taskId: taskToMove.id,
                    newAssigneeId: light.assigneeId,
                    originalAssigneeId: heavy.assigneeId,
                  },
                  reasoning: `Team member has ${heavy._count.id} active tasks vs median of ${median}. Rebalancing one task to a less-loaded teammate prevents burnout and bottlenecks.`,
                  expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
                },
              });

              insights.push({
                id: `gi-rebalance-${heavy.assigneeId}`,
                type: "suggestion",
                priority: "medium",
                title: "Workload Imbalance Detected",
                message: `One team member has ${heavy._count.id} active tasks (team median: ${median}). GI suggests reassigning one task.`,
                action: { label: "Review action", href: "/admin/gi/actions" },
                context: context.module,
              });
            }
          }
        }
      }
    }
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Generator: Self-Optimizing Insights (Adult) ──────────

async function generateSelfOptimizingInsights(
  userId: string,
  context: GIEngineContext
): Promise<GIInsight[]> {
  const insights: GIInsight[] = [];

  try {
    // Learn organizational rhythms and surface them
    const now = new Date();
    const hour = now.getHours();

    // Check learned peak productivity hours
    const peakHoursLearning = await prisma.gILearningLog.findFirst({
      where: {
        category: "rhythm",
        key: "user_peak_hours",
        userId,
        isActive: true,
      },
    });

    if (peakHoursLearning) {
      const peakData = peakHoursLearning.value as { peakStart: number; peakEnd: number; confidence: number };
      if (peakData.confidence > 0.6 && hour === peakData.peakStart) {
        insights.push({
          id: `optimize-peak-${userId}`,
          type: "nudge",
          priority: "low",
          title: "Peak Hours Starting",
          message: `Based on your patterns, you're most productive between ${peakData.peakStart}:00-${peakData.peakEnd}:00. Focus on your hardest tasks now.`,
          action: { label: "View tasks", href: "/pms?sort=difficulty" },
          context: context.module,
        });
      }
    } else {
      // Try to learn peak hours from task completion data
      const completedTasks = await prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: "DONE",
          completedAt: { not: null },
        },
        select: { completedAt: true },
        orderBy: { completedAt: "desc" },
        take: 50,
      });

      if (completedTasks.length >= 20) {
        const hourCounts = new Map<number, number>();
        for (const t of completedTasks) {
          if (t.completedAt) {
            const h = t.completedAt.getHours();
            hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
          }
        }

        const sorted = [...hourCounts.entries()].sort((a, b) => b[1] - a[1]);
        if (sorted.length >= 3) {
          const peakHours = sorted.slice(0, 3).map((e) => e[0]).sort((a, b) => a - b);
          const peakStart = peakHours[0];
          const peakEnd = peakHours[peakHours.length - 1] + 1;
          const totalInPeak = sorted.slice(0, 3).reduce((s, e) => s + e[1], 0);
          const confidence = totalInPeak / completedTasks.length;

          await recordLearning(
            "rhythm", "user_peak_hours",
            { peakStart, peakEnd, peakHours, confidence },
            confidence, completedTasks.length,
            null, userId
          );
        }
      }
    }

    // Learn and surface approval patterns
    const approvalLearning = await prisma.gILearningLog.findFirst({
      where: {
        category: "pattern",
        key: "avg_approval_time",
        userId,
        isActive: true,
      },
    });

    if (!approvalLearning) {
      // Learn average approval time
      const approvedTasks = await prisma.task.findMany({
        where: {
          creatorId: userId,
          status: { in: ["APPROVED", "DONE"] },
        },
        select: {
          activities: {
            where: { action: "status_change", newValue: "REVIEW" },
            select: { createdAt: true },
            take: 1,
          },
          completedAt: true,
        },
        take: 30,
      });

      const approvalTimes: number[] = [];
      for (const t of approvedTasks) {
        if (t.activities.length > 0 && t.completedAt) {
          const reviewAt = t.activities[0].createdAt;
          const hours = (t.completedAt.getTime() - reviewAt.getTime()) / (1000 * 60 * 60);
          if (hours > 0 && hours < 168) approvalTimes.push(hours);
        }
      }

      if (approvalTimes.length >= 5) {
        const avg = approvalTimes.reduce((s, v) => s + v, 0) / approvalTimes.length;
        await recordLearning(
          "pattern", "avg_approval_time",
          { avgHours: Math.round(avg * 10) / 10, dataPoints: approvalTimes.length },
          0.5 + (approvalTimes.length / 60), approvalTimes.length,
          null, userId
        );
      }
    }

    // Check prediction accuracy and surface meta-insights
    const recentPredictions = await prisma.gIPrediction.findMany({
      where: {
        accuracy: { not: null },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { accuracy: true, type: true },
      take: 50,
    });

    if (recentPredictions.length >= 10) {
      const avgAccuracy = recentPredictions.reduce((s, p) => s + (p.accuracy ?? 0), 0) / recentPredictions.length;
      if (avgAccuracy > 0.7) {
        insights.push({
          id: `optimize-accuracy-${userId}`,
          type: "info",
          priority: "low",
          title: "GI Accuracy Report",
          message: `GI predictions have been ${Math.round(avgAccuracy * 100)}% accurate over the last 30 days across ${recentPredictions.length} predictions.`,
          action: { label: "View predictions", href: "/admin/gi/predictions" },
          context: context.module,
        });
      }
    }
  } catch {
    // Non-critical
  }

  return insights;
}

// ─── Helper: Create Prediction (Adult) ────────────────────

async function createPrediction(
  type: string,
  confidence: number,
  severity: string,
  title: string,
  description: string,
  data: Record<string, unknown>,
  targetUserId: string | null,
  departmentId: string | null,
  entityRef: string | null,
  predictsAt: Date
): Promise<void> {
  try {
    // Avoid duplicate predictions for same entity
    const existing = await prisma.gIPrediction.findFirst({
      where: {
        type,
        entityRef: entityRef ?? undefined,
        targetUserId: targetUserId ?? undefined,
        isActive: true,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      await prisma.gIPrediction.create({
        data: {
          type,
          confidence,
          severity,
          title,
          description,
          data: data as Prisma.InputJsonValue,
          targetUserId,
          departmentId,
          entityRef,
          predictsAt,
        },
      });
    }
  } catch {
    // Silent — predictions should never break insights
  }
}

// ─── Helper: Record Learning (Adult) ──────────────────────

async function recordLearning(
  category: string,
  key: string,
  value: Record<string, unknown>,
  confidence: number,
  observations: number,
  departmentId: string | null,
  userId: string | null
): Promise<void> {
  try {
    const existing = await prisma.gILearningLog.findFirst({
      where: { category, key, departmentId, userId },
    });

    if (existing) {
      await prisma.gILearningLog.update({
        where: { id: existing.id },
        data: {
          value: value as Prisma.InputJsonValue,
          confidence: Math.min(confidence, 1),
          observations,
          lastObserved: new Date(),
        },
      });
    } else {
      await prisma.gILearningLog.create({
        data: {
          category, key, value: value as Prisma.InputJsonValue,
          confidence: Math.min(confidence, 1),
          observations, departmentId, userId,
        },
      });
    }
  } catch {
    // Silent — learning should never break insights
  }
}

// ─── Helper: Log Pattern (Adolescent) ────────────────────

async function logPattern(
  userId: string | null,
  departmentId: string | null,
  patternType: string,
  description: string,
  data: Record<string, unknown>,
  severity: string = "info"
): Promise<void> {
  try {
    // Check if same pattern was already logged recently (24h)
    const existing = await prisma.gIPatternLog.findFirst({
      where: {
        userId: userId ?? undefined,
        departmentId: departmentId ?? undefined,
        patternType,
        isActive: true,
        detectedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      await prisma.gIPatternLog.create({
        data: {
          userId,
          departmentId,
          patternType,
          description,
          data: data as Prisma.InputJsonValue,
          severity,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day TTL
        },
      });
    }
  } catch {
    // Silent — logging should never break insights
  }
}
