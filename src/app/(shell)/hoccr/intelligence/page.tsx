"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Loader2,
  X,
  Plus,
  Network,
  GitBranch,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---- Types ----

interface DeptCultureScore {
  departmentId: string;
  departmentName: string;
  overallScore: number;
  prevOverallScore: number;
  trend: "up" | "down" | "stable";
  memberCount: number;
  breakdown: {
    sentiment: number;
    engagement: number;
    recognition: number;
    collaboration: number;
    retention: number;
  };
}

interface CultureMetricsData {
  orgScore: number;
  departments: DeptCultureScore[];
  flags: {
    type: string;
    message: string;
    departmentId: string;
    severity: string;
  }[];
  unrecognizedPerformers: {
    userId: string;
    name: string;
    avatar: string | null;
    tasksCompleted: number;
    recognitionsReceived: number;
  }[];
}

interface DeptInteraction {
  fromDeptId: string;
  fromDeptName: string;
  toDeptId: string;
  toDeptName: string;
  strength: number;
}

interface DependencyItem {
  id: string;
  fromDeptId: string;
  fromDeptName: string;
  toDeptId: string;
  toDeptName: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface IntelligenceData {
  departments: { id: string; name: string }[];
  interactionMap: DeptInteraction[];
  crossDeptBottlenecks: DependencyItem[];
  dependencyHealth: {
    total: number;
    resolved: number;
    escalated: number;
    resolutionRate: number;
  };
  resourceSharing: {
    user: { id: string; name: string; avatar: string | null };
    departments: { id: string; name: string }[];
    deptCount: number;
  }[];
  leastCollaborating: {
    departmentId: string;
    departmentName: string;
    totalInteractions: number;
  }[];
}

// ---- Constants ----

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-[rgba(239,68,68,0.15)] text-red-700",
  high: "bg-[rgba(249,115,22,0.15)] text-orange-700",
  medium: "bg-[rgba(234,179,8,0.15)] text-yellow-700",
  low: "bg-[var(--bg-elevated)] text-gray-600",
};

const STATUS_STYLES: Record<string, string> = {
  waiting: "bg-[rgba(234,179,8,0.15)] text-yellow-700",
  acknowledged: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  resolved: "bg-[rgba(16,185,129,0.15)] text-emerald-700",
  escalated: "bg-[rgba(239,68,68,0.15)] text-red-700",
};

// ---- Component ----

export default function IntelligencePage() {
  const [cultureData, setCultureData] = useState<CultureMetricsData | null>(null);
  const [intelData, setIntelData] = useState<IntelligenceData | null>(null);
  const [dependencies, setDependencies] = useState<DependencyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cultureRes, intelRes, depsRes] = await Promise.all([
        fetch("/api/hoccr/culture/metrics"),
        fetch("/api/hoccr/intelligence"),
        fetch("/api/hoccr/dependencies"),
      ]);

      if (cultureRes.ok) {
        setCultureData(await cultureRes.json());
      }
      if (intelRes.ok) {
        setIntelData(await intelRes.json());
      }
      if (depsRes.ok) {
        setDependencies(await depsRes.json());
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
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Intelligence Dashboard</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Culture health, cross-department collaboration, and organizational intelligence
        </p>
      </div>

      {/* Org-wide Culture Score */}
      {cultureData && (
        <div className="mb-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-[var(--accent-primary)]" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">Organization Culture Score</p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  cultureData.orgScore >= 70
                    ? "text-emerald-600"
                    : cultureData.orgScore >= 40
                    ? "text-yellow-600"
                    : "text-red-600"
                )}
              >
                {cultureData.orgScore}
                <span className="ml-1 text-sm font-normal text-[var(--text-muted)]">/ 100</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Culture Health Overview - Department Cards */}
      {cultureData && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Culture Health by Department</h3>
          <div className="grid grid-cols-3 gap-4">
            {cultureData.departments.map((dept) => (
              <div
                key={dept.departmentId}
                className={cn(
                  "rounded-lg border p-4",
                  dept.overallScore >= 70
                    ? "border-emerald-200 bg-[rgba(16,185,129,0.1)]/50"
                    : dept.overallScore >= 40
                    ? "border-yellow-200 bg-[rgba(234,179,8,0.1)]/50"
                    : "border-red-200 bg-[rgba(239,68,68,0.1)]/50"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">{dept.departmentName}</h4>
                  {dept.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : dept.trend === "down" ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="mb-3 flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      dept.overallScore >= 70
                        ? "text-emerald-600"
                        : dept.overallScore >= 40
                        ? "text-yellow-600"
                        : "text-red-600"
                    )}
                  >
                    {dept.overallScore}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">/ 100</span>
                  {dept.trend !== "stable" && (
                    <span
                      className={cn(
                        "text-xs",
                        dept.trend === "up" ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      (was {dept.prevOverallScore})
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <BreakdownBar label="Sentiment" value={dept.breakdown.sentiment} />
                  <BreakdownBar label="Engagement" value={dept.breakdown.engagement} />
                  <BreakdownBar label="Recognition" value={dept.breakdown.recognition} />
                  <BreakdownBar label="Collaboration" value={dept.breakdown.collaboration} />
                  <BreakdownBar label="Retention" value={dept.breakdown.retention} />
                </div>
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">{dept.memberCount} members</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-Department Interaction Map */}
      {intelData && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Network className="h-4 w-4 text-[var(--accent-primary)]" />
            Cross-Department Interactions
          </h3>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            {intelData.interactionMap.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                No cross-department interactions recorded yet
              </p>
            ) : (
              <div>
                {/* Heatmap-style grid */}
                <div className="overflow-x-auto">
                  <HeatmapGrid
                    departments={intelData.departments}
                    interactions={intelData.interactionMap}
                  />
                </div>

                {/* Top interactions list */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">Top Collaborations</p>
                  {intelData.interactionMap.slice(0, 5).map((interaction, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] px-3 py-2"
                    >
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {interaction.fromDeptName}
                      </span>
                      <ArrowRight className="h-3 w-3 text-[var(--text-muted)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {interaction.toDeptName}
                      </span>
                      <Badge className="ml-auto bg-[var(--accent-primary)]/10 text-[10px] text-[var(--accent-primary)]">
                        {interaction.strength} interactions
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Least collaborating */}
                {intelData.leastCollaborating.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
                      Least Collaborating Departments
                    </p>
                    <div className="flex gap-2">
                      {intelData.leastCollaborating.map((dept) => (
                        <Badge
                          key={dept.departmentId}
                          variant="secondary"
                          className="bg-[rgba(249,115,22,0.1)] text-xs text-orange-700"
                        >
                          {dept.departmentName} ({dept.totalInteractions} interactions)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dependency Health + Active Dependencies */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {intelData && (
          <div className="col-span-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <GitBranch className="h-4 w-4 text-[var(--accent-primary)]" />
              Dependency Health
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Resolution Rate</span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    intelData.dependencyHealth.resolutionRate >= 70
                      ? "text-emerald-600"
                      : intelData.dependencyHealth.resolutionRate >= 40
                      ? "text-yellow-600"
                      : "text-red-600"
                  )}
                >
                  {intelData.dependencyHealth.resolutionRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Total (30d)</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {intelData.dependencyHealth.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Resolved</span>
                <span className="text-sm font-medium text-emerald-600">
                  {intelData.dependencyHealth.resolved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Escalated</span>
                <span className="text-sm font-medium text-red-600">
                  {intelData.dependencyHealth.escalated}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Active Dependencies</h3>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Dependency
            </Button>
          </div>
          {dependencies.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">
              No dependencies tracked yet
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">From</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">To</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)]">Description</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Priority</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Status</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dependencies.map((dep) => (
                    <DependencyRow
                      key={dep.id}
                      dep={dep}
                      onStatusChange={async (id, status) => {
                        const res = await fetch("/api/hoccr/dependencies", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id, status }),
                        });
                        if (res.ok) fetchData();
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Unrecognized Performers */}
      {cultureData && cultureData.unrecognizedPerformers.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Award className="h-4 w-4 text-[var(--accent-secondary)]" />
            Unrecognized Performers
          </h3>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Team members with high task completion but no recognition received this period
            </p>
            <div className="grid grid-cols-2 gap-2">
              {cultureData.unrecognizedPerformers.map((performer) => (
                <div
                  key={performer.userId}
                  className="flex items-center gap-3 rounded-lg bg-[var(--bg-surface)] px-3 py-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-xs font-medium text-white">
                    {performer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{performer.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {performer.tasksCompleted} tasks completed, 0 recognitions
                    </p>
                  </div>
                  <Badge className="bg-[var(--accent-secondary)]/10 text-[10px] text-[var(--accent-secondary)]">
                    Needs Recognition
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alert Feed */}
      {cultureData && cultureData.flags.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Culture Alerts
          </h3>
          <div className="space-y-2">
            {cultureData.flags.map((flag, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-4 py-3",
                  flag.severity === "high"
                    ? "border-red-200 bg-[rgba(239,68,68,0.1)]"
                    : "border-yellow-200 bg-[rgba(234,179,8,0.1)]"
                )}
              >
                {flag.severity === "high" ? (
                  <AlertOctagon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                )}
                <div>
                  <p className="text-sm text-[var(--text-primary)]">{flag.message}</p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-1 text-[10px]",
                      flag.type === "declining_culture"
                        ? "bg-[rgba(249,115,22,0.15)] text-orange-700"
                        : flag.type === "engagement_drop"
                        ? "bg-[rgba(234,179,8,0.15)] text-yellow-700"
                        : "bg-[rgba(239,68,68,0.15)] text-red-700"
                    )}
                  >
                    {flag.type.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Dependency Dialog */}
      {createOpen && intelData && (
        <CreateDependencyDialog
          departments={intelData.departments}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ---- Sub-components ----

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-[10px] text-[var(--text-secondary)]">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <div
          className={cn(
            "h-full rounded-full",
            value >= 70 ? "bg-[rgba(16,185,129,0.1)]0" : value >= 40 ? "bg-[rgba(234,179,8,0.1)]0" : "bg-[rgba(239,68,68,0.1)]0"
          )}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="w-8 text-right text-[10px] font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function HeatmapGrid({
  departments,
  interactions,
}: {
  departments: { id: string; name: string }[];
  interactions: DeptInteraction[];
}) {
  // Build lookup
  const strengthMap: Record<string, number> = {};
  let maxStrength = 1;

  for (const interaction of interactions) {
    const key = [interaction.fromDeptId, interaction.toDeptId].sort().join("-");
    strengthMap[key] = interaction.strength;
    if (interaction.strength > maxStrength) maxStrength = interaction.strength;
  }

  if (departments.length === 0) return null;

  return (
    <table className="w-full text-xs">
      <thead>
        <tr>
          <th className="p-1" />
          {departments.map((d) => (
            <th
              key={d.id}
              className="p-1 text-center font-medium text-[var(--text-secondary)]"
              style={{ maxWidth: 80 }}
            >
              <span className="block truncate">{d.name}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {departments.map((row) => (
          <tr key={row.id}>
            <td className="p-1 font-medium text-[var(--text-secondary)]">
              <span className="block w-24 truncate">{row.name}</span>
            </td>
            {departments.map((col) => {
              if (row.id === col.id) {
                return (
                  <td key={col.id} className="p-1 text-center">
                    <div className="mx-auto h-8 w-8 rounded bg-[var(--bg-elevated)]" />
                  </td>
                );
              }
              const key = [row.id, col.id].sort().join("-");
              const strength = strengthMap[key] || 0;
              const intensity = strength / maxStrength;
              return (
                <td key={col.id} className="p-1 text-center">
                  <div
                    className="mx-auto flex h-8 w-8 items-center justify-center rounded text-[10px] font-medium"
                    style={{
                      backgroundColor:
                        strength > 0
                          ? `rgba(46, 134, 171, ${Math.max(intensity * 0.8, 0.1)})`
                          : "#F9FAFB",
                      color: intensity > 0.5 ? "white" : "#6B7280",
                    }}
                    title={`${row.name} - ${col.name}: ${strength} interactions`}
                  >
                    {strength > 0 ? strength : ""}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DependencyRow({
  dep,
  onStatusChange,
}: {
  dep: DependencyItem;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <tr className="border-b border-[var(--border-subtle)] last:border-0">
      <td className="px-3 py-2 text-[var(--text-primary)]">{dep.fromDeptName}</td>
      <td className="px-3 py-2 text-[var(--text-primary)]">{dep.toDeptName}</td>
      <td className="max-w-48 truncate px-3 py-2 text-[var(--text-secondary)]">{dep.description}</td>
      <td className="px-3 py-2 text-center">
        <Badge className={cn("text-[10px]", PRIORITY_STYLES[dep.priority] || "")}>
          {dep.priority}
        </Badge>
      </td>
      <td className="px-3 py-2 text-center">
        <Badge className={cn("text-[10px]", STATUS_STYLES[dep.status] || "")}>
          {dep.status}
        </Badge>
      </td>
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          {dep.status === "waiting" && (
            <button
              onClick={() => onStatusChange(dep.id, "acknowledged")}
              className="rounded p-1 text-blue-600 hover:bg-[rgba(59,130,246,0.1)]"
              title="Acknowledge"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}
          {(dep.status === "waiting" || dep.status === "acknowledged") && (
            <>
              <button
                onClick={() => onStatusChange(dep.id, "resolved")}
                className="rounded p-1 text-emerald-600 hover:bg-[rgba(16,185,129,0.1)]"
                title="Resolve"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onStatusChange(dep.id, "escalated")}
                className="rounded p-1 text-red-600 hover:bg-[rgba(239,68,68,0.1)]"
                title="Escalate"
              >
                <AlertOctagon className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {dep.status === "escalated" && (
            <button
              onClick={() => onStatusChange(dep.id, "resolved")}
              className="rounded p-1 text-emerald-600 hover:bg-[rgba(16,185,129,0.1)]"
              title="Resolve"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}
          {dep.status === "resolved" && (
            <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          )}
        </div>
      </td>
    </tr>
  );
}

function CreateDependencyDialog({
  departments,
  onClose,
  onCreated,
}: {
  departments: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fromDeptId, setFromDeptId] = useState("");
  const [toDeptId, setToDeptId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!fromDeptId || !toDeptId || !description) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hoccr/dependencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromDeptId, toDeptId, description, priority }),
      });
      if (res.ok) onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Create Cross-Dept Dependency</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[var(--text-secondary)]">From Department</label>
            <select
              value={fromDeptId}
              onChange={(e) => setFromDeptId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-secondary)]">To Department</label>
            <select
              value={toDeptId}
              onChange={(e) => setToDeptId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
            >
              <option value="">Select department</option>
              {departments
                .filter((d) => d.id !== fromDeptId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-secondary)]">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the dependency..."
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-secondary)]">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !fromDeptId || !toDeptId || !description}
            >
              {submitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
