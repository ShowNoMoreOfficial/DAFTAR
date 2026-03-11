"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Eye,
  Radio,
  ArrowRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityItem {
  id: string;
  type: "overdue" | "review" | "signals";
  title: string;
  subtitle: string;
  actionLabel: string;
  actionUrl: string;
  severity: "critical" | "warning" | "info";
}

const SEVERITY_STYLES = {
  critical: {
    icon: AlertTriangle,
    iconClass: "text-[var(--status-error)]",
    bg: "bg-[rgba(239,68,68,0.06)]",
    border: "border-l-[var(--status-error)]",
  },
  warning: {
    icon: Eye,
    iconClass: "text-[var(--accent-tertiary)]",
    bg: "bg-[rgba(245,158,11,0.06)]",
    border: "border-l-[var(--accent-tertiary)]",
  },
  info: {
    icon: Radio,
    iconClass: "text-[#6366f1]",
    bg: "bg-[rgba(99,102,241,0.06)]",
    border: "border-l-[#6366f1]",
  },
};

export function PriorityActions() {
  const [items, setItems] = useState<PriorityItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPriorities() {
      try {
        const [kpiRes, insightsRes] = await Promise.all([
          fetch("/api/kpi?days=30"),
          fetch("/api/gi/insights"),
        ]);

        const priorities: PriorityItem[] = [];

        if (kpiRes.ok) {
          const kpi = await kpiRes.json();
          if (kpi.overdueTasks > 0) {
            priorities.push({
              id: "overdue",
              type: "overdue",
              title: `${kpi.overdueTasks} task${kpi.overdueTasks !== 1 ? "s" : ""} overdue`,
              subtitle: "These need immediate attention",
              actionLabel: "View Tasks",
              actionUrl: "/pms?filter=overdue",
              severity: "critical",
            });
          }
        }

        if (insightsRes.ok) {
          const data = await insightsRes.json();
          const insights = data.insights || [];
          for (const insight of insights) {
            if (insight.type === "pending_reviews" && insight.value > 0) {
              priorities.push({
                id: "reviews",
                type: "review",
                title: `${insight.value} pending review${insight.value !== 1 ? "s" : ""}`,
                subtitle: "Content waiting for your approval",
                actionLabel: "Review Now",
                actionUrl: "/m/yantri/workspace",
                severity: "warning",
              });
            }
            if (insight.type === "unprocessed_signals" && insight.value > 0) {
              priorities.push({
                id: "signals",
                type: "signals",
                title: `${insight.value} new signal${insight.value !== 1 ? "s" : ""} waiting`,
                subtitle: "Topics ready for the content pipeline",
                actionLabel: "Open Signals",
                actionUrl: "/m/khabri/signals",
                severity: "info",
              });
            }
          }
        }

        setItems(priorities);
      } catch { /* silent */ }
      setLoading(false);
    }

    fetchPriorities();
  }, []);

  const visibleItems = items.filter((i) => !dismissed.has(i.id));

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((n) => (
          <div key={n} className="h-14 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] skeleton-shimmer" />
        ))}
      </div>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4">
        <CheckCircle2 className="h-5 w-5 text-[var(--status-success)]" />
        <p className="text-sm text-[var(--text-secondary)]">
          All clear — nothing needs your immediate attention.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visibleItems.map((item) => {
        const style = SEVERITY_STYLES[item.severity];
        const Icon = style.icon;

        return (
          <div
            key={item.id}
            className={cn(
              "group flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] border-l-[3px] px-4 py-3 transition-all",
              style.bg,
              style.border
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", style.iconClass)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
              <p className="text-xs text-[var(--text-muted)]">{item.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={item.actionUrl}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--text-inverse)]"
              >
                {item.actionLabel}
                <ArrowRight className="h-3 w-3" />
              </Link>
              <button
                onClick={() => setDismissed((prev) => new Set([...prev, item.id]))}
                className="rounded p-1 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--bg-elevated)] group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
