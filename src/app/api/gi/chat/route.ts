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
      message: "I'm GI v2, your organizational copilot. I can help with:\n• Task status, deadlines & overdue alerts\n• Credibility score breakdown\n• Upcoming deadlines\n• Department & team performance\n• Bottleneck detection\n• Organization overview\n• Leaderboard standings\n• Notification summary\n\nJust ask me anything!",
      suggestions: ["How are my tasks?", "My credibility score", "Upcoming deadlines", "Team status"],
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
