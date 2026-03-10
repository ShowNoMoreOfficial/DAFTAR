"use client";

import { useState, useEffect } from "react";
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
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  LOW: "bg-gray-100 text-gray-600",
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
    <div className="rounded-xl border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-5 py-3">
        <h2 className="text-sm font-semibold text-[#1A1A1A]">Upcoming Deadlines</h2>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="h-4 w-4 rounded bg-[#F0F2F5]" />
                <div className="flex-1">
                  <div className="h-3 w-2/3 rounded bg-[#F0F2F5]" />
                  <div className="mt-1.5 h-2 w-20 rounded bg-[#F0F2F5]" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-6 text-center">
            <Calendar className="mx-auto h-8 w-8 text-[#D1D5DB]" />
            <p className="mt-2 text-sm text-[#9CA3AF]">
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
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#F8F9FA]"
                >
                  {due.isOverdue ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                  ) : (
                    <Clock
                      className={cn(
                        "h-4 w-4 shrink-0",
                        due.isSoon ? "text-amber-500" : "text-[#9CA3AF]"
                      )}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[#1A1A1A]">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      {task.assignee ? task.assignee.name : "Unassigned"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[10px]",
                        PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.MEDIUM
                      )}
                    >
                      {task.priority}
                    </Badge>
                    <span
                      className={cn(
                        "whitespace-nowrap text-[10px] font-medium",
                        due.isOverdue
                          ? "text-red-600"
                          : due.isSoon
                            ? "text-amber-600"
                            : "text-[#9CA3AF]"
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
