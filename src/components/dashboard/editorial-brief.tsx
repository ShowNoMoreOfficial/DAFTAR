"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  Clock,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BriefRecommendation {
  title: string;
  angle: string;
  brandName: string;
  brandId: string;
  platform: string;
  contentType: string;
  urgency: string;
  reason: string;
}

interface BriefTrend {
  id: string;
  name: string;
  velocity: number | null;
  lifecycle: string;
  signalCount: number;
}

interface BriefData {
  recommendations: BriefRecommendation[];
  trends: BriefTrend[];
  generatedAt: string;
  empty?: boolean;
}

const CACHE_KEY = "daftar-editorial-brief";
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  immediate: { label: "Now", color: "bg-red-500/15 text-red-500 border-red-500/30" },
  within_24h: { label: "24h", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  within_48h: { label: "48h", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  evergreen: { label: "Evergreen", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
};

const PLATFORM_LABELS: Record<string, string> = {
  YOUTUBE: "YouTube",
  X_THREAD: "X Thread",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
};

function getCachedBrief(): BriefData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { data: BriefData; cachedAt: number };
    if (Date.now() - cached.cachedAt > CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function setCachedBrief(data: BriefData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch { /* quota exceeded */ }
}

export function EditorialBrief() {
  const [data, setData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchBrief = async (force = false) => {
    if (!force) {
      const cached = getCachedBrief();
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/yantri/editorial-brief");
      if (!res.ok) throw new Error("Failed");
      const briefData: BriefData = await res.json();
      setData(briefData);
      setCachedBrief(briefData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrief(); }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Daily Editorial Brief</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-primary)]" />
          <span className="ml-2 text-xs text-[var(--text-muted)]">Generating editorial brief...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Daily Editorial Brief</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => fetchBrief(true)} className="h-7 text-[10px]">
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">Could not load editorial brief.</p>
      </div>
    );
  }

  if (!data || data.empty || data.recommendations.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Daily Editorial Brief</h3>
        </div>
        <p className="text-xs text-[var(--text-muted)]">No trending topics right now. Check back later.</p>
      </div>
    );
  }

  const generatedTime = new Date(data.generatedAt).toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Daily Editorial Brief</h3>
          <span className="text-[10px] text-[var(--text-muted)]">{generatedTime}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => fetchBrief(true)} className="h-7 text-[10px]">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Trending context */}
      {data.trends.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <TrendingUp className="h-3 w-3 text-[var(--text-muted)]" />
          {data.trends.map((t) => (
            <Badge key={t.id} variant="outline" className="text-[10px] gap-1">
              {t.name}
              {t.velocity != null && <span className="text-emerald-500">{t.velocity > 0 ? "+" : ""}{t.velocity.toFixed(1)}</span>}
            </Badge>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-2">
        {data.recommendations.slice(0, 5).map((rec, i) => {
          const urgency = URGENCY_CONFIG[rec.urgency] || URGENCY_CONFIG.evergreen;
          const platform = PLATFORM_LABELS[rec.platform] || rec.platform;

          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] px-3 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <span className="text-xs font-bold text-[var(--text-muted)] mt-0.5 shrink-0 w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">{rec.title}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{rec.angle}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[9px]">{rec.brandName}</Badge>
                  <Badge variant="outline" className="text-[9px]">{platform}</Badge>
                  <Badge variant="outline" className={cn("text-[9px] border", urgency.color)}>
                    <Clock className="h-2.5 w-2.5 mr-0.5" /> {urgency.label}
                  </Badge>
                </div>
              </div>
              <Link
                href={`/content-studio?topic=${encodeURIComponent(rec.title)}&auto=true`}
                className="shrink-0 flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-700 font-medium mt-0.5"
              >
                Create <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
