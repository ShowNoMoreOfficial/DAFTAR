"use client";

import { useState, useCallback } from "react";
import { TaskCard } from "@/components/pms/task-card";
import { CreateTaskDialog } from "@/components/pms/create-task-dialog";
import { TaskDetailPanel } from "@/components/pms/task-detail-panel";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardTask {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  difficultyWeight: number;
  assignee: { id: string; name: string; avatar: string | null } | null;
  tags: { name: string }[];
  _count: { comments: number };
}

interface BoardColumn {
  id: string;
  title: string;
  tasks: BoardTask[];
}

const COLUMN_COLORS: Record<string, string> = {
  CREATED: "border-t-gray-400",
  ASSIGNED: "border-t-blue-400",
  IN_PROGRESS: "border-t-yellow-400",
  REVIEW: "border-t-purple-400",
  APPROVED: "border-t-green-400",
  DONE: "border-t-emerald-400",
};

interface KanbanBoardProps {
  initialColumns: BoardColumn[];
}

export function KanbanBoard({ initialColumns }: KanbanBoardProps) {
  const [columns, setColumns] = useState<BoardColumn[]>(initialColumns);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    const res = await fetch("/api/tasks/board");
    if (res.ok) setColumns(await res.json());
  }, []);

  const handleDrop = async (taskId: string, newStatus: string) => {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchBoard();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Task Board</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchBoard}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Task
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto px-6 pb-6">
        {columns.map((col) => (
          <div
            key={col.id}
            className={cn(
              "flex w-[280px] min-w-[280px] flex-col rounded-lg border border-[var(--border-subtle)] border-t-4 bg-[var(--bg-surface)]",
              COLUMN_COLORS[col.id]
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const taskId = e.dataTransfer.getData("taskId");
              if (taskId) handleDrop(taskId, col.id);
            }}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {col.title}
              </span>
              <span className="rounded-full bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                {col.tasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
              {col.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("taskId", task.id)
                  }
                >
                  <TaskCard
                    task={task}
                    onClick={setSelectedTaskId}
                    draggable
                  />
                </div>
              ))}
              {col.tasks.length === 0 && (
                <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No tasks
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchBoard}
      />

      <TaskDetailPanel
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onStatusChange={fetchBoard}
      />
    </div>
  );
}
