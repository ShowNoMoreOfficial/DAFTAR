"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast, Toaster } from "sonner";

// ─── Types ──────────────────────────────────────────────

export interface LiveNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface SSEEvent {
  event: string;
  notificationId?: string;
  type?: string;
  taskType?: string;
  result?: string;
  userId?: string;
  timestamp?: string;
}

interface NotificationContextValue {
  unreadCount: number;
  notifications: LiveNotification[];
  markAsRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  notifications: [],
  markAsRead: async () => {},
  markAllRead: async () => {},
  refetch: async () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

// ─── Toast Styling by Type ──────────────────────────────

const TOAST_CONFIG: Record<string, { icon: string; description: string }> = {
  TASK_ASSIGNED: { icon: "📋", description: "New task assigned to you" },
  TASK_STATUS_CHANGED: { icon: "🔄", description: "Task status updated" },
  TASK_COMMENT: { icon: "💬", description: "New comment on task" },
  TASK_OVERDUE: { icon: "⚠️", description: "Task is overdue" },
  APPROVAL_PENDING: { icon: "⏳", description: "Approval needed" },
  APPROVAL_COMPLETED: { icon: "✅", description: "Approval completed" },
  DELIVERABLE_READY: { icon: "📦", description: "Deliverable ready" },
  GI_SUGGESTION: { icon: "✨", description: "GI has a suggestion" },
  GI_REVIEW: { icon: "🔍", description: "GI review complete" },
  SYSTEM: { icon: "ℹ️", description: "System notification" },
};

function showNotificationToast(notification: LiveNotification) {
  const config = TOAST_CONFIG[notification.type] || TOAST_CONFIG.SYSTEM;

  toast(notification.title, {
    description: notification.message || config.description,
    icon: config.icon,
    duration: 5000,
    action: notification.link
      ? {
          label: "View",
          onClick: () => {
            window.location.href = notification.link!;
          },
        }
      : undefined,
  });
}

function showGICompleteToast(taskType: string, result: string) {
  toast("AI Task Complete", {
    description: `${taskType}: ${result}`,
    icon: "✅",
    duration: 6000,
  });
}

// ─── Provider Component ─────────────────────────────────

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectAttempts = useRef(0);

  // ── Fetch initial notifications ───────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=30");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Silently fail — SSE will provide real-time updates
    }
  }, []);

  // ── Fetch a single notification by ID ─────────────────

  const fetchSingleNotification = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?limit=1`);
      if (!res.ok) return;
      // Re-fetch the full list to get the new notification in order
      const data = await res.json();
      const allNotifications: LiveNotification[] = data.notifications || [];
      const newNotif = allNotifications.find((n: LiveNotification) => n.id === id);

      if (newNotif) {
        setNotifications((prev) => {
          // Avoid duplicates
          if (prev.some((n) => n.id === id)) return prev;
          return [newNotif, ...prev].slice(0, 30);
        });
        setUnreadCount((prev) => prev + 1);
        showNotificationToast(newNotif);
      }
    } catch {
      // If we can't fetch the specific notification, just bump the count
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // ── SSE Connection ────────────────────────────────────

  const connectSSE = useCallback(() => {
    // Don't connect if we already have an active connection
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    // Clean up any existing connection
    eventSourceRef.current?.close();

    const es = new EventSource("/api/notifications/stream");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.event) {
          case "connected":
            // Connection established — reset reconnect counter
            reconnectAttempts.current = 0;
            break;

          case "notification":
            // A new notification was created for this user.
            // Fetch the full notification object from the API
            // so we have title, message, link, etc.
            if (data.notificationId) {
              fetchSingleNotification(data.notificationId);
            }
            break;

          case "gi_complete":
            // GI background task finished — show inline toast
            if (data.taskType && data.result) {
              showGICompleteToast(data.taskType, data.result);
            }
            break;
        }
      } catch {
        // Ignore malformed events (e.g. heartbeat comments)
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff reconnection: 1s, 2s, 4s, 8s... max 30s
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttempts.current),
        30_000
      );
      reconnectAttempts.current++;

      reconnectTimeoutRef.current = setTimeout(connectSSE, delay);
    };
  }, [fetchSingleNotification]);

  // ── Lifecycle ─────────────────────────────────────────

  useEffect(() => {
    // Initial data load
    fetchNotifications();

    // Open SSE stream
    connectSSE();

    // Reconnect when tab becomes visible again (handles sleep/background)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
        connectSSE();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      clearTimeout(reconnectTimeoutRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications, connectSSE]);

  // ── Actions ───────────────────────────────────────────

  const markAsRead = useCallback(async (ids: string[]) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        markAsRead,
        markAllRead,
        refetch: fetchNotifications,
      }}
    >
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
          },
        }}
        richColors
        closeButton
      />
    </NotificationContext.Provider>
  );
}
