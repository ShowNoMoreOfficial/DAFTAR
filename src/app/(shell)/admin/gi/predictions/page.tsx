"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

interface Prediction {
  id: string;
  type: string;
  description: string;
  confidence: number;
  severity: string;
  isActive: boolean;
  accuracy: number | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface PredictionsResponse {
  predictions: Prediction[];
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    avgConfidence: number;
    avgAccuracy: number | null;
    withAccuracy: number;
  };
}

const PREDICTION_TYPES = [
  "ALL",
  "deadline_risk",
  "capacity_crunch",
  "quality_decline",
  "burnout_risk",
  "bottleneck_forming",
] as const;

const TYPE_LABELS: Record<string, string> = {
  deadline_risk: "Deadline Risk",
  capacity_crunch: "Capacity Crunch",
  quality_decline: "Quality Decline",
  burnout_risk: "Burnout Risk",
  bottleneck_forming: "Bottleneck Forming",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-blue-100 text-blue-700",
};

const TYPE_COLORS: Record<string, string> = {
  deadline_risk: "bg-red-50 text-red-600",
  capacity_crunch: "bg-orange-50 text-orange-600",
  quality_decline: "bg-yellow-50 text-yellow-600",
  burnout_risk: "bg-pink-50 text-pink-600",
  bottleneck_forming: "bg-purple-50 text-purple-600",
};

export default function GIPredictionsPage() {
  const [data, setData] = useState<PredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const fetchPredictions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "ALL") params.set("type", typeFilter);
    fetch(`/api/gi/predictions?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Predictions</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          GI-generated predictions about upcoming risks and opportunities.
        </p>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Total Predictions</p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{data.stats.total}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#9CA3AF]">
              <span className="text-red-500">{data.stats.critical} critical</span>
              <span>&middot;</span>
              <span className="text-orange-500">{data.stats.high} high</span>
              <span>&middot;</span>
              <span className="text-amber-500">{data.stats.medium} medium</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Avg Confidence</p>
            <p className="mt-2 text-2xl font-bold text-[#2E86AB]">{data.stats.avgConfidence}%</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Across active predictions</p>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Avg Accuracy</p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">
              {data.stats.avgAccuracy !== null ? `${data.stats.avgAccuracy}%` : "N/A"}
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {data.stats.withAccuracy} predictions with outcome data
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {PREDICTION_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              typeFilter === t
                ? "bg-[#2E86AB] text-white"
                : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8F9FA]"
            }`}
          >
            {t === "ALL" ? "All Types" : TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>

      {/* Predictions List */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        {loading ? (
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : data?.predictions && data.predictions.length > 0 ? (
          <div className="divide-y divide-[#E5E7EB]">
            {data.predictions.map((pred) => {
              const sevColor = SEVERITY_COLORS[pred.severity] || "bg-gray-100 text-gray-600";
              const typeColor = TYPE_COLORS[pred.type] || "bg-gray-50 text-gray-600";
              return (
                <div key={pred.id} className="p-4 hover:bg-[#F8F9FA] transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A]">{pred.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className={typeColor} variant="secondary">
                          {TYPE_LABELS[pred.type] || pred.type.replace(/_/g, " ")}
                        </Badge>
                        <Badge className={sevColor} variant="secondary">
                          {pred.severity}
                        </Badge>
                        {pred.accuracy !== null && (
                          <span className="text-xs text-[#9CA3AF]">
                            Accuracy: {Math.round(pred.accuracy * 100)}%
                          </span>
                        )}
                        <span className="text-xs text-[#D1D5DB]">&middot;</span>
                        <span className="text-xs text-[#9CA3AF]">
                          {new Date(pred.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="w-32 shrink-0">
                      <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                        <span>Confidence</span>
                        <span className="font-medium">{Math.round(pred.confidence * 100)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${pred.confidence * 100}%`,
                            backgroundColor:
                              pred.confidence >= 0.8
                                ? "#2E86AB"
                                : pred.confidence >= 0.5
                                ? "#F59E0B"
                                : "#9CA3AF",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-[#9CA3AF]">
            No predictions found{typeFilter !== "ALL" ? ` for type "${TYPE_LABELS[typeFilter]}"` : ""}.
          </p>
        )}
      </div>
    </div>
  );
}
