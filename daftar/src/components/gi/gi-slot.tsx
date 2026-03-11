"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";

interface GISlotProps {
  name: string;
  entityId?: string;
  entityType?: string;
}

interface SlotContent {
  message: string;
  type: "info" | "warning" | "suggestion";
}

export function GISlot({ name, entityId, entityType }: GISlotProps) {
  const [content, setContent] = useState<SlotContent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);

    // Try fetching dynamic context first
    if (name === "dashboard-insight") {
      fetchDashboardInsight().then((insight) => {
        if (insight) setContent(insight);
        else setContent(getStaticNudge(name));
      });
    } else {
      setContent(getStaticNudge(name));
    }
  }, [name, entityId, entityType]);

  if (!content || dismissed) return null;

  const bgColors = {
    info: "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    suggestion: "bg-purple-50 border-purple-200 text-purple-700",
  };

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-3 ${bgColors[content.type]}`}
    >
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
      <p className="flex-1 text-xs">{content.message}</p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 opacity-40 hover:opacity-70"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

async function fetchDashboardInsight(): Promise<SlotContent | null> {
  try {
    const res = await fetch("/api/kpi?days=7");
    if (!res.ok) return null;
    const data = await res.json();

    if (data.overdueTasks > 0) {
      return {
        type: "warning",
        message: `You have ${data.overdueTasks} overdue task${data.overdueTasks !== 1 ? "s" : ""}. Prioritize these to stay on track.`,
      };
    }

    if (data.completionRate >= 80) {
      return {
        type: "suggestion",
        message: `Great pace! ${data.completionRate}% completion rate this week. ${data.completedTasks} tasks done.`,
      };
    }

    if (data.totalTasks > 0) {
      return {
        type: "info",
        message: `This week: ${data.completedTasks}/${data.totalTasks} tasks completed (${data.completionRate}%). ${data.totalTasks - data.completedTasks} remaining.`,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function getStaticNudge(name: string): SlotContent | null {
  switch (name) {
    case "dashboard-insight":
      return {
        type: "suggestion",
        message:
          "GI Tip: Check the PMS board for task assignments. Use the leaderboard to track team progress.",
      };
    case "task-header":
      return {
        type: "info",
        message:
          "GI can help you track this task's progress and suggest next steps.",
      };
    case "workload-insight":
      return {
        type: "warning",
        message:
          "Review team workload distribution to prevent bottlenecks. Balance task assignments by difficulty weight.",
      };
    case "pms-board":
      return {
        type: "suggestion",
        message:
          "Drag tasks between columns to update status. Tasks weighted by difficulty contribute more to your credibility score.",
      };
    case "hoccr-hiring":
      return {
        type: "info",
        message:
          "Track candidates through stages. GI will surface hiring insights as the pipeline grows.",
      };
    default:
      return null;
  }
}
