"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Loader2,
  RefreshCw,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KhabriVolumePoint, KhabriCategoryBreakdown, KhabriSentimentPoint } from "@/types/khabri";

// ─── Component ──────────────────────────────────────────

export default function KhabriAnalyticsPage() {
  const [volume, setVolume] = useState<KhabriVolumePoint[]>([]);
  const [categories, setCategories] = useState<KhabriCategoryBreakdown[]>([]);
  const [sentiment, setSentiment] = useState<KhabriSentimentPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [interval, setInterval] = useState<"hour" | "day">("hour");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [volRes, catRes, sentRes] = await Promise.all([
        fetch(`/api/khabri/analytics/volume?hours=${hours}&interval=${interval}`),
        fetch(`/api/khabri/analytics/categories?hours=${hours}`),
        fetch(`/api/khabri/analytics/sentiment?hours=${hours}&interval=${interval}`),
      ]);

      if (volRes.ok) {
        const v = await volRes.json();
        // API returns {data: {interval, dataPoints: [...], total}}
        setVolume(v.data?.dataPoints || v.data || []);
      }
      if (catRes.ok) {
        const c = await catRes.json();
        // API returns {data: {categories: [...], total, uncategorized}}
        const rawCats = c.data?.categories || c.data || [];
        setCategories(
          Array.isArray(rawCats)
            ? rawCats.map((cat: Record<string, unknown>) => ({
                category: (cat.name as string) || (cat.category as string) || "",
                count: (cat.count as number) || 0,
                percentage: (cat.percentage as number) || 0,
              }))
            : []
        );
      }
      if (sentRes.ok) {
        const s = await sentRes.json();
        // API returns {data: {interval, dataPoints: [...], overall}}
        setSentiment(s.data?.dataPoints || s.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [hours, interval]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Compute aggregate sentiment from latest data
  const latestSentiment = sentiment.length > 0 ? sentiment[sentiment.length - 1] : null;
  const totalVolume = volume.reduce((sum, v) => sum + v.count, 0);
  const maxVolumePoint = Math.max(...volume.map((v) => v.count), 1);
  const maxCategoryCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#2E86AB]" /> Analytics
          </h1>
          <p className="text-sm text-[#6B7280]">Signal volume, category distribution, and sentiment analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time Range */}
          <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden">
            {[6, 12, 24, 48, 72].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  hours === h ? "bg-[#2E86AB] text-white" : "bg-white text-[#6B7280] hover:bg-[#F8F9FA]"
                )}
              >
                {h}h
              </button>
            ))}
          </div>
          {/* Interval */}
          <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden">
            {(["hour", "day"] as const).map((int) => (
              <button
                key={int}
                onClick={() => setInterval(int)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                  interval === int ? "bg-[#A23B72] text-white" : "bg-white text-[#6B7280] hover:bg-[#F8F9FA]"
                )}
              >
                {int}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E86AB]" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <SummaryCard
              icon={<Activity className="h-5 w-5 text-[#2E86AB]" />}
              label="Total Signals"
              value={totalVolume.toLocaleString()}
            />
            <SummaryCard
              icon={<BarChart3 className="h-5 w-5 text-[#A23B72]" />}
              label="Categories"
              value={categories.length}
            />
            <SummaryCard
              icon={<ThumbsUp className="h-5 w-5 text-emerald-600" />}
              label="Positive Signals"
              value={latestSentiment?.positive || 0}
            />
            <SummaryCard
              icon={<ThumbsDown className="h-5 w-5 text-red-500" />}
              label="Negative Signals"
              value={latestSentiment?.negative || 0}
            />
          </div>

          {/* Signal Volume Chart (bar chart) */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white">
            <div className="border-b border-[#E5E7EB] px-5 py-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#2E86AB]" /> Signal Volume
              </h2>
            </div>
            <div className="px-5 py-4">
              {volume.length === 0 ? (
                <p className="text-center text-sm text-[#9CA3AF] py-8">No volume data available</p>
              ) : (
                <div className="flex items-end gap-1 h-40">
                  {volume.map((point, i) => {
                    const height = (point.count / maxVolumePoint) * 100;
                    return (
                      <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                        <div
                          className="w-full rounded-t bg-[#2E86AB]/70 hover:bg-[#2E86AB] transition-colors min-h-[2px]"
                          style={{ height: `${Math.max(height, 1)}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                          <div className="rounded bg-[#1A1A1A] px-2 py-1 text-xs text-white whitespace-nowrap">
                            {point.count} signals
                            <br />
                            {new Date(point.timestamp).toLocaleString(undefined, {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Category Distribution */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#E5E7EB] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1A1A1A]">Category Distribution</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {categories.length === 0 ? (
                  <p className="text-center text-sm text-[#9CA3AF] py-4">No category data</p>
                ) : (
                  categories.map((cat) => {
                    const barWidth = (cat.count / maxCategoryCount) * 100;
                    return (
                      <div key={cat.category} className="flex items-center gap-3">
                        <span className="text-sm text-[#1A1A1A] w-28 truncate shrink-0">{cat.category}</span>
                        <div className="flex-1 h-5 rounded-full bg-[#F0F2F5] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#2E86AB]/70"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#6B7280] w-14 text-right shrink-0">
                          {cat.count} ({cat.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sentiment Timeline */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#E5E7EB] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1A1A1A]">Sentiment Over Time</h2>
              </div>
              <div className="px-5 py-4 space-y-2">
                {sentiment.length === 0 ? (
                  <p className="text-center text-sm text-[#9CA3AF] py-4">No sentiment data</p>
                ) : (
                  sentiment.map((point, i) => {
                    const total = point.positive + point.negative + point.neutral + point.mixed;
                    if (total === 0) return null;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9CA3AF] w-16 shrink-0">
                          {new Date(point.timestamp).toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "2-digit"
                          })}
                        </span>
                        <div className="flex-1 h-4 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-400 h-full" style={{ width: `${(point.positive / total) * 100}%` }} />
                          <div className="bg-gray-300 h-full" style={{ width: `${(point.neutral / total) * 100}%` }} />
                          <div className="bg-yellow-400 h-full" style={{ width: `${(point.mixed / total) * 100}%` }} />
                          <div className="bg-red-400 h-full" style={{ width: `${(point.negative / total) * 100}%` }} />
                        </div>
                        <span className={cn(
                          "text-xs font-medium w-10 text-right shrink-0",
                          point.avgScore > 0 ? "text-emerald-600" : point.avgScore < 0 ? "text-red-600" : "text-[#6B7280]"
                        )}>
                          {point.avgScore > 0 ? "+" : ""}{point.avgScore.toFixed(1)}
                        </span>
                      </div>
                    );
                  })
                )}
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 pt-2 text-xs text-[#9CA3AF]">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Positive</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-300" /> Neutral</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" /> Mixed</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Negative</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Summary Card ───────────────────────────────────────

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0F2F5]">{icon}</div>
      <div>
        <p className="text-xl font-bold text-[#1A1A1A]">{value}</p>
        <p className="text-xs text-[#6B7280]">{label}</p>
      </div>
    </div>
  );
}
