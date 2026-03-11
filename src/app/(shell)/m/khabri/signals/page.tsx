"use client";

import { useState, useEffect, useCallback } from "react";
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
  Zap,
  Send,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KhabriSignal, KhabriMeta } from "@/types/khabri";

// ─── Extended Signal Type ────────────────────────────────

type Signal = KhabriSignal;

// ─── Sentiment Config ───────────────────────────────────

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  POSITIVE: { label: "Positive", color: "bg-emerald-100 text-emerald-700", icon: <ThumbsUp className="h-3 w-3" /> },
  Positive: { label: "Positive", color: "bg-emerald-100 text-emerald-700", icon: <ThumbsUp className="h-3 w-3" /> },
  NEGATIVE: { label: "Negative", color: "bg-red-100 text-red-700", icon: <ThumbsDown className="h-3 w-3" /> },
  Negative: { label: "Negative", color: "bg-red-100 text-red-700", icon: <ThumbsDown className="h-3 w-3" /> },
  NEUTRAL: { label: "Neutral", color: "bg-gray-100 text-gray-600", icon: <Minus className="h-3 w-3" /> },
  Neutral: { label: "Neutral", color: "bg-gray-100 text-gray-600", icon: <Minus className="h-3 w-3" /> },
  MIXED: { label: "Mixed", color: "bg-yellow-100 text-yellow-700", icon: <Minus className="h-3 w-3" /> },
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

// ─── Sentiment Bar ──────────────────────────────────────

function SentimentBar({ score }: { score: number }) {
  // score is -1 to 1, map to 0-100
  const pct = ((score + 1) / 2) * 100;
  const color =
    score > 0.3 ? "bg-emerald-500" : score < -0.3 ? "bg-red-500" : "bg-gray-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 rounded-full bg-gray-100">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", score > 0.3 ? "text-emerald-600" : score < -0.3 ? "text-red-600" : "text-[#6B7280]")}>
        {score > 0 ? "+" : ""}{score.toFixed(2)}
      </span>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────

export default function KhabriSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [meta, setMeta] = useState<KhabriMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sentToYantri, setSentToYantri] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch only live signals from Khabri API
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
      let fetchedSignals: Signal[] = data.data || [];

      // Client-side source filter
      if (sourceFilter) {
        fetchedSignals = fetchedSignals.filter((s) => s.source === sourceFilter);
      }

      // Sort by publishedAt descending (most recent first)
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

  const handleSearch = () => {
    setPage(1);
    setActiveSearch(searchQuery);
  };

  const handleSendToYantri = async (signalId: string) => {
    const signal = signals.find((s) => s.id === signalId);
    if (!signal) return;

    setSentToYantri((prev) => new Set(prev).add(signalId));

    try {
      const sentimentScore = typeof signal.sentiment === "object" ? signal.sentiment?.score : signal.sentimentScore;
      const res = await fetch("/api/pipeline/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId: signal.id,
          trendTitle: signal.title,
          summary: signal.content || signal.title,
          urgency: (sentimentScore !== undefined && sentimentScore < -0.5) ? "breaking" : "normal",
          source: signal.source,
          category: signal.category,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed");
      }
      setToast({ message: `"${signal.title.substring(0, 50)}..." sent to Yantri`, type: "success" });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setSentToYantri((prev) => {
        const next = new Set(prev);
        next.delete(signalId);
        return next;
      });
      setToast({ message: err instanceof Error ? err.message : "Failed to send to Yantri. Please try again.", type: "error" });
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Toast notification */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-md animate-in fade-in slide-in-from-top-2",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.message}
          {toast.type === "success" && (
            <a href="/m/yantri" className="ml-2 underline text-emerald-100 hover:text-white">Open Yantri &rarr;</a>
          )}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#A23B72]" /> Signal Radar
          </h1>
          <p className="text-sm text-[#6B7280]">High-density signal monitoring with impact scoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-[#2E86AB] hover:bg-[#2E86AB]/90 text-white" : ""}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" /> Filters
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSignals} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              placeholder="Search signals by text, entity, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} size="sm" className="bg-[#2E86AB] hover:bg-[#2E86AB]/90 text-white">
            Search
          </Button>
          {(activeSearch || sourceFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSearchQuery(""); setActiveSearch(""); setSourceFilter(""); setPage(1); }}
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#6B7280]">Source:</label>
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs text-[#1A1A1A] focus:border-[#2E86AB] focus:outline-none"
              >
                <option value="">All Sources</option>
                {[...new Set(signals.map((s) => s.source).filter(Boolean))].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {sourceFilter && (
              <Badge variant="outline" className="text-[10px] gap-1 text-[#A23B72]">
                Source: {sourceFilter}
              </Badge>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E86AB]" />
        </div>
      ) : (
        <>
          {/* Signal Stats Bar */}
          <div className="flex items-center gap-4 text-xs text-[#6B7280]">
            <span>{meta?.total ?? signals.length} total signals</span>
            <span>Showing {signals.length} on this page</span>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Signals List — Bloomberg Terminal Style */}
          <div className="space-y-2">
            {signals.length === 0 ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-12 text-center text-sm text-[#9CA3AF]">
                {activeSearch ? `No signals found for "${activeSearch}"` : "No signals match current filters"}
              </div>
            ) : (
              signals.map((signal) => {
                const isExpanded = expandedId === signal.id;
                const sentimentObj = typeof signal.sentiment === "object" ? signal.sentiment : null;
                const sentimentLabel = typeof signal.sentiment === "string"
                  ? signal.sentiment
                  : sentimentObj?.label;
                const sentimentScore = sentimentObj?.score ?? signal.sentimentScore;
                const sentimentCfg = sentimentLabel
                  ? SENTIMENT_CONFIG[sentimentLabel] || SENTIMENT_CONFIG.NEUTRAL
                  : null;
                const isSent = sentToYantri.has(signal.id);

                return (
                  <div
                    key={signal.id}
                    className={cn(
                      "rounded-xl border bg-white transition-all",
                      isExpanded
                        ? "border-[#2E86AB]/30"
                        : "border-[#E5E7EB]"
                    )}
                  >
                    {/* Signal Row */}
                    <div
                      className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#F8F9FA] transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                    >
                      {/* Sentiment Score Column */}
                      <div className="shrink-0 pt-0.5">
                        {sentimentScore !== undefined ? (
                          <SentimentBar score={sentimentScore} />
                        ) : (
                          <span className="text-xs text-[#D1D5DB]">—</span>
                        )}
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{signal.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {signal.source && (
                            <span className="text-xs font-medium text-[#6B7280]">{signal.source}</span>
                          )}
                          {signal.category && (
                            <Badge variant="outline" className="text-[10px]">{signal.category}</Badge>
                          )}
                          {sentimentCfg && (
                            <Badge className={cn("text-[10px] gap-1", sentimentCfg.color)}>
                              {sentimentCfg.icon} {sentimentCfg.label}
                            </Badge>
                          )}
                          {signal.publishedAt && (
                            <span className="text-[10px] text-[#9CA3AF]">
                              {new Date(signal.publishedAt).toLocaleString("en-IN", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row Actions */}
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 gap-1 text-[10px]",
                            isSent
                              ? "text-emerald-600 hover:text-emerald-700"
                              : "text-[#A23B72] hover:text-[#A23B72]/80 hover:bg-[#A23B72]/5"
                          )}
                          onClick={(e) => { e.stopPropagation(); handleSendToYantri(signal.id); }}
                          disabled={isSent}
                        >
                          {isSent ? (
                            <><Zap className="h-3 w-3" /> Sent</>
                          ) : (
                            <><Send className="h-3 w-3" /> Yantri</>
                          )}
                        </Button>
                        {(signal.sourceUrl || signal.url) && (
                          <a
                            href={signal.sourceUrl || signal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 p-1.5 text-[#6B7280] hover:text-[#2E86AB] transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Expanded Enrichment Data */}
                    {isExpanded && (
                      <div className="border-t border-[#F0F2F5] px-5 py-4 space-y-3">
                        {signal.content && (
                          <p className="text-sm text-[#6B7280] leading-relaxed">{signal.content}</p>
                        )}

                        {signal.entities && signal.entities.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-[#6B7280] mb-1.5">Entities</p>
                            <div className="flex flex-wrap gap-1.5">
                              {signal.entities.map((entity, i) => (
                                <Badge key={i} variant="outline" className="text-xs gap-1">
                                  {ENTITY_ICONS[entity.type] || null}
                                  {entity.name}
                                  <span className="text-[#9CA3AF]">({(entity.salience * 100).toFixed(0)}%)</span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {signal.keywords && signal.keywords.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-[#6B7280] mb-1.5">Keywords</p>
                            <div className="flex flex-wrap gap-1.5">
                              {signal.keywords.map((kw, i) => (
                                <span key={i} className="inline-flex items-center rounded-full bg-[#F0F2F5] px-2.5 py-0.5 text-xs text-[#6B7280]">
                                  {kw.keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {signal.locations && signal.locations.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-[#6B7280] mb-1.5">Locations</p>
                            <div className="flex flex-wrap gap-1.5">
                              {signal.locations.map((loc, i) => (
                                <Badge key={i} variant="outline" className="text-xs gap-1">
                                  <MapPin className="h-3 w-3" /> {loc.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {sentimentScore !== undefined && (
                          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                            Sentiment score: <strong className="text-[#1A1A1A]">{sentimentScore.toFixed(2)}</strong>
                          </div>
                        )}
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
              <p className="text-xs text-[#9CA3AF]">
                Page {meta.page} &middot; {meta.total} total signals
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
