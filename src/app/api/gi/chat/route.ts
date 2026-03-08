import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { message, context } = await req.json();
  if (!message?.trim()) return badRequest("Message is required");

  const { role, id: userId, primaryDepartmentId, name: userName } = session.user;

  // Gather contextual data based on current module/view
  const contextData: Record<string, unknown> = {};

  try {
    // Get user's task stats
    const [totalTasks, activeTasks, overdueTasks, recentlyCompleted, reviewTasks] = await Promise.all([
      prisma.task.count({ where: { assigneeId: userId } }),
      prisma.task.count({ where: { assigneeId: userId, status: { in: ["ASSIGNED", "IN_PROGRESS", "REVIEW"] } } }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { notIn: ["DONE", "CANCELLED"] },
          dueDate: { lt: new Date() },
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
        where: { assigneeId: userId, status: "REVIEW" },
      }),
    ]);

    contextData.userTaskStats = { totalTasks, activeTasks, overdueTasks, recentlyCompleted, reviewTasks };

    // Get credibility score
    const credibility = await prisma.credibilityScore.findUnique({
      where: { userId },
      select: { overallScore: true, reliability: true, tasksCompleted: true, tasksOnTime: true, tasksLate: true },
    });
    if (credibility) contextData.credibility = credibility;

    // Get upcoming deadlines (next 3 days)
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      select: { title: true, dueDate: true, priority: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    });
    if (upcomingDeadlines.length > 0) contextData.upcomingDeadlines = upcomingDeadlines;

    // If on a specific task, get its details
    if (context?.currentEntityType === "task" && context?.currentEntityId) {
      const task = await prisma.task.findUnique({
        where: { id: context.currentEntityId },
        select: { title: true, status: true, priority: true, dueDate: true, description: true },
      });
      if (task) contextData.currentTask = task;
    }

    // Department context for dept heads
    if ((role === "DEPT_HEAD" || role === "ADMIN") && primaryDepartmentId) {
      const [deptStats, bottlenecks, teamSize] = await Promise.all([
        prisma.task.groupBy({
          by: ["status"],
          where: { departmentId: primaryDepartmentId },
          _count: true,
        }),
        prisma.bottleneck.count({
          where: { departmentId: primaryDepartmentId, status: "active" },
        }),
        prisma.departmentMember.count({
          where: { departmentId: primaryDepartmentId },
        }),
      ]);
      contextData.departmentStats = deptStats.map((s) => ({ status: s.status, count: s._count }));
      contextData.activeBottlenecks = bottlenecks;
      contextData.teamSize = teamSize;
    }

    // Admin gets org-wide stats
    if (role === "ADMIN") {
      const [totalUsers, totalBrands, totalDepts, openPositions, activeBottlenecksOrg] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.brand.count(),
        prisma.department.count(),
        prisma.hiringPosition.count({ where: { isOpen: true } }),
        prisma.bottleneck.count({ where: { status: "active" } }),
      ]);
      contextData.orgStats = { totalUsers, totalBrands, totalDepts, openPositions, activeBottlenecksOrg };
    }

    // Recent notifications (unread)
    const unreadNotifs = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    contextData.unreadNotifications = unreadNotifs;

    // Relay/content stats
    const [scheduledPosts, draftPosts, publishedPosts, failedPosts] = await Promise.all([
      prisma.contentPost.count({ where: { status: "SCHEDULED" } }),
      prisma.contentPost.count({ where: { status: "DRAFT" } }),
      prisma.contentPost.count({ where: { status: "PUBLISHED" } }),
      prisma.contentPost.count({ where: { status: "FAILED" } }),
    ]);
    contextData.contentStats = { scheduledPosts, draftPosts, publishedPosts, failedPosts };

    // Unread announcements
    const unreadAnnouncements = await prisma.announcement.count({
      where: {
        OR: [{ departmentId: null }, ...(primaryDepartmentId ? [{ departmentId: primaryDepartmentId }] : [])],
        readBy: { none: { userId } },
      },
    });
    contextData.unreadAnnouncements = unreadAnnouncements;

    // Adult: Predictions, autonomous actions, learnings
    const [activePredictions, pendingActions, recentExecutions, learningCount] = await Promise.all([
      prisma.gIPrediction.findMany({
        where: {
          isActive: true,
          OR: [
            { targetUserId: userId },
            ...(primaryDepartmentId ? [{ departmentId: primaryDepartmentId }] : []),
          ],
        },
        select: { type: true, title: true, severity: true, confidence: true, predictsAt: true },
        orderBy: { severity: "desc" },
        take: 5,
      }),
      prisma.gIAutonomousAction.count({
        where: { status: "PENDING" },
      }),
      prisma.gIAutonomousAction.findMany({
        where: {
          status: "EXECUTED",
          executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { actionType: true, description: true, executedAt: true },
        orderBy: { executedAt: "desc" },
        take: 3,
      }),
      prisma.gILearningLog.count({ where: { isActive: true } }),
    ]);

    if (activePredictions.length > 0) contextData.activePredictions = activePredictions;
    contextData.pendingActions = pendingActions;
    if (recentExecutions.length > 0) contextData.recentAutoActions = recentExecutions;
    contextData.totalLearnings = learningCount;

    // Adolescent: Pattern history and motivation profile
    const recentPatterns = await prisma.gIPatternLog.findMany({
      where: {
        OR: [
          { userId },
          ...(primaryDepartmentId ? [{ departmentId: primaryDepartmentId }] : []),
        ],
        isActive: true,
        detectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { patternType: true, description: true, severity: true },
      orderBy: { detectedAt: "desc" },
      take: 5,
    });
    if (recentPatterns.length > 0) contextData.recentPatterns = recentPatterns;

    const motivationProfile = await prisma.gIMotivationProfile.findUnique({
      where: { userId },
      select: { preferredTone: true, motivators: true, nudgeFrequency: true },
    });
    if (motivationProfile) contextData.motivationProfile = motivationProfile;

    // Vritti/article stats
    const [totalArticles, draftArticles, publishedArticles, reviewArticles] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: "DRAFTING" } }),
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.article.count({ where: { status: "REVIEW" } }),
    ]);
    contextData.articleStats = { totalArticles, draftArticles, publishedArticles, reviewArticles };
  } catch {
    // Non-critical: continue without context data
  }

  // Build a reactive response based on the question and context
  const response = generateReactiveResponse(message, contextData, context, role, userName);

  return NextResponse.json({
    message: response.message,
    suggestions: response.suggestions,
    contextUsed: Object.keys(contextData),
    proactiveInsight: generateProactiveInsight(contextData, role),
  });
}

interface TaskStats {
  totalTasks: number;
  activeTasks: number;
  overdueTasks: number;
  recentlyCompleted: number;
  reviewTasks: number;
}

interface Credibility {
  overallScore: number;
  reliability: number;
  tasksCompleted: number;
  tasksOnTime: number;
  tasksLate: number;
}

interface OrgStats {
  totalUsers: number;
  totalBrands: number;
  totalDepts: number;
  openPositions: number;
  activeBottlenecksOrg: number;
}

function generateReactiveResponse(
  message: string,
  data: Record<string, unknown>,
  context: Record<string, unknown> | null,
  role: string,
  userName: string
) {
  const lowerMsg = message.toLowerCase();
  const stats = data.userTaskStats as TaskStats | undefined;
  const credibility = data.credibility as Credibility | undefined;
  const upcomingDeadlines = data.upcomingDeadlines as { title: string; dueDate: string; priority: string }[] | undefined;
  const unreadNotifs = data.unreadNotifications as number | undefined;
  const firstName = userName?.split(" ")[0] || "there";

  // Credibility / score queries
  if (lowerMsg.includes("credibility") || lowerMsg.includes("score") || lowerMsg.includes("rating") || lowerMsg.includes("reputation")) {
    if (credibility) {
      const onTimeRate = credibility.tasksCompleted > 0
        ? Math.round((credibility.tasksOnTime / credibility.tasksCompleted) * 100)
        : 0;
      return {
        message: `Your credibility score is ${credibility.overallScore}/100 (reliability: ${credibility.reliability}/100).\n\n• ${credibility.tasksCompleted} tasks completed\n• ${onTimeRate}% on-time delivery rate\n• ${credibility.tasksLate} delivered late\n\n${credibility.overallScore >= 70 ? "Great standing!" : credibility.overallScore >= 50 ? "Room for improvement — focus on hitting deadlines." : "Needs attention — prioritize overdue tasks to recover."}`,
        suggestions: ["Show overdue tasks", "View leaderboard", "How are my tasks?"],
      };
    }
    return {
      message: "No credibility data yet. Complete tasks to start building your score!",
      suggestions: ["View my tasks", "Open PMS board"],
    };
  }

  // Upcoming deadlines
  if (lowerMsg.includes("upcoming") || lowerMsg.includes("due soon") || lowerMsg.includes("coming up")) {
    if (upcomingDeadlines && upcomingDeadlines.length > 0) {
      const lines = upcomingDeadlines.map((d) => {
        const date = new Date(d.dueDate);
        const dayLabel = isToday(date) ? "today" : isTomorrow(date) ? "tomorrow" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        return `• ${d.title} (${d.priority}) — due ${dayLabel}`;
      });
      return {
        message: `Upcoming deadlines:\n${lines.join("\n")}`,
        suggestions: ["Show overdue tasks", "View calendar"],
      };
    }
    return {
      message: "No deadlines in the next 3 days. You're in the clear!",
      suggestions: ["View my tasks", "Show all deadlines"],
    };
  }

  // Notifications
  if (lowerMsg.includes("notification") || lowerMsg.includes("alert") || lowerMsg.includes("update")) {
    return {
      message: unreadNotifs && unreadNotifs > 0
        ? `You have ${unreadNotifs} unread notification${unreadNotifs !== 1 ? "s" : ""}. Check the bell icon in the top bar to review them.`
        : "No unread notifications. You're all caught up!",
      suggestions: ["How are my tasks?", "Any overdue?"],
    };
  }

  // Task-related queries
  if (lowerMsg.includes("task") || lowerMsg.includes("work") || lowerMsg.includes("todo")) {
    if (stats) {
      let msg = `You have ${stats.activeTasks} active task${stats.activeTasks !== 1 ? "s" : ""}.`;
      const suggestions: string[] = [];
      if (stats.reviewTasks > 0) {
        msg += ` ${stats.reviewTasks} in review.`;
      }
      if (stats.overdueTasks > 0) {
        msg += ` ⚠ ${stats.overdueTasks} overdue — prioritize these.`;
        suggestions.push("Show overdue tasks");
      }
      if (stats.recentlyCompleted > 0) {
        msg += ` ${stats.recentlyCompleted} completed this week.`;
      }
      if (stats.activeTasks === 0) {
        msg = "No active tasks right now. Check the PMS board for new assignments.";
        suggestions.push("Open PMS board");
      }
      suggestions.push("View credibility score", "Upcoming deadlines");
      return { message: msg, suggestions };
    }
  }

  // Status queries
  if (lowerMsg.includes("status") || lowerMsg.includes("how am i") || lowerMsg.includes("progress") || lowerMsg.includes("on track")) {
    if (stats) {
      const completionRate = stats.totalTasks > 0
        ? Math.round(((stats.totalTasks - stats.activeTasks) / stats.totalTasks) * 100)
        : 0;
      let msg = `${firstName}, your completion rate is ${completionRate}%. ${stats.activeTasks} active, ${stats.recentlyCompleted} done this week.`;
      if (stats.overdueTasks > 0) {
        msg += ` Watch out — ${stats.overdueTasks} overdue.`;
      } else {
        msg += " You're on track!";
      }
      if (credibility) {
        msg += ` Credibility: ${credibility.overallScore}/100.`;
      }
      return {
        message: msg,
        suggestions: ["Show leaderboard", "View credibility score", "Upcoming deadlines"],
      };
    }
  }

  // Overdue queries
  if (lowerMsg.includes("overdue") || lowerMsg.includes("late") || lowerMsg.includes("deadline") || lowerMsg.includes("behind")) {
    if (stats) {
      if (stats.overdueTasks > 0) {
        return {
          message: `You have ${stats.overdueTasks} overdue task${stats.overdueTasks !== 1 ? "s" : ""}. Focus on these first to improve your credibility score.${credibility ? ` Current score: ${credibility.overallScore}/100.` : ""}`,
          suggestions: ["View my tasks", "View credibility score", "Show upcoming deadlines"],
        };
      }
      return {
        message: "No overdue tasks — you're ahead of schedule!",
        suggestions: ["View my tasks", "Upcoming deadlines"],
      };
    }
  }

  // Bottleneck queries
  if (lowerMsg.includes("bottleneck") || lowerMsg.includes("blocked") || lowerMsg.includes("stuck")) {
    const bottlenecks = data.activeBottlenecks as number | undefined;
    if (bottlenecks !== undefined) {
      return {
        message: bottlenecks > 0
          ? `There are ${bottlenecks} active bottleneck${bottlenecks !== 1 ? "s" : ""} in your department. Check HOCCR Operations for details.`
          : "No active bottlenecks detected. Operations are running smoothly.",
        suggestions: ["View operations", "Team workload", "Department stats"],
      };
    }
  }

  // Department stats (for dept heads/admin)
  if (lowerMsg.includes("department") || lowerMsg.includes("team")) {
    const deptStats = data.departmentStats as { status: string; count: number }[] | undefined;
    const teamSize = data.teamSize as number | undefined;
    const bottlenecks = data.activeBottlenecks as number | undefined;
    if (deptStats) {
      const total = deptStats.reduce((s, d) => s + d.count, 0);
      const done = deptStats.find((d) => d.status === "DONE")?.count || 0;
      const inProgress = deptStats.find((d) => d.status === "IN_PROGRESS")?.count || 0;
      const review = deptStats.find((d) => d.status === "REVIEW")?.count || 0;
      let msg = `Department: ${total} tasks total. ${done} completed, ${inProgress} in progress, ${review} in review.`;
      if (teamSize) msg += ` Team size: ${teamSize}.`;
      if (bottlenecks && bottlenecks > 0) msg += ` ⚠ ${bottlenecks} active bottleneck${bottlenecks !== 1 ? "s" : ""}.`;
      return {
        message: msg,
        suggestions: ["View team workload", "Check bottlenecks", "Open PMS board"],
      };
    }
  }

  // Org stats for admin
  if (lowerMsg.includes("organization") || lowerMsg.includes("org") || lowerMsg.includes("company") || lowerMsg.includes("overview")) {
    const orgStats = data.orgStats as OrgStats | undefined;
    if (orgStats) {
      let msg = `Daftar has ${orgStats.totalUsers} active users across ${orgStats.totalDepts} departments, managing ${orgStats.totalBrands} brand${orgStats.totalBrands !== 1 ? "s" : ""}.`;
      if (orgStats.openPositions > 0) msg += ` ${orgStats.openPositions} open hiring position${orgStats.openPositions !== 1 ? "s" : ""}.`;
      if (orgStats.activeBottlenecksOrg > 0) msg += ` ⚠ ${orgStats.activeBottlenecksOrg} active bottleneck${orgStats.activeBottlenecksOrg !== 1 ? "s" : ""} org-wide.`;
      return {
        message: msg,
        suggestions: ["View all users", "View departments", "Check bottlenecks"],
      };
    }
  }

  // Content / Relay queries
  if (lowerMsg.includes("content") || lowerMsg.includes("post") || lowerMsg.includes("relay") || lowerMsg.includes("schedule") || lowerMsg.includes("publish")) {
    const contentStats = data.contentStats as { scheduledPosts: number; draftPosts: number; publishedPosts: number; failedPosts: number } | undefined;
    if (contentStats) {
      let msg = `Content overview: ${contentStats.publishedPosts} published, ${contentStats.scheduledPosts} scheduled, ${contentStats.draftPosts} drafts.`;
      if (contentStats.failedPosts > 0) {
        msg += ` ⚠ ${contentStats.failedPosts} failed — needs attention.`;
      }
      return {
        message: msg,
        suggestions: ["View content queue", "Content calendar", "Content analytics"],
      };
    }
  }

  // Announcements queries
  if (lowerMsg.includes("announcement") || lowerMsg.includes("comms") || lowerMsg.includes("communication")) {
    const unreadAnn = data.unreadAnnouncements as number | undefined;
    return {
      message: unreadAnn && unreadAnn > 0
        ? `You have ${unreadAnn} unread announcement${unreadAnn !== 1 ? "s" : ""}. Check the Communication page to stay updated.`
        : "No unread announcements. You're up to date!",
      suggestions: ["View announcements", "Give feedback", "How are my tasks?"],
    };
  }

  // Article / Vritti queries
  if (lowerMsg.includes("article") || lowerMsg.includes("vritti") || lowerMsg.includes("cms") || lowerMsg.includes("editorial") || lowerMsg.includes("blog")) {
    const articleStats = data.articleStats as { totalArticles: number; draftArticles: number; publishedArticles: number; reviewArticles: number } | undefined;
    if (articleStats) {
      let msg = `Vritti CMS: ${articleStats.totalArticles} total articles. ${articleStats.publishedArticles} published, ${articleStats.draftArticles} drafting, ${articleStats.reviewArticles} in review.`;
      if (articleStats.reviewArticles > 0) {
        msg += ` ${articleStats.reviewArticles} article${articleStats.reviewArticles !== 1 ? "s" : ""} awaiting review.`;
      }
      return {
        message: msg,
        suggestions: ["View editorial pipeline", "View articles", "Content calendar"],
      };
    }
    return {
      message: "Vritti is your CMS for managing articles, editorial workflows, and media. Head to the Vritti module to get started.",
      suggestions: ["Open Vritti", "Content status"],
    };
  }

  // Prediction queries (Adult)
  if (lowerMsg.includes("predict") || lowerMsg.includes("risk") || lowerMsg.includes("forecast") || lowerMsg.includes("anticipat")) {
    const predictions = data.activePredictions as { type: string; title: string; severity: string; confidence: number; predictsAt: string }[] | undefined;
    if (predictions && predictions.length > 0) {
      const lines = predictions.map((p) => {
        const conf = Math.round(p.confidence * 100);
        return `• [${p.severity.toUpperCase()}] ${p.title} (${conf}% confidence)`;
      });
      return {
        message: `Active predictions:\n${lines.join("\n")}\n\nI analyze historical patterns, workload data, and team dynamics to predict issues before they happen.`,
        suggestions: ["View all predictions", "Pending actions", "Show risks"],
      };
    }
    return {
      message: "No active predictions right now. I continuously analyze patterns to predict deadline risks, capacity crunches, and burnout signals.",
      suggestions: ["How are my tasks?", "Team status", "Show patterns"],
    };
  }

  // Autonomous action queries (Adult)
  if (lowerMsg.includes("action") || lowerMsg.includes("automat") || lowerMsg.includes("autonomous") || lowerMsg.includes("gi did")) {
    const pending = data.pendingActions as number | undefined;
    const recent = data.recentAutoActions as { actionType: string; description: string; executedAt: string }[] | undefined;
    let msg = "";
    if (pending && pending > 0) {
      msg += `${pending} pending action${pending !== 1 ? "s" : ""} awaiting your approval.\n`;
    }
    if (recent && recent.length > 0) {
      msg += `\nRecent auto-actions:\n`;
      msg += recent.map((a) => `• ${a.description}`).join("\n");
    }
    if (!msg) {
      msg = "No pending or recent autonomous actions. I take actions based on configured autonomy tiers — Tier 2 needs your approval, Tier 3 auto-executes and notifies you.";
    }
    return {
      message: msg,
      suggestions: ["Review pending actions", "View action history", "Configure autonomy tiers"],
    };
  }

  // Learning queries (Adult)
  if (lowerMsg.includes("learn") || lowerMsg.includes("rhythm") || lowerMsg.includes("optimize") || lowerMsg.includes("self-improv")) {
    const learnings = data.totalLearnings as number | undefined;
    return {
      message: learnings && learnings > 0
        ? `I've accumulated ${learnings} learning${learnings !== 1 ? "s" : ""} about organizational rhythms, preferences, and patterns. These include peak productivity hours, approval times, collaboration patterns, and team dynamics. I use these to continuously improve my suggestions and predictions.`
        : "I'm still building my knowledge base. As I observe more data, I'll learn peak productivity hours, approval patterns, and team rhythms to give you better, more personalized guidance.",
      suggestions: ["View GI learnings", "Show predictions", "What can you do?"],
    };
  }

  // Pattern / trend queries (Adolescent)
  if (lowerMsg.includes("pattern") || lowerMsg.includes("trend") || lowerMsg.includes("insight") || lowerMsg.includes("analysis")) {
    const patterns = data.recentPatterns as { patternType: string; description: string; severity: string }[] | undefined;
    if (patterns && patterns.length > 0) {
      const lines = patterns.map((p) => `• ${p.description} (${p.severity})`);
      return {
        message: `Recent patterns detected:\n${lines.join("\n")}\n\nI track velocity trends, quality shifts, team dynamics, and cross-department dependencies over time.`,
        suggestions: ["Team status", "My velocity", "Cross-department blockers"],
      };
    }
    return {
      message: "No significant patterns detected recently. I continuously monitor velocity trends, quality shifts, and team dynamics to surface insights proactively.",
      suggestions: ["How are my tasks?", "Team status", "Department overview"],
    };
  }

  // Leaderboard
  if (lowerMsg.includes("leaderboard") || lowerMsg.includes("ranking") || lowerMsg.includes("rank") || lowerMsg.includes("standing")) {
    return {
      message: "Check the Leaderboard page to see team rankings based on task completion, streaks, and credibility scores.",
      suggestions: ["View leaderboard", "View credibility score"],
    };
  }

  // Help / what can you do
  if (lowerMsg.includes("help") || lowerMsg.includes("what can you") || lowerMsg.includes("capabilities")) {
    return {
      message: "I'm GI v4 (Adult), your autonomous organizational copilot. I can help with:\n\n**Core Intelligence:**\n• Task status, deadlines & overdue alerts\n• Smart task sequencing suggestions\n• Credibility score breakdown\n• Content scheduling & publishing status\n\n**Predictive Analytics:**\n• Deadline risk predictions based on historical pace\n• Capacity crunch forecasting\n• Burnout risk detection for team members\n• Pattern-based issue prediction before they happen\n\n**Autonomous Actions:**\n• Tier-based action system (inform → suggest → act & notify → act silently)\n• Auto-escalation of stalled reviews\n• Workload rebalancing suggestions\n• One-tap approve/reject for my suggestions\n\n**Self-Optimization:**\n• Learns your peak productivity hours\n• Tracks approval time patterns\n• Adapts coaching style to your preferences\n• Prediction accuracy self-monitoring\n\n**Team & Cross-Dept Intelligence:**\n• Department performance trends & velocity tracking\n• Cross-department dependency management\n• Team member risk & burnout detection\n• Personalized motivational calibration\n\n**Content & Communication:**\n• Vritti CMS editorial pipeline\n• Relay content analytics & scheduling\n• Announcements & feedback channels",
      suggestions: ["Show predictions", "Pending actions", "What has GI learned?", "Team status"],
    };
  }

  // Greeting
  if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey") || lowerMsg.includes("good morning") || lowerMsg.includes("good evening")) {
    let greeting = `Hey ${firstName}!`;
    if (stats) {
      greeting += ` You have ${stats.activeTasks} active task${stats.activeTasks !== 1 ? "s" : ""}.`;
      if (stats.overdueTasks > 0) {
        greeting += ` Heads up: ${stats.overdueTasks} overdue.`;
      } else {
        greeting += " Looking good!";
      }
    } else {
      greeting += " I'm GI, your organizational copilot. How can I help?";
    }
    return { message: greeting, suggestions: ["Show my tasks", "Upcoming deadlines", "What can you do?"] };
  }

  // Default
  return {
    message: `I can help with tasks, deadlines, credibility scores, team performance, bottlenecks, and more. Try asking about your tasks, upcoming deadlines, or team status!`,
    suggestions: ["How are my tasks?", "Upcoming deadlines", "My credibility score", "What can you do?"],
  };
}

/**
 * Generate proactive insights based on current data — returned alongside every response
 */
function generateProactiveInsight(data: Record<string, unknown>, role: string): string | null {
  const stats = data.userTaskStats as TaskStats | undefined;
  const credibility = data.credibility as Credibility | undefined;
  const upcomingDeadlines = data.upcomingDeadlines as { title: string; dueDate: string }[] | undefined;
  const bottlenecks = data.activeBottlenecks as number | undefined;

  // Priority order for proactive insights
  if (stats?.overdueTasks && stats.overdueTasks >= 3) {
    return `⚠ You have ${stats.overdueTasks} overdue tasks. This is affecting your credibility score. Focus on clearing these.`;
  }

  if (bottlenecks && bottlenecks > 0 && (role === "DEPT_HEAD" || role === "ADMIN")) {
    return `⚠ ${bottlenecks} active bottleneck${bottlenecks !== 1 ? "s" : ""} detected in your department. Review HOCCR Operations.`;
  }

  if (credibility && credibility.overallScore < 40) {
    return `Your credibility score (${credibility.overallScore}/100) needs attention. Complete tasks on time to recover.`;
  }

  if (upcomingDeadlines && upcomingDeadlines.length > 0) {
    const todayDeadlines = upcomingDeadlines.filter((d) => isToday(new Date(d.dueDate)));
    if (todayDeadlines.length > 0) {
      return `${todayDeadlines.length} task${todayDeadlines.length !== 1 ? "s" : ""} due today: ${todayDeadlines.map((d) => d.title).join(", ")}`;
    }
  }

  if (stats?.recentlyCompleted && stats.recentlyCompleted >= 5) {
    return `Great week! You've completed ${stats.recentlyCompleted} tasks. Keep the momentum going!`;
  }

  // Adult: Surface active predictions
  const predictions = data.activePredictions as { type: string; title: string; severity: string; confidence: number }[] | undefined;
  if (predictions && predictions.length > 0) {
    const critical = predictions.find((p) => p.severity === "critical" || p.severity === "high");
    if (critical) {
      return `Prediction: ${critical.title} (${Math.round(critical.confidence * 100)}% confidence). Review GI predictions for details.`;
    }
  }

  // Adult: Surface pending actions
  const pendingActs = data.pendingActions as number | undefined;
  if (pendingActs && pendingActs > 0) {
    return `${pendingActs} GI action${pendingActs !== 1 ? "s" : ""} awaiting your approval. Review in Admin > GI > Actions.`;
  }

  // Adolescent: Surface recent patterns
  const patterns = data.recentPatterns as { patternType: string; description: string; severity: string }[] | undefined;
  if (patterns && patterns.length > 0) {
    const warning = patterns.find((p) => p.severity === "warning" || p.severity === "critical");
    if (warning) {
      return `Pattern detected: ${warning.description}`;
    }
  }

  return null;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.getFullYear() === tomorrow.getFullYear() && date.getMonth() === tomorrow.getMonth() && date.getDate() === tomorrow.getDate();
}
