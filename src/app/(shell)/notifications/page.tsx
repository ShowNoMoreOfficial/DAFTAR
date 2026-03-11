"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Clock,
  ClipboardList,
  ArrowRightLeft,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Package,
  Sparkles,
  Info,
  Settings,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationPreferences {
  id: string;
  userId: string;
  preferences: Record<string, { enabled: boolean; channels: string[] }>;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

const NOTIFICATION_TYPES = [
  "TASK_ASSIGNED",
  "TASK_STATUS_CHANGED",
  "TASK_COMMENT",
  "TASK_OVERDUE",
  "APPROVAL_PENDING",
  "APPROVAL_COMPLETED",
  "DELIVERABLE_READY",
  "GI_SUGGESTION",
  "SYSTEM",
] as const;

const TYPE_LABELS: Record<string, string> = {
  TASK_ASSIGNED: "Task Assigned",
  TASK_STATUS_CHANGED: "Status Changed",
  TASK_COMMENT: "Task Comment",
  TASK_OVERDUE: "Task Overdue",
  APPROVAL_PENDING: "Approval Pending",
  APPROVAL_COMPLETED: "Approval Completed",
  DELIVERABLE_READY: "Deliverable Ready",
  GI_SUGGESTION: "GI Suggestion",
  SYSTEM: "System",
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  TASK_ASSIGNED: "When a task is assigned to you",
  TASK_STATUS_CHANGED: "When a task you are involved in changes status",
  TASK_COMMENT: "When someone comments on your tasks",
  TASK_OVERDUE: "When your tasks are overdue",
  APPROVAL_PENDING: "When items need your approval",
  APPROVAL_COMPLETED: "When your submissions are approved",
  DELIVERABLE_READY: "When deliverables are ready for review",
  GI_SUGGESTION: "Contextual suggestions from the GI",
  SYSTEM: "Platform announcements and updates",
};

const TYPE_STYLES: Record<string, string> = {
  TASK_ASSIGNED: "bg-[rgba(59,130,246,0.15)] text-blue-600",
  TASK_STATUS_CHANGED: "bg-[rgba(234,179,8,0.15)] text-yellow-600",
  TASK_COMMENT: "bg-[rgba(168,85,247,0.15)] text-purple-600",
  TASK_OVERDUE: "bg-[rgba(239,68,68,0.15)] text-red-600",
  APPROVAL_PENDING: "bg-[rgba(249,115,22,0.15)] text-orange-600",
  APPROVAL_COMPLETED: "bg-[rgba(16,185,129,0.15)] text-emerald-600",
  DELIVERABLE_READY: "bg-[rgba(20,184,166,0.15)] text-teal-600",
  GI_SUGGESTION: "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
  SYSTEM: "bg-[var(--bg-elevated)] text-gray-600",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  TASK_ASSIGNED: <ClipboardList className="h-4 w-4" />,
  TASK_STATUS_CHANGED: <ArrowRightLeft className="h-4 w-4" />,
  TASK_COMMENT: <MessageSquare className="h-4 w-4" />,
  TASK_OVERDUE: <AlertTriangle className="h-4 w-4" />,
  APPROVAL_PENDING: <Clock className="h-4 w-4" />,
  APPROVAL_COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  DELIVERABLE_READY: <Package className="h-4 w-4" />,
  GI_SUGGESTION: <Sparkles className="h-4 w-4" />,
  SYSTEM: <Info className="h-4 w-4" />,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");
  const [filterType, setFilterType] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Preferences
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filterRead === "unread") params.set("isRead", "false");
      if (filterRead === "read") params.set("isRead", "true");
      if (filterType) params.set("type", filterType);

      const res = await fetch(`/api/notifications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // fail silently
    }
    setLoading(false);
  }, [page, filterRead, filterType]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [filterRead, filterType]);

  async function fetchPreferences() {
    setPrefsLoading(true);
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        setPrefs(data);
      }
    } catch {
      // fail silently
    }
    setPrefsLoading(false);
  }

  async function savePreferences() {
    if (!prefs) return;
    try {
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: prefs.preferences,
          quietHoursStart: prefs.quietHoursStart,
          quietHoursEnd: prefs.quietHoursEnd,
        }),
      });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch {
      // fail silently
    }
  }

  async function markSelectedAsRead() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setSelected(new Set());
    fetchNotifications();
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setSelected(new Set());
    fetchNotifications();
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/notifications/${id}`, { method: "DELETE" })
      )
    );
    setSelected(new Set());
    fetchNotifications();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === notifications.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notifications.map((n) => n.id)));
    }
  }

  function togglePrefType(type: string) {
    if (!prefs) return;
    const current = prefs.preferences[type] || { enabled: true, channels: ["in_app"] };
    setPrefs({
      ...prefs,
      preferences: {
        ...prefs.preferences,
        [type]: { ...current, enabled: !current.enabled },
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Notifications</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="text-xs"
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowPrefs(!showPrefs);
              if (!showPrefs && !prefs) fetchPreferences();
            }}
            className="text-xs"
          >
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Preferences panel */}
      {showPrefs && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Notification Preferences
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Choose which notifications you receive
              </p>
            </div>
            <button
              onClick={() => setShowPrefs(false)}
              className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {prefsLoading ? (
            <p className="text-xs text-[var(--text-muted)]">Loading preferences...</p>
          ) : prefs ? (
            <div className="space-y-6">
              {/* Notification type toggles */}
              <div className="space-y-3">
                {NOTIFICATION_TYPES.map((type) => {
                  const pref = prefs.preferences[type] || {
                    enabled: true,
                    channels: ["in_app"],
                  };
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full",
                            TYPE_STYLES[type]
                          )}
                        >
                          {TYPE_ICONS[type]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {TYPE_LABELS[type]}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {TYPE_DESCRIPTIONS[type]}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePrefType(type)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          pref.enabled ? "bg-[var(--accent-primary)]" : "bg-[#D1D5DB]"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--bg-surface)] shadow transition-transform ${
                            pref.enabled
                              ? "translate-x-[22px]"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Quiet hours */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                  Quiet Hours
                </h3>
                <p className="mb-3 text-xs text-[var(--text-muted)]">
                  Suppress notifications during these hours
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                      Start
                    </label>
                    <input
                      type="time"
                      value={prefs.quietHoursStart || ""}
                      onChange={(e) =>
                        setPrefs({
                          ...prefs,
                          quietHoursStart: e.target.value || null,
                        })
                      }
                      className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
                    />
                  </div>
                  <span className="mt-5 text-sm text-[var(--text-muted)]">to</span>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                      End
                    </label>
                    <input
                      type="time"
                      value={prefs.quietHoursEnd || ""}
                      onChange={(e) =>
                        setPrefs({
                          ...prefs,
                          quietHoursEnd: e.target.value || null,
                        })
                      }
                      className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={savePreferences}
                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90"
              >
                {prefsSaved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Saved
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Preferences
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* Filters and bulk actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Read filter tabs */}
        <div className="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
          {(
            [
              { key: "all", label: "All" },
              { key: "unread", label: "Unread" },
              { key: "read", label: "Read" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterRead(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filterRead === f.key
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
          >
            <option value="">All types</option>
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">
              {selected.size} selected
            </span>
            <Button
              variant="outline"
              size="xs"
              onClick={markSelectedAsRead}
              className="text-xs"
            >
              <Check className="mr-1 h-3 w-3" />
              Mark read
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onClick={deleteSelected}
              className="text-xs"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Notification list */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        {/* Select all header */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-2.5">
            <input
              type="checkbox"
              checked={
                notifications.length > 0 &&
                selected.size === notifications.length
              }
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 rounded border-[#D1D5DB] text-[var(--accent-primary)] focus:ring-[#2E86AB]"
            />
            <span className="text-[10px] text-[var(--text-muted)]">
              {total} notification{total !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-xs text-[var(--text-muted)]">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <p className="mt-3 text-sm text-[var(--text-muted)]">No notifications found</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {filterRead !== "all" || filterType
                ? "Try adjusting your filters"
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 border-b border-[#F0F2F5] px-4 py-3.5 transition-colors hover:bg-[var(--bg-surface)]",
                  !n.isRead && "bg-[var(--accent-primary)]/[0.03]"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(n.id)}
                  onChange={() => toggleSelect(n.id)}
                  className="mt-1 h-3.5 w-3.5 rounded border-[#D1D5DB] text-[var(--accent-primary)] focus:ring-[#2E86AB]"
                />

                {/* Unread dot */}
                <div className="flex w-2 shrink-0 items-start pt-2">
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
                  )}
                </div>

                {/* Type icon */}
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    TYPE_STYLES[n.type] || TYPE_STYLES.SYSTEM
                  )}
                >
                  {TYPE_ICONS[n.type] || TYPE_ICONS.SYSTEM}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={cn(
                          "text-sm",
                          n.isRead
                            ? "text-[var(--text-secondary)]"
                            : "font-medium text-[var(--text-primary)]"
                        )}
                      >
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {n.message}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        TYPE_STYLES[n.type] || TYPE_STYLES.SYSTEM
                      )}
                    >
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    {n.link && (
                      <a
                        href={n.link}
                        className="text-[10px] font-medium text-[var(--accent-primary)] hover:underline"
                      >
                        View details
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  {!n.isRead && (
                    <button
                      onClick={() => {
                        fetch(`/api/notifications/${n.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isRead: true }),
                        }).then(() => fetchNotifications());
                      }}
                      className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-primary)]"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      fetch(`/api/notifications/${n.id}`, {
                        method: "DELETE",
                      }).then(() => fetchNotifications());
                    }}
                    className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[rgba(239,68,68,0.1)] hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-3">
            <span className="text-xs text-[var(--text-muted)]">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
