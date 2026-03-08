"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
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

const TYPE_STYLES: Record<string, string> = {
  TASK_ASSIGNED: "bg-blue-100 text-blue-600",
  TASK_STATUS_CHANGED: "bg-yellow-100 text-yellow-600",
  TASK_COMMENT: "bg-purple-100 text-purple-600",
  TASK_OVERDUE: "bg-red-100 text-red-600",
  APPROVAL_PENDING: "bg-orange-100 text-orange-600",
  APPROVAL_COMPLETED: "bg-emerald-100 text-emerald-600",
  DELIVERABLE_READY: "bg-teal-100 text-teal-600",
  GI_SUGGESTION: "bg-[#2E86AB]/10 text-[#2E86AB]",
  SYSTEM: "bg-gray-100 text-gray-600",
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
  SYSTEM: <Info className="h-3.5 w-3.5" />,
};

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
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markAsRead(ids: string[]) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - ids.length));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) {
      markAsRead([n.id]);
    }
    if (n.link) {
      router.push(n.link);
      setOpen(false);
    }
  }

  const todayNotifications = notifications.filter((n) => isToday(n.createdAt));
  const earlierNotifications = notifications.filter((n) => !isToday(n.createdAt));

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-[#F0F2F5]"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#A23B72] text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[380px] rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-[#2E86AB] transition-colors hover:bg-[#2E86AB]/10"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F0F2F5]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto h-8 w-8 text-[#D1D5DB]" />
                <p className="mt-2 text-xs text-[#9CA3AF]">No notifications yet</p>
              </div>
            ) : (
              <>
                {todayNotifications.length > 0 && (
                  <div>
                    <div className="px-4 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
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
                    <div className="px-4 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
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

          <div className="border-t border-[#E5E7EB] px-4 py-2.5">
            <button
              onClick={() => {
                router.push("/notifications");
                setOpen(false);
              }}
              className="w-full text-center text-xs font-medium text-[#2E86AB] transition-colors hover:text-[#2E86AB]/80"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onClick,
  onMarkRead,
}: {
  notification: Notification;
  onClick: () => void;
  onMarkRead: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex cursor-pointer gap-3 border-b border-[#F0F2F5] px-4 py-3 transition-colors hover:bg-[#F8F9FA]",
        !n.isRead && "bg-[#2E86AB]/[0.03]"
      )}
    >
      {/* Unread dot */}
      <div className="flex w-2 shrink-0 items-start pt-2.5">
        {!n.isRead && (
          <span className="h-2 w-2 rounded-full bg-[#2E86AB]" />
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
        <p
          className={cn(
            "text-xs",
            n.isRead ? "text-[#6B7280]" : "font-medium text-[#1A1A1A]"
          )}
        >
          {n.title}
        </p>
        {n.message && (
          <p className="mt-0.5 text-[10px] leading-relaxed text-[#9CA3AF] line-clamp-2">
            {n.message}
          </p>
        )}
        <span className="mt-1 text-[10px] text-[#D1D5DB]">
          {timeAgo(n.createdAt)}
        </span>
      </div>

      {/* Mark read button */}
      {!n.isRead && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead();
          }}
          className="mt-0.5 shrink-0 rounded-md p-1 text-[#9CA3AF] transition-colors hover:bg-[#F0F2F5] hover:text-[#2E86AB]"
          title="Mark as read"
        >
          <Check className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
