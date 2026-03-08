"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

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

  useEffect(() => {
    const nudge = getSlotNudge(name, entityId, entityType);
    if (nudge) setContent(nudge);
  }, [name, entityId, entityType]);

  if (!content) return null;

  const bgColors = {
    info: "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    suggestion: "bg-purple-50 border-purple-200 text-purple-700",
  };

  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 ${bgColors[content.type]}`}>
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
      <p className="text-xs">{content.message}</p>
    </div>
  );
}

function getSlotNudge(name: string, _entityId?: string, _entityType?: string): SlotContent | null {
  switch (name) {
    case "dashboard-insight":
      return {
        type: "suggestion",
        message: "GI Tip: Check the PMS board for task assignments. Use the leaderboard to track team progress.",
      };
    case "task-header":
      return {
        type: "info",
        message: "GI can help you track this task's progress and suggest next steps.",
      };
    case "workload-insight":
      return {
        type: "warning",
        message: "Review team workload distribution to prevent bottlenecks. Balance task assignments by difficulty weight.",
      };
    default:
      return null;
  }
}
