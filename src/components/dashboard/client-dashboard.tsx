"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Palette,
  Globe,
  ArrowRight,
  Eye,
  Heart,
  TrendingUp,
  FileCheck,
  Clock,
  Calendar,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  Loader2,
} from "lucide-react";

interface ClientDashboardData {
  brands: {
    id: string;
    name: string;
    slug: string;
    clientName: string;
    platforms: { platform: string; isActive: boolean }[];
  }[];
  pendingReview: {
    id: string;
    title: string;
    type: string;
    status: string;
    brandName: string;
    brandId: string;
    createdAt: string;
  }[];
  recentContent: {
    id: string;
    title: string;
    platform: string;
    brandName: string;
    publishedAt: string | null;
    views: number;
    likes: number;
    engagementRate: number;
  }[];
  calendar: {
    id: string;
    title: string;
    platform: string;
    brandName: string;
    scheduledAt: string;
  }[];
  stats: {
    totalBrands: number;
    pendingReviewCount: number;
    publishedCount: number;
    totalViews: number;
  };
}

const platformColors: Record<string, string> = {
  youtube: "bg-[rgba(239,68,68,0.15)] text-red-700",
  instagram: "bg-[rgba(236,72,153,0.15)] text-pink-700",
  x: "bg-[var(--bg-elevated)] text-gray-700",
  twitter: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  linkedin: "bg-[rgba(59,130,246,0.15)] text-blue-800",
  facebook: "bg-indigo-100 text-indigo-700",
  tiktok: "bg-[rgba(168,85,247,0.15)] text-purple-700",
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
  });
}

function weekDayName(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

interface ClientDashboardProps {
  userName: string;
}

export function ClientDashboard({ userName }: ClientDashboardProps) {
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  async function handleReview(deliverableId: string, action: "approve" | "request_revision", feedback?: string) {
    setReviewingId(deliverableId);
    try {
      const res = await fetch(`/api/client/deliverables/${deliverableId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback }),
      });
      if (res.ok && data) {
        setData({
          ...data,
          pendingReview: data.pendingReview.filter((d) => d.id !== deliverableId),
          stats: { ...data.stats, pendingReviewCount: data.stats.pendingReviewCount - 1 },
        });
      }
    } finally {
      setReviewingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-64 rounded skeleton-shimmer" />
          <div className="mt-2 h-4 w-48 rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <div className="h-3 w-16 rounded skeleton-shimmer" />
              <div className="mt-3 h-7 w-12 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-16 text-center text-sm text-[var(--text-muted)]">
        Unable to load dashboard data.
      </p>
    );
  }

  const { brands, pendingReview, recentContent, calendar, stats } = data;

  // Generate upcoming 7 days for calendar
  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Welcome back, {userName?.split(" ")[0] || "there"}.
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Here&apos;s an overview of your brands and content.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Brands", value: String(stats.totalBrands), icon: Palette, color: "#A23B72", bg: "bg-[rgba(162,59,114,0.1)]" },
          { label: "Pending Review", value: String(stats.pendingReviewCount), icon: Clock, color: "#F59E0B", bg: "bg-[rgba(245,158,11,0.1)]" },
          { label: "Published", value: formatNumber(stats.publishedCount), icon: FileCheck, color: "#10B981", bg: "bg-[rgba(16,185,129,0.1)]" },
          { label: "Total Views", value: formatNumber(stats.totalViews), icon: Eye, color: "#2E86AB", bg: "bg-[rgba(46,134,171,0.1)]" },
        ].map((kpi) => (
          <div key={kpi.label} className="hover-glow rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">{kpi.label}</p>
              <div className={cn("rounded-lg p-1.5", kpi.bg)}>
                <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Brands row */}
      {brands.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Your Brands</h2>
            <Link href="/brands" className="text-xs text-[var(--accent-primary)] hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
                      <Palette className="h-5 w-5 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{brand.name}</h3>
                      <p className="text-[10px] text-[var(--text-muted)]">{brand.clientName}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {brand.platforms.filter((p) => p.isActive).map((p) => (
                    <Badge
                      key={p.platform}
                      className={cn(
                        "text-[10px] font-medium",
                        platformColors[p.platform.toLowerCase()] || "bg-[var(--bg-elevated)] text-gray-700"
                      )}
                    >
                      <Globe className="mr-1 h-3 w-3" />
                      {p.platform}
                    </Badge>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending Review */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Pending Review</h2>
            <p className="text-xs text-[var(--text-muted)]">Deliverables awaiting your approval</p>
          </div>
          {pendingReview.length > 0 && (
            <Badge className="bg-[rgba(245,158,11,0.15)] text-yellow-800 text-[10px]">
              {pendingReview.length} pending
            </Badge>
          )}
        </div>
        {pendingReview.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
            No deliverables pending review. You&apos;re all caught up!
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {pendingReview.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{d.title}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{d.type.replace(/_/g, " ")}</Badge>
                    <span className="text-[10px] text-[var(--text-muted)]">{d.brandName}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{formatDate(d.createdAt)}</span>
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
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
                    className="h-7 bg-[var(--accent-primary)] text-xs hover:bg-[var(--accent-primary)]/90"
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

      {/* Recent Content Performance */}
      {recentContent.length > 0 && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Content</h2>
            <p className="text-xs text-[var(--text-muted)]">Recently published content with performance</p>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {recentContent.map((post) => (
              <div key={post.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{post.title}</p>
                    <Badge
                      className={cn(
                        "shrink-0 text-[10px]",
                        platformColors[post.platform.toLowerCase()] || "bg-[var(--bg-elevated)] text-gray-700"
                      )}
                    >
                      {post.platform}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)]">{post.brandName}</span>
                    {post.publishedAt && (
                      <span className="text-[10px] text-[var(--text-muted)]">{formatDate(post.publishedAt)}</span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {formatNumber(post.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {formatNumber(post.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {post.engagementRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Calendar */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Upcoming Content</h2>
          <p className="text-xs text-[var(--text-muted)]">Scheduled posts for the next 7 days</p>
        </div>
        <div className="grid grid-cols-7 divide-x divide-[var(--border-subtle)]">
          {upcomingDays.map((day) => {
            const dayStr = day.toISOString().slice(0, 10);
            const dayEvents = calendar.filter(
              (e) => e.scheduledAt && e.scheduledAt.slice(0, 10) === dayStr
            );
            const isToday = dayStr === new Date().toISOString().slice(0, 10);
            return (
              <div key={dayStr} className="min-h-[100px] p-2">
                <p className={cn("mb-1 text-center text-[10px] font-medium", isToday ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]")}>
                  {weekDayName(day)}
                </p>
                <p className={cn("mb-2 text-center text-xs font-semibold", isToday ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]")}>
                  {day.getDate()}
                </p>
                <div className="space-y-1">
                  {dayEvents.map((e) => (
                    <div key={e.id} className="rounded bg-[var(--accent-primary)]/10 px-1.5 py-1">
                      <p className="truncate text-[9px] font-medium text-[var(--accent-primary)]">{e.title}</p>
                      <p className="text-[8px] text-[var(--text-secondary)]">{e.platform}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {calendar.length === 0 && (
          <p className="px-5 py-4 text-center text-sm text-[var(--text-muted)]">No scheduled content this week.</p>
        )}
      </div>
    </div>
  );
}
