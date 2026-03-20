"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Radio,
  Search,
  Brain,
  Eye,
  CheckCircle2,
  Send,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Image,
  Video,
  FileText,
  ArrowRight,
  XCircle,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───

interface Deliverable {
  id: string;
  status: string;
  platform: string;
  pipelineType: string;
  copyMarkdown: string;
  createdAt: string;
  updatedAt: string;
  brand: { id: string; name: string } | null;
  tree: { id: string; title: string } | null;
  assets: { id: string; type: string }[];
}

// ─── Status groups ───

const STATUS_GROUPS = [
  { id: "REVIEW", label: "Needs Review", icon: Eye, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", dot: "bg-purple-400" },
  { id: "DRAFTED", label: "Drafts", icon: Brain, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "bg-orange-400" },
  { id: "APPROVED", label: "Approved", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  { id: "PLANNED", label: "Planned", icon: Radio, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400" },
  { id: "RESEARCHING", label: "Researching", icon: Search, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" },
  { id: "RELAYED", label: "Publishing", icon: Send, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", dot: "bg-cyan-400" },
  { id: "PUBLISHED", label: "Published", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", dot: "bg-green-400" },
  { id: "KILLED", label: "Killed", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400" },
] as const;

const PLATFORM_LABELS: Record<string, string> = {
  YOUTUBE: "YouTube", X_THREAD: "X Thread", X_SINGLE: "X Post",
  BLOG: "Blog", LINKEDIN: "LinkedIn", META_REEL: "Reel",
  META_CAROUSEL: "Carousel", META_POST: "Meta Post",
};

const PLATFORM_ICONS: Record<string, string> = {
  YOUTUBE: "▶", X_THREAD: "𝕏", X_SINGLE: "𝕏",
  BLOG: "📝", LINKEDIN: "in", META_REEL: "🎬",
  META_CAROUSEL: "◫", META_POST: "◉",
};

// Text-only platforms eligible for direct publish
const TEXT_ONLY_PLATFORMS = ["X_SINGLE", "X_THREAD", "LINKEDIN", "META_POST"];

// ─── Component ───

export default function PipelinePage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ PUBLISHED: true, KILLED: true });
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Filters
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchDeliverables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/yantri/deliverables");
      if (!res.ok) throw new Error("Failed to load deliverables");
      const data = await res.json();
      setDeliverables(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeliverables(); }, [fetchDeliverables]);

  // Derived data
  const brands = useMemo(() => {
    const set = new Map<string, string>();
    deliverables.forEach(d => { if (d.brand) set.set(d.brand.id, d.brand.name); });
    return Array.from(set, ([id, name]) => ({ id, name }));
  }, [deliverables]);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    deliverables.forEach(d => set.add(d.platform));
    return Array.from(set);
  }, [deliverables]);

  const filtered = useMemo(() => {
    return deliverables.filter(d => {
      if (brandFilter !== "all" && d.brand?.id !== brandFilter) return false;
      if (platformFilter !== "all" && d.platform !== platformFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    });
  }, [deliverables, brandFilter, platformFilter, statusFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, Deliverable[]> = {};
    STATUS_GROUPS.forEach(g => { map[g.id] = []; });
    filtered.forEach(d => {
      if (map[d.status]) map[d.status].push(d);
      // Unknown statuses go to PLANNED
      else if (map.PLANNED) map.PLANNED.push(d);
    });
    return map;
  }, [filtered]);

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePublish = async (deliverable: Deliverable) => {
    if (publishingId) return;
    setPublishingId(deliverable.id);
    try {
      // Create a relay post from deliverable, then publish
      const createRes = await fetch("/api/relay/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: deliverable.brand?.id,
          platform: deliverable.platform,
          content: deliverable.copyMarkdown,
          deliverableId: deliverable.id,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create post");
      const post = await createRes.json();

      const pubRes = await fetch(`/api/relay/posts/${post.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!pubRes.ok) {
        const err = await pubRes.json().catch(() => ({}));
        throw new Error(err.error || "Publish failed");
      }

      // Refresh list
      await fetchDeliverables();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishingId(null);
    }
  };

  // ─── Render ───

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400">{error}</p>
        <Button variant="outline" onClick={fetchDeliverables}>Retry</Button>
      </div>
    );
  }

  const totalCount = filtered.length;
  const reviewCount = grouped.REVIEW?.length || 0;
  const approvedCount = grouped.APPROVED?.length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Pipeline</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {totalCount} items
            {reviewCount > 0 && <span className="text-purple-400 ml-2">· {reviewCount} need review</span>}
            {approvedCount > 0 && <span className="text-emerald-400 ml-2">· {approvedCount} approved</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-[var(--bg-deep)]")}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filter
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchDeliverables}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="bg-[var(--bg-card)] border-[var(--border-subtle)]">
          <CardContent className="p-4 flex flex-wrap gap-4">
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-muted)]">Brand</label>
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className="block w-40 bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)]"
              >
                <option value="all">All brands</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-muted)]">Platform</label>
              <select
                value={platformFilter}
                onChange={e => setPlatformFilter(e.target.value)}
                className="block w-40 bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)]"
              >
                <option value="all">All platforms</option>
                {platforms.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p] || p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-muted)]">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="block w-40 bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)]"
              >
                <option value="all">All statuses</option>
                {STATUS_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status groups */}
      {STATUS_GROUPS.map(group => {
        const items = grouped[group.id] || [];
        if (items.length === 0 && statusFilter === "all") return null;
        const isCollapsed = collapsed[group.id] ?? false;
        const Icon = group.icon;

        return (
          <div key={group.id} className="space-y-2">
            {/* Group header */}
            <button
              onClick={() => toggleCollapse(group.id)}
              className="flex items-center gap-2 w-full text-left group"
            >
              {isCollapsed
                ? <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              }
              <Icon className={cn("w-4 h-4", group.color)} />
              <span className={cn("text-sm font-medium", group.color)}>{group.label}</span>
              <Badge variant="outline" className={cn("text-xs ml-1", group.color, group.border)}>
                {items.length}
              </Badge>
            </button>

            {/* Items */}
            {!isCollapsed && (
              <div className="space-y-1.5 ml-6">
                {items.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-2">No items</p>
                ) : (
                  items.map(d => (
                    <DeliverableRow
                      key={d.id}
                      deliverable={d}
                      group={group}
                      publishingId={publishingId}
                      onPublish={handlePublish}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {totalCount === 0 && (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="text-lg">No deliverables yet</p>
          <p className="text-sm mt-1">Create content from Intelligence or Content Studio</p>
        </div>
      )}
    </div>
  );
}

// ─── Row component ───

function DeliverableRow({
  deliverable: d,
  group,
  publishingId,
  onPublish,
}: {
  deliverable: Deliverable;
  group: (typeof STATUS_GROUPS)[number];
  publishingId: string | null;
  onPublish: (d: Deliverable) => void;
}) {
  const title = d.tree?.title
    || d.copyMarkdown?.slice(0, 80).replace(/[#*_\n]/g, "").trim()
    || "Untitled";

  const assetCount = d.assets?.length || 0;
  const imageCount = d.assets?.filter(a => a.type === "IMAGE" || a.type === "THUMBNAIL").length || 0;
  const videoCount = d.assets?.filter(a => a.type === "VIDEO" || a.type === "COMPOSITION").length || 0;
  const timeAgo = formatTimeAgo(d.updatedAt || d.createdAt);

  const isTextOnly = TEXT_ONLY_PLATFORMS.includes(d.platform);
  const canPublishNow = d.status === "APPROVED" && isTextOnly;
  const isPublishing = publishingId === d.id;

  return (
    <Card className={cn(
      "bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors",
      group.id === "REVIEW" && "border-l-2 border-l-purple-500/50",
    )}>
      <CardContent className="p-3 flex items-center gap-3">
        {/* Platform icon */}
        <span className="w-8 h-8 rounded-lg bg-[var(--bg-deep)] flex items-center justify-center text-sm font-medium shrink-0">
          {PLATFORM_ICONS[d.platform] || "?"}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {d.brand && (
              <span className="text-xs text-[var(--text-muted)] shrink-0">{d.brand.name}</span>
            )}
            <span className="text-xs text-[var(--text-muted)]">·</span>
            <span className="text-xs text-[var(--text-muted)]">{PLATFORM_LABELS[d.platform] || d.platform}</span>
          </div>
          <p className="text-sm text-[var(--text-primary)] truncate mt-0.5">{title}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
            <span>{timeAgo}</span>
            {assetCount > 0 && (
              <span className="flex items-center gap-1">
                {imageCount > 0 && <><Image className="w-3 h-3" />{imageCount}</>}
                {videoCount > 0 && <><Video className="w-3 h-3" />{videoCount}</>}
                {assetCount - imageCount - videoCount > 0 && <><FileText className="w-3 h-3" />{assetCount - imageCount - videoCount}</>}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {canPublishNow && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={(e) => { e.preventDefault(); onPublish(d); }}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Rocket className="w-3 h-3 mr-1" />
              )}
              Publish
            </Button>
          )}

          <Link href={`/m/yantri/review/${d.id}`}>
            <Button size="sm" variant="ghost" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              Review <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ───

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
