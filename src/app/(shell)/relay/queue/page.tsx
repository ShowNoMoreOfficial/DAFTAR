"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Clock,
  Inbox,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/ui/markdown-content";

// ─── Types ───

interface QueueItem {
  id: string;
  title: string;
  content: string;
  platform: string;
  brand: { id: string; name: string } | null;
  assetCount: number;
  approvedAt: string;
}

// ─── Platform config ───

const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  YOUTUBE: { label: "YouTube", color: "#FF0000", icon: "YT" },
  X_THREAD: { label: "X Thread", color: "#000000", icon: "X" },
  X_SINGLE: { label: "X Post", color: "#000000", icon: "X" },
  LINKEDIN: { label: "LinkedIn", color: "#0A66C2", icon: "LI" },
  META_REEL: { label: "Reel", color: "#E4405F", icon: "IG" },
  META_CAROUSEL: { label: "Carousel", color: "#E4405F", icon: "IG" },
  META_POST: { label: "IG Post", color: "#E4405F", icon: "IG" },
  BLOG: { label: "Blog", color: "#6B7280", icon: "BG" },
};

// ─── Component ───

export default function PublishQueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/relay/queue");
      if (res.ok) {
        const data = await res.json();
        setQueue(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Clear toast after 4s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Bridge + publish immediately
  const handlePublishNow = async (deliverableId: string) => {
    setActionId(deliverableId);
    try {
      // Step 1: Bridge deliverable → ContentPost
      const bridgeRes = await fetch("/api/relay/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverableId }),
      });
      const bridgeData = await bridgeRes.json();
      if (!bridgeRes.ok) throw new Error(bridgeData.error || "Bridge failed");

      // Step 2: Publish the ContentPost
      const publishRes = await fetch(`/api/relay/posts/${bridgeData.postId}/publish`, {
        method: "POST",
      });
      const publishData = await publishRes.json();
      if (!publishRes.ok) throw new Error(publishData.error || "Publish failed");

      setToast({ message: "Published successfully!", type: "success" });
      // Remove from queue
      setQueue((prev) => prev.filter((q) => q.id !== deliverableId));
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Publish failed", type: "error" });
    } finally {
      setActionId(null);
    }
  };

  // Bridge + schedule
  const handleSchedule = async (deliverableId: string) => {
    if (!scheduleDate || !scheduleTime) {
      setToast({ message: "Pick a date and time", type: "error" });
      return;
    }

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

    setActionId(deliverableId);
    try {
      // Bridge with scheduledAt — creates ContentPost as SCHEDULED
      const bridgeRes = await fetch("/api/relay/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverableId, scheduledAt }),
      });
      const bridgeData = await bridgeRes.json();
      if (!bridgeRes.ok) throw new Error(bridgeData.error || "Bridge failed");

      setToast({ message: `Scheduled for ${scheduleDate} ${scheduleTime}`, type: "success" });
      setScheduleId(null);
      setScheduleDate("");
      setScheduleTime("12:00");
      setQueue((prev) => prev.filter((q) => q.id !== deliverableId));
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Schedule failed", type: "error" });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-md animate-in fade-in slide-in-from-top-2",
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          )}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Publish Queue</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Approved content ready for publishing. Publish now or schedule for later.
        </p>
      </div>

      {/* Queue list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
          <Inbox className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
          <h3 className="mt-4 text-sm font-medium text-[var(--text-primary)]">
            Queue is empty
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Approve content in Content Studio to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => {
            const platformCfg = PLATFORM_CONFIG[item.platform] || {
              label: item.platform,
              color: "#6B7280",
              icon: "?",
            };
            const isActioning = actionId === item.id;
            const isScheduling = scheduleId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-all hover:border-[#2E86AB]/30"
              >
                <div className="flex items-start gap-4">
                  {/* Platform badge */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: platformCfg.color }}
                  >
                    {platformCfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
                      {item.title}
                    </h3>
                    {item.content && (
                      <div className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2 [&_p]:mb-0 [&_p]:text-xs [&_p]:text-[var(--text-secondary)]">
                        <MarkdownContent content={item.content} />
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {platformCfg.label}
                      </Badge>
                      {item.brand && (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.brand.name}
                        </Badge>
                      )}
                      {item.assetCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                          <ImageIcon className="h-3 w-3" />
                          {item.assetCount} assets
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)]">
                        Approved{" "}
                        {new Date(item.approvedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isActioning}
                      onClick={() => handlePublishNow(item.id)}
                    >
                      {isActioning && !isScheduling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Publish Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5"
                      disabled={isActioning}
                      onClick={() =>
                        setScheduleId(isScheduling ? null : item.id)
                      }
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Schedule
                    </Button>
                  </div>
                </div>

                {/* Schedule picker (expanded) */}
                {isScheduling && (
                  <div className="mt-4 flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[#FAFAFA] p-3">
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="h-8 w-40 text-xs"
                    />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="h-8 w-28 text-xs"
                    />
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isActioning || !scheduleDate}
                      onClick={() => handleSchedule(item.id)}
                    >
                      {isActioning ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Confirm
                    </Button>
                    <button
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      onClick={() => {
                        setScheduleId(null);
                        setScheduleDate("");
                        setScheduleTime("12:00");
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
