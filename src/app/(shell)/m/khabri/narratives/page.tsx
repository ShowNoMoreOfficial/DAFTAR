"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  Radio,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  KhabriNarrative,
  KhabriMeta,
  KhabriStakeholder,
  KhabriTimelineEvent,
  NarrativeArcPhase,
} from "@/types/khabri";

// ─── Arc Phase Config ───────────────────────────────────

const ARC_CONFIG: Record<NarrativeArcPhase, { label: string; color: string; description: string }> = {
  EMERGENCE: { label: "Emergence", color: "bg-[rgba(59,130,246,0.15)] text-blue-700", description: "Story is forming, low signal volume" },
  ESCALATION: { label: "Escalation", color: "bg-[rgba(234,179,8,0.15)] text-yellow-700", description: "Activity increasing, sub-narratives forming" },
  PEAK: { label: "Peak", color: "bg-[rgba(239,68,68,0.15)] text-red-700", description: "Maximum intensity, highest signal density" },
  RESOLUTION: { label: "Resolution", color: "bg-[rgba(16,185,129,0.15)] text-emerald-700", description: "Story winding down, signals rare" },
};

const STAKEHOLDER_ROLE_COLORS: Record<string, string> = {
  protagonist: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  antagonist: "bg-[rgba(239,68,68,0.15)] text-red-700",
  regulator: "bg-[rgba(168,85,247,0.15)] text-purple-700",
  observer: "bg-[var(--bg-elevated)] text-gray-600",
};

// ─── Component ──────────────────────────────────────────

export default function KhabriNarrativesPage() {
  const [narratives, setNarratives] = useState<KhabriNarrative[]>([]);
  const [meta, setMeta] = useState<KhabriMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    stakeholders: KhabriStakeholder[];
    timeline: KhabriTimelineEvent[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchNarratives = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/khabri/narratives?page=${page}&pageSize=10`);
      if (res.ok) {
        const data = await res.json();
        setNarratives(data.data || []);
        setMeta(data.meta || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchNarratives(); }, [fetchNarratives]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetailData(null);
      return;
    }

    setExpandedId(id);
    setDetailLoading(true);
    setDetailData(null);

    try {
      const [stakeholdersRes, timelineRes] = await Promise.all([
        fetch(`/api/khabri/narratives/${id}/stakeholders`),
        fetch(`/api/khabri/narratives/${id}/timeline`),
      ]);

      const stakeholders = stakeholdersRes.ok ? (await stakeholdersRes.json()).data || [] : [];
      const timeline = timelineRes.ok ? (await timelineRes.json()).data || [] : [];

      setDetailData({ stakeholders, timeline });
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-[var(--accent-primary)]" /> Narratives
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Narrative tree tracking and stakeholder analysis</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchNarratives} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {narratives.length === 0 ? (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-12 text-center text-sm text-[var(--text-muted)]">
                No narratives found
              </div>
            ) : (
              narratives.map((narrative) => {
                const arc = (narrative.arcPhase && ARC_CONFIG[narrative.arcPhase]) || ARC_CONFIG.EMERGENCE;
                const isExpanded = expandedId === narrative.id;

                return (
                  <div
                    key={narrative.id}
                    className={cn(
                      "rounded-xl border bg-[var(--bg-surface)] transition-colors",
                      isExpanded ? "border-[#2E86AB]/30" : "border-[var(--border-subtle)]"
                    )}
                  >
                    {/* Narrative Header */}
                    <div
                      className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
                      onClick={() => toggleExpand(narrative.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{narrative.title}</h3>
                          <Badge className={cn("text-[10px]", arc.color)}>{arc.label}</Badge>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{narrative.summary}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Radio className="h-3 w-3" /> {narrative.signalCount} signals
                          </span>
                          {(narrative.childCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <GitBranch className="h-3 w-3" /> {narrative.childCount} branches
                            </span>
                          )}
                          {(narrative.stakeholderCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {narrative.stakeholderCount} stakeholders
                            </span>
                          )}
                          {narrative.keywords && narrative.keywords.length > 0 && (
                            <span className="hidden sm:inline">
                              {narrative.keywords.slice(0, 3).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-[var(--text-muted)]">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="border-t border-[#F0F2F5] px-5 py-4">
                        {detailLoading ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-primary)]" />
                          </div>
                        ) : detailData ? (
                          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Stakeholders */}
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                                <Users className="inline h-3.5 w-3.5 mr-1" /> Stakeholders
                              </h4>
                              {detailData.stakeholders.length === 0 ? (
                                <p className="text-xs text-[var(--text-muted)]">No stakeholders identified</p>
                              ) : (
                                <div className="space-y-2">
                                  {detailData.stakeholders.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-[var(--text-primary)]">{s.name}</span>
                                        <Badge className={cn("text-[10px]", STAKEHOLDER_ROLE_COLORS[s.role] || "bg-[var(--bg-elevated)] text-gray-600")}>
                                          {s.role}
                                        </Badge>
                                      </div>
                                      <span className={cn(
                                        "text-xs font-medium",
                                        s.sentiment > 0 ? "text-emerald-600" : s.sentiment < 0 ? "text-red-600" : "text-[var(--text-secondary)]"
                                      )}>
                                        {s.sentiment > 0 ? "+" : ""}{s.sentiment.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Timeline */}
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                                <Clock className="inline h-3.5 w-3.5 mr-1" /> Timeline
                              </h4>
                              {detailData.timeline.length === 0 ? (
                                <p className="text-xs text-[var(--text-muted)]">No timeline events</p>
                              ) : (
                                <div className="relative space-y-3 pl-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-[#E5E7EB]">
                                  {detailData.timeline.slice(0, 8).map((event, i) => {
                                    const evArc = ARC_CONFIG[event.arcPhase] || ARC_CONFIG.EMERGENCE;
                                    return (
                                      <div key={i} className="relative">
                                        <div className="absolute -left-4 top-1.5 h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
                                        <p className="text-sm font-medium text-[var(--text-primary)]">{event.title}</p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{event.summary}</p>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                          <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                                          <Badge className={cn("text-[9px]", evArc.color)}>{evArc.label}</Badge>
                                          {event.impact > 0 && <span>Impact: {event.impact}</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {meta && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">
                Page {meta.page} • {meta.total} total narratives
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!meta.hasMore}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
