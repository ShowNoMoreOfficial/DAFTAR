"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  AlertTriangle,
  Radio,
  Globe2,
  RefreshCw,
  Loader2,
  ArrowUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { KhabriTrend, KhabriAnomaly, KhabriCategoryBreakdown } from "@/types/khabri";

// ─── Severity Config ────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  ELEVATED: { label: "Elevated", color: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-700" },
  CRITICAL: { label: "Critical", color: "bg-red-100 text-red-700" },
};

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  KEYWORD_SPIKE: "Keyword Spike",
  ENTITY_SURGE: "Entity Surge",
  SENTIMENT_SHIFT: "Sentiment Shift",
  GEO_CONCENTRATION: "Geo Concentration",
};

// ─── Component ──────────────────────────────────────────

export default function KhabriDashboardPage() {
  const [topTrends, setTopTrends] = useState<KhabriTrend[]>([]);
  const [anomalies, setAnomalies] = useState<KhabriAnomaly[]>([]);
  const [categories, setCategories] = useState<KhabriCategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendsRes, anomaliesRes, categoriesRes] = await Promise.all([
        fetch("/api/khabri/trends/top?limit=8"),
        fetch("/api/khabri/anomalies/trending"),
        fetch("/api/khabri/analytics/categories?hours=24"),
      ]);

      if (trendsRes.ok) {
        const t = await trendsRes.json();
        setTopTrends(t.data || []);
      }
      if (anomaliesRes.ok) {
        const a = await anomaliesRes.json();
        setAnomalies(a.data || []);
      }
      if (categoriesRes.ok) {
        const c = await categoriesRes.json();
        setCategories(c.data || []);
      }
    } catch {
      setError("Failed to connect to Khabri Intelligence API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E86AB]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="h-10 w-10 text-orange-500" />
        <p className="text-sm text-[#6B7280]">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Khabri Intelligence</h1>
          <p className="text-sm text-[#6B7280]">Real-time signal intelligence, trend detection, and narrative tracking</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <QuickStat
          icon={<TrendingUp className="h-5 w-5 text-[#2E86AB]" />}
          label="Active Trends"
          value={topTrends.length}
          href="/m/khabri/trends"
        />
        <QuickStat
          icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          label="Anomalies"
          value={anomalies.length}
          href="/m/khabri/signals"
        />
        <QuickStat
          icon={<Radio className="h-5 w-5 text-[#A23B72]" />}
          label="Signal Categories"
          value={categories.length}
          href="/m/khabri/analytics"
        />
        <QuickStat
          icon={<Globe2 className="h-5 w-5 text-emerald-600" />}
          label="Geo Intel"
          value="Live"
          href="/m/khabri/geo"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Trends */}
        <div className="lg:col-span-2 rounded-xl border border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#2E86AB]" /> Top Trends
            </h2>
            <Link href="/m/khabri/trends" className="text-xs text-[#2E86AB] hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#F0F2F5]">
            {topTrends.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[#9CA3AF]">No trends detected</div>
            ) : (
              topTrends.map((trend, i) => (
                <div key={trend.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#F8F9FA] transition-colors">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2E86AB]/10 text-xs font-bold text-[#2E86AB]">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">{trend.topic}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {trend.category && (
                        <span className="text-xs text-[#6B7280]">{trend.category}</span>
                      )}
                      {trend.region && (
                        <span className="text-xs text-[#9CA3AF]">• {trend.region}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-sm font-semibold text-[#1A1A1A]">{trend.score}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Anomalies */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" /> Anomalies
            </h2>
          </div>
          <div className="divide-y divide-[#F0F2F5]">
            {anomalies.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[#9CA3AF]">No anomalies detected</div>
            ) : (
              anomalies.slice(0, 6).map((anomaly) => {
                const sev = SEVERITY_CONFIG[anomaly.severity] || SEVERITY_CONFIG.ELEVATED;
                return (
                  <div key={anomaly.id} className="px-5 py-3 hover:bg-[#F8F9FA] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#1A1A1A]">{anomaly.subject}</p>
                      <Badge className={cn("shrink-0 text-[10px]", sev.color)}>{sev.label}</Badge>
                    </div>
                    <span className="text-xs text-[#9CA3AF] mt-1 block">
                      {ANOMALY_TYPE_LABELS[anomaly.type] || anomaly.type}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      {categories.length > 0 && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Signal Categories (24h)</h2>
            <Link href="/m/khabri/analytics" className="text-xs text-[#2E86AB] hover:underline flex items-center gap-1">
              Full analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => (
              <div key={cat.category} className="text-center">
                <p className="text-lg font-bold text-[#1A1A1A]">{cat.count}</p>
                <p className="text-xs text-[#6B7280] truncate">{cat.category}</p>
                <div className="mx-auto mt-1.5 h-1.5 w-full max-w-[80px] rounded-full bg-[#F0F2F5]">
                  <div
                    className="h-full rounded-full bg-[#2E86AB]"
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quick Stat Card ────────────────────────────────────

function QuickStat({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 transition-colors hover:border-[#2E86AB]/30 hover:bg-[#F8F9FA]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0F2F5]">
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-[#1A1A1A]">{value}</p>
        <p className="text-xs text-[#6B7280]">{label}</p>
      </div>
    </Link>
  );
}
