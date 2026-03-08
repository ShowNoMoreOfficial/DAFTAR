"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Heart,
  Share2,
  TrendingUp,
  BarChart3,
  Loader2,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

interface AnalyticsData {
  totalPosts: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  totalClicks: number;
  totalReach: number;
  totalImpressions: number;
  platformBreakdown: {
    platform: string;
    posts: number;
    views: number;
    engagementRate: number;
  }[];
  topPosts: {
    id: string;
    title: string;
    platform: string;
    brandName: string;
    views: number;
    engagementRate: number;
    publishedAt: string | null;
  }[];
}

// ─── Constants ──────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "bg-[#FF0000]",
  x: "bg-[#000000]",
  instagram: "bg-[#E4405F]",
  linkedin: "bg-[#0A66C2]",
  facebook: "bg-[#1877F2]",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

// ─── Component ──────────────────────────────────────────

export default function RelayAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (brandId) params.set("brandId", brandId);
      const res = await fetch(`/api/relay/analytics?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [period, brandId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((d) => setBrands(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-sm text-[#9CA3AF]">
        Unable to load analytics data.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Content Analytics</h2>
          <p className="text-sm text-[#9CA3AF]">
            Performance metrics across all platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#6B7280]"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-white p-0.5">
            {[
              { label: "7d", value: "7" },
              { label: "30d", value: "30" },
              { label: "90d", value: "90" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  period === p.value ? "bg-[#2E86AB] text-white" : "text-[#6B7280] hover:bg-[#F0F2F5]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <MetricCard
          icon={<BarChart3 className="h-5 w-5 text-[#2E86AB]" />}
          label="Total Posts"
          value={String(data.totalPosts)}
        />
        <MetricCard
          icon={<Eye className="h-5 w-5 text-purple-500" />}
          label="Total Views"
          value={formatNumber(data.totalViews)}
        />
        <MetricCard
          icon={<Heart className="h-5 w-5 text-pink-500" />}
          label="Total Engagement"
          value={formatNumber(data.totalEngagement)}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-[#A23B72]" />}
          label="Avg Engagement Rate"
          value={`${data.avgEngagementRate}%`}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Platform breakdown */}
        <div className="col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">Platform Breakdown</h3>
          <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
            {data.platformBreakdown.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#9CA3AF]">No platform data</p>
            ) : (
              data.platformBreakdown.map((p) => (
                <div key={p.platform} className="flex items-center gap-3">
                  <div className={cn("h-3 w-3 rounded-full", PLATFORM_COLORS[p.platform] || "bg-gray-400")} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        {PLATFORM_LABELS[p.platform] || p.platform}
                      </span>
                      <span className="text-xs text-[#6B7280]">{p.posts} posts</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-[#9CA3AF]">
                      <span>{formatNumber(p.views)} views</span>
                      <span>{p.engagementRate}% eng.</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F3F4F6]">
                      <div
                        className={cn("h-full rounded-full", PLATFORM_COLORS[p.platform] || "bg-gray-400")}
                        style={{ width: `${Math.min(p.engagementRate * 10, 100)}%`, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top performing posts */}
        <div className="col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-[#1A1A1A]">Top Performing Posts</h3>
          <div className="rounded-lg border border-[#E5E7EB] bg-white">
            {data.topPosts.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#9CA3AF]">No published posts yet</p>
            ) : (
              <div className="divide-y divide-[#F0F2F5]">
                {data.topPosts.map((post, i) => (
                  <div key={post.id} className="flex items-center gap-4 px-4 py-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        i < 3 ? "bg-[#2E86AB] text-white" : "bg-[#F0F2F5] text-[#6B7280]"
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1A1A1A]">{post.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                        <span className="flex items-center gap-1">
                          <div className={cn("h-1.5 w-1.5 rounded-full", PLATFORM_COLORS[post.platform] || "bg-gray-400")} />
                          {PLATFORM_LABELS[post.platform] || post.platform}
                        </span>
                        <span>{post.brandName}</span>
                        {post.publishedAt && (
                          <span>
                            {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-[#6B7280]">
                        <Eye className="h-3 w-3" />
                        {formatNumber(post.views)}
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="h-3 w-3" />
                        {post.engagementRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-[#9CA3AF]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
