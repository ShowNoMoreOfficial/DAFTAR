"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Plus,
  Filter,
  RefreshCw,
  ExternalLink,
  XCircle,
  Sparkles,
  X,
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

// ─── Pipeline columns ───

const PIPELINE_COLUMNS = [
  { id: "PLANNED", label: "Queued", icon: Radio, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "RESEARCHING", label: "Researching", icon: Search, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "REVIEW", label: "Review", icon: Eye, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "APPROVED", label: "Approved", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "RELAYED", label: "Publishing", icon: Send, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { id: "PUBLISHED", label: "Published", icon: CheckCircle2, color: "text-[var(--accent-primary)]", bg: "bg-[rgba(0,212,170,0.1)]", border: "border-[var(--accent-primary)]/20" },
];

const PLATFORM_LABELS: Record<string, string> = {
  YOUTUBE: "YouTube",
  X_THREAD: "X Thread",
  X_SINGLE: "X Post",
  BLOG: "Blog",
  LINKEDIN: "LinkedIn",
  META_REEL: "Meta Reel",
  META_CAROUSEL: "Carousel",
  META_POST: "Meta Post",
};

const PIPELINE_LABELS: Record<string, string> = {
  viral_micro: "Viral Micro",
  carousel: "Carousel",
  cinematic: "Cinematic",
  reel: "Reel",
  standard: "Standard",
};

// ─── Component ───

export default function YantriWorkspacePage() {
  const router = useRouter();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genBrand, setGenBrand] = useState("");
  const [genType, setGenType] = useState("youtube_explainer");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [delRes, brandsRes] = await Promise.all([
        fetch("/api/yantri/deliverables"),
        fetch("/api/brands"),
      ]);

      if (delRes.ok) {
        const data = await delRes.json();
        setDeliverables(Array.isArray(data) ? data : []);
      }

      if (brandsRes.ok) {
        const data = await brandsRes.json();
        setBrands(Array.isArray(data) ? data : data.brands || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDeliverables = deliverables.filter((d) => {
    if (filterBrand !== "all" && d.brand?.id !== filterBrand) return false;
    if (filterPlatform !== "all" && d.platform !== filterPlatform) return false;
    return true;
  });

  const getColumnDeliverables = (status: string) =>
    filteredDeliverables.filter((d) => d.status === status);

  const handleAction = async (id: string, action: string) => {
    try {
      await fetch(`/api/yantri/deliverables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchData();
    } catch { /* silent */ }
  };

  const handleGenerate = async () => {
    if (!genTopic.trim() || !genBrand) return;
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/yantri/quick-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic.trim(),
          brandId: genBrand,
          contentType: genType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "Generation failed");
        return;
      }
      setShowGenerate(false);
      setGenTopic("");
      router.push(`/m/yantri/review/${data.deliverableId}`);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Network error");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Content Studio</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Pipeline overview — {filteredDeliverables.length} item{filteredDeliverables.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-[var(--border-default)] text-[var(--text-secondary)]"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filters
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            className="border-[var(--border-default)] text-[var(--text-secondary)]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            className="bg-[var(--accent-primary)] hover:opacity-90"
            onClick={() => { setShowGenerate(true); if (brands.length && !genBrand) setGenBrand(brands[0].id); }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generate Content
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex items-center gap-3 mb-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Brand</label>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-deep)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Platform</label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-deep)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value="all">All Platforms</option>
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 h-full min-w-max pb-2">
          {PIPELINE_COLUMNS.map((col) => {
            const items = getColumnDeliverables(col.id);
            const Icon = col.icon;

            return (
              <div
                key={col.id}
                className="flex w-[240px] shrink-0 flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              >
                {/* Column header */}
                <div className={cn("flex items-center justify-between px-3 py-2.5 border-b", col.border, "border-b-2")}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", col.color)} />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {col.label}
                    </span>
                  </div>
                  <Badge variant="secondary" className={cn("h-5 px-1.5 text-[10px] font-semibold", col.bg, col.color)}>
                    {items.length}
                  </Badge>
                </div>

                {/* Column items */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {items.length === 0 && (
                    <p className="text-center text-[10px] text-[var(--text-muted)] py-4">
                      No items
                    </p>
                  )}

                  {items.map((item) => (
                    <PipelineCard
                      key={item.id}
                      item={item}
                      column={col.id}
                      onAction={handleAction}
                      onNavigate={(id) => router.push(`/m/yantri/review/${id}`)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate Content Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Generate Content</h2>
              <button onClick={() => setShowGenerate(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Topic / Signal</label>
                <textarea
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. India's $10 billion semiconductor manufacturing push"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-deep)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Brand</label>
                <select
                  value={genBrand}
                  onChange={(e) => setGenBrand(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-deep)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <option value="">Select brand...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Content Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "youtube_explainer", label: "YouTube Explainer", desc: "10-15 min script" },
                    { id: "x_thread", label: "X/Twitter Thread", desc: "8-12 tweets" },
                    { id: "carousel", label: "Instagram Carousel", desc: "8-10 slides" },
                    { id: "quick_take", label: "Quick Take", desc: "2-5 min video" },
                  ].map((ct) => (
                    <button
                      key={ct.id}
                      onClick={() => setGenType(ct.id)}
                      className={cn(
                        "flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-colors",
                        genType === ct.id
                          ? "border-[var(--accent-primary)] bg-[rgba(0,212,170,0.08)]"
                          : "border-[var(--border-default)] bg-[var(--bg-deep)] hover:border-[var(--border-hover)]"
                      )}
                    >
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{ct.label}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{ct.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {genError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                  {genError}
                </div>
              )}

              {/* Generate Button */}
              <Button
                className="w-full bg-[var(--accent-primary)] hover:opacity-90 h-11 text-sm font-semibold"
                disabled={generating || !genTopic.trim() || !genBrand}
                onClick={handleGenerate}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating... (30-60 seconds)
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Card ───

function PipelineCard({
  item,
  column,
  onAction,
  onNavigate,
}: {
  item: Deliverable;
  column: string;
  onAction: (id: string, action: string) => void;
  onNavigate: (id: string) => void;
}) {
  const title = item.tree?.title || item.copyMarkdown?.slice(0, 60) || "Untitled";
  const timeAgo = getTimeAgo(item.updatedAt || item.createdAt);

  return (
    <Card
      className="border-[var(--border-subtle)] bg-[var(--bg-deep)] hover:border-[var(--accent-primary)]/30 transition-colors group cursor-pointer"
      onClick={() => onNavigate(item.id)}
    >
      <CardContent className="p-3 space-y-2">
        {/* Brand tag */}
        {item.brand && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-[rgba(0,212,170,0.08)] text-[var(--accent-primary)]">
            {item.brand.name}
          </Badge>
        )}

        {/* Title */}
        <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-relaxed">
          {title}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span>{PLATFORM_LABELS[item.platform] || item.platform}</span>
          <span>·</span>
          <span>{PIPELINE_LABELS[item.pipelineType] || item.pipelineType}</span>
        </div>

        {/* Assets indicator */}
        {item.assets && item.assets.length > 0 && (
          <p className="text-[10px] text-[var(--text-muted)]">
            {item.assets.length} asset{item.assets.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-[var(--text-muted)]">{timeAgo}</p>

        {/* Action buttons */}
        <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {column === "REVIEW" && (
            <>
              <Button
                size="sm"
                className="h-6 px-2 text-[10px] bg-purple-600 hover:bg-purple-700 text-white"
                onClick={(e) => { e.stopPropagation(); onNavigate(item.id); }}
              >
                <Eye className="h-3 w-3 mr-1" />
                Review
              </Button>
              <Button
                size="sm"
                className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={(e) => { e.stopPropagation(); onAction(item.id, "approve"); }}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[10px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={(e) => { e.stopPropagation(); onAction(item.id, "kill"); }}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </>
          )}

          {column === "PLANNED" && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px] border-[var(--border-default)] text-[var(--text-secondary)]"
              onClick={(e) => { e.stopPropagation(); onAction(item.id, "retrigger"); }}
            >
              <Brain className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}

          {item.tree && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] text-[var(--text-muted)]"
              onClick={(e) => { e.stopPropagation(); window.location.href = `/m/yantri/narrative-trees/${item.tree!.id}`; }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ───

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
