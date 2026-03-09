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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KhabriSignal, KhabriMeta } from "@/types/khabri";

// ─── Sentiment Config ───────────────────────────────────

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  POSITIVE: { label: "Positive", color: "bg-emerald-100 text-emerald-700", icon: <ThumbsUp className="h-3 w-3" /> },
  NEGATIVE: { label: "Negative", color: "bg-red-100 text-red-700", icon: <ThumbsDown className="h-3 w-3" /> },
  NEUTRAL: { label: "Neutral", color: "bg-gray-100 text-gray-600", icon: <Minus className="h-3 w-3" /> },
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

// ─── Component ──────────────────────────────────────────

export default function KhabriSignalsPage() {
  const [signals, setSignals] = useState<KhabriSignal[]>([]);
  const [meta, setMeta] = useState<KhabriMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeSearch
        ? `/api/khabri/signals/search?q=${encodeURIComponent(activeSearch)}&page=${page}&pageSize=20`
        : `/api/khabri/signals?page=${page}&pageSize=20`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setSignals(data.data || []);
        setMeta(data.meta || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, activeSearch]);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  const handleSearch = () => {
    setPage(1);
    setActiveSearch(searchQuery);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#A23B72]" /> Signals
          </h1>
          <p className="text-sm text-[#6B7280]">Signal monitoring with enrichment data</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSignals} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            placeholder="Search signals by text, entity, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} size="sm" className="bg-[#2E86AB] hover:bg-[#2E86AB]/90 text-white">
          Search
        </Button>
        {activeSearch && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearchQuery(""); setActiveSearch(""); setPage(1); }}
          >
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E86AB]" />
        </div>
      ) : (
        <>
          {/* Signals List */}
          <div className="space-y-3">
            {signals.length === 0 ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-12 text-center text-sm text-[#9CA3AF]">
                {activeSearch ? `No signals found for "${activeSearch}"` : "No signals found"}
              </div>
            ) : (
              signals.map((signal) => {
                const isExpanded = expandedId === signal.id;
                // API returns sentiment as string or as {label, score} object
                const sentimentLabel = typeof signal.sentiment === "string"
                  ? signal.sentiment
                  : signal.sentiment?.label;
                const sentimentCfg = sentimentLabel
                  ? SENTIMENT_CONFIG[sentimentLabel] || SENTIMENT_CONFIG.NEUTRAL
                  : null;

                return (
                  <div
                    key={signal.id}
                    className={cn(
                      "rounded-xl border bg-white transition-colors",
                      isExpanded ? "border-[#2E86AB]/30" : "border-[#E5E7EB]"
                    )}
                  >
                    <div
                      className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-[#F8F9FA] transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A]">{signal.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {signal.source && (
                            <span className="text-xs text-[#6B7280]">{signal.source}</span>
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
                            <span className="text-xs text-[#9CA3AF]">
                              {new Date(signal.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {(signal.sourceUrl || signal.url) && (
                        <a
                          href={signal.sourceUrl || signal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 p-1 text-[#6B7280] hover:text-[#2E86AB]"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
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

                        {signal.sentiment && (
                          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                            Sentiment score: <strong className="text-[#1A1A1A]">
                              {typeof signal.sentiment === "object" && signal.sentiment.score !== undefined
                                ? signal.sentiment.score.toFixed(2)
                                : signal.sentimentScore !== undefined
                                  ? signal.sentimentScore.toFixed(2)
                                  : "N/A"}
                            </strong>
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
                Page {meta.page} • {meta.total} total signals
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
