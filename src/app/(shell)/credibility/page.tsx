"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Target,
  Loader2,
} from "lucide-react";

interface ScoreData {
  reliability: number;
  quality: number;
  consistency: number;
  overall: number;
  tasksCompleted: number;
  tasksOnTime: number;
  tasksLate: number;
  onTimePct: number;
}

interface StatsData {
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;
}

interface Delivery {
  id: string;
  title: string;
  dueDate: string | null;
  completedAt: string;
  onTime: boolean;
  weight: number;
  priority: string;
}

function scoreColor(val: number): string {
  if (val >= 80) return "text-emerald-600";
  if (val >= 60) return "text-[var(--accent-primary)]";
  if (val >= 40) return "text-yellow-600";
  return "text-red-600";
}

function scoreBg(val: number): string {
  if (val >= 80) return "bg-[rgba(16,185,129,0.1)]0";
  if (val >= 60) return "bg-[var(--accent-primary)]";
  if (val >= 40) return "bg-[rgba(234,179,8,0.1)]0";
  return "bg-[rgba(239,68,68,0.1)]0";
}

function scoreLabel(val: number): string {
  if (val >= 80) return "Excellent";
  if (val >= 60) return "Good";
  if (val >= 40) return "Average";
  return "Needs Improvement";
}

export default function CredibilityPage() {
  const [score, setScore] = useState<ScoreData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/credibility")
      .then((r) => r.json())
      .then((d) => {
        setScore(d.score);
        setStats(d.stats);
        setStreak(d.streak);
        setDeliveries(d.recentDeliveries || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  if (!score || !stats || !streak) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
        No credibility data available yet. Complete tasks to build your score.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Credibility Score</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Your reliability and performance metrics based on task delivery
        </p>
      </div>

      {/* Overall Score Hero */}
      <div className="mb-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
        <div className="flex items-center gap-8">
          {/* Score ring */}
          <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#F0F2F5"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={score.overall >= 80 ? "#10B981" : score.overall >= 60 ? "#2E86AB" : score.overall >= 40 ? "#EAB308" : "#EF4444"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(score.overall / 100) * 327} 327`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={cn("text-3xl font-bold", scoreColor(score.overall))}>
                {score.overall}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">/ 100</span>
            </div>
          </div>

          {/* Score details */}
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck className={cn("h-5 w-5", scoreColor(score.overall))} />
              <span className={cn("text-sm font-semibold", scoreColor(score.overall))}>
                {scoreLabel(score.overall)}
              </span>
            </div>
            <p className="mb-4 text-xs text-[var(--text-muted)]">
              Based on {score.tasksCompleted} completed tasks with {score.onTimePct}% on-time delivery
            </p>

            {/* Sub-scores */}
            <div className="grid grid-cols-3 gap-4">
              <ScoreBar label="Reliability" value={score.reliability} icon={<Target className="h-3.5 w-3.5" />} />
              <ScoreBar label="Quality" value={score.quality} icon={<Star className="h-3.5 w-3.5" />} />
              <ScoreBar label="Consistency" value={score.consistency} icon={<TrendingUp className="h-3.5 w-3.5" />} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          label="Tasks Completed"
          value={String(score.tasksCompleted)}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-[var(--accent-primary)]" />}
          label="On-Time Delivery"
          value={`${score.onTimePct}%`}
          sub={`${score.tasksOnTime} of ${score.tasksCompleted}`}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Late Deliveries"
          value={String(score.tasksLate)}
          highlight={score.tasksLate > 0}
        />
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          label="Current Streak"
          value={`${streak.currentStreak}d`}
          sub={`Best: ${streak.longestStreak}d`}
        />
      </div>

      {/* XP & Level */}
      <div className="mb-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2E86AB] to-[#A23B72] text-white">
            <Zap className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Level {streak.level}</span>
              <Badge variant="secondary" className="text-[10px]">{streak.totalXp} XP</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {stats.doneTasks} tasks done &middot; {stats.inProgressTasks} in progress &middot; {stats.totalTasks} total assigned
            </p>
          </div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="border-b border-[var(--border-subtle)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Deliveries</h3>
        </div>
        {deliveries.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)]">
            No completed tasks yet
          </div>
        ) : (
          <div className="divide-y divide-[#F0F2F5]">
            {deliveries.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    d.onTime ? "bg-[rgba(16,185,129,0.15)] text-emerald-600" : "bg-[rgba(239,68,68,0.15)] text-red-600"
                  )}
                >
                  {d.onTime ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[var(--text-primary)]">{d.title}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Completed {new Date(d.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    {d.dueDate && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        &middot; Due {new Date(d.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[9px]",
                      d.priority === "URGENT"
                        ? "bg-[rgba(239,68,68,0.15)] text-red-700"
                        : d.priority === "HIGH"
                          ? "bg-[rgba(249,115,22,0.15)] text-orange-700"
                          : "bg-[var(--bg-elevated)] text-gray-600"
                    )}
                  >
                    {d.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px]">
                    w{d.weight}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-[9px]",
                      d.onTime ? "bg-[rgba(16,185,129,0.15)] text-emerald-700" : "bg-[rgba(239,68,68,0.15)] text-red-700"
                    )}
                  >
                    {d.onTime ? "On Time" : "Late"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <span className={scoreColor(value)}>{icon}</span>
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-[var(--bg-elevated)]">
          <div
            className={cn("h-2 rounded-full transition-all", scoreBg(value))}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className={cn("text-xs font-semibold", scoreColor(value))}>{value}</span>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4",
        highlight && "border-red-200 bg-[rgba(239,68,68,0.1)]"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold", highlight ? "text-red-600" : "text-[var(--text-primary)]")}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}
