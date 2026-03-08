"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Loader2,
  Zap,
  Users,
  ArrowRight,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIs {
  activeTasks: number;
  completionRate: number;
  avgCompletionHours: number;
  overdueTasks: number;
}

interface DeptBreakdown {
  id: string;
  name: string;
  activeTasks: number;
  completed30d: number;
  completionRate: number;
  overdue: number;
}

interface BottleneckItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
  status: string;
  detectedAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string | null;
  activeTaskCount: number;
}

interface CapacityItem {
  id: string;
  name: string;
  avatar: string | null;
  activeTaskCount: number;
  totalWeight: number;
  utilizationPct: number;
  status: string;
}

interface CrossDeptDependency {
  id: string;
  fromDeptName: string;
  toDeptName: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface DependencyStats {
  total: number;
  waiting: number;
  acknowledged: number;
  escalated: number;
  resolved: number;
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const TYPE_LABELS: Record<string, string> = {
  approval_delayed: "Approval Delayed",
  task_blocked: "Task Blocked",
  capacity_exceeded: "Capacity Exceeded",
  dependency_waiting: "Dependency Waiting",
};

export default function OperationsPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [departments, setDepartments] = useState<DeptBreakdown[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckItem[]>([]);
  const [capacity, setCapacity] = useState<CapacityItem[]>([]);
  const [crossDeps, setCrossDeps] = useState<CrossDeptDependency[]>([]);
  const [depStats, setDepStats] = useState<DependencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [opsRes, capRes, bnRes, depsRes] = await Promise.all([
        fetch("/api/hoccr/operations"),
        fetch("/api/hoccr/operations/capacity"),
        fetch("/api/hoccr/operations/bottlenecks?status=active"),
        fetch("/api/hoccr/operations/dependencies"),
      ]);

      if (opsRes.ok) {
        const data = await opsRes.json();
        setKpis(data.kpis);
        setDepartments(data.departments);
      }

      if (capRes.ok) {
        const data = await capRes.json();
        setCapacity(data.capacity);
      }

      if (bnRes.ok) {
        const data = await bnRes.json();
        setBottlenecks(Array.isArray(data) ? data : []);
      }

      if (depsRes.ok) {
        const data = await depsRes.json();
        setCrossDeps(data.dependencies || []);
        setDepStats(data.stats || null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDetectBottlenecks = async () => {
    setDetecting(true);
    try {
      const res = await fetch("/api/hoccr/operations/bottlenecks", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBottlenecks(data.bottlenecks || []);
      }
    } finally {
      setDetecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Operations Dashboard</h2>
        <p className="text-sm text-[#9CA3AF]">
          Monitor team performance, bottlenecks, and capacity
        </p>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          <KPICard
            icon={<Activity className="h-5 w-5 text-[#2E86AB]" />}
            label="Active Tasks"
            value={String(kpis.activeTasks)}
          />
          <KPICard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            label="Completion Rate (30d)"
            value={`${kpis.completionRate}%`}
          />
          <KPICard
            icon={<Clock className="h-5 w-5 text-[#A23B72]" />}
            label="Avg Completion Time"
            value={`${kpis.avgCompletionHours}h`}
          />
          <KPICard
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            label="Overdue Tasks"
            value={String(kpis.overdueTasks)}
            highlight={kpis.overdueTasks > 0}
          />
        </div>
      )}

      {/* Department Breakdown */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">Department Breakdown</h3>
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA]">
                <th className="px-4 py-2.5 text-left font-medium text-[#6B7280]">Department</th>
                <th className="px-4 py-2.5 text-center font-medium text-[#6B7280]">Active Tasks</th>
                <th className="px-4 py-2.5 text-center font-medium text-[#6B7280]">Completed (30d)</th>
                <th className="px-4 py-2.5 text-center font-medium text-[#6B7280]">Completion Rate</th>
                <th className="px-4 py-2.5 text-center font-medium text-[#6B7280]">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#9CA3AF]">
                    No department data available
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="border-b border-[#E5E7EB] last:border-0">
                    <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{dept.name}</td>
                    <td className="px-4 py-2.5 text-center">{dept.activeTasks}</td>
                    <td className="px-4 py-2.5 text-center text-emerald-600">{dept.completed30d}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={cn(
                          "font-medium",
                          dept.completionRate >= 70
                            ? "text-emerald-600"
                            : dept.completionRate >= 40
                            ? "text-yellow-600"
                            : "text-red-600"
                        )}
                      >
                        {dept.completionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {dept.overdue > 0 ? (
                        <span className="font-medium text-red-600">{dept.overdue}</span>
                      ) : (
                        <span className="text-[#9CA3AF]">0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottleneck Alerts */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Bottleneck Alerts</h3>
          <Button size="sm" variant="outline" onClick={handleDetectBottlenecks} disabled={detecting}>
            {detecting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="mr-1.5 h-3.5 w-3.5" />
            )}
            Detect Bottlenecks
          </Button>
        </div>
        {bottlenecks.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-8 text-center text-sm text-[#9CA3AF]">
            No active bottlenecks detected. Click "Detect Bottlenecks" to scan.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {bottlenecks.map((bn) => (
              <div
                key={bn.id}
                className={cn(
                  "rounded-lg border p-4",
                  SEVERITY_STYLES[bn.severity] || SEVERITY_STYLES.medium
                )}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{bn.title}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px]",
                      SEVERITY_STYLES[bn.severity] || ""
                    )}
                  >
                    {bn.severity}
                  </Badge>
                </div>
                {bn.description && (
                  <p className="mb-2 text-xs opacity-80">{bn.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {TYPE_LABELS[bn.type] || bn.type}
                  </Badge>
                  <span className="text-[10px] opacity-60">
                    {new Date(bn.detectedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cross-Department Dependencies */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Cross-Department Dependencies</h3>
          <GitBranch className="h-4 w-4 text-[#9CA3AF]" />
          {depStats && depStats.total > 0 && (
            <div className="ml-auto flex items-center gap-2 text-xs">
              {depStats.waiting > 0 && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700">
                  {depStats.waiting} waiting
                </span>
              )}
              {depStats.escalated > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                  {depStats.escalated} escalated
                </span>
              )}
              {depStats.resolved > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                  {depStats.resolved} resolved
                </span>
              )}
            </div>
          )}
        </div>
        {crossDeps.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-8 text-center text-sm text-[#9CA3AF]">
            No cross-department dependencies tracked
          </div>
        ) : (
          <div className="space-y-2">
            {crossDeps.filter((d) => d.status !== "resolved").slice(0, 8).map((dep) => (
              <div
                key={dep.id}
                className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-[#2E86AB]">{dep.fromDeptName}</span>
                  <ArrowRight className="h-3 w-3 text-[#9CA3AF]" />
                  <span className="font-medium text-[#A23B72]">{dep.toDeptName}</span>
                </div>
                <p className="flex-1 truncate text-sm text-[#6B7280]">{dep.description}</p>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px]",
                    dep.status === "escalated"
                      ? "bg-red-100 text-red-700"
                      : dep.status === "waiting"
                      ? "bg-yellow-100 text-yellow-700"
                      : dep.status === "acknowledged"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {dep.status}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px]",
                    dep.priority === "critical"
                      ? "bg-red-100 text-red-700"
                      : dep.priority === "high"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {dep.priority}
                </Badge>
                <span className="text-[10px] text-[#9CA3AF]">
                  {new Date(dep.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Capacity */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Team Capacity</h3>
          <Users className="h-4 w-4 text-[#9CA3AF]" />
        </div>
        {capacity.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-8 text-center text-sm text-[#9CA3AF]">
            No capacity data available
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border border-[#E5E7EB] bg-white p-4">
            {capacity.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-32 truncate text-sm text-[#1A1A1A]">{member.name}</div>
                <div className="flex-1">
                  <div className="h-5 overflow-hidden rounded-full bg-[#F3F4F6]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        member.utilizationPct > 90
                          ? "bg-red-500"
                          : member.utilizationPct > 70
                          ? "bg-yellow-500"
                          : "bg-emerald-500"
                      )}
                      style={{
                        width: `${Math.min(member.utilizationPct, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-xs text-[#6B7280]">
                  {member.utilizationPct}% ({member.activeTaskCount} tasks)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#E5E7EB] bg-white p-4",
        highlight && "border-red-200 bg-red-50"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-[#9CA3AF]">{label}</span>
      </div>
      <p
        className={cn(
          "text-2xl font-bold",
          highlight ? "text-red-600" : "text-[#1A1A1A]"
        )}
      >
        {value}
      </p>
    </div>
  );
}
