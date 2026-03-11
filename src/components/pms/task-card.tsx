"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate: string | null;
    difficultyWeight: number;
    assignee: { id: string; name: string; avatar: string | null } | null;
    tags: { name: string }[];
    _count: { comments: number };
  };
  onClick?: (taskId: string) => void;
  draggable?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-[rgba(239,68,68,0.15)] text-red-700",
  HIGH: "bg-[rgba(249,115,22,0.15)] text-orange-700",
  MEDIUM: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  LOW: "bg-[var(--bg-elevated)] text-gray-600",
};

const PRIORITY_ICONS: Record<string, string> = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-blue-500",
  LOW: "text-gray-400",
};

export function TaskCard({ task, onClick, draggable }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div
      className={cn(
        "group cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm transition-all hover:shadow-md",
        draggable && "active:opacity-70"
      )}
      onClick={() => onClick?.(task.id)}
      draggable={draggable}
      data-task-id={task.id}
    >
      {/* Priority + Weight */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flag className={cn("h-3.5 w-3.5", PRIORITY_ICONS[task.priority] ?? PRIORITY_ICONS.MEDIUM)} />
          <Badge className={cn("text-[10px]", PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.MEDIUM)}>
            {task.priority}
          </Badge>
        </div>
        {task.difficultyWeight > 1 && (
          <span className="text-[10px] font-medium text-[var(--text-muted)]">
            W:{task.difficultyWeight}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="mb-2 text-sm font-medium text-[var(--text-primary)] line-clamp-2">
        {task.title}
      </p>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag.name}
              className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Assignee + Due date + Comments */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={task.assignee.avatar || undefined} />
              <AvatarFallback className="bg-[var(--accent-primary)] text-[8px] text-white">
                {task.assignee.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[10px]",
                isOverdue ? "text-red-500" : "text-[var(--text-muted)]"
              )}
            >
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          {task._count.comments > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
