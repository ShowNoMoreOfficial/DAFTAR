"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle,
  MessageSquare,
  ArrowRight,
  UserPlus,
  AlertCircle,
} from "lucide-react";

interface Activity {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  actor: { id: string; name: string; avatar: string | null };
  task: { id: string; title: string };
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  status_changed: <ArrowRight className="h-3.5 w-3.5 text-amber-500" />,
  created: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
  commented: <MessageSquare className="h-3.5 w-3.5 text-blue-500" />,
  assigned: <UserPlus className="h-3.5 w-3.5 text-purple-500" />,
  updated: <AlertCircle className="h-3.5 w-3.5 text-[#6B7280]" />,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function describeActivity(a: Activity): string {
  if (a.action === "status_changed") {
    return `moved "${a.task.title}" to ${(a.newValue ?? "unknown").replace("_", " ").toLowerCase()}`;
  }
  if (a.action === "created") {
    return `created "${a.task.title}"`;
  }
  if (a.action === "commented") {
    return `commented on "${a.task.title}"`;
  }
  if (a.action === "assigned") {
    return `was assigned to "${a.task.title}"`;
  }
  return `updated "${a.task.title}"`;
}

export function ActivityFeed() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity?limit=8")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-5 py-3">
        <h2 className="text-sm font-semibold text-[#1A1A1A]">
          Recent Activity
        </h2>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-[#F0F2F5]" />
                <div className="flex-1">
                  <div className="h-3 w-3/4 rounded bg-[#F0F2F5]" />
                  <div className="mt-1.5 h-2 w-16 rounded bg-[#F0F2F5]" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#9CA3AF]">
            No recent activity. Activity will appear as tasks are updated.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((a) => (
              <div
                key={a.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-0.5 transition-colors hover:bg-[#F8F9FA]"
                onClick={() => router.push(`/pms?taskId=${a.task.id}`)}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={a.actor.avatar || undefined} />
                  <AvatarFallback className="bg-[#2E86AB] text-[10px] text-white">
                    {a.actor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#6B7280]">
                    <span className="font-medium text-[#1A1A1A]">
                      {a.actor.name.split(" ")[0]}
                    </span>{" "}
                    {describeActivity(a)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#9CA3AF]">
                    {timeAgo(a.createdAt)}
                  </p>
                </div>
                <div className="mt-0.5 shrink-0">
                  {ACTION_ICONS[a.action] || ACTION_ICONS["updated"]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
