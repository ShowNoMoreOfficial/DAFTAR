"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KhabriTrend, KhabriMeta } from "@/types/khabri";

// ─── Component ──────────────────────────────────────────

export default function KhabriTrendsPage() {
  const [trends, setTrends] = useState<KhabriTrend[]>([]);
  const [meta, setMeta] = useState<KhabriMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedTrend, setSelectedTrend] = useState<KhabriTrend | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/khabri/trends?page=${page}&pageSize=20`);
      if (res.ok) {
        const data = await res.json();
        setTrends(data.data || []);
        setMeta(data.meta || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#2E86AB]" /> Trends
          </h1>
          <p className="text-sm text-[#6B7280]">Ranked trend analysis and tracking</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTrends} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E86AB]" />
        </div>
      ) : (
        <>
          {/* Trend Table */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-left">
                  <th className="px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider w-12">Rank</th>
                  <th className="px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Topic</th>
                  <th className="px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">Region</th>
                  <th className="px-5 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {trends.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#9CA3AF]">
                      No trends found
                    </td>
                  </tr>
                ) : (
                  trends.map((trend) => (
                    <tr
                      key={trend.id}
                      className={cn(
                        "hover:bg-[#F8F9FA] transition-colors cursor-pointer",
                        selectedTrend?.id === trend.id && "bg-[#2E86AB]/5"
                      )}
                      onClick={() => setSelectedTrend(selectedTrend?.id === trend.id ? null : trend)}
                    >
                      <td className="px-5 py-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2E86AB]/10 text-xs font-bold text-[#2E86AB]">
                          {trend.rank}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-[#1A1A1A]">{trend.topic}</p>
                      </td>
                      <td className="px-5 py-3">
                        {trend.category ? (
                          <Badge variant="outline" className="text-xs">{trend.category}</Badge>
                        ) : (
                          <span className="text-xs text-[#9CA3AF]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-[#6B7280]">{trend.region || "—"}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {trend.score >= 80 ? (
                            <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                          ) : trend.score >= 50 ? (
                            <ArrowUp className="h-3.5 w-3.5 text-[#2E86AB]" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
                          )}
                          <span className={cn(
                            "text-sm font-semibold",
                            trend.score >= 80 ? "text-emerald-600" : trend.score >= 50 ? "text-[#2E86AB]" : "text-[#6B7280]"
                          )}>
                            {trend.score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          {selectedTrend && (
            <div className="rounded-xl border border-[#2E86AB]/20 bg-[#2E86AB]/5 p-5">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">{selectedTrend.topic}</h3>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#6B7280]">
                <span>Score: <strong className="text-[#1A1A1A]">{selectedTrend.score}</strong></span>
                {selectedTrend.category && <span>Category: <strong className="text-[#1A1A1A]">{selectedTrend.category}</strong></span>}
                {selectedTrend.region && <span>Region: <strong className="text-[#1A1A1A]">{selectedTrend.region}</strong></span>}
                {selectedTrend.momentum !== undefined && <span>Momentum: <strong className="text-[#1A1A1A]">{selectedTrend.momentum}</strong></span>}
                {selectedTrend.sourceCount !== undefined && <span>Sources: <strong className="text-[#1A1A1A]">{selectedTrend.sourceCount}</strong></span>}
              </div>
            </div>
          )}

          {/* Pagination */}
          {meta && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#9CA3AF]">
                Page {meta.page} • {meta.total} total trends
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
