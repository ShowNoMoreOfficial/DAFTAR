"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface ActionItem {
  id: string;
  actionType: string;
  description: string;
  tier: number;
  status: string;
  reasoning: string;
  createdAt: string;
}

interface PredictionItem {
  id: string;
  type: string;
  description: string;
  confidence: number;
  severity: string;
  isActive: boolean;
}

interface ActionsResponse {
  actions: ActionItem[];
  stats: {
    total: number;
    PENDING?: number;
    EXECUTED?: number;
    APPROVED?: number;
  };
}

interface PredictionsResponse {
  predictions: PredictionItem[];
  stats: {
    total: number;
    avgConfidence: number;
    avgAccuracy: number | null;
  };
}

interface LearningResponse {
  learnings: unknown[];
  stats: {
    totalLearnings: number;
    avgConfidence: number;
    totalObservations: number;
  };
}

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Inform", color: "bg-[rgba(59,130,246,0.15)] text-blue-700" },
  2: { label: "Suggest", color: "bg-[rgba(245,158,11,0.15)] text-amber-700" },
  3: { label: "Act & Notify", color: "bg-[rgba(34,197,94,0.15)] text-green-700" },
  4: { label: "Act Silently", color: "bg-[rgba(168,85,247,0.15)] text-purple-700" },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-[rgba(245,158,11,0.15)] text-amber-700",
  APPROVED: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  EXECUTED: "bg-[rgba(34,197,94,0.15)] text-green-700",
  REJECTED: "bg-[rgba(239,68,68,0.15)] text-red-700",
  UNDONE: "bg-[var(--bg-elevated)] text-gray-600",
  FAILED: "bg-[rgba(239,68,68,0.15)] text-red-700",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-[rgba(239,68,68,0.15)] text-red-700",
  high: "bg-[rgba(249,115,22,0.15)] text-orange-700",
  medium: "bg-[rgba(245,158,11,0.15)] text-amber-700",
  low: "bg-[rgba(59,130,246,0.15)] text-blue-700",
};

export default function GIOverviewPage() {
  const [actionsData, setActionsData] = useState<ActionsResponse | null>(null);
  const [predictionsData, setPredictionsData] = useState<PredictionsResponse | null>(null);
  const [learningData, setLearningData] = useState<LearningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/gi/actions?limit=5").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/gi/predictions").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/gi/learning").then((r) => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([actions, predictions, learning]) => {
        if (actions) setActionsData(actions);
        if (predictions) setPredictionsData(predictions);
        if (learning) setLearningData(learning);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/gi/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActionsData((prev) =>
          prev
            ? {
                ...prev,
                actions: prev.actions.map((a) => (a.id === id ? { ...a, status: updated.status } : a)),
              }
            : prev
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]" />
      </div>
    );
  }

  const pendingActions = actionsData?.stats?.PENDING ?? 0;
  const activePredictions = predictionsData?.stats?.total ?? 0;
  const accuracyRate = predictionsData?.stats?.avgAccuracy ?? 0;
  const learningsCount = learningData?.stats?.totalLearnings ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">GI Overview</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            General Intelligence copilot status and activity.
          </p>
        </div>
        <Badge className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[#2E86AB]/20 px-3 py-1 text-sm font-medium">
          Adult v4
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Active Predictions</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{activePredictions}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Across all severity levels</p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Pending Actions</p>
          <p className="mt-2 text-2xl font-bold text-[var(--accent-secondary)]">{pendingActions}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Awaiting approval</p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Accuracy Rate</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{accuracyRate}%</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Prediction accuracy</p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Learnings</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{learningsCount}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{learningData?.stats?.totalObservations ?? 0} observations</p>
        </div>
      </div>

      {/* Recent Autonomous Actions */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm">
        <div className="border-b border-[var(--border-subtle)] p-4">
          <h2 className="text-sm font-medium text-[var(--text-primary)]">Recent Autonomous Actions</h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Latest GI actions requiring review or recently executed</p>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {actionsData?.actions && actionsData.actions.length > 0 ? (
            actionsData.actions.map((action) => {
              const tierInfo = TIER_LABELS[action.tier] || TIER_LABELS[1];
              const statusColor = STATUS_COLORS[action.status] || "bg-[var(--bg-elevated)] text-gray-600";
              return (
                <div key={action.id} className="flex items-center justify-between p-4 hover:bg-[var(--bg-surface)]">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{action.description}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)] truncate">{action.reasoning}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge className={tierInfo.color} variant="secondary">
                        Tier {action.tier} &middot; {tierInfo.label}
                      </Badge>
                      <Badge className={statusColor} variant="secondary">
                        {action.status}
                      </Badge>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(action.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {action.status === "PENDING" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(action.id, "approve")}
                        disabled={actionLoading === action.id}
                        className="rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(action.id, "reject")}
                        disabled={actionLoading === action.id}
                        className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[rgba(239,68,68,0.1)] hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="p-6 text-center text-sm text-[var(--text-muted)]">No recent actions.</p>
          )}
        </div>
      </div>

      {/* Active Predictions */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm">
        <div className="border-b border-[var(--border-subtle)] p-4">
          <h2 className="text-sm font-medium text-[var(--text-primary)]">Active Predictions</h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Current predictions with confidence and severity
          </p>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {predictionsData?.predictions && predictionsData.predictions.length > 0 ? (
            predictionsData.predictions.slice(0, 5).map((pred) => {
              const sevColor = SEVERITY_COLORS[pred.severity] || "bg-[var(--bg-elevated)] text-gray-600";
              return (
                <div key={pred.id} className="flex items-center justify-between p-4 hover:bg-[var(--bg-surface)]">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{pred.description}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge className="bg-[var(--bg-elevated)] text-gray-600" variant="secondary">
                        {pred.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                      <Badge className={sevColor} variant="secondary">
                        {pred.severity}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1">
                        <span>Confidence</span>
                        <span>{Math.round(pred.confidence * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--bg-elevated)]">
                        <div
                          className="h-1.5 rounded-full bg-[var(--accent-primary)]"
                          style={{ width: `${pred.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="p-6 text-center text-sm text-[var(--text-muted)]">No active predictions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
