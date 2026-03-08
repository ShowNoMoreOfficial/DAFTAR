import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { message, context } = await req.json();
  if (!message?.trim()) return badRequest("Message is required");

  const { role, id: userId, primaryDepartmentId } = session.user;

  // Gather contextual data based on current module/view
  const contextData: Record<string, unknown> = {};

  try {
    // Get user's task stats
    const [totalTasks, activeTasks, overdueTasks, recentlyCompleted] = await Promise.all([
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
    ]);

    contextData.userTaskStats = { totalTasks, activeTasks, overdueTasks, recentlyCompleted };

    // If on a specific task, get its details
    if (context?.currentEntityType === "task" && context?.currentEntityId) {
      const task = await prisma.task.findUnique({
        where: { id: context.currentEntityId },
        select: { title: true, status: true, priority: true, dueDate: true, description: true },
      });
      if (task) contextData.currentTask = task;
    }

    // Department context for dept heads
    if (role === "DEPT_HEAD" && primaryDepartmentId) {
      const deptStats = await prisma.task.groupBy({
        by: ["status"],
        where: { departmentId: primaryDepartmentId },
        _count: true,
      });
      contextData.departmentStats = deptStats.map((s) => ({ status: s.status, count: s._count }));
    }

    // Admin gets org-wide stats
    if (role === "ADMIN") {
      const [totalUsers, totalBrands, totalDepts] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.brand.count(),
        prisma.department.count(),
      ]);
      contextData.orgStats = { totalUsers, totalBrands, totalDepts };
    }
  } catch {
    // Non-critical: continue without context data
  }

  // Build a reactive response based on the question and context
  const response = generateReactiveResponse(message, contextData, context, role);

  return NextResponse.json({
    message: response.message,
    suggestions: response.suggestions,
    contextUsed: Object.keys(contextData),
  });
}

function generateReactiveResponse(
  message: string,
  data: Record<string, unknown>,
  context: Record<string, unknown> | null,
  role: string
) {
  const lowerMsg = message.toLowerCase();
  const stats = data.userTaskStats as { totalTasks: number; activeTasks: number; overdueTasks: number; recentlyCompleted: number } | undefined;
  const suggestions: string[] = [];

  // Task-related queries
  if (lowerMsg.includes("task") || lowerMsg.includes("work") || lowerMsg.includes("todo")) {
    if (stats) {
      let msg = `You have ${stats.activeTasks} active task${stats.activeTasks !== 1 ? "s" : ""}.`;
      if (stats.overdueTasks > 0) {
        msg += ` ${stats.overdueTasks} ${stats.overdueTasks === 1 ? "is" : "are"} overdue — I'd recommend prioritizing those.`;
        suggestions.push("Show me overdue tasks");
      }
      if (stats.recentlyCompleted > 0) {
        msg += ` You've completed ${stats.recentlyCompleted} task${stats.recentlyCompleted !== 1 ? "s" : ""} this week.`;
      }
      if (stats.activeTasks === 0) {
        msg = "You have no active tasks right now. Check the PMS board for new assignments.";
        suggestions.push("Open PMS board");
      }
      return { message: msg, suggestions };
    }
  }

  // Status queries
  if (lowerMsg.includes("status") || lowerMsg.includes("how am i") || lowerMsg.includes("progress")) {
    if (stats) {
      const completionRate = stats.totalTasks > 0
        ? Math.round(((stats.totalTasks - stats.activeTasks) / stats.totalTasks) * 100)
        : 0;
      return {
        message: `Your overall completion rate is ${completionRate}%. ${stats.activeTasks} tasks active, ${stats.recentlyCompleted} completed this week.${stats.overdueTasks > 0 ? ` Watch out — ${stats.overdueTasks} overdue.` : " You're on track!"}`,
        suggestions: ["Show leaderboard", "View my tasks"],
      };
    }
  }

  // Overdue queries
  if (lowerMsg.includes("overdue") || lowerMsg.includes("late") || lowerMsg.includes("deadline")) {
    if (stats) {
      if (stats.overdueTasks > 0) {
        return {
          message: `You have ${stats.overdueTasks} overdue task${stats.overdueTasks !== 1 ? "s" : ""}. Focus on these first to improve your credibility score.`,
          suggestions: ["Show overdue tasks", "View credibility score"],
        };
      }
      return { message: "No overdue tasks. You're ahead of schedule!", suggestions: ["View my tasks"] };
    }
  }

  // Department stats (for dept heads/admin)
  if (lowerMsg.includes("department") || lowerMsg.includes("team")) {
    const deptStats = data.departmentStats as { status: string; count: number }[] | undefined;
    if (deptStats) {
      const total = deptStats.reduce((s, d) => s + d.count, 0);
      const done = deptStats.find((d) => d.status === "DONE")?.count || 0;
      const inProgress = deptStats.find((d) => d.status === "IN_PROGRESS")?.count || 0;
      return {
        message: `Department has ${total} total tasks. ${done} completed, ${inProgress} in progress. Check the workload view for team distribution.`,
        suggestions: ["View team workload", "Open PMS board"],
      };
    }
  }

  // Org stats for admin
  if (lowerMsg.includes("organization") || lowerMsg.includes("org") || lowerMsg.includes("company")) {
    const orgStats = data.orgStats as { totalUsers: number; totalBrands: number; totalDepts: number } | undefined;
    if (orgStats) {
      return {
        message: `ShowNoMore has ${orgStats.totalUsers} active users across ${orgStats.totalDepts} departments, managing ${orgStats.totalBrands} brand${orgStats.totalBrands !== 1 ? "s" : ""}.`,
        suggestions: ["View all users", "View departments"],
      };
    }
  }

  // Help / what can you do
  if (lowerMsg.includes("help") || lowerMsg.includes("what can you") || lowerMsg.includes("capabilities")) {
    return {
      message: "I'm GI, your organizational copilot. I can help with:\n• Task status and deadlines\n• Workload insights\n• Department performance\n• Team standings and leaderboard\n\nJust ask me about your tasks, deadlines, or team status!",
      suggestions: ["How are my tasks?", "Show team workload", "Am I on track?"],
    };
  }

  // Greeting
  if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
    const greeting = stats
      ? `Hello! You have ${stats.activeTasks} active tasks.${stats.overdueTasks > 0 ? ` Heads up: ${stats.overdueTasks} overdue.` : " Looking good!"}`
      : "Hello! I'm GI, your organizational copilot. How can I help?";
    return { message: greeting, suggestions: ["Show my tasks", "Team status", "What can you do?"] };
  }

  // Default
  return {
    message: `I understand you're asking about "${message}". I'm currently a reactive assistant — I can answer questions about tasks, deadlines, team performance, and workload. Try asking about your tasks or team status!`,
    suggestions: ["How are my tasks?", "Any overdue?", "What can you do?"],
  };
}
