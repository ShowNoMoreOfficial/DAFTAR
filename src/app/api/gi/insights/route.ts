import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import {
  getOverdueTasks,
  getOverloadedUsers,
  getPendingReviewDeliverables,
  getTeamWeeklyStats,
  getUnprocessedSignals,
  getUpcomingContent,
} from "@/lib/gi/data-queries";

export interface GIInsight {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  value?: number;
  actionUrl: string;
  actionLabel: string;
}

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const insights: GIInsight[] = [];

  try {
    const [overdue, overloaded, pendingReviews, weeklyStats, unprocessed, upcoming] =
      await Promise.all([
        getOverdueTasks(5),
        getOverloadedUsers(),
        getPendingReviewDeliverables(),
        getTeamWeeklyStats(),
        getUnprocessedSignals(),
        getUpcomingContent(3),
      ]);

    // Overdue tasks
    if (overdue.total > 0) {
      insights.push({
        type: "overdue_tasks",
        severity: overdue.total >= 5 ? "critical" : "warning",
        title: "Overdue Tasks",
        description: `${overdue.total} task${overdue.total !== 1 ? "s" : ""} past due date`,
        value: overdue.total,
        actionUrl: "/pms/list",
        actionLabel: "Show me",
      });
    }

    // Pending reviews
    if (pendingReviews.total > 0) {
      insights.push({
        type: "pending_reviews",
        severity: pendingReviews.total >= 5 ? "warning" : "info",
        title: "Pending Reviews",
        description: `${pendingReviews.total} deliverable${pendingReviews.total !== 1 ? "s" : ""} awaiting review`,
        value: pendingReviews.total,
        actionUrl: "/m/yantri",
        actionLabel: "Review now",
      });
    }

    // Team health
    const healthSeverity: GIInsight["severity"] =
      overloaded.users.length > 0 ? "warning" : weeklyStats.completedThisWeek > 0 ? "info" : "info";
    insights.push({
      type: "team_health",
      severity: healthSeverity,
      title: "Team Health",
      description: `${weeklyStats.completedThisWeek} tasks done this week, ${weeklyStats.totalActive} active${overloaded.users.length > 0 ? `, ${overloaded.users.length} overloaded` : ""}`,
      value: weeklyStats.completedThisWeek,
      actionUrl: "/leaderboard",
      actionLabel: "View team",
    });

    // Unprocessed signals
    if (unprocessed.total > 0) {
      insights.push({
        type: "unprocessed_signals",
        severity: "info",
        title: "Unprocessed Signals",
        description: `${unprocessed.total} signal${unprocessed.total !== 1 ? "s" : ""} not yet linked to pipelines`,
        value: unprocessed.total,
        actionUrl: "/m/khabri/signals",
        actionLabel: "View signals",
      });
    }

    // Upcoming content
    if (upcoming.posts.length > 0) {
      const nextPost = upcoming.posts[0];
      const dateStr = nextPost.scheduledAt
        ? new Date(nextPost.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : "TBD";
      insights.push({
        type: "content_calendar",
        severity: "info",
        title: "Content Calendar",
        description: `Next: "${nextPost.title}" on ${nextPost.platform} (${dateStr})${upcoming.posts.length > 1 ? ` + ${upcoming.posts.length - 1} more` : ""}`,
        value: upcoming.posts.length,
        actionUrl: "/relay/calendar",
        actionLabel: "View calendar",
      });
    }
  } catch (err) {
    console.error("[GI Insights]", err);
  }

  return NextResponse.json({ insights });
}
