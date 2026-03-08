"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Clock, User, Flag, Calendar, MessageSquare, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  difficultyWeight: number;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  assignee: { id: string; name: string; avatar: string | null; email: string } | null;
  creator: { id: string; name: string; avatar: string | null };
  department: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  tags: { name: string }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string; avatar: string | null };
  }[];
  activities: {
    id: string;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    actor: { id: string; name: string };
  }[];
}

interface TaskDetailPanelProps {
  taskId: string | null;
  onClose: () => void;
  onStatusChange?: () => void;
}

const STATUS_FLOW = ["CREATED", "ASSIGNED", "IN_PROGRESS", "REVIEW", "APPROVED", "DONE"];

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  REVIEW: "bg-purple-100 text-purple-700",
  APPROVED: "bg-green-100 text-green-700",
  DONE: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function TaskDetailPanel({ taskId, onClose, onStatusChange }: TaskDetailPanelProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"comments" | "activity">("comments");

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) setTask(await res.json());
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleStatusChange = async (newStatus: string) => {
    if (!taskId) return;
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchTask();
      onStatusChange?.();
    }
  };

  const handleComment = async () => {
    if (!taskId || !comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });
      if (res.ok) {
        setComment("");
        fetchTask();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!taskId) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-[420px] flex-col border-l border-[#E5E7EB] bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Task Detail</h3>
        <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]">
          <X className="h-5 w-5" />
        </button>
      </div>

      {loading || !task ? (
        <div className="flex flex-1 items-center justify-center text-sm text-[#9CA3AF]">
          Loading...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Title + Status */}
          <div className="border-b border-[#E5E7EB] p-4">
            <h2 className="mb-2 text-base font-semibold text-[#1A1A1A]">{task.title}</h2>
            {task.description && (
              <p className="mb-3 text-sm text-[#6B7280]">{task.description}</p>
            )}

            {/* Status progression */}
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FLOW.map((s) => {
                const isCurrent = task.status === s;
                const currentIdx = STATUS_FLOW.indexOf(task.status);
                const thisIdx = STATUS_FLOW.indexOf(s);
                const isPast = thisIdx < currentIdx;
                const isNext = thisIdx === currentIdx + 1;

                return (
                  <button
                    key={s}
                    onClick={() => isNext ? handleStatusChange(s) : undefined}
                    disabled={!isNext}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                      isCurrent && STATUS_COLORS[s],
                      isPast && "bg-[#F0F2F5] text-[#9CA3AF] line-through",
                      isNext && "cursor-pointer border border-dashed border-[#2E86AB] text-[#2E86AB] hover:bg-[#2E86AB]/10",
                      !isCurrent && !isPast && !isNext && "bg-[#F8F9FA] text-[#D1D5DB]"
                    )}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meta fields */}
          <div className="border-b border-[#E5E7EB] p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-[#9CA3AF]" />
              <span className="text-[#6B7280]">Assignee:</span>
              {task.assignee ? (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={task.assignee.avatar || undefined} />
                    <AvatarFallback className="bg-[#2E86AB] text-[8px] text-white">
                      {task.assignee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-[#1A1A1A]">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-[#9CA3AF]">Unassigned</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Flag className="h-4 w-4 text-[#9CA3AF]" />
              <span className="text-[#6B7280]">Priority:</span>
              <Badge className={cn("text-[10px]", STATUS_COLORS[task.priority] || "bg-gray-100 text-gray-700")}>
                {task.priority}
              </Badge>
            </div>

            {task.dueDate && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-[#9CA3AF]" />
                <span className="text-[#6B7280]">Due:</span>
                <span className={cn(
                  "font-medium",
                  new Date(task.dueDate) < new Date() && task.status !== "DONE"
                    ? "text-red-500"
                    : "text-[#1A1A1A]"
                )}>
                  {new Date(task.dueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {task.department && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-[#9CA3AF]" />
                <span className="text-[#6B7280]">Department:</span>
                <span className="font-medium text-[#1A1A1A]">{task.department.name}</span>
              </div>
            )}

            {task.brand && (
              <div className="flex items-center gap-3 text-sm">
                <span className="ml-7 text-[#6B7280]">Brand:</span>
                <span className="font-medium text-[#1A1A1A]">{task.brand.name}</span>
              </div>
            )}

            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {task.tags.map((t) => (
                  <span key={t.name} className="rounded-full bg-[#F0F2F5] px-2 py-0.5 text-[10px] text-[#6B7280]">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tabs: Comments / Activity */}
          <div className="border-b border-[#E5E7EB]">
            <div className="flex">
              <button
                onClick={() => setTab("comments")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors",
                  tab === "comments"
                    ? "border-b-2 border-[#2E86AB] font-medium text-[#2E86AB]"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Comments ({task.comments.length})
              </button>
              <button
                onClick={() => setTab("activity")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors",
                  tab === "activity"
                    ? "border-b-2 border-[#2E86AB] font-medium text-[#2E86AB]"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                )}
              >
                <Activity className="h-3.5 w-3.5" />
                Activity
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="p-4">
            {tab === "comments" ? (
              <div className="space-y-3">
                {/* Add comment */}
                <div className="flex gap-2">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <Button size="sm" onClick={handleComment} disabled={submitting || !comment.trim()}>
                  {submitting ? "Posting..." : "Post"}
                </Button>

                {/* Comment list */}
                <div className="space-y-3 pt-2">
                  {task.comments.map((c) => (
                    <div key={c.id} className="rounded-lg bg-[#F8F9FA] p-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={c.author.avatar || undefined} />
                          <AvatarFallback className="bg-[#2E86AB] text-[8px] text-white">
                            {c.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-[#1A1A1A]">{c.author.name}</span>
                        <span className="text-[10px] text-[#9CA3AF]">
                          {new Date(c.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B7280]">{c.content}</p>
                    </div>
                  ))}
                  {task.comments.length === 0 && (
                    <p className="text-center text-xs text-[#9CA3AF]">No comments yet</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {task.activities.map((a) => (
                  <div key={a.id} className="flex gap-2 text-xs">
                    <span className="font-medium text-[#1A1A1A]">{a.actor.name}</span>
                    <span className="text-[#6B7280]">
                      {a.action === "status_changed"
                        ? `changed status from ${a.oldValue} to ${a.newValue}`
                        : a.action === "commented"
                          ? "added a comment"
                          : a.action === "created"
                            ? "created this task"
                            : `updated ${a.field}`}
                    </span>
                    <span className="ml-auto text-[#9CA3AF]">
                      {new Date(a.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                ))}
                {task.activities.length === 0 && (
                  <p className="text-center text-xs text-[#9CA3AF]">No activity yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
