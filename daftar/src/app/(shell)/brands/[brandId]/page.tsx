"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Eye,
  Heart,
  Share2,
  TrendingUp,
  FileCheck,
  BarChart3,
  Calendar,
  Globe,
  CheckCircle2,
  MessageSquare,
  Loader2,
  Settings,
} from "lucide-react";

interface PostAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

interface RecentPost {
  id: string;
  title: string;
  platform: string;
  publishedAt: string | null;
  publishedUrl: string | null;
  analytics: PostAnalytics | null;
}

interface BrandPerformance {
  brand: {
    id: string;
    name: string;
    slug: string;
    client: { id: string; name: string; userId: string | null };
    platforms: { platform: string; isActive: boolean }[];
  };
  metrics: {
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    avgEngagement: number;
    pendingDeliverables: number;
  };
  recentPosts: RecentPost[];
}

interface Deliverable {
  id: string;
  title: string;
  type: string;
  status: string;
  thumbnailUrl: string | null;
  createdAt: string;
  feedback: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  platform: string;
  scheduledAt: string;
  status: string;
}

const platformColors: Record<string, string> = {
  youtube: "bg-red-100 text-red-700",
  instagram: "bg-pink-100 text-pink-700",
  x: "bg-gray-100 text-gray-700",
  twitter: "bg-blue-100 text-blue-700",
  linkedin: "bg-blue-100 text-blue-800",
  facebook: "bg-indigo-100 text-indigo-700",
  tiktok: "bg-purple-100 text-purple-700",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function weekDayName(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export default function BrandDetailPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const [data, setData] = useState<BrandPerformance | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`/api/client/brands/${brandId}/performance`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/client/brands/${brandId}/deliverables?status=ready_for_review`).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`/api/relay/calendar?brandId=${brandId}`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([perfData, delData, calData]) => {
        setData(perfData);
        setDeliverables(Array.isArray(delData) ? delData : []);
        setCalendar(Array.isArray(calData) ? calData : []);
      })
      .finally(() => setLoading(false));
  }, [brandId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleReview(deliverableId: string, action: "approve" | "request_revision", feedback?: string) {
    setReviewingId(deliverableId);
    try {
      const res = await fetch(`/api/client/deliverables/${deliverableId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback }),
      });
      if (res.ok) {
        setDeliverables((prev) => prev.filter((d) => d.id !== deliverableId));
      }
    } finally {
      setReviewingId(null);
    }
  }

  // Generate upcoming 7 days for calendar
  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/brands" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A]">
          <ArrowLeft className="h-4 w-4" /> Back to Brands
        </Link>
        <p className="py-12 text-center text-sm text-[#9CA3AF]">
          Unable to load brand data. You may not have access to this brand.
        </p>
      </div>
    );
  }

  const { brand, metrics, recentPosts } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/brands" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A]">
        <ArrowLeft className="h-4 w-4" /> Back to Brands
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">{brand.name}</h1>
          <p className="text-sm text-[#9CA3AF]">{brand.client.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {brand.platforms.map((p) => (
            <Badge
              key={p.platform}
              className={cn(
                "text-[10px] font-medium",
                platformColors[p.platform.toLowerCase()] || "bg-gray-100 text-gray-700"
              )}
            >
              <Globe className="mr-1 h-3 w-3" />
              {p.platform}
            </Badge>
          ))}
          <Link href={`/brands/${brandId}/manage`}>
            <Button variant="outline" size="sm" className="text-xs">
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Manage Brand
            </Button>
          </Link>
          <Link href={`/brands/${brandId}/deliverables`}>
            <Button variant="outline" size="sm" className="text-xs">
              <FileCheck className="mr-1.5 h-3.5 w-3.5" />
              All Deliverables
            </Button>
          </Link>
          <Link href={`/brands/${brandId}/reports`}>
            <Button variant="outline" size="sm" className="text-xs">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Posts", value: formatNumber(metrics.totalPosts), icon: BarChart3, color: "#2E86AB" },
          { label: "Total Views", value: formatNumber(metrics.totalViews), icon: Eye, color: "#2E86AB" },
          { label: "Avg Engagement", value: metrics.avgEngagement.toFixed(1) + "%", icon: TrendingUp, color: "#A23B72" },
          { label: "Pending Deliverables", value: metrics.pendingDeliverables.toString(), icon: FileCheck, color: "#A23B72" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <div className="mb-2 flex items-center gap-2">
              <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
              <span className="text-xs text-[#6B7280]">{kpi.label}</span>
            </div>
            <p className="text-2xl font-semibold text-[#1A1A1A]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Content Performance */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Content Performance</h2>
          <p className="text-xs text-[#9CA3AF]">Recent published content with analytics</p>
        </div>
        {recentPosts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#9CA3AF]">No published content yet.</p>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-[#1A1A1A]">{post.title}</p>
                    <Badge
                      className={cn(
                        "shrink-0 text-[10px]",
                        platformColors[post.platform.toLowerCase()] || "bg-gray-100 text-gray-700"
                      )}
                    >
                      {post.platform}
                    </Badge>
                  </div>
                  {post.publishedAt && (
                    <p className="text-[10px] text-[#9CA3AF]">{formatDate(post.publishedAt)}</p>
                  )}
                </div>
                {post.analytics && (
                  <div className="ml-4 flex items-center gap-4 text-xs text-[#6B7280]">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {formatNumber(post.analytics.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {formatNumber(post.analytics.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3.5 w-3.5" />
                      {formatNumber(post.analytics.shares)}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {post.analytics.engagementRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Deliverables */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Pending Deliverables</h2>
            <p className="text-xs text-[#9CA3AF]">Items awaiting your review</p>
          </div>
          <Link href={`/brands/${brandId}/deliverables`}>
            <Button variant="ghost" size="sm" className="text-xs text-[#2E86AB]">
              View All
            </Button>
          </Link>
        </div>
        {deliverables.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#9CA3AF]">No deliverables pending review.</p>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {deliverables.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1A1A1A]">{d.title}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{d.type}</Badge>
                    <span className="text-[10px] text-[#9CA3AF]">{formatDate(d.createdAt)}</span>
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-[#A23B72] hover:bg-[#A23B72]/5"
                    disabled={reviewingId === d.id}
                    onClick={() => {
                      const feedback = window.prompt("Revision feedback:");
                      if (feedback) handleReview(d.id, "request_revision", feedback);
                    }}
                  >
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Revise
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 bg-[#2E86AB] text-xs hover:bg-[#2E86AB]/90"
                    disabled={reviewingId === d.id}
                    onClick={() => handleReview(d.id, "approve")}
                  >
                    {reviewingId === d.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content Calendar */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Upcoming Content</h2>
          <p className="text-xs text-[#9CA3AF]">Scheduled posts for the next 7 days</p>
        </div>
        <div className="grid grid-cols-7 divide-x divide-[#E5E7EB]">
          {upcomingDays.map((day) => {
            const dayStr = day.toISOString().slice(0, 10);
            const dayEvents = calendar.filter(
              (e) => e.scheduledAt && e.scheduledAt.slice(0, 10) === dayStr
            );
            const isToday = dayStr === new Date().toISOString().slice(0, 10);
            return (
              <div key={dayStr} className="min-h-[100px] p-2">
                <p
                  className={cn(
                    "mb-1 text-center text-[10px] font-medium",
                    isToday ? "text-[#2E86AB]" : "text-[#6B7280]"
                  )}
                >
                  {weekDayName(day)}
                </p>
                <p
                  className={cn(
                    "mb-2 text-center text-xs font-semibold",
                    isToday ? "text-[#2E86AB]" : "text-[#1A1A1A]"
                  )}
                >
                  {day.getDate()}
                </p>
                <div className="space-y-1">
                  {dayEvents.map((e) => (
                    <div
                      key={e.id}
                      className="rounded bg-[#2E86AB]/10 px-1.5 py-1"
                    >
                      <p className="truncate text-[9px] font-medium text-[#2E86AB]">
                        {e.title}
                      </p>
                      <p className="text-[8px] text-[#6B7280]">{e.platform}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {calendar.length === 0 && (
          <p className="px-5 py-4 text-center text-sm text-[#9CA3AF]">No scheduled content this week.</p>
        )}
      </div>
    </div>
  );
}
