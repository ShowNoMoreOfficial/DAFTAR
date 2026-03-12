"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Radio,
  Search,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Minus,
  User,
  Building2,
  MapPin,
  Sparkles,
  Filter,
  TrendingUp,
  GitBranch,
  ArrowUp,
  ArrowDown,
  Activity,
  AlertTriangle,
  BarChart3,
  Inbox,
  Factory,
  CheckCircle2,
  Ban,
  ArrowRight,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Radar,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { KhabriSignal, KhabriMeta, KhabriTrend, KhabriNarrative, KhabriStakeholder, KhabriTimelineEvent, NarrativeArcPhase } from "@/types/khabri";

// ─── Tab definition ───

const TABS = [
  { id: "signals", label: "Signals", icon: Radio },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "research", label: "Research", icon: GitBranch },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Sentiment Config ───

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  POSITIVE: { label: "Positive", color: "bg-[rgba(16,185,129,0.15)] text-emerald-700", icon: <ThumbsUp className="h-3 w-3" /> },
  Positive: { label: "Positive", color: "bg-[rgba(16,185,129,0.15)] text-emerald-700", icon: <ThumbsUp className="h-3 w-3" /> },
  NEGATIVE: { label: "Negative", color: "bg-[rgba(239,68,68,0.15)] text-red-700", icon: <ThumbsDown className="h-3 w-3" /> },
  Negative: { label: "Negative", color: "bg-[rgba(239,68,68,0.15)] text-red-700", icon: <ThumbsDown className="h-3 w-3" /> },
  NEUTRAL: { label: "Neutral", color: "bg-[var(--bg-elevated)] text-gray-600", icon: <Minus className="h-3 w-3" /> },
  Neutral: { label: "Neutral", color: "bg-[var(--bg-elevated)] text-gray-600", icon: <Minus className="h-3 w-3" /> },
  MIXED: { label: "Mixed", color: "bg-[rgba(234,179,8,0.15)] text-yellow-700", icon: <Minus className="h-3 w-3" /> },
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  person: <User className="h-3 w-3" />,
  PERSON: <User className="h-3 w-3" />,
  organization: <Building2 className="h-3 w-3" />,
  ORG: <Building2 className="h-3 w-3" />,
  company: <Building2 className="h-3 w-3" />,
  country: <MapPin className="h-3 w-3" />,
  location: <MapPin className="h-3 w-3" />,
  LOCATION: <MapPin className="h-3 w-3" />,
};

const ARC_CONFIG: Record<string, { label: string; color: string }> = {
  EMERGENCE: { label: "Emergence", color: "bg-[rgba(59,130,246,0.15)] text-blue-700" },
  ESCALATION: { label: "Escalation", color: "bg-[rgba(234,179,8,0.15)] text-yellow-700" },
  PEAK: { label: "Peak", color: "bg-[rgba(239,68,68,0.15)] text-red-700" },
  RESOLUTION: { label: "Resolution", color: "bg-[rgba(16,185,129,0.15)] text-emerald-700" },
};

const TREE_STATUS_CFG: Record<string, { label: string; color: string }> = {
  INCOMING: { label: "Incoming", color: "bg-[rgba(59,130,246,0.1)] text-blue-700" },
  EVALUATING: { label: "Evaluating", color: "bg-[rgba(245,158,11,0.1)] text-amber-700" },
  APPROVED: { label: "Approved", color: "bg-[rgba(16,185,129,0.1)] text-emerald-700" },
  IN_PRODUCTION: { label: "In Production", color: "bg-[rgba(168,85,247,0.1)] text-purple-700" },
  COMPLETED: { label: "Completed", color: "bg-[var(--bg-elevated)] text-gray-600" },
  SKIPPED: { label: "Skipped", color: "bg-[var(--bg-elevated)] text-gray-500" },
};

// ─── Sentiment Bar ───

function SentimentBar({ score: rawScore }: { score: number }) {
  const score = typeof rawScore === "number" && !isNaN(rawScore) ? rawScore : 0;
  const pct = ((score + 1) / 2) * 100;
  const color = score > 0.3 ? "bg-emerald-500" : score < -0.3 ? "bg-red-500" : "bg-gray-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 rounded-full bg-[var(--bg-elevated)]">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", score > 0.3 ? "text-emerald-600" : score < -0.3 ? "text-red-600" : "text-[var(--text-secondary)]")}>
        {score > 0 ? "+" : ""}{score.toFixed(2)}
      </span>
    </div>
  );
}

// ─── Main Page ───

export default function IntelligencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "signals";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Sync tab when URL params change (e.g. sidebar navigation)
  useEffect(() => {
    const urlTab = searchParams.get("tab") as TabId;
    if (urlTab && TABS.some((t) => t.id === urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Radar className="h-5 w-5 text-[var(--accent-primary)]" />
              Intelligence
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Signals, trends, and research — everything happening in the world.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm transition-colors",
                activeTab === tab.id
                  ? "border-[#2E86AB] font-medium text-[var(--accent-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "signals" && <SignalsTab />}
        {activeTab === "trends" && <TrendsTab />}
        {activeTab === "research" && <ResearchTab />}
      </div>
    </div>
  );
}

// ─── SIGNALS TAB ───

function SignalsTab() {
  const router = useRouter();
  const [signals, setSignals] = useState<KhabriSignal[]>([]);
  const [meta, setMeta] = useState<KhabriMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        activeSearch
          ? `/api/khabri/signals/search?q=${encodeURIComponent(activeSearch)}&page=${page}&pageSize=25`
          : `/api/khabri/signals?page=${page}&pageSize=25`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Failed to fetch signals (${res.status})`);
      }
      const data = await res.json();
      let fetchedSignals: KhabriSignal[] = data.data || [];
      if (sourceFilter) {
        fetchedSignals = fetchedSignals.filter((s) => s.source === sourceFilter);
      }
      fetchedSignals.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
      setSignals(fetchedSignals);
      setMeta(data.meta || { total: fetchedSignals.length, page: 1, pageSize: fetchedSignals.length, hasMore: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load signals");
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeSearch, sourceFilter]);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  const handleSearch = () => { setPage(1); setActiveSearch(searchQuery); };

  return (
    <div className="p-6 space-y-4">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-md animate-in fade-in slide-in-from-top-2",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.message}
        </div>
      )}

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Search signals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} size="sm" className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white">
            Search
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSignals} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          {(activeSearch || sourceFilter) && (
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setActiveSearch(""); setSourceFilter(""); setPage(1); }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : (
        <>
          {error && (
            <div className="rounded-lg border border-red-200 bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span>{meta?.total ?? signals.length} signals</span>
          </div>

          <div className="space-y-2">
            {signals.length === 0 ? (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-12 text-center text-sm text-[var(--text-muted)]">
                {activeSearch ? `No signals found for "${activeSearch}"` : "No signals available"}
              </div>
            ) : (
              signals.map((signal) => {
                const isExpanded = expandedId === signal.id;
                const sentimentObj = typeof signal.sentiment === "object" ? signal.sentiment : null;
                const sentimentLabel = typeof signal.sentiment === "string" ? signal.sentiment : sentimentObj?.label;
                const rawScore = sentimentObj?.score ?? signal.sentimentScore;
                const sentimentScore = typeof rawScore === "number" ? rawScore : undefined;
                const sentimentCfg = sentimentLabel ? SENTIMENT_CONFIG[sentimentLabel] || SENTIMENT_CONFIG.NEUTRAL : null;

                return (
                  <div
                    key={signal.id}
                    className={cn(
                      "rounded-xl border bg-[var(--bg-surface)] transition-all",
                      isExpanded ? "border-[#2E86AB]/30" : "border-[var(--border-subtle)]"
                    )}
                  >
                    <div
                      className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-[var(--bg-elevated)]/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                    >
                      <div className="shrink-0 pt-0.5">
                        {sentimentScore !== undefined ? <SentimentBar score={sentimentScore} /> : <span className="text-xs text-[var(--text-muted)]">--</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">{signal.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {signal.source && <span className="text-xs font-medium text-[var(--text-secondary)]">{signal.source}</span>}
                          {signal.category && <Badge variant="outline" className="text-[10px]">{signal.category}</Badge>}
                          {sentimentCfg && <Badge className={cn("text-[10px] gap-1", sentimentCfg.color)}>{sentimentCfg.icon} {sentimentCfg.label}</Badge>}
                          {signal.publishedAt && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {new Date(signal.publishedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-[10px] text-teal-600 hover:text-teal-700 hover:bg-teal-600/5"
                          onClick={(e) => { e.stopPropagation(); router.push(`/content-studio?topic=${encodeURIComponent(signal.title)}&auto=true`); }}
                        >
                          <Sparkles className="h-3 w-3" /> Create Content
                        </Button>
                        {(signal.sourceUrl || signal.url) && (
                          <a
                            href={signal.sourceUrl || signal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[var(--border-subtle)] px-5 py-4 space-y-3">
                        {signal.content && <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{signal.content}</p>}
                        {signal.entities && signal.entities.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">Entities</p>
                            <div className="flex flex-wrap gap-1.5">
                              {signal.entities.map((entity, i) => (
                                <Badge key={i} variant="outline" className="text-xs gap-1">
                                  {ENTITY_ICONS[entity.type] || null} {entity.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {signal.keywords && signal.keywords.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">Keywords</p>
                            <div className="flex flex-wrap gap-1.5">
                              {signal.keywords.map((kw, i) => (
                                <span key={i} className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-xs text-[var(--text-secondary)]">
                                  {kw.keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {meta && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">Page {meta.page} &middot; {meta.total} total</p>
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

// ─── TRENDS TAB ───

function TrendsTab() {
  const router = useRouter();
  const [trends, setTrends] = useState<KhabriTrend[]>([]);
  const [meta, setMeta] = useState<KhabriMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/khabri/trends?page=${page}&pageSize=20`);
      if (!res.ok) throw new Error(`Failed to fetch trends (${res.status})`);
      const data = await res.json();
      setTrends(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trends");
      setTrends([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{meta?.total ?? trends.length} trends tracked</p>
        <Button variant="outline" size="sm" onClick={fetchTrends} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-red-700">{error}</div>
      ) : trends.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-12 text-center text-sm text-[var(--text-muted)]">
          No trends available
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trends.map((trend) => {
            const velocity = trend.momentum ?? 0;
            const signalCount = trend.sourceCount ?? 0;
            const lifecycle = trend.category ?? "";

            return (
              <div key={trend.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 hover:border-[#2E86AB]/30 transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{trend.topic}</h3>
                  {lifecycle && (
                    <Badge variant="outline" className="text-[10px] shrink-0">{lifecycle}</Badge>
                  )}
                </div>

                {trend.region && (
                  <p className="text-xs text-[var(--text-secondary)] mb-3">{trend.region}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-3">
                  {signalCount > 0 && (
                    <span className="flex items-center gap-1"><Radio className="h-3 w-3" /> {signalCount} signals</span>
                  )}
                  {velocity !== 0 && (
                    <span className={cn("flex items-center gap-1", velocity > 0 ? "text-emerald-600" : "text-red-600")}>
                      {velocity > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(velocity).toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-[10px] text-teal-600 hover:text-teal-700 hover:bg-teal-600/5"
                    onClick={() => router.push(`/content-studio?topic=${encodeURIComponent(trend.topic || "")}&auto=true`)}
                  >
                    <Sparkles className="h-3 w-3" /> Create Content
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">Page {meta.page}</p>
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
    </div>
  );
}

// ─── RESEARCH TAB (Narrative Trees / Fact Dossiers) ───

interface NarrativeTree {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  urgency: string;
  createdAt: string;
  createdBy: { name: string };
  _count: { narratives: number };
  narratives: { brandId: string; platform: string; status: string }[];
}

function ResearchTab() {
  const [trees, setTrees] = useState<NarrativeTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  const fetchTrees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== "ALL") params.set("status", filter);
      const res = await fetch(`/api/yantri/narrative-trees?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
      const data = await res.json();
      setTrees(data.trees || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load research");
      setTrees([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTrees(); }, [fetchTrees]);

  const STATUSES = ["ALL", "INCOMING", "IN_PRODUCTION", "APPROVED", "COMPLETED", "SKIPPED"];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === s
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {s === "ALL" ? "All" : (TREE_STATUS_CFG[s]?.label || s)}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={fetchTrees} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-red-700">{error}</div>
      ) : trees.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-12 text-center text-sm text-[var(--text-muted)]">
          No research dossiers found
        </div>
      ) : (
        <div className="space-y-3">
          {trees.map((tree) => {
            const statusCfg = TREE_STATUS_CFG[tree.status] || { label: tree.status, color: "bg-[var(--bg-elevated)] text-gray-600" };
            return (
              <Link
                key={tree.id}
                href={`/m/yantri/narrative-trees/${tree.id}`}
                className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 hover:border-[#2E86AB]/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{tree.title}</h3>
                    {tree.summary && <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{tree.summary}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                      <span>{tree.createdBy.name}</span>
                      <span>{new Date(tree.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      <span>{tree._count.narratives} narratives</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[10px]", statusCfg.color)}>{statusCfg.label}</Badge>
                    {tree.urgency === "breaking" && (
                      <Badge className="bg-[rgba(239,68,68,0.15)] text-red-700 text-[10px]">Breaking</Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
