"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  assignee: { id: string; name: string } | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-[rgba(239,68,68,0.15)] text-[var(--status-error)]",
  HIGH: "bg-[rgba(245,158,11,0.15)] text-[var(--accent-tertiary)]",
  MEDIUM: "bg-[rgba(59,130,246,0.15)] text-[var(--status-info)]",
  LOW: "bg-[var(--bg-elevated)] text-[var(--text-muted)]",
};

function formatDue(dateStr: string): { label: string; isOverdue: boolean; isSoon: boolean } {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isSoon: false };
  if (diffDays === 0) return { label: "Due today", isOverdue: false, isSoon: true };
  if (diffDays === 1) return { label: "Due tomorrow", isOverdue: false, isSoon: true };
  if (diffDays <= 3) return { label: `Due in ${diffDays}d`, isOverdue: false, isSoon: true };

  return {
    label: due.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    isOverdue: false,
    isSoon: false,
  };
}

export function UpcomingDeadlines() {
  const router = useRouter();
  const [tasks, setTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks?limit=100")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        const data = json.data ?? json;
        if (Array.isArray(data)) {
          const upcoming = data
            .filter(
              (t: UpcomingTask) =>
                t.dueDate && !["DONE", "CANCELLED"].includes(t.status)
            )
            .sort(
              (a: UpcomingTask, b: UpcomingTask) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            )
            .slice(0, 6);
          setTasks(upcoming);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Upcoming Deadlines</h2>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded skeleton-shimmer" />
                <div className="flex-1">
                  <div className="h-3 w-2/3 rounded skeleton-shimmer" />
                  <div className="mt-1.5 h-2 w-20 rounded skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-6 text-center">
            <Calendar className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              No upcoming deadlines. Tasks with due dates will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => {
              const due = formatDue(task.dueDate);
              return (
                <div
                  key={task.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--bg-elevated)]"
                  onClick={() => router.push(`/pms?taskId=${task.id}`)}
                >
                  {due.isOverdue ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--status-error)]" />
                  ) : (
                    <Clock
                      className={cn(
                        "h-4 w-4 shrink-0",
                        due.isSoon ? "text-[var(--accent-tertiary)]" : "text-[var(--text-muted)]"
                      )}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {task.assignee ? task.assignee.name : "Unassigned"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[10px] border-0",
                        PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.MEDIUM
                      )}
                    >
                      {task.priority}
                    </Badge>
                    <span
                      className={cn(
                        "whitespace-nowrap text-[10px] font-medium font-mono",
                        due.isOverdue
                          ? "text-[var(--status-error)]"
                          : due.isSoon
                            ? "text-[var(--accent-tertiary)]"
                            : "text-[var(--text-muted)]"
                      )}
                    >
                      {due.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
