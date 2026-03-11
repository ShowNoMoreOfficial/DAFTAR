"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "@/components/pms/create-task-dialog";
import { TaskDetailPanel } from "@/components/pms/task-detail-panel";
import { Plus, Flag, Calendar, ArrowUpDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_STATUS_COLORS } from "@/lib/constants";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  difficultyWeight: number;
  createdAt: string;
  assignee: { id: string; name: string; avatar: string | null } | null;
  creator: { id: string; name: string; avatar: string | null };
  department: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  tags: { name: string }[];
  _count: { comments: number };
}

const STATUS_COLORS = TASK_STATUS_COLORS;

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-blue-500",
  LOW: "text-gray-400",
};

export default function PMSListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);

    try {
      const res = await fetch(`/api/tasks?${params}`);
      if (res.ok) {
        const json = await res.json();
        setTasks(json.data ?? json);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs"
          >
            <option value="">All Statuses</option>
            {["CREATED", "ASSIGNED", "IN_PROGRESS", "REVIEW", "APPROVED", "DONE", "CANCELLED"].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs"
          >
            <option value="">All Priorities</option>
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.open("/api/tasks/export", "_blank")}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Task
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-left text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
              <th className="pb-2 pr-4">
                <div className="flex items-center gap-1">
                  Task <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Priority</th>
              <th className="pb-2 pr-4">Assignee</th>
              <th className="pb-2 pr-4">Department</th>
              <th className="pb-2 pr-4">Due Date</th>
              <th className="pb-2">Weight</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#9CA3AF]">
                  Loading...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#9CA3AF]">
                  No tasks found. Create one to get started.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="cursor-pointer border-b border-[#F0F2F5] transition-colors hover:bg-[#F8F9FA]"
                  >
                    <td className="py-3 pr-4">
                      <span className="font-medium text-[#1A1A1A]">{task.title}</span>
                      {task.tags.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {task.tags.map((t) => (
                            <span key={t.name} className="rounded bg-[#F0F2F5] px-1.5 py-0.5 text-[10px] text-[#6B7280]">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={cn("text-[10px]", STATUS_COLORS[task.status])}>
                        {task.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Flag className={cn("h-4 w-4", PRIORITY_COLORS[task.priority])} />
                    </td>
                    <td className="py-3 pr-4">
                      {task.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={task.assignee.avatar || undefined} />
                            <AvatarFallback className="bg-[#2E86AB] text-[8px] text-white">
                              {task.assignee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#D1D5DB]">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs text-[#6B7280]">
                      {task.department?.name || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {task.dueDate ? (
                        <span className={cn("flex items-center gap-1 text-xs", isOverdue ? "text-red-500" : "text-[#6B7280]")}>
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      ) : (
                        <span className="text-xs text-[#D1D5DB]">—</span>
                      )}
                    </td>
                    <td className="py-3 text-xs text-[#9CA3AF]">{task.difficultyWeight}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchTasks} />
      <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onStatusChange={fetchTasks} />
    </div>
  );
}
