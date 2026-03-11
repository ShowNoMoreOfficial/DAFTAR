"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Award,
  Loader2,
  X,
  Send,
  RefreshCw,
  Smile,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────

interface DeptSentiment {
  departmentId: string;
  departmentName: string;
  avgScore: number | null;
  totalEntries: number;
  trend: "up" | "down" | "stable";
  weeks: { week: number; avg: number; count: number }[];
}

interface RecognitionItem {
  id: string;
  from: { id: string; name: string; avatar: string | null };
  to: { id: string; name: string; avatar: string | null };
  category: string;
  message: string;
  isPublic: boolean;
  createdAt: string;
}

interface TopRecognized {
  user: { id: string; name: string; avatar: string | null };
  count: number;
}

interface DeptEngagement {
  departmentId: string;
  departmentName: string;
  avgOverallScore: number;
  avgTaskCompletion: number;
  avgCollaboration: number;
  avgActiveDays: number;
  userCount: number;
}

// ─── Constants ──────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  kudos: "bg-[rgba(234,179,8,0.15)] text-yellow-700",
  teamwork: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  innovation: "bg-[rgba(168,85,247,0.15)] text-purple-700",
  quality: "bg-[rgba(16,185,129,0.15)] text-emerald-700",
  leadership: "bg-[rgba(236,72,153,0.15)] text-pink-700",
};

const CATEGORIES = ["kudos", "teamwork", "innovation", "quality", "leadership"];

// ─── Component ──────────────────────────────────────────

export default function CulturePage() {
  const [activeTab, setActiveTab] = useState<"sentiment" | "recognition" | "engagement">("sentiment");

  return (
    <div className="h-full overflow-y-auto">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6">
        {(
          [
            { key: "sentiment" as const, label: "Sentiment", icon: Smile },
            { key: "recognition" as const, label: "Recognition", icon: Award },
            { key: "engagement" as const, label: "Engagement", icon: BarChart3 },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm transition-colors",
              activeTab === tab.key
                ? "border-[#2E86AB] font-medium text-[var(--accent-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "sentiment" && <SentimentTab />}
        {activeTab === "recognition" && <RecognitionTab />}
        {activeTab === "engagement" && <EngagementTab />}
      </div>
    </div>
  );
}

// ─── Sentiment Tab ──────────────────────────────────────

function SentimentTab() {
  const [data, setData] = useState<DeptSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulseOpen, setPulseOpen] = useState(false);
  const [score, setScore] = useState(3);
  const [notes, setNotes] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSentiment = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hoccr/culture/sentiment");
      if (res.ok) {
        const json = await res.json();
        setData(json.departments || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSentiment();
  }, [fetchSentiment]);

  const handleSubmitPulse = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hoccr/culture/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, notes: notes || null, isAnonymous: anonymous }),
      });
      if (res.ok) {
        setPulseOpen(false);
        setScore(3);
        setNotes("");
        setAnonymous(false);
        fetchSentiment();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Team Sentiment</h3>
          <p className="text-xs text-[var(--text-muted)]">Department-level mood and trends</p>
        </div>
        <Button size="sm" onClick={() => setPulseOpen(true)}>
          <Heart className="mr-1.5 h-3.5 w-3.5" />
          Submit Pulse
        </Button>
      </div>

      {/* Pulse dialog */}
      {pulseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-[var(--bg-surface)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">How are you feeling?</h3>
              <button onClick={() => setPulseOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm text-[var(--text-secondary)]">
                Score: <span className="font-semibold text-[var(--text-primary)]">{score}</span> / 5
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="w-full accent-[#2E86AB]"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>Very Low</span>
                <span>Low</span>
                <span>Neutral</span>
                <span>Good</span>
                <span>Great</span>
              </div>
            </div>
            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mb-3"
            />
            <label className="mb-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="accent-[#2E86AB]"
              />
              Submit anonymously
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPulseOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitPulse} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Department cards */}
      {data.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          No sentiment data yet. Submit a pulse to get started.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {data.map((dept) => (
            <div key={dept.departmentId} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">{dept.departmentName}</h4>
                {dept.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : dept.trend === "down" ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-[var(--text-muted)]" />
                )}
              </div>
              <div className="mb-2 flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-2xl font-bold",
                    dept.avgScore === null
                      ? "text-[var(--text-muted)]"
                      : dept.avgScore >= 4
                      ? "text-emerald-600"
                      : dept.avgScore >= 3
                      ? "text-yellow-600"
                      : "text-red-600"
                  )}
                >
                  {dept.avgScore !== null ? dept.avgScore : "--"}
                </span>
                <span className="text-xs text-[var(--text-muted)]">/ 5</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">{dept.totalEntries} entries (4 weeks)</p>

              {/* Mini trend bar */}
              <div className="mt-3 flex items-end gap-1">
                {dept.weeks.map((w, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-sm",
                      w.avg >= 4
                        ? "bg-emerald-400"
                        : w.avg >= 3
                        ? "bg-yellow-400"
                        : w.avg > 0
                        ? "bg-red-400"
                        : "bg-gray-200"
                    )}
                    style={{ height: `${Math.max(w.avg * 6, 4)}px` }}
                    title={`Week ${i + 1}: ${w.avg} avg (${w.count} entries)`}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-[var(--text-muted)]">
                <span>4w ago</span>
                <span>This week</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Recognition Tab ────────────────────────────────────

function RecognitionTab() {
  const [recognitions, setRecognitions] = useState<RecognitionItem[]>([]);
  const [topRecognized, setTopRecognized] = useState<TopRecognized[]>([]);
  const [loading, setLoading] = useState(true);
  const [giveOpen, setGiveOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  // Form
  const [toUserId, setToUserId] = useState("");
  const [category, setCategory] = useState("kudos");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecognitions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hoccr/culture/recognition");
      if (res.ok) {
        const json = await res.json();
        setRecognitions(json.recognitions || []);
        setTopRecognized(json.topRecognized || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecognitions();
    // Load users for the selector
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.users || [];
        setUsers(list.map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })));
      })
      .catch(() => {});
  }, [fetchRecognitions]);

  const handleGiveRecognition = async () => {
    if (!toUserId || !message) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hoccr/culture/recognition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, category, message, isPublic }),
      });
      if (res.ok) {
        setToUserId("");
        setCategory("kudos");
        setMessage("");
        setIsPublic(true);
        setGiveOpen(false);
        fetchRecognitions();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recognition Feed</h3>
          <p className="text-xs text-[var(--text-muted)]">Celebrate team achievements</p>
        </div>
        <Button size="sm" onClick={() => setGiveOpen(true)}>
          <Award className="mr-1.5 h-3.5 w-3.5" />
          Give Recognition
        </Button>
      </div>

      {/* Give recognition dialog */}
      {giveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Give Recognition</h3>
              <button onClick={() => setGiveOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
              >
                <option value="">Select team member</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
              <Textarea
                placeholder="What did they do that was awesome?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="accent-[#2E86AB]"
                />
                Visible to everyone
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setGiveOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGiveRecognition} disabled={submitting || !toUserId || !message}>
                  {submitting ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Feed */}
        <div className="col-span-2 space-y-3">
          {recognitions.length === 0 ? (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              No recognitions yet. Be the first to recognize a teammate!
            </div>
          ) : (
            recognitions.map((r) => (
              <div key={r.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[10px] font-medium text-white">
                    {r.from.name.charAt(0)}
                  </div>
                  <Send className="h-3 w-3 text-[var(--text-muted)]" />
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-[10px] font-medium text-white">
                    {r.to.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{r.from.name}</span>
                    <span className="mx-1.5 text-xs text-[var(--text-muted)]">recognized</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{r.to.name}</span>
                  </div>
                  <Badge className={cn("text-[10px]", CATEGORY_COLORS[r.category] || "")}>
                    {r.category}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{r.message}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <span>
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  {!r.isPublic && <Badge variant="secondary" className="text-[9px]">Private</Badge>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Top Recognized */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Top Recognized (This Month)</h4>
          {topRecognized.length === 0 ? (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
              No data yet
            </div>
          ) : (
            <div className="space-y-2">
              {topRecognized.map((t, i) => (
                <div
                  key={t.user.id}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3"
                >
                  <span className="text-sm font-bold text-[var(--accent-secondary)]">#{i + 1}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-[10px] font-medium text-white">
                    {t.user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{t.user.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{t.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Engagement Tab ─────────────────────────────────────

function EngagementTab() {
  const [departments, setDepartments] = useState<DeptEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("");

  const fetchEngagement = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hoccr/culture/engagement");
      if (res.ok) {
        const json = await res.json();
        setDepartments(json.departments || []);
        setPeriod(json.period || "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEngagement();
  }, [fetchEngagement]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/hoccr/culture/engagement", { method: "POST" });
      if (res.ok) {
        fetchEngagement();
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Engagement Metrics</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Period: {period || "current month"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Refresh Metrics
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          No engagement data available. Click "Refresh Metrics" to compute.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {departments.map((dept) => (
            <div key={dept.departmentId} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">{dept.departmentName}</h4>
                <span className="text-xs text-[var(--text-muted)]">{dept.userCount} members</span>
              </div>

              {/* Overall score */}
              <div className="mb-4 flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-3xl font-bold",
                    dept.avgOverallScore >= 70
                      ? "text-emerald-600"
                      : dept.avgOverallScore >= 40
                      ? "text-yellow-600"
                      : "text-red-600"
                  )}
                >
                  {dept.avgOverallScore}
                </span>
                <span className="text-xs text-[var(--text-muted)]">/ 100 overall</span>
              </div>

              {/* Metric bars */}
              <div className="space-y-2">
                <MetricBar label="Task Completion" value={dept.avgTaskCompletion} max={100} />
                <MetricBar label="Collaboration" value={dept.avgCollaboration} max={100} />
                <MetricBar label="Active Days" value={dept.avgActiveDays} max={22} suffix=" days" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricBar({
  label,
  value,
  max,
  suffix = "%",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-medium text-[var(--text-primary)]">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <div
          className={cn(
            "h-full rounded-full",
            pct >= 70 ? "bg-[rgba(16,185,129,0.1)]0" : pct >= 40 ? "bg-[rgba(234,179,8,0.1)]0" : "bg-[rgba(239,68,68,0.1)]0"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
