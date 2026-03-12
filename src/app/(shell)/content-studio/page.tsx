"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  XCircle,
  Sparkles,
  X,
  PenTool,
  Layers,
  Calendar,
  Archive,
  Clock,
  ChevronLeft,
  ChevronRight,
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

interface Narrative {
  id: string;
  angle: string;
  priority: number;
  platform: string;
  status: string;
  createdAt: string;
  brand: { name: string };
  trend: { headline: string; score: number };
}

// ─── Tab definition ───

const TABS = [
  { id: "studio", label: "Studio", icon: Layers },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "library", label: "Library", icon: Archive },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Pipeline columns ───

const PIPELINE_COLUMNS = [
  { id: "PLANNED", label: "Queued", icon: Radio, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "RESEARCHING", label: "Researching", icon: Search, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "DRAFTED", label: "Revision", icon: Brain, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "REVIEW", label: "Review", icon: Eye, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "APPROVED", label: "Approved", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "RELAYED", label: "Publishing", icon: Send, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { id: "PUBLISHED", label: "Published", icon: CheckCircle2, color: "text-[var(--accent-primary)]", bg: "bg-[rgba(0,212,170,0.1)]", border: "border-[var(--accent-primary)]/20" },
];

const PLATFORM_LABELS: Record<string, string> = {
  YOUTUBE: "YouTube", X_THREAD: "X Thread", X_SINGLE: "X Post",
  BLOG: "Blog", LINKEDIN: "LinkedIn", META_REEL: "Meta Reel",
  META_CAROUSEL: "Carousel", META_POST: "Meta Post",
};

const PIPELINE_LABELS: Record<string, string> = {
  viral_micro: "Viral Micro", carousel: "Carousel",
  cinematic: "Cinematic", reel: "Reel", standard: "Standard",
};

// ─── Time ago helper ───

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Main Page ───

export default function ContentStudioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" /></div>}>
      <ContentStudioInner />
    </Suspense>
  );
}

function ContentStudioInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "studio";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <PenTool className="h-5 w-5 text-[var(--accent-primary)]" />
              Content Studio
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Create, review, and manage all content in one place.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm transition-colors",
                activeTab === tab.id
                  ? "border-[#2E86AB] font-medium text-[var(--accent-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "studio" && <StudioTab />}
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "library" && <LibraryTab />}
      </div>
    </div>
  );
}

// ─── STUDIO TAB (Pipeline + Quick Generate) ───

function StudioTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [showGenerate, setShowGenerate] = useState(!!searchParams.get("topic"));
  const [genTopic, setGenTopic] = useState(searchParams.get("topic") || "");
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
        const brandList = Array.isArray(data) ? data : data.brands || [];
        setBrands(brandList);
        if (brandList.length > 0 && !genBrand) setGenBrand(brandList[0].id);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
        body: JSON.stringify({ topic: genTopic.trim(), brandId: genBrand, contentType: genType }),
      });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error || "Generation failed"); return; }
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
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] p-6">
      {/* Quick Generate Bar */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="What should we create content about?"
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && genTopic.trim()) { setShowGenerate(true); if (brands.length && !genBrand) setGenBrand(brands[0].id); } }}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
          <Button
            size="sm"
            className="bg-[var(--accent-primary)] hover:opacity-90 shrink-0"
            onClick={() => { setShowGenerate(true); if (brands.length && !genBrand) setGenBrand(brands[0].id); }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <p className="text-sm text-[var(--text-secondary)]">
          {filteredDeliverables.length} item{filteredDeliverables.length !== 1 ? "s" : ""} in pipeline
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-3.5 w-3.5 mr-1.5" /> Filters
          </Button>
          <Button size="sm" variant="outline" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex items-center gap-3 mb-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Brand</label>
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-deep)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]">
              <option value="all">All Brands</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Platform</label>
            <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-deep)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]">
              <option value="all">All Platforms</option>
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
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
              <div key={col.id} className="flex w-[220px] shrink-0 flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <div className={cn("flex items-center justify-between px-3 py-2.5 border-b", col.border, "border-b-2")}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", col.color)} />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{col.label}</span>
                  </div>
                  <Badge variant="secondary" className={cn("h-5 px-1.5 text-[10px] font-semibold", col.bg, col.color)}>
                    {items.length}
                  </Badge>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {items.length === 0 && <p className="text-center text-[10px] text-[var(--text-muted)] py-4">No items</p>}
                  {items.map((item) => {
                    const title = item.tree?.title || item.copyMarkdown?.slice(0, 60) || "Untitled";
                    const timeAgo = getTimeAgo(item.updatedAt || item.createdAt);
                    return (
                      <Card
                        key={item.id}
                        className="border-[var(--border-subtle)] bg-[var(--bg-deep)] hover:border-[var(--accent-primary)]/30 transition-colors group cursor-pointer"
                        onClick={() => router.push(`/m/yantri/review/${item.id}`)}
                      >
                        <CardContent className="p-3 space-y-2">
                          {item.brand && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-[rgba(0,212,170,0.08)] text-[var(--accent-primary)]">
                              {item.brand.name}
                            </Badge>
                          )}
                          <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-relaxed">{title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                            <span>{PLATFORM_LABELS[item.platform] || item.platform}</span>
                            <span>&middot;</span>
                            <span>{timeAgo}</span>
                          </div>
                          {col.id === "REVIEW" && (
                            <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" className="h-6 px-2 text-[10px] bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={(e) => { e.stopPropagation(); router.push(`/m/yantri/review/${item.id}`); }}>
                                <Eye className="h-3 w-3 mr-1" /> Review
                              </Button>
                              <Button size="sm" className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={(e) => { e.stopPropagation(); handleAction(item.id, "approve"); }}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
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
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Brand</label>
                <select value={genBrand} onChange={(e) => setGenBrand(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-deep)] px-3 py-2 text-sm text-[var(--text-primary)]">
                  <option value="">Select brand...</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Content Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "youtube_explainer", label: "YouTube Explainer", desc: "10-15 min script" },
                    { id: "x_thread", label: "X/Twitter Thread", desc: "8-12 tweets" },
                    { id: "carousel", label: "Instagram Carousel", desc: "8-10 slides" },
                    { id: "quick_take", label: "Quick Take", desc: "2-5 min video" },
                  ].map((ct) => (
                    <button key={ct.id} onClick={() => setGenType(ct.id)}
                      className={cn(
                        "flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-colors",
                        genType === ct.id
                          ? "border-[var(--accent-primary)] bg-[rgba(0,212,170,0.08)]"
                          : "border-[var(--border-default)] bg-[var(--bg-deep)] hover:border-[var(--border-hover)]"
                      )}>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{ct.label}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{ct.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              {genError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{genError}</div>
              )}
              <Button className="w-full bg-[var(--accent-primary)] hover:opacity-90 h-11 text-sm font-semibold"
                disabled={generating || !genTopic.trim() || !genBrand} onClick={handleGenerate}>
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating... (30-60s)</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate Content</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CALENDAR TAB ───

function CalendarTab() {
  return (
    <div className="p-6">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
        <Calendar className="h-10 w-10 mx-auto text-[var(--text-muted)] mb-3" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Content Calendar</h3>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          View scheduled publications across all platforms.
        </p>
        <Link href="/relay/calendar">
          <Button variant="outline" size="sm">Open Calendar</Button>
        </Link>
      </div>
    </div>
  );
}

// ─── LIBRARY TAB (History + Performance) ───

function LibraryTab() {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterPlatform) params.set("platform", filterPlatform);
    fetch(`/api/yantri/editorial-narratives?${params}`)
      .then((r) => r.json())
      .then((data) => { setNarratives(Array.isArray(data) ? data : []); })
      .catch(() => setNarratives([]))
      .finally(() => setLoading(false));
  }, [filterStatus, filterPlatform]);

  return (
    <div className="p-6 space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)]">
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="APPROVED">Approved</option>
          <option value="REVIEW">In Review</option>
          <option value="DRAFTED">Drafted</option>
        </select>
        <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)]">
          <option value="">All Platforms</option>
          {Object.entries(PLATFORM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="text-xs text-[var(--text-muted)]">{narratives.length} items</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" /></div>
      ) : narratives.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-12 text-center text-sm text-[var(--text-muted)]">
          No content found
        </div>
      ) : (
        <div className="space-y-2">
          {narratives.map((n) => (
            <div key={n.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 hover:border-[#2E86AB]/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{n.angle || n.trend?.headline}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-muted)]">
                    <span>{n.brand?.name}</span>
                    <span>&middot;</span>
                    <span>{PLATFORM_LABELS[n.platform] || n.platform}</span>
                    <span>&middot;</span>
                    <span>{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{n.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
