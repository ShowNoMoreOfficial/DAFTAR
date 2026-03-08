"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskDetailPanel } from "@/components/pms/task-detail-panel";
import { Flag, Calendar, Clock, CheckCircle, Circle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  difficultyWeight: number;
  department: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  tags: { name: string }[];
  _count: { comments: number };
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  CREATED: <Circle className="h-4 w-4 text-gray-400" />,
  ASSIGNED: <Circle className="h-4 w-4 text-blue-400" />,
  IN_PROGRESS: <PlayCircle className="h-4 w-4 text-yellow-500" />,
  REVIEW: <Clock className="h-4 w-4 text-purple-500" />,
  APPROVED: <CheckCircle className="h-4 w-4 text-green-500" />,
  DONE: <CheckCircle className="h-4 w-4 text-emerald-500" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-blue-500",
  LOW: "text-gray-400",
};

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks?limit=100");
      if (res.ok) {
        const json = await res.json();
        setTasks(json.data ?? json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filtered = tasks.filter((t) => {
    if (filter === "active") return !["DONE", "CANCELLED"].includes(t.status);
    if (filter === "completed") return t.status === "DONE";
    return true;
  });

  const overdue = filtered.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE");
  const today = filtered.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">My Tasks</h1>
          <p className="text-sm text-[#9CA3AF]">{filtered.length} tasks</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-white p-0.5">
          {(["active", "completed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f ? "bg-[#2E86AB] text-white" : "text-[#6B7280] hover:bg-[#F0F2F5]"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">{overdue.length} overdue task{overdue.length > 1 ? "s" : ""}</p>
        </div>
      )}

      {/* Due today */}
      {today.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm font-medium text-yellow-700">{today.length} task{today.length > 1 ? "s" : ""} due today</p>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-[#9CA3AF]">Loading tasks...</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#9CA3AF]">No tasks found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3 transition-all hover:shadow-sm"
              >
                {STATUS_ICONS[task.status] || <Circle className="h-4 w-4 text-gray-300" />}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", task.status === "DONE" ? "text-[#9CA3AF] line-through" : "text-[#1A1A1A]")}>
                    {task.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {task.department && <span className="text-[10px] text-[#9CA3AF]">{task.department.name}</span>}
                    {task.tags.map((t) => (
                      <span key={t.name} className="rounded bg-[#F0F2F5] px-1.5 py-0.5 text-[10px] text-[#6B7280]">{t.name}</span>
                    ))}
                  </div>
                </div>
                <Flag className={cn("h-3.5 w-3.5", PRIORITY_COLORS[task.priority])} />
                {task.dueDate && (
                  <span className={cn("flex items-center gap-1 text-[10px]", isOverdue ? "text-red-500" : "text-[#9CA3AF]")}>
                    <Calendar className="h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                )}
                <Badge variant="secondary" className="text-[10px]">W:{task.difficultyWeight}</Badge>
              </div>
            );
          })}
        </div>
      )}

      <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onStatusChange={fetchTasks} />
    </div>
  );
}
