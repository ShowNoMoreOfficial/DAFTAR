"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Users,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CapacityTable,
  type CapacityRow,
} from "@/components/hoccr/capacity-table";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────

interface VelocityPoint {
  week: string;
  tasks: number;
}

interface DeptCapacity {
  department: string;
  capacity: number;
  headcount: number;
}

interface ChartSummary {
  avgWeeklyVelocity: number;
  velocityTrend: "up" | "down";
  avgCapacity: number;
  overloadedDepts: number;
}

interface CapacityItem {
  id: string;
  name: string;
  departmentId: string | null;
  departmentName: string | null;
  activeTaskCount: number;
  utilizationPct: number;
}

// ─── Helpers ──────────────────────────────────────────────

function getCapacityBarFill(pct: number): string {
  if (pct > 85) return "#EF4444"; // red-500
  if (pct > 70) return "#EAB308"; // yellow-500
  return "#10B981"; // emerald-500
}

// ─── Component ────────────────────────────────────────────

export default function OperationsPage() {
  const [velocity, setVelocity] = useState<VelocityPoint[]>([]);
  const [deptCap, setDeptCap] = useState<DeptCapacity[]>([]);
  const [chartSummary, setChartSummary] = useState<ChartSummary | null>(null);
  const [capacityRows, setCapacityRows] = useState<CapacityRow[]>([]);
  const [blockerCount, setBlockerCount] = useState(0);
  const [sentimentAvg, setSentimentAvg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [chartsRes, capRes, opsRes, sentRes] = await Promise.all([
        fetch("/api/hoccr/intelligence/charts"),
        fetch("/api/hoccr/operations/capacity"),
        fetch("/api/hoccr/operations"),
        fetch("/api/hoccr/culture/sentiment"),
      ]);

      if (chartsRes.ok) {
        const data = await chartsRes.json();
        setVelocity(data.companyVelocity ?? []);
        setDeptCap(data.departmentCapacity ?? []);
        setChartSummary(data.summary ?? null);
      }

      if (capRes.ok) {
        const data = await capRes.json();
        const rows: CapacityRow[] = (data.capacity ?? []).map(
          (c: CapacityItem) => ({
            id: c.id,
            name: c.name,
            department: c.departmentName ?? "Unassigned",
            capacityPct: c.utilizationPct,
            openTasks: c.activeTaskCount,
          })
        );
        setCapacityRows(rows);
      }

      if (opsRes.ok) {
        const data = await opsRes.json();
        setBlockerCount(data.kpis?.overdueTasks ?? 0);
      }

      if (sentRes.ok) {
        const data = await sentRes.json();
        const depts = Array.isArray(data) ? data : data.departments ?? [];
        if (depts.length > 0) {
          const avg =
            depts.reduce(
              (s: number, d: { avgSentiment?: number }) =>
                s + (d.avgSentiment ?? 0),
              0
            ) / depts.length;
          setSentimentAvg(Math.round(avg * 10) / 10);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Operations Dashboard
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Velocity, capacity, and team health at a glance
        </p>
      </div>

      {/* ── KPI Cards ────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KPICard
          icon={<TrendingUp className="h-5 w-5 text-[var(--accent-primary)]" />}
          label="Overall Velocity"
          value={
            chartSummary
              ? `${chartSummary.avgWeeklyVelocity}/wk`
              : "—"
          }
          sub={
            chartSummary
              ? chartSummary.velocityTrend === "up"
                ? "Trending up"
                : "Trending down"
              : undefined
          }
          subColor={
            chartSummary?.velocityTrend === "up"
              ? "text-emerald-600"
              : "text-red-500"
          }
        />
        <KPICard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Active Blockers"
          value={String(blockerCount)}
          highlight={blockerCount > 0}
        />
        <KPICard
          icon={<Smile className="h-5 w-5 text-[var(--accent-secondary)]" />}
          label="Avg Sentiment"
          value={sentimentAvg !== null ? `${sentimentAvg}/10` : "—"}
        />
        <KPICard
          icon={<AlertOctagon className="h-5 w-5 text-orange-500" />}
          label="Overloaded Depts"
          value={
            chartSummary
              ? String(chartSummary.overloadedDepts)
              : "—"
          }
          highlight={
            chartSummary ? chartSummary.overloadedDepts > 0 : false
          }
        />
      </div>

      {/* ── Charts Section ───────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        {/* Company Velocity */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--accent-primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Company Velocity
            </h3>
            <span className="ml-auto text-[10px] text-[var(--text-muted)]">
              Tasks completed / week
            </span>
          </div>
          {velocity.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={velocity}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="velocityGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#2E86AB"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="#2E86AB"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke="#2E86AB"
                  strokeWidth={2}
                  fill="url(#velocityGrad)"
                  dot={{ r: 3, fill: "#2E86AB", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-[var(--text-muted)]">
              No velocity data
            </div>
          )}
        </div>

        {/* Department Capacity */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--accent-secondary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Department Capacity
            </h3>
            <span className="ml-auto text-[10px] text-[var(--text-muted)]">
              % workload utilization
            </span>
          </div>
          {deptCap.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={deptCap}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                barSize={28}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value) => [`${value}%`, "Capacity"]}
                />
                <Bar dataKey="capacity" radius={[4, 4, 0, 0]}>
                  {deptCap.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={getCapacityBarFill(entry.capacity)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-[var(--text-muted)]">
              No capacity data
            </div>
          )}
        </div>
      </div>

      {/* ── Capacity Table ───────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Employee Capacity
          </h3>
          <Users className="h-4 w-4 text-[var(--text-muted)]" />
        </div>
        <CapacityTable rows={capacityRows} />
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
  highlight,
  sub,
  subColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4",
        highlight && "border-red-200 bg-[rgba(239,68,68,0.1)]"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
      </div>
      <p
        className={cn(
          "text-2xl font-bold",
          highlight ? "text-red-600" : "text-[var(--text-primary)]"
        )}
      >
        {value}
      </p>
      {sub && (
        <p className={cn("mt-1 text-xs", subColor ?? "text-[var(--text-muted)]")}>
          {sub}
        </p>
      )}
    </div>
  );
}
