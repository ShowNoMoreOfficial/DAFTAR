"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

interface Learning {
  id: string;
  category: string;
  pattern: string;
  description: string;
  confidence: number;
  observations: number;
  isActive: boolean;
  lastObserved: string;
  createdAt: string;
}

interface LearningResponse {
  learnings: Learning[];
  byCategory: Record<string, Learning[]>;
  stats: {
    totalLearnings: number;
    categories: number;
    avgConfidence: number;
    totalObservations: number;
  };
}

const CATEGORIES = ["ALL", "rhythm", "preference", "pattern", "correction", "outcome"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  rhythm: "Organizational Rhythm",
  preference: "Preference",
  pattern: "Pattern",
  correction: "Correction",
  outcome: "Outcome",
};

const CATEGORY_COLORS: Record<string, string> = {
  rhythm: "bg-blue-100 text-blue-700",
  preference: "bg-purple-100 text-purple-700",
  pattern: "bg-green-100 text-green-700",
  correction: "bg-amber-100 text-amber-700",
  outcome: "bg-teal-100 text-teal-700",
};

export default function GILearningPage() {
  const [data, setData] = useState<LearningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const fetchLearning = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter !== "ALL") params.set("category", categoryFilter);
    fetch(`/api/gi/learning?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [categoryFilter]);

  useEffect(() => {
    fetchLearning();
  }, [fetchLearning]);

  // Group learnings by category for display
  const groupedLearnings = data?.byCategory || {};
  const displayCategories =
    categoryFilter === "ALL"
      ? Object.keys(groupedLearnings)
      : [categoryFilter].filter((c) => groupedLearnings[c]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Learning Log</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          What GI has learned about your organization — rhythms, patterns, and preferences.
        </p>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Total Learnings</p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{data.stats.totalLearnings}</p>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Categories</p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{data.stats.categories}</p>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Avg Confidence</p>
            <p className="mt-2 text-2xl font-bold text-[#2E86AB]">{data.stats.avgConfidence}%</p>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Total Observations</p>
            <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{data.stats.totalObservations}</p>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              categoryFilter === c
                ? "bg-[#2E86AB] text-white"
                : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8F9FA]"
            }`}
          >
            {c === "ALL" ? "All Categories" : CATEGORY_LABELS[c] || c}
          </button>
        ))}
      </div>

      {/* Learnings grouped by category */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-[#E5E7EB] bg-white" />
          ))}
        </div>
      ) : displayCategories.length > 0 ? (
        <div className="space-y-6">
          {displayCategories.map((category) => {
            const items = groupedLearnings[category] || [];
            const catColor = CATEGORY_COLORS[category] || "bg-gray-100 text-gray-600";
            return (
              <div key={category} className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
                <div className="border-b border-[#E5E7EB] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={catColor} variant="secondary">
                      {CATEGORY_LABELS[category] || category}
                    </Badge>
                    <span className="text-xs text-[#9CA3AF]">{items.length} learnings</span>
                  </div>
                </div>
                <div className="divide-y divide-[#E5E7EB]">
                  {items.map((learning) => (
                    <div key={learning.id} className="p-4 hover:bg-[#F8F9FA] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A]">{learning.pattern}</p>
                          <p className="mt-0.5 text-xs text-[#9CA3AF] leading-relaxed">
                            {learning.description}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-[#9CA3AF]">
                            <span>{learning.observations} observations</span>
                            <span className="text-[#D1D5DB]">&middot;</span>
                            <span>Last seen {new Date(learning.lastObserved).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="w-28 shrink-0">
                          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                            <span>Confidence</span>
                            <span className="font-medium">{Math.round(learning.confidence * 100)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-[#2E86AB] transition-all"
                              style={{ width: `${learning.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-[#9CA3AF]">
            No learnings found{categoryFilter !== "ALL" ? ` in "${CATEGORY_LABELS[categoryFilter]}"` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
