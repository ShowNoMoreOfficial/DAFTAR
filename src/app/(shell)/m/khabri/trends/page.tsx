"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Zap,
  AlertTriangle,
  BarChart3,
  Activity,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KhabriTrend, KhabriMeta } from "@/types/khabri";

// ─── Types for Mock Data ────────────────────────────────

interface TrendTimeSeries {
  keyword: string;
  points: { timestamp: string; volume: number }[];
}

interface TrendAnomaly {
  id: string;
  keyword: string;
  currentVolume: number;
  baselineVolume: number;
  spikePercent: number;
  detectedAt: string;
  severity: "ELEVATED" | "HIGH" | "CRITICAL";
}

// ─── Sparkline Component ────────────────────────────────

function MiniSparkline({ points, color }: { points: { volume: number }[]; color: string }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.volume));
  const min = Math.min(...points.map((p) => p.volume));
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const pathData = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p.volume - min) / range) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="shrink-0">
      <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Severity Config ────────────────────────────────────

const SEVERITY_CONFIG = {
  CRITICAL: { label: "Critical", color: "bg-[rgba(239,68,68,0.1)]0 text-white", border: "border-red-300", glow: "shadow-[0_0_16px_rgba(239,68,68,0.2)]" },
  HIGH: { label: "High", color: "bg-[rgba(245,158,11,0.1)]0 text-white", border: "border-amber-300", glow: "shadow-[0_0_12px_rgba(245,158,11,0.15)]" },
  ELEVATED: { label: "Elevated", color: "bg-yellow-400 text-yellow-900", border: "border-yellow-300", glow: "" },
};

// ─── Component ──────────────────────────────────────────

export default function KhabriTrendsPage() {
  const router = useRouter();
  // Live trends data (from Khabri API)
  const [trends, setTrends] = useState<KhabriTrend[]>([]);
  const [meta, setMeta] = useState<KhabriMeta | null>(null);
  const [page, setPage] = useState(1);
  const [selectedTrend, setSelectedTrend] = useState<KhabriTrend | null>(null);

  // Mock trend data (time-series + anomalies)
  const [trendSeries, setTrendSeries] = useState<TrendTimeSeries[]>([]);
  const [anomalies, setAnomalies] = useState<TrendAnomaly[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<TrendTimeSeries | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch mock time-series + anomalies
      const mockRes = await fetch("/api/m/khabri/trends");
      if (mockRes.ok) {
        const mockData = await mockRes.json();
        setTrendSeries(mockData.trends || []);
        setAnomalies(mockData.anomalies || []);
        if (mockData.trends?.length > 0 && !selectedSeries) {
          setSelectedSeries(mockData.trends[0]);
        }
      }

      // Also fetch live ranked trends
      const liveRes = await fetch(`/api/khabri/trends?page=${page}&pageSize=20`);
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        setTrends(liveData.data || []);
        setMeta(liveData.meta || null);
      }
    } catch {
      // ignore — either mock or live may be unavailable
    } finally {
      setLoading(false);
    }
  }, [page, selectedSeries]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--accent-primary)]" /> Trend Anomaly Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Real-time keyword volume tracking and anomaly detection</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* ═══ Section 1: Breaking Anomalies ═══ */}
      {anomalies.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Breaking Anomalies</h2>
            <Badge className="bg-[rgba(239,68,68,0.15)] text-red-700 text-[10px]">{anomalies.length} detected</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {anomalies.map((anomaly) => {
              const cfg = SEVERITY_CONFIG[anomaly.severity];
              return (
                <Card
                  key={anomaly.id}
                  className={cn(
                    "transition-all hover:scale-[1.01]",
                    cfg.border,
                    cfg.glow
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className={cn("text-[10px]", cfg.color)}>
                        <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                        {cfg.label}
                      </Badge>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(anomaly.detectedAt).toLocaleString("en-IN", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold text-[var(--text-primary)] mt-1">
                      {anomaly.keyword}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-black text-red-600">
                          +{anomaly.spikePercent}%
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {anomaly.baselineVolume} &rarr; {anomaly.currentVolume} vol/h
                        </p>
                      </div>
                      <Activity className={cn(
                        "h-8 w-8",
                        anomaly.severity === "CRITICAL" ? "text-red-400" : "text-amber-400"
                      )} />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full h-7 text-[10px] border-teal-500/30 text-teal-600 hover:bg-teal-500/10"
                      onClick={() => router.push(`/m/yantri/workspace?topic=${encodeURIComponent(anomaly.keyword)}`)}
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> Generate Content
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Section 2: Trend Line Chart ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-[var(--accent-primary)]" />
                Keyword Volume — 48h
              </CardTitle>
              <CardDescription className="text-xs">
                Click a keyword to view its time-series data
              </CardDescription>
            </div>
          </div>
          {/* Keyword pills */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {trendSeries.map((series) => (
              <Button
                key={series.keyword}
                variant={selectedSeries?.keyword === series.keyword ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 text-xs",
                  selectedSeries?.keyword === series.keyword && "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
                )}
                onClick={() => setSelectedSeries(series)}
              >
                {series.keyword}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {selectedSeries ? (
            <div className="space-y-3">
              {/* Large chart area */}
              <div className="relative rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedSeries.keyword}</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Peak: {Math.max(...selectedSeries.points.map((p) => p.volume)).toLocaleString()} vol/h
                  </span>
                </div>
                {/* SVG Line Chart */}
                <div className="w-full overflow-hidden">
                  <svg viewBox="0 0 800 200" className="w-full h-48" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={i}
                        x1={0}
                        y1={i * 50}
                        x2={800}
                        y2={i * 50}
                        stroke="#F0F2F5"
                        strokeWidth="1"
                      />
                    ))}
                    {/* Area fill */}
                    <path
                      d={(() => {
                        const pts = selectedSeries.points;
                        const max = Math.max(...pts.map((p) => p.volume));
                        const min = Math.min(...pts.map((p) => p.volume));
                        const range = max - min || 1;
                        const pathParts = pts.map((p, i) => {
                          const x = (i / (pts.length - 1)) * 800;
                          const y = 195 - ((p.volume - min) / range) * 185;
                          return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                        });
                        return `${pathParts.join(" ")} L 800 200 L 0 200 Z`;
                      })()}
                      fill="url(#areaGradient)"
                      opacity={0.3}
                    />
                    {/* Line */}
                    <path
                      d={(() => {
                        const pts = selectedSeries.points;
                        const max = Math.max(...pts.map((p) => p.volume));
                        const min = Math.min(...pts.map((p) => p.volume));
                        const range = max - min || 1;
                        return pts
                          .map((p, i) => {
                            const x = (i / (pts.length - 1)) * 800;
                            const y = 195 - ((p.volume - min) / range) * 185;
                            return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          })
                          .join(" ");
                      })()}
                      fill="none"
                      stroke="#2E86AB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2E86AB" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#2E86AB" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                {/* Time axis */}
                <div className="flex justify-between mt-1 text-[10px] text-[var(--text-muted)]">
                  <span>48h ago</span>
                  <span>36h</span>
                  <span>24h</span>
                  <span>12h</span>
                  <span>Now</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
              <BarChart3 className="h-10 w-10 mb-2" />
              <p className="text-sm">Select a keyword above to view its trend line</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Section 3: All Trends — Sparkline Table ═══ */}
      {trendSeries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">All Tracked Keywords</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#F0F2F5]">
              {trendSeries.map((series) => {
                const peak = Math.max(...series.points.map((p) => p.volume));
                const latest = series.points[series.points.length - 1]?.volume ?? 0;
                const earliest = series.points[0]?.volume ?? 0;
                const change = earliest > 0 ? ((latest - earliest) / earliest) * 100 : 0;

                return (
                  <div
                    key={series.keyword}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--bg-surface)] cursor-pointer transition-colors"
                    onClick={() => setSelectedSeries(series)}
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)] w-40 shrink-0">{series.keyword}</span>
                    <MiniSparkline
                      points={series.points.slice(-24)}
                      color={change > 100 ? "#EF4444" : change > 0 ? "#2E86AB" : "#9CA3AF"}
                    />
                    <div className="flex items-center gap-1 ml-auto">
                      {change > 0 ? (
                        <ArrowUp className={cn("h-3.5 w-3.5", change > 100 ? "text-red-500" : "text-emerald-500")} />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      )}
                      <span className={cn(
                        "text-xs font-bold tabular-nums",
                        change > 100 ? "text-red-600" : change > 0 ? "text-emerald-600" : "text-[var(--text-secondary)]"
                      )}>
                        {change > 0 ? "+" : ""}{change.toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] tabular-nums w-20 text-right">
                      Peak: {peak.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Section 4: Live Ranked Trends (from Khabri API) ═══ */}
      {trends.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Ranked Trends</h2>
            <Badge variant="outline" className="text-[10px]">Live from Khabri</Badge>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-left">
                  <th className="px-5 py-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider w-12">Rank</th>
                  <th className="px-5 py-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Topic</th>
                  <th className="px-5 py-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Region</th>
                  <th className="px-5 py-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider text-right">Score</th>
                  <th className="px-5 py-3 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {trends.map((trend) => (
                  <tr
                    key={trend.id}
                    className={cn(
                      "hover:bg-[var(--bg-surface)] transition-colors cursor-pointer",
                      selectedTrend?.id === trend.id && "bg-[var(--accent-primary)]/5"
                    )}
                    onClick={() => setSelectedTrend(selectedTrend?.id === trend.id ? null : trend)}
                  >
                    <td className="px-5 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-xs font-bold text-[var(--accent-primary)]">
                        {trend.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{trend.topic}</p>
                    </td>
                    <td className="px-5 py-3">
                      {trend.category ? (
                        <Badge variant="outline" className="text-xs">{trend.category}</Badge>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-[var(--text-secondary)]">{trend.region || "—"}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {trend.score >= 80 ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                        ) : trend.score >= 50 ? (
                          <ArrowUp className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        )}
                        <span className={cn(
                          "text-sm font-semibold",
                          trend.score >= 80 ? "text-emerald-600" : trend.score >= 50 ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
                        )}>
                          {trend.score}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] text-teal-600 hover:text-teal-700 hover:bg-teal-600/5"
                        onClick={(e) => { e.stopPropagation(); router.push(`/m/yantri/workspace?topic=${encodeURIComponent(trend.topic)}`); }}
                      >
                        <Sparkles className="h-3 w-3 mr-1" /> Generate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          {selectedTrend && (
            <div className="rounded-xl border border-[#2E86AB]/20 bg-[var(--accent-primary)]/5 p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{selectedTrend.topic}</h3>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                <span>Score: <strong className="text-[var(--text-primary)]">{selectedTrend.score}</strong></span>
                {selectedTrend.category && <span>Category: <strong className="text-[var(--text-primary)]">{selectedTrend.category}</strong></span>}
                {selectedTrend.region && <span>Region: <strong className="text-[var(--text-primary)]">{selectedTrend.region}</strong></span>}
                {selectedTrend.momentum !== undefined && <span>Momentum: <strong className="text-[var(--text-primary)]">{selectedTrend.momentum}</strong></span>}
                {selectedTrend.sourceCount !== undefined && <span>Sources: <strong className="text-[var(--text-primary)]">{selectedTrend.sourceCount}</strong></span>}
              </div>
            </div>
          )}

          {/* Pagination */}
          {meta && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">
                Page {meta.page} &middot; {meta.total} total trends
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
