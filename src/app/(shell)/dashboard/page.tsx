import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GISlot } from "@/components/gi/gi-slot";
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
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          Welcome back, {name?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Here&apos;s your overview for today.
        </p>
      </div>

      <GISlot name="dashboard-insight" />

      <KPICards role={role} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <UpcomingDeadlines />
      </div>
    </div>
  );
}
