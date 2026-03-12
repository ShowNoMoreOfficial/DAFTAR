import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PriorityActions } from "@/components/dashboard/priority-actions";
import { PipelineMiniBar } from "@/components/dashboard/pipeline-mini-bar";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { QuickNav } from "@/components/dashboard/quick-nav";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, name } = session.user;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Welcome back, {name?.split(" ")[0] || "there"}.
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Here&apos;s what needs your attention.
        </p>
      </div>

      {/* Priority Actions — what needs attention NOW */}
      <PriorityActions />

      {/* Content Pipeline mini-bar */}
      <PipelineMiniBar />

      {/* KPI Cards */}
      <KPICards role={role} />

      {/* Quick navigation links */}
      <QuickNav role={role} />

      {/* Two-column: Deadlines + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingDeadlines />
        <ActivityFeed />
      </div>
    </div>
  );
}
