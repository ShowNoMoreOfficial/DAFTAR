"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bug,
  Lightbulb,
  ThumbsUp,
  MessageSquarePlus,
  RefreshCw,
  Download,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface Feedback {
  id: string;
  type: string;
  message: string;
  page: string;
  rating: number | null;
  status: string;
  adminNote: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string; email: string; role: string };
}

const TYPE_CONFIG: Record<string, { icon: typeof Bug; label: string; color: string }> = {
  bug: { icon: Bug, label: "Bug", color: "text-red-400" },
  suggestion: { icon: Lightbulb, label: "Idea", color: "text-yellow-400" },
  content_quality: { icon: ThumbsUp, label: "Content", color: "text-blue-400" },
  ux_issue: { icon: MessageSquarePlus, label: "UX", color: "text-purple-400" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  NEW: { label: "New", variant: "default" },
  ACKNOWLEDGED: { label: "Acknowledged", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "outline" },
  FIXED: { label: "Fixed", variant: "secondary" },
  WONTFIX: { label: "Won't Fix", variant: "destructive" },
};

export default function FeedbackDashboardPage() {
  const { data: session } = useSession();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) setFeedbacks(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status } : f))
    );
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">
        Admin access required
      </div>
    );
  }

  const filtered =
    filter === "all" ? feedbacks : feedbacks.filter((f) => f.type === filter);

  const counts = {
    all: feedbacks.length,
    bug: feedbacks.filter((f) => f.type === "bug").length,
    suggestion: feedbacks.filter((f) => f.type === "suggestion").length,
    content_quality: feedbacks.filter((f) => f.type === "content_quality").length,
    ux_issue: feedbacks.filter((f) => f.type === "ux_issue").length,
    new: feedbacks.filter((f) => f.status === "NEW").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Team Feedback
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {counts.new} new items
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFeedbacks}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/api/feedback/export", "_blank")}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(
          [
            { key: "all", label: "Total", count: counts.all },
            { key: "bug", label: "Bugs", count: counts.bug },
            { key: "suggestion", label: "Ideas", count: counts.suggestion },
            { key: "content_quality", label: "Content", count: counts.content_quality },
            { key: "ux_issue", label: "UX Issues", count: counts.ux_issue },
          ] as const
        ).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`p-3 rounded-lg border transition-colors text-left ${
              filter === key
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                : "border-[var(--border-default)] bg-[var(--bg-surface)]"
            }`}
          >
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {count}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {filtered.map((fb) => {
          const typeConf = TYPE_CONFIG[fb.type] || TYPE_CONFIG.bug;
          const TypeIcon = typeConf.icon;
          const statusConf = STATUS_CONFIG[fb.status] || STATUS_CONFIG.NEW;

          return (
            <div
              key={fb.id}
              className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <TypeIcon className={`w-5 h-5 mt-0.5 shrink-0 ${typeConf.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                      {fb.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
                      <span>{fb.user.name}</span>
                      <span>·</span>
                      <span>{fb.page}</span>
                      <span>·</span>
                      <span>
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                      {fb.rating && (
                        <>
                          <span>·</span>
                          <span>Rating: {fb.rating}/5</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                </div>
              </div>

              {/* Status actions */}
              {fb.status === "NEW" && (
                <div className="flex gap-2 mt-3 pl-8">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(fb.id, "ACKNOWLEDGED")}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Acknowledge
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(fb.id, "FIXED")}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Fixed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(fb.id, "WONTFIX")}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Won&apos;t Fix
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            No feedback yet
          </div>
        )}
      </div>
    </div>
  );
}
