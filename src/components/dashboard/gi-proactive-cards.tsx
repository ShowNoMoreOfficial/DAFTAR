"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FileSearch,
  Radio,
  Heart,
  Calendar,
  X,
} from "lucide-react";

interface GIInsight {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  value?: number;
  actionUrl: string;
  actionLabel: string;
}

const ICON_MAP: Record<string, { icon: React.ReactNode; iconBg: string; border: string }> = {
  overdue_tasks: {
    icon: <AlertTriangle className="h-5 w-5 text-[var(--status-error)]" />,
    iconBg: "bg-[rgba(239,68,68,0.1)]",
    border: "border-l-[var(--status-error)]",
  },
  pending_reviews: {
    icon: <FileSearch className="h-5 w-5 text-[var(--accent-secondary)]" />,
    iconBg: "bg-[rgba(99,102,241,0.1)]",
    border: "border-l-[var(--accent-secondary)]",
  },
  team_health: {
    icon: <Heart className="h-5 w-5 text-[var(--accent-primary)]" />,
    iconBg: "bg-[rgba(0,212,170,0.1)]",
    border: "border-l-[var(--accent-primary)]",
  },
  unprocessed_signals: {
    icon: <Radio className="h-5 w-5 text-[#6366f1]" />,
    iconBg: "bg-[rgba(99,102,241,0.1)]",
    border: "border-l-[#6366f1]",
  },
  content_calendar: {
    icon: <Calendar className="h-5 w-5 text-[var(--accent-tertiary)]" />,
    iconBg: "bg-[rgba(245,158,11,0.1)]",
    border: "border-l-[var(--accent-tertiary)]",
  },
};

const DISMISS_KEY = "gi-dismissed-cards";

function getDismissedToday(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (!stored) return new Set();
    const { date, types } = JSON.parse(stored);
    // Reset dismissals daily
    if (date !== new Date().toISOString().slice(0, 10)) return new Set();
    return new Set(types as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(types: Set<string>) {
  localStorage.setItem(
    DISMISS_KEY,
    JSON.stringify({ date: new Date().toISOString().slice(0, 10), types: [...types] })
  );
}

export function GIProactiveCards() {
  const [insights, setInsights] = useState<GIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState<Set<string>>(new Set());

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/gi/insights");
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch {
      // Silent fail — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 60s
  useEffect(() => {
    setDismissed(getDismissedToday());
    fetchInsights();
    const interval = setInterval(fetchInsights, 60_000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  // Staggered fade-in animation
  useEffect(() => {
    if (insights.length === 0) return;
    insights.forEach((insight, i) => {
      setTimeout(() => {
        setVisible((prev) => new Set([...prev, insight.type]));
      }, i * 120);
    });
  }, [insights]);

  const handleDismiss = (type: string) => {
    const next = new Set([...dismissed, type]);
    setDismissed(next);
    saveDismissed(next);
  };

  const visibleInsights = insights.filter((i) => !dismissed.has(i.type));

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="rounded-xl border border-[var(--border-subtle)] border-l-4 border-l-[var(--border-default)] bg-[var(--bg-surface)] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg skeleton-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded skeleton-shimmer" />
                <div className="h-6 w-12 rounded skeleton-shimmer" />
              </div>
            </div>
            <div className="mt-3 h-3 w-32 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (visibleInsights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visibleInsights.map((insight) => {
        const style = ICON_MAP[insight.type] || ICON_MAP.team_health;
        const isVisible = visible.has(insight.type);

        return (
          <div
            key={insight.type}
            className={`group relative rounded-xl border border-[var(--border-subtle)] border-l-4 ${style.border} bg-[var(--bg-surface)] p-5 transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
          >
            {/* Dismiss button */}
            <button
              onClick={() => handleDismiss(insight.type)}
              className="absolute right-2 top-2 rounded p-1 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] group-hover:opacity-100"
              title="Dismiss until tomorrow"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${style.iconBg}`}>{style.icon}</div>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  {insight.title}
                </p>
                {insight.value !== undefined && (
                  <p className="mt-0.5 text-2xl font-semibold text-[var(--text-primary)]">
                    {insight.value}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-2 text-xs text-[var(--text-muted)]">{insight.description}</p>

            <Link
              href={insight.actionUrl}
              className="mt-3 inline-block text-xs font-medium text-[var(--accent-primary)] transition-opacity hover:underline"
            >
              {insight.actionLabel} &rarr;
            </Link>
          </div>
        );
      })}
    </div>
  );
}
