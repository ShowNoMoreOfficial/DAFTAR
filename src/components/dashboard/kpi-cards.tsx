"use client";

import { useState, useEffect } from "react";
import type { Role } from "@prisma/client";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Palette,
  FileCheck,
  Flame,
  Trophy,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  avgCompletionHours: number;
  tasksByStatus: { status: string; count: number }[];
}

interface KPICardsProps {
  role: Role;
}

export function KPICards({ role }: KPICardsProps) {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [myStats, setMyStats] = useState<{
    assigned: number;
    completed: number;
    inProgress: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, tasksRes] = await Promise.all([
          fetch("/api/kpi?days=30"),
          fetch("/api/tasks?limit=200"),
        ]);

        if (kpiRes.ok) {
          setKpi(await kpiRes.json());
        }

        if (tasksRes.ok) {
          const tasksJson = await tasksRes.json();
          const tasks = tasksJson.data ?? tasksJson;
          if (Array.isArray(tasks)) {
            setMyStats({
              assigned: tasks.filter(
                (t: { status: string }) =>
                  !["DONE", "CANCELLED"].includes(t.status)
              ).length,
              completed: tasks.filter(
                (t: { status: string }) => t.status === "DONE"
              ).length,
              inProgress: tasks.filter(
                (t: { status: string }) => t.status === "IN_PROGRESS"
              ).length,
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
          >
            <div className="h-3 w-16 rounded skeleton-shimmer" />
            <div className="mt-3 h-7 w-12 rounded skeleton-shimmer" />
            <div className="mt-2 h-3 w-20 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  const cards = getCardsForRole(role, kpi, myStats);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="hover-glow rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              {card.title}
            </p>
            <div className={cn("rounded-lg p-1.5", card.iconBg)}>
              {card.icon}
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {card.value}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}

interface CardData {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
}

function getCardsForRole(
  role: Role,
  kpi: KPIData | null,
  myStats: { assigned: number; completed: number; inProgress: number } | null
): CardData[] {
  if (role === "ADMIN" || role === "HEAD_HR") {
    return [
      {
        title: "Total Tasks",
        value: kpi ? String(kpi.totalTasks) : "0",
        subtitle: "last 30 days",
        icon: <CheckSquare className="h-4 w-4 text-[var(--accent-primary)]" />,
        iconBg: "bg-[rgba(0,212,170,0.1)]",
      },
      {
        title: "Completion Rate",
        value: kpi ? `${kpi.completionRate}%` : "0%",
        subtitle: `${kpi?.completedTasks ?? 0} completed`,
        icon: <TrendingUp className="h-4 w-4 text-[var(--status-success)]" />,
        iconBg: "bg-[rgba(16,185,129,0.1)]",
      },
      {
        title: "Overdue",
        value: kpi ? String(kpi.overdueTasks) : "0",
        subtitle: "need attention",
        icon: <AlertTriangle className="h-4 w-4 text-[var(--status-error)]" />,
        iconBg: "bg-[rgba(239,68,68,0.1)]",
      },
      {
        title: "Avg Completion",
        value: kpi ? `${kpi.avgCompletionHours}h` : "--",
        subtitle: "average time",
        icon: <Clock className="h-4 w-4 text-[var(--accent-tertiary)]" />,
        iconBg: "bg-[rgba(245,158,11,0.1)]",
      },
    ];
  }

  if (role === "DEPT_HEAD") {
    return [
      {
        title: "Dept Tasks",
        value: kpi ? String(kpi.totalTasks) : "0",
        subtitle: "last 30 days",
        icon: <BarChart3 className="h-4 w-4 text-[var(--accent-primary)]" />,
        iconBg: "bg-[rgba(0,212,170,0.1)]",
      },
      {
        title: "Completion Rate",
        value: kpi ? `${kpi.completionRate}%` : "0%",
        subtitle: `${kpi?.completedTasks ?? 0} done`,
        icon: <TrendingUp className="h-4 w-4 text-[var(--status-success)]" />,
        iconBg: "bg-[rgba(16,185,129,0.1)]",
      },
      {
        title: "Overdue",
        value: kpi ? String(kpi.overdueTasks) : "0",
        subtitle: "need attention",
        icon: <AlertTriangle className="h-4 w-4 text-[var(--status-error)]" />,
        iconBg: "bg-[rgba(239,68,68,0.1)]",
      },
      {
        title: "In Progress",
        value: myStats ? String(myStats.inProgress) : "0",
        subtitle: "active now",
        icon: <Flame className="h-4 w-4 text-[var(--accent-tertiary)]" />,
        iconBg: "bg-[rgba(245,158,11,0.1)]",
      },
    ];
  }

  if (role === "MEMBER" || role === "CONTRACTOR") {
    return [
      {
        title: "My Tasks",
        value: myStats ? String(myStats.assigned) : "0",
        subtitle: "assigned to you",
        icon: <CheckSquare className="h-4 w-4 text-[var(--accent-primary)]" />,
        iconBg: "bg-[rgba(0,212,170,0.1)]",
      },
      {
        title: "Completed",
        value: myStats ? String(myStats.completed) : "0",
        subtitle: "tasks done",
        icon: <TrendingUp className="h-4 w-4 text-[var(--status-success)]" />,
        iconBg: "bg-[rgba(16,185,129,0.1)]",
      },
      {
        title: "In Progress",
        value: myStats ? String(myStats.inProgress) : "0",
        subtitle: "active now",
        icon: <Flame className="h-4 w-4 text-[var(--accent-tertiary)]" />,
        iconBg: "bg-[rgba(245,158,11,0.1)]",
      },
      {
        title: "Leaderboard",
        value: "--",
        subtitle: "your rank",
        icon: <Trophy className="h-4 w-4 text-[var(--accent-tertiary)]" />,
        iconBg: "bg-[rgba(245,158,11,0.1)]",
      },
    ];
  }

  if (role === "CLIENT") {
    return [
      {
        title: "Deliverables",
        value: myStats ? String(myStats.completed) : "0",
        subtitle: "completed items",
        icon: <FileCheck className="h-4 w-4 text-[var(--status-success)]" />,
        iconBg: "bg-[rgba(16,185,129,0.1)]",
      },
      {
        title: "Pending Review",
        value: myStats ? String(myStats.assigned) : "0",
        subtitle: "awaiting approval",
        icon: <Clock className="h-4 w-4 text-[var(--accent-tertiary)]" />,
        iconBg: "bg-[rgba(245,158,11,0.1)]",
      },
      {
        title: "Brands",
        value: "--",
        subtitle: "active brands",
        icon: <Palette className="h-4 w-4 text-[var(--accent-secondary)]" />,
        iconBg: "bg-[rgba(99,102,241,0.1)]",
      },
      {
        title: "Team",
        value: "--",
        subtitle: "working on your brands",
        icon: <Users className="h-4 w-4 text-[var(--accent-primary)]" />,
        iconBg: "bg-[rgba(0,212,170,0.1)]",
      },
    ];
  }

  // FINANCE and others
  return [
    {
      title: "Tasks",
      value: kpi ? String(kpi.totalTasks) : "0",
      subtitle: "last 30 days",
      icon: <CheckSquare className="h-4 w-4 text-[var(--accent-primary)]" />,
      iconBg: "bg-[rgba(0,212,170,0.1)]",
    },
    {
      title: "Completed",
      value: kpi ? String(kpi.completedTasks) : "0",
      subtitle: "tasks done",
      icon: <TrendingUp className="h-4 w-4 text-[var(--status-success)]" />,
      iconBg: "bg-[rgba(16,185,129,0.1)]",
    },
    {
      title: "Overdue",
      value: kpi ? String(kpi.overdueTasks) : "0",
      subtitle: "need attention",
      icon: <AlertTriangle className="h-4 w-4 text-[var(--status-error)]" />,
      iconBg: "bg-[rgba(239,68,68,0.1)]",
    },
    {
      title: "Avg Time",
      value: kpi ? `${kpi.avgCompletionHours}h` : "--",
      subtitle: "to complete",
      icon: <Clock className="h-4 w-4 text-[var(--accent-tertiary)]" />,
      iconBg: "bg-[rgba(245,158,11,0.1)]",
    },
  ];
}
