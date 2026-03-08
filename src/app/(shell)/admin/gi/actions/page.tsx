"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

interface ActionItem {
  id: string;
  actionType: string;
  description: string;
  tier: number;
  status: string;
  reasoning: string;
  createdAt: string;
  executedAt: string | null;
  result: Record<string, unknown> | null;
}

interface ActionsResponse {
  actions: ActionItem[];
  stats: Record<string, number>;
}

const STATUSES = ["ALL", "PENDING", "APPROVED", "EXECUTED", "REJECTED", "UNDONE", "FAILED"] as const;

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
  FAILED: "bg-red-200 text-red-800",
};

export default function GIActionsPage() {
  const [data, setData] = useState<ActionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchActions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    params.set("limit", "50");
    fetch(`/api/gi/actions?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  async function handleAction(id: string, action: "approve" | "reject" | "undo") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/gi/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchActions();
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Autonomous Actions</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Review, approve, reject, or undo GI autonomous actions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === s
                ? "bg-[#2E86AB] text-white"
                : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8F9FA]"
            }`}
          >
            {s === "ALL" ? "All" : s}
            {s !== "ALL" && data?.stats?.[s] !== undefined && (
              <span className="ml-1 opacity-75">({data.stats[s]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Actions List */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        {loading ? (
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : data?.actions && data.actions.length > 0 ? (
          <div className="divide-y divide-[#E5E7EB]">
            {data.actions.map((action) => {
              const tierInfo = TIER_LABELS[action.tier] || TIER_LABELS[1];
              const statusColor = STATUS_COLORS[action.status] || "bg-gray-100 text-gray-600";
              const isPending = action.status === "PENDING";
              const isExecuted = action.status === "EXECUTED";

              return (
                <div key={action.id} className="p-4 hover:bg-[#F8F9FA] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A]">{action.description}</p>
                      <p className="mt-1 text-xs text-[#9CA3AF] leading-relaxed">{action.reasoning}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className={tierInfo.color} variant="secondary">
                          Tier {action.tier} &middot; {tierInfo.label}
                        </Badge>
                        <Badge className={statusColor} variant="secondary">
                          {action.status}
                        </Badge>
                        <span className="text-xs text-[#9CA3AF]">
                          {action.actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <span className="text-xs text-[#D1D5DB]">&middot;</span>
                        <span className="text-xs text-[#9CA3AF]">
                          {new Date(action.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      {isPending && (
                        <>
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
                        </>
                      )}
                      {isExecuted && (
                        <button
                          onClick={() => handleAction(action.id, "undo")}
                          disabled={actionLoading === action.id}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">
            No actions found{filter !== "ALL" ? ` with status "${filter}"` : ""}.
          </p>
        )}
      </div>
    </div>
  );
}
