import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GISlot } from "@/components/gi/gi-slot";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, name } = session.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          Welcome back, {name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Here&apos;s your overview for today.
        </p>
      </div>

      <GISlot name="dashboard-insight" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {role === "ADMIN" && (
          <>
            <KPICard title="Active Users" value="4" subtitle="team members" />
            <KPICard title="Active Brands" value="2" subtitle="brands managed" />
            <KPICard title="Pending Approvals" value="7" subtitle="items waiting" />
            <KPICard title="Tasks In Progress" value="12" subtitle="across departments" />
          </>
        )}
        {role === "MEMBER" && (
          <>
            <KPICard title="My Tasks" value="5" subtitle="assigned to you" />
            <KPICard title="Completed Today" value="2" subtitle="tasks done" />
            <KPICard title="Streak" value="3 days" subtitle="keep going!" />
            <KPICard title="Leaderboard" value="#2" subtitle="this week" />
          </>
        )}
        {role === "CLIENT" && (
          <>
            <KPICard title="Deliverables" value="8" subtitle="approved this month" />
            <KPICard title="Pending Review" value="3" subtitle="awaiting your approval" />
            <KPICard title="Brands" value="2" subtitle="active brands" />
            <KPICard title="Published" value="15" subtitle="this month" />
          </>
        )}
        {!["ADMIN", "MEMBER", "CLIENT"].includes(role) && (
          <>
            <KPICard title="Tasks" value="--" subtitle="loading..." />
            <KPICard title="Approvals" value="--" subtitle="loading..." />
            <KPICard title="Team" value="--" subtitle="loading..." />
            <KPICard title="KPIs" value="--" subtitle="loading..." />
          </>
        )}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-sm font-medium text-[#1A1A1A]">Recent Activity</h2>
          <p className="mt-4 text-sm text-[#9CA3AF]">
            Activity feed will appear here once modules are connected.
          </p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-sm font-medium text-[#1A1A1A]">Upcoming</h2>
          <p className="mt-4 text-sm text-[#9CA3AF]">
            Calendar events and deadlines will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[#1A1A1A]">{value}</p>
      <p className="mt-1 text-xs text-[#9CA3AF]">{subtitle}</p>
    </div>
  );
}
