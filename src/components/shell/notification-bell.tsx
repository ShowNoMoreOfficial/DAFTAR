"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  ClipboardList,
  ArrowRightLeft,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Sparkles,
  Info,
  Search as SearchIcon,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/components/providers/notification-provider";
import type { LiveNotification } from "@/components/providers/notification-provider";

// ─── Type Styling (Abyss) ───────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  TASK_ASSIGNED: "bg-[rgba(59,130,246,0.15)] text-[var(--status-info)]",
  TASK_STATUS_CHANGED: "bg-[rgba(245,158,11,0.15)] text-[var(--accent-tertiary)]",
  TASK_COMMENT: "bg-[rgba(99,102,241,0.15)] text-[var(--accent-secondary)]",
  TASK_OVERDUE: "bg-[rgba(239,68,68,0.15)] text-[var(--status-error)]",
  APPROVAL_PENDING: "bg-[rgba(245,158,11,0.15)] text-[var(--accent-tertiary)]",
  APPROVAL_COMPLETED: "bg-[rgba(16,185,129,0.15)] text-[var(--status-success)]",
  DELIVERABLE_READY: "bg-[rgba(0,212,170,0.15)] text-[var(--accent-primary)]",
  GI_SUGGESTION: "bg-[rgba(0,212,170,0.15)] text-[var(--accent-primary)]",
  GI_REVIEW: "bg-[rgba(99,102,241,0.15)] text-[var(--accent-secondary)]",
  SYSTEM: "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  TASK_ASSIGNED: <ClipboardList className="h-3.5 w-3.5" />,
  TASK_STATUS_CHANGED: <ArrowRightLeft className="h-3.5 w-3.5" />,
  TASK_COMMENT: <MessageSquare className="h-3.5 w-3.5" />,
  TASK_OVERDUE: <AlertTriangle className="h-3.5 w-3.5" />,
  APPROVAL_PENDING: <Clock className="h-3.5 w-3.5" />,
  APPROVAL_COMPLETED: <CheckCircle2 className="h-3.5 w-3.5" />,
  DELIVERABLE_READY: <Package className="h-3.5 w-3.5" />,
  GI_SUGGESTION: <Sparkles className="h-3.5 w-3.5" />,
  GI_REVIEW: <Eye className="h-3.5 w-3.5" />,
  SYSTEM: <Info className="h-3.5 w-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  TASK_ASSIGNED: "Task",
  TASK_STATUS_CHANGED: "Status",
  TASK_COMMENT: "Comment",
  TASK_OVERDUE: "Overdue",
  APPROVAL_PENDING: "Approval",
  APPROVAL_COMPLETED: "Approved",
  DELIVERABLE_READY: "Deliverable",
  GI_SUGGESTION: "GI",
  GI_REVIEW: "GI Review",
  SYSTEM: "System",
};

// ─── Helpers ────────────────────────────────────────────

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

// ─── Filter Tabs ────────────────────────────────────────

type FilterTab = "all" | "unread" | "mentions" | "ai";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "mentions", label: "Tasks" },
  { key: "ai", label: "AI" },
];

function filterNotifications(
  items: LiveNotification[],
  tab: FilterTab
): LiveNotification[] {
  switch (tab) {
    case "unread":
      return items.filter((n) => !n.isRead);
    case "mentions":
      return items.filter((n) =>
        ["TASK_ASSIGNED", "TASK_COMMENT", "TASK_STATUS_CHANGED", "TASK_OVERDUE"].includes(n.type)
      );
    case "ai":
      return items.filter((n) =>
        ["GI_SUGGESTION", "GI_REVIEW", "APPROVAL_COMPLETED", "DELIVERABLE_READY"].includes(n.type)
      );
    default:
      return items;
  }
}

// ─── Main Component ─────────────────────────────────────

export function NotificationBell() {
  const router = useRouter();
  const { unreadCount, notifications, markAsRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleNotificationClick(n: LiveNotification) {
    if (!n.isRead) markAsRead([n.id]);
    if (n.link) {
      router.push(n.link);
      setOpen(false);
    }
  }

  const filtered = filterNotifications(notifications, activeTab);
  const todayNotifications = filtered.filter((n) => isToday(n.createdAt));
  const earlierNotifications = filtered.filter((n) => !isToday(n.createdAt));

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative rounded-lg p-2 transition-colors",
          open
            ? "bg-[rgba(0,212,170,0.1)] text-[var(--accent-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
        )}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--status-error)] px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[400px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-overlay)] shadow-[var(--shadow-lg)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--status-error)] px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-[var(--accent-primary)] transition-colors hover:bg-[rgba(0,212,170,0.1)]"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[var(--border-subtle)] px-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative px-3 py-2 text-xs font-medium transition-colors",
                  activeTab === tab.key
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-4/5 -translate-x-1/2 rounded-full bg-[var(--accent-primary)]" />
                )}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                {activeTab === "all" ? (
                  <>
                    <Bell className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      No notifications yet
                    </p>
                  </>
                ) : (
                  <>
                    <SearchIcon className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      No {activeTab === "unread" ? "unread" : activeTab === "mentions" ? "task" : "AI"} notifications
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {todayNotifications.length > 0 && (
                  <div>
                    <div className="sticky top-0 bg-[var(--bg-overlay)] backdrop-blur-sm px-4 py-2 z-10">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Today
                      </span>
                    </div>
                    {todayNotifications.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onClick={() => handleNotificationClick(n)}
                        onMarkRead={() => markAsRead([n.id])}
                      />
                    ))}
                  </div>
                )}

                {earlierNotifications.length > 0 && (
                  <div>
                    <div className="sticky top-0 bg-[var(--bg-overlay)] backdrop-blur-sm px-4 py-2 z-10">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Earlier
                      </span>
                    </div>
                    {earlierNotifications.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onClick={() => handleNotificationClick(n)}
                        onMarkRead={() => markAsRead([n.id])}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border-subtle)] px-4 py-2.5">
            <button
              onClick={() => {
                router.push("/notifications");
                setOpen(false);
              }}
              className="w-full text-center text-xs font-medium text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-primary)]/80"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notification Item ──────────────────────────────────

function NotificationItem({
  notification: n,
  onClick,
  onMarkRead,
}: {
  notification: LiveNotification;
  onClick: () => void;
  onMarkRead: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex cursor-pointer gap-3 border-b border-[var(--border-subtle)] px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)] group",
        !n.isRead && "bg-[rgba(0,212,170,0.03)]"
      )}
    >
      {/* Unread dot */}
      <div className="flex w-2 shrink-0 items-start pt-2.5">
        {!n.isRead && (
          <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
        )}
      </div>

      {/* Type icon */}
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
          TYPE_STYLES[n.type] || TYPE_STYLES.SYSTEM
        )}
      >
        {TYPE_ICONS[n.type] || TYPE_ICONS.SYSTEM}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-xs leading-snug",
              n.isRead ? "text-[var(--text-secondary)]" : "font-medium text-[var(--text-primary)]"
            )}
          >
            {n.title}
          </p>
          <span className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium",
            TYPE_STYLES[n.type] || TYPE_STYLES.SYSTEM
          )}>
            {TYPE_LABELS[n.type] || "System"}
          </span>
        </div>
        {n.message && (
          <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--text-muted)] line-clamp-2">
            {n.message}
          </p>
        )}
        <span className="mt-1 inline-block text-[10px] text-[var(--text-muted)]">
          {timeAgo(n.createdAt)}
        </span>
      </div>

      {/* Mark read button — shows on hover */}
      {!n.isRead && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead();
          }}
          className="mt-0.5 shrink-0 rounded-md p-1 text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-primary)]"
          title="Mark as read"
        >
          <Check className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
