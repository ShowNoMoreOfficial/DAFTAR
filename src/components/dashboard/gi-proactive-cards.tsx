"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FileSearch,
  Radio,
  Flame,
} from "lucide-react";

interface CardDef {
  key: string;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  borderAccent: string;
  href: string;
  linkLabel: string;
}

interface CardState {
  value: number | null;
  description: string;
  loading: boolean;
  error: boolean;
}

const CARD_DEFS: CardDef[] = [
  {
    key: "overdue",
    title: "Overdue Tasks",
    icon: <AlertTriangle className="h-5 w-5 text-[var(--status-error)]" />,
    iconBg: "bg-[rgba(239,68,68,0.1)]",
    borderAccent: "border-l-[var(--status-error)]",
    href: "/pms/board",
    linkLabel: "View board",
  },
  {
    key: "deliverables",
    title: "Pending Review",
    icon: <FileSearch className="h-5 w-5 text-[var(--accent-secondary)]" />,
    iconBg: "bg-[rgba(99,102,241,0.1)]",
    borderAccent: "border-l-[var(--accent-secondary)]",
    href: "/yantri",
    linkLabel: "Review now",
  },
  {
    key: "signals",
    title: "Recent Signals",
    icon: <Radio className="h-5 w-5 text-[var(--accent-primary)]" />,
    iconBg: "bg-[rgba(0,212,170,0.1)]",
    borderAccent: "border-l-[var(--accent-primary)]",
    href: "/m/khabri/signals",
    linkLabel: "View signals",
  },
  {
    key: "streak",
    title: "Top Performer",
    icon: <Flame className="h-5 w-5 text-[var(--accent-tertiary)]" />,
    iconBg: "bg-[rgba(245,158,11,0.1)]",
    borderAccent: "border-l-[var(--accent-tertiary)]",
    href: "/gamification",
    linkLabel: "Leaderboard",
  },
];

export function GIProactiveCards() {
  const [cards, setCards] = useState<Record<string, CardState>>({
    overdue: { value: null, description: "", loading: true, error: false },
    deliverables: { value: null, description: "", loading: true, error: false },
    signals: { value: null, description: "", loading: true, error: false },
    streak: { value: null, description: "", loading: true, error: false },
  });

  useEffect(() => {
    fetch("/api/kpi?days=7")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { overdueTasks: number }) => {
        setCards((prev) => ({
          ...prev,
          overdue: {
            value: data.overdueTasks,
            description:
              data.overdueTasks === 0
                ? "All clear — no overdue tasks"
                : `${data.overdueTasks} task${data.overdueTasks === 1 ? "" : "s"} past due date`,
            loading: false,
            error: false,
          },
        }));
      })
      .catch(() => {
        setCards((prev) => ({
          ...prev,
          overdue: { value: null, description: "", loading: false, error: true },
        }));
      });

    fetch("/api/yantri/deliverables?status=REVIEW")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: unknown[]) => {
        const count = Array.isArray(data) ? data.length : 0;
        setCards((prev) => ({
          ...prev,
          deliverables: {
            value: count,
            description:
              count === 0
                ? "No deliverables awaiting review"
                : `${count} deliverable${count === 1 ? "" : "s"} awaiting review`,
            loading: false,
            error: false,
          },
        }));
      })
      .catch(() => {
        setCards((prev) => ({
          ...prev,
          deliverables: { value: null, description: "", loading: false, error: true },
        }));
      });

    fetch("/api/khabri/signals?pageSize=5")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { meta?: { total: number }; data?: unknown[] }) => {
        const total = data.meta?.total ?? (Array.isArray(data.data) ? data.data.length : 0);
        setCards((prev) => ({
          ...prev,
          signals: {
            value: total,
            description:
              total === 0
                ? "No signals detected yet"
                : `${total} signal${total === 1 ? "" : "s"} tracked`,
            loading: false,
            error: false,
          },
        }));
      })
      .catch(() => {
        setCards((prev) => ({
          ...prev,
          signals: { value: null, description: "", loading: false, error: true },
        }));
      });

    fetch("/api/gamification/leaderboard")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (
          data: {
            rank: number;
            user: { name: string | null };
            totalXp: number;
            currentStreak: number;
          }[]
        ) => {
          if (Array.isArray(data) && data.length > 0) {
            const top = data[0];
            setCards((prev) => ({
              ...prev,
              streak: {
                value: top.currentStreak,
                description: `${top.user.name ?? "Unknown"} — ${top.totalXp.toLocaleString()} XP`,
                loading: false,
                error: false,
              },
            }));
          } else {
            setCards((prev) => ({
              ...prev,
              streak: {
                value: 0,
                description: "No streak data yet",
                loading: false,
                error: false,
              },
            }));
          }
        }
      )
      .catch(() => {
        setCards((prev) => ({
          ...prev,
          streak: { value: null, description: "", loading: false, error: true },
        }));
      });
  }, []);

  const visibleDefs = CARD_DEFS.filter((d) => !cards[d.key].error);

  if (visibleDefs.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {visibleDefs.map((def) => {
        const state = cards[def.key];

        if (state.loading) {
          return (
            <div
              key={def.key}
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
          );
        }

        return (
          <Link
            key={def.key}
            href={def.href}
            className={`group hover-glow rounded-xl border border-[var(--border-subtle)] border-l-4 ${def.borderAccent} bg-[var(--bg-surface)] p-5`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${def.iconBg}`}>{def.icon}</div>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  {def.title}
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-[var(--text-primary)]">
                  {state.value ?? 0}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">{state.description}</p>
            <p className="mt-2 text-xs font-medium text-[var(--accent-primary)] opacity-0 transition-opacity group-hover:opacity-100">
              {def.linkLabel} &rarr;
            </p>
          </Link>
        );
      })}
    </div>
  );
}
