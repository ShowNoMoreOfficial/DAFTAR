import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };
import { redirect } from "next/navigation";
import { GISlot } from "@/components/gi/gi-slot";
import { GIProactiveCards } from "@/components/dashboard/gi-proactive-cards";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, name } = session.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Welcome back, {name?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Here&apos;s your overview for today.
        </p>
      </div>

      <GISlot name="dashboard-insight" />

      <GIProactiveCards />

      <KPICards role={role} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <UpcomingDeadlines />
      </div>
    </div>
  );
}
