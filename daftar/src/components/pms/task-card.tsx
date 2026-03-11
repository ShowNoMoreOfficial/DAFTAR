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
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  LOW: "bg-gray-100 text-gray-600",
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
        "group cursor-pointer rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-sm transition-all hover:shadow-md",
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
          <span className="text-[10px] font-medium text-[#9CA3AF]">
            W:{task.difficultyWeight}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="mb-2 text-sm font-medium text-[#1A1A1A] line-clamp-2">
        {task.title}
      </p>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag.name}
              className="rounded-full bg-[#F0F2F5] px-2 py-0.5 text-[10px] text-[#6B7280]"
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
              <AvatarFallback className="bg-[#2E86AB] text-[8px] text-white">
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
                isOverdue ? "text-red-500" : "text-[#9CA3AF]"
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
            <span className="flex items-center gap-0.5 text-[10px] text-[#9CA3AF]">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
