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
  rhythm: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  preference: "bg-[rgba(168,85,247,0.15)] text-purple-700",
  pattern: "bg-[rgba(34,197,94,0.15)] text-green-700",
  correction: "bg-[rgba(245,158,11,0.15)] text-amber-700",
  outcome: "bg-[rgba(20,184,166,0.15)] text-teal-700",
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
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Learning Log</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          What GI has learned about your organization — rhythms, patterns, and preferences.
        </p>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Total Learnings</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{data.stats.totalLearnings}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Categories</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{data.stats.categories}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Avg Confidence</p>
            <p className="mt-2 text-2xl font-bold text-[var(--accent-primary)]">{data.stats.avgConfidence}%</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Total Observations</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{data.stats.totalObservations}</p>
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
                ? "bg-[var(--accent-primary)] text-white"
                : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
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
            <div key={i} className="h-40 animate-pulse rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]" />
          ))}
        </div>
      ) : displayCategories.length > 0 ? (
        <div className="space-y-6">
          {displayCategories.map((category) => {
            const items = groupedLearnings[category] || [];
            const catColor = CATEGORY_COLORS[category] || "bg-[var(--bg-elevated)] text-gray-600";
            return (
              <div key={category} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm">
                <div className="border-b border-[var(--border-subtle)] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={catColor} variant="secondary">
                      {CATEGORY_LABELS[category] || category}
                    </Badge>
                    <span className="text-xs text-[var(--text-muted)]">{items.length} learnings</span>
                  </div>
                </div>
                <div className="divide-y divide-[#E5E7EB]">
                  {items.map((learning) => (
                    <div key={learning.id} className="p-4 hover:bg-[var(--bg-surface)] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{learning.pattern}</p>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)] leading-relaxed">
                            {learning.description}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                            <span>{learning.observations} observations</span>
                            <span className="text-[var(--text-muted)]">&middot;</span>
                            <span>Last seen {new Date(learning.lastObserved).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="w-28 shrink-0">
                          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1">
                            <span>Confidence</span>
                            <span className="font-medium">{Math.round(learning.confidence * 100)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)]">
                            <div
                              className="h-2 rounded-full bg-[var(--accent-primary)] transition-all"
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
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-sm text-center">
          <p className="text-sm text-[var(--text-muted)]">
            No learnings found{categoryFilter !== "ALL" ? ` in "${CATEGORY_LABELS[categoryFilter]}"` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
