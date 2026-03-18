"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Users, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface WorkloadEntry {
  user: { id: string; name: string; avatar: string | null; role: string };
  activeTasks: number;
  totalWeight: number;
  overdueTasks: number;
  tasksByStatus: {
    assigned: number;
    inProgress: number;
    review: number;
  };
  credibility: {
    overallScore: number;
    tasksCompleted: number;
    tasksOnTime: number;
    tasksLate: number;
  } | null;
}

interface KPIData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  avgCompletionHours: number;
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
}

export default function PMSWorkloadPage() {
  const [workload, setWorkload] = useState<WorkloadEntry[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState(0);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks/workload").then((r) => r.json()),
      fetch("/api/kpi").then((r) => r.json()),
    ]).then(([w, k]) => {
      // Handle both old array format and new { members, unassignedTasks } format
      if (Array.isArray(w)) {
        setWorkload(w);
      } else {
        setWorkload(w.members || []);
        setUnassignedTasks(w.unassignedTasks || 0);
      }
      setKpi(k);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
        Loading workload data...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* KPI Cards */}
      {kpi && (
        <div className="mb-6 grid grid-cols-5 gap-4">
          <KPICard
            label="Total Tasks"
            value={kpi.totalTasks}
            icon={<Users className="h-5 w-5 text-[var(--accent-primary)]" />}
          />
          <KPICard
            label="Completed"
            value={kpi.completedTasks}
            icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
          />
          <KPICard
            label="Completion Rate"
            value={`${kpi.completionRate}%`}
            icon={<TrendingUp className="h-5 w-5 text-[var(--accent-secondary)]" />}
          />
          <KPICard
            label="Overdue"
            value={kpi.overdueTasks}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            alert={kpi.overdueTasks > 0}
          />
          <KPICard
            label="Avg. Completion"
            value={`${kpi.avgCompletionHours}h`}
            icon={<Clock className="h-5 w-5 text-[var(--text-secondary)]" />}
          />
        </div>
      )}

      {/* Task distribution */}
      {kpi && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Tasks by Status</h3>
            <div className="space-y-2">
              {kpi.tasksByStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">{s.status.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-[var(--bg-elevated)]">
                      <div
                        className="h-2 rounded-full bg-[var(--accent-primary)]"
                        style={{ width: `${kpi.totalTasks > 0 ? (s.count / kpi.totalTasks) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Tasks by Priority</h3>
            <div className="space-y-2">
              {kpi.tasksByPriority.map((p) => {
                const colors: Record<string, string> = {
                  URGENT: "bg-red-400",
                  HIGH: "bg-orange-400",
                  MEDIUM: "bg-blue-400",
                  LOW: "bg-gray-300",
                };
                return (
                  <div key={p.priority} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">{p.priority}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-[var(--bg-elevated)]">
                        <div
                          className={cn("h-2 rounded-full", colors[p.priority])}
                          style={{ width: `${kpi.totalTasks > 0 ? (p.count / kpi.totalTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[var(--text-primary)]">{p.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Unassigned tasks warning */}
      {unassignedTasks > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-yellow-200 bg-[rgba(234,179,8,0.1)] px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600" />
          <p className="text-sm text-yellow-700">
            <span className="font-semibold">{unassignedTasks} unassigned task{unassignedTasks !== 1 ? "s" : ""}</span>
            {" "}— these won&apos;t appear in anyone&apos;s workload until assigned.
          </p>
        </div>
      )}

      {/* Team Workload */}
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="border-b border-[var(--border-subtle)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Team Workload</h3>
        </div>
        <div className="divide-y divide-[#F0F2F5]">
          {workload.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-muted)]">
              No team members found
            </div>
          ) : (
            workload.map((entry) => (
              <div key={entry.user.id} className="flex items-center gap-4 px-4 py-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.user.avatar || undefined} />
                  <AvatarFallback className="bg-[var(--accent-primary)] text-xs text-white">
                    {entry.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{entry.user.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{entry.user.role}</p>
                </div>

                {/* Workload bar */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {entry.tasksByStatus.assigned} assigned
                    </Badge>
                    <Badge className="bg-[rgba(234,179,8,0.15)] text-yellow-700 text-[10px]">
                      {entry.tasksByStatus.inProgress} active
                    </Badge>
                    <Badge className="bg-[rgba(168,85,247,0.15)] text-purple-700 text-[10px]">
                      {entry.tasksByStatus.review} review
                    </Badge>
                  </div>

                  {entry.overdueTasks > 0 && (
                    <Badge className="bg-[rgba(239,68,68,0.15)] text-red-700 text-[10px]">
                      {entry.overdueTasks} overdue
                    </Badge>
                  )}

                  <div className="text-right">
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      W: {entry.totalWeight}
                    </span>
                  </div>

                  {entry.credibility && (
                    <div className="flex items-center gap-1" title="Credibility Score">
                      <div className="h-1.5 w-12 rounded-full bg-[var(--bg-elevated)]">
                        <div
                          className={cn(
                            "h-1.5 rounded-full",
                            entry.credibility.overallScore >= 70
                              ? "bg-emerald-400"
                              : entry.credibility.overallScore >= 40
                                ? "bg-yellow-400"
                                : "bg-red-400"
                          )}
                          style={{ width: `${entry.credibility.overallScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {entry.credibility.overallScore}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon,
  alert,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4",
        alert && "border-red-200 bg-[rgba(239,68,68,0.1)]"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        {icon}
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
