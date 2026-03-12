"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface PipelineStats {
  PLANNED: number;
  RESEARCHING: number;
  DRAFTED: number;
  APPROVED: number;
  RELAYED: number;
  PUBLISHED: number;
}

const STAGES = [
  { key: "PLANNED", label: "Queued", color: "bg-blue-500" },
  { key: "RESEARCHING", label: "Research", color: "bg-amber-500" },
  { key: "DRAFTED", label: "Review", color: "bg-purple-500" },
  { key: "APPROVED", label: "Approved", color: "bg-emerald-500" },
  { key: "RELAYED", label: "Publishing", color: "bg-cyan-500" },
  { key: "PUBLISHED", label: "Done", color: "bg-[var(--accent-primary)]" },
];

export function PipelineMiniBar() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/yantri/pipeline/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stats) setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-20 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] skeleton-shimmer" />
    );
  }

  if (!stats) return null;

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Content Pipeline
        </h3>
        <Link
          href="/content-studio"
          className="flex items-center gap-1 text-[10px] font-medium text-[var(--accent-primary)] hover:underline"
        >
          Open Studio
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Progress bar */}
      {total > 0 ? (
        <>
          <div className="flex h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            {STAGES.map((stage) => {
              const count = stats[stage.key as keyof PipelineStats] || 0;
              const pct = (count / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={stage.key}
                  className={cn("transition-all duration-500", stage.color)}
                  style={{ width: `${pct}%` }}
                  title={`${stage.label}: ${count}`}
                />
              );
            })}
          </div>

          {/* Labels */}
          <div className="mt-2.5 flex items-center gap-4 flex-wrap">
            {STAGES.map((stage) => {
              const count = stats[stage.key as keyof PipelineStats] || 0;
              if (count === 0) return null;
              return (
                <div key={stage.key} className="flex items-center gap-1.5">
                  <div className={cn("h-2 w-2 rounded-full", stage.color)} />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {stage.label}: <span className="font-semibold text-[var(--text-secondary)]">{count}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">
          No content in the pipeline yet.
        </p>
      )}
    </div>
  );
}
