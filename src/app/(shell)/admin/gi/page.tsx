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
  1: { label: "Inform", color: "bg-blue-100 text-blue-700" },
  2: { label: "Suggest", color: "bg-amber-100 text-amber-700" },
  3: { label: "Act & Notify", color: "bg-green-100 text-green-700" },
  4: { label: "Act Silently", color: "bg-purple-100 text-purple-700" },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  EXECUTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  UNDONE: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-100 text-red-700",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-blue-100 text-blue-700",
};

export default function GIOverviewPage() {
  const [actionsData, setActionsData] = useState<ActionsResponse | null>(null);
  const [predictionsData, setPredictionsData] = useState<PredictionsResponse | null>(null);
  const [learningData, setLearningData] = useState<LearningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/gi/actions?limit=5").then((r) => r.json()),
      fetch("/api/gi/predictions").then((r) => r.json()),
      fetch("/api/gi/learning").then((r) => r.json()),
    ])
      .then(([actions, predictions, learning]) => {
        setActionsData(actions);
        setPredictionsData(predictions);
        setLearningData(learning);
      })
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
            <div key={i} className="h-28 animate-pulse rounded-xl border border-[#E5E7EB] bg-white" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-[#E5E7EB] bg-white" />
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
          <h1 className="text-xl font-semibold text-[#1A1A1A]">GI Overview</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            General Intelligence copilot status and activity.
          </p>
        </div>
        <Badge className="bg-[#2E86AB]/10 text-[#2E86AB] border border-[#2E86AB]/20 px-3 py-1 text-sm font-medium">
          Adult v4
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Active Predictions</p>
          <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{activePredictions}</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">Across all severity levels</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Pending Actions</p>
          <p className="mt-2 text-2xl font-bold text-[#A23B72]">{pendingActions}</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">Awaiting approval</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Accuracy Rate</p>
          <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{accuracyRate}%</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">Prediction accuracy</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Learnings</p>
          <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{learningsCount}</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">{learningData?.stats?.totalObservations ?? 0} observations</p>
        </div>
      </div>

      {/* Recent Autonomous Actions */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-sm font-medium text-[#1A1A1A]">Recent Autonomous Actions</h2>
          <p className="mt-0.5 text-xs text-[#6B7280]">Latest GI actions requiring review or recently executed</p>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {actionsData?.actions && actionsData.actions.length > 0 ? (
            actionsData.actions.map((action) => {
              const tierInfo = TIER_LABELS[action.tier] || TIER_LABELS[1];
              const statusColor = STATUS_COLORS[action.status] || "bg-gray-100 text-gray-600";
              return (
                <div key={action.id} className="flex items-center justify-between p-4 hover:bg-[#F8F9FA]">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">{action.description}</p>
                    <p className="mt-0.5 text-xs text-[#9CA3AF] truncate">{action.reasoning}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge className={tierInfo.color} variant="secondary">
                        Tier {action.tier} &middot; {tierInfo.label}
                      </Badge>
                      <Badge className={statusColor} variant="secondary">
                        {action.status}
                      </Badge>
                      <span className="text-xs text-[#9CA3AF]">
                        {new Date(action.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {action.status === "PENDING" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(action.id, "approve")}
                        disabled={actionLoading === action.id}
                        className="rounded-lg bg-[#2E86AB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2E86AB]/90 disabled:opacity-50 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(action.id, "reject")}
                        disabled={actionLoading === action.id}
                        className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="p-6 text-center text-sm text-[#9CA3AF]">No recent actions.</p>
          )}
        </div>
      </div>

      {/* Active Predictions */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-sm font-medium text-[#1A1A1A]">Active Predictions</h2>
          <p className="mt-0.5 text-xs text-[#6B7280]">
            Current predictions with confidence and severity
          </p>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {predictionsData?.predictions && predictionsData.predictions.length > 0 ? (
            predictionsData.predictions.slice(0, 5).map((pred) => {
              const sevColor = SEVERITY_COLORS[pred.severity] || "bg-gray-100 text-gray-600";
              return (
                <div key={pred.id} className="flex items-center justify-between p-4 hover:bg-[#F8F9FA]">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">{pred.description}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-600" variant="secondary">
                        {pred.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                      <Badge className={sevColor} variant="secondary">
                        {pred.severity}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                        <span>Confidence</span>
                        <span>{Math.round(pred.confidence * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-[#2E86AB]"
                          style={{ width: `${pred.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="p-6 text-center text-sm text-[#9CA3AF]">No active predictions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
