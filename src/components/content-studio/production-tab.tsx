"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Download,
  FileText,
  Film,
  Camera,
  Image,
  Music,
  Users,
  BarChart3,
  Play,
  Package,
  ExternalLink,
  Search,
  Eye,
  CheckCircle2,
  Clapperboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───

interface Asset {
  id: string;
  type: string;
  url: string;
  promptUsed: string | null;
  slideIndex: number | null;
  metadata: Record<string, unknown> | null;
}

interface ProductionDeliverable {
  id: string;
  status: string;
  platform: string;
  pipelineType: string;
  copyMarkdown: string | null;
  scriptData: unknown;
  carouselData: unknown;
  postingPlan: unknown;
  researchPrompt: string | null;
  createdAt: string;
  brand: { id: string; name: string } | null;
  tree: { id: string; title: string } | null;
  assets: Asset[];
}

interface BRollShot {
  description: string;
  source: string;
  duration: string;
  priority: string;
}

interface BRollSheetEntry {
  section: number;
  shots: BRollShot[];
}

interface KeyStakeholder {
  name: string;
  title: string;
  relevance: string;
  photoNeeded: boolean;
  nameCardText: string;
}

interface MusicBriefEntry {
  section: string;
  mood: string;
  tempo: string;
  reference: string;
}

interface ScriptSection {
  type: string;
  text?: string;
  script?: string;
  timeCode?: string;
  duration?: string;
  timestamp?: string;
  title?: string;
  visualNotes?: string;
  visualNote?: string;
  lowerThirds?: Array<{ text: string; timing: string }>;
  dataCard?: { stat: string; label: string; source?: string };
}

interface ScriptData {
  titles?: Array<{ text: string; strategy?: string }>;
  script?: { sections: ScriptSection[]; totalDuration?: string };
  slides?: Array<{ position: number; headline: string; body: string; visualDescription: string; colorAccent: string }>;
  tweets?: Array<{ position: number; text: string; type: string }>;
  caption?: string;
  description?: string;
  tags?: string[];
  thumbnailBriefs?: Array<{ concept: string; elements: string[] }>;
}

interface PostingPlan {
  tags?: string[];
  description?: string;
  bRollSheet?: BRollSheetEntry[];
  keyStakeholders?: KeyStakeholder[];
  musicBrief?: MusicBriefEntry[];
}

function safeParseJson<T>(value: T | string | null | undefined): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return null; }
  }
  return value as T;
}

const PLATFORM_LABELS: Record<string, string> = {
  YOUTUBE: "YouTube", X_THREAD: "X Thread", X_SINGLE: "X Post",
  BLOG: "Blog", LINKEDIN: "LinkedIn", META_REEL: "Meta Reel",
  META_CAROUSEL: "Carousel", META_POST: "Meta Post",
};

// ─── Asset Checklist Item ───

interface AssetCheckItem {
  label: string;
  icon: LucideIcon;
  present: boolean;
  count: number;
  downloadable: boolean;
  items: { url: string; name: string }[];
}

function getAssetChecklist(d: ProductionDeliverable): AssetCheckItem[] {
  const structured: ScriptData = safeParseJson(d.scriptData) ?? safeParseJson(d.carouselData) ?? {};
  const posting = safeParseJson<PostingPlan>(d.postingPlan as string | PostingPlan | null);
  const sections = structured.script?.sections ?? [];
  const brandName = d.brand?.name ?? "content";
  const title = d.tree?.title ?? "deliverable";
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 40);

  const imageAssets = d.assets.filter(a => ["IMAGE", "THUMBNAIL", "CAROUSEL_SLIDE", "SOCIAL_CARD"].includes(a.type) && a.url?.startsWith("http"));
  const brollAssets = d.assets.filter(a => a.type === "BROLL");
  const audioAssets = d.assets.filter(a => a.type === "AUDIO" && a.url?.startsWith("http"));
  const thumbnailAssets = d.assets.filter(a => a.type === "THUMBNAIL" && a.url?.startsWith("http"));

  const hasScript = sections.length > 0 || (d.copyMarkdown && d.copyMarkdown.length > 100);
  const bRollSheet = posting?.bRollSheet ?? [];
  const stakeholders = posting?.keyStakeholders ?? [];
  const musicBrief = posting?.musicBrief ?? [];

  // Collect lower thirds from script sections
  const lowerThirds: Array<{ text: string; timing: string }> = [];
  for (const sec of sections) {
    if (sec.lowerThirds) lowerThirds.push(...sec.lowerThirds);
  }

  // Data cards from script sections
  const dataCards: Array<{ stat: string; label: string; source?: string }> = [];
  for (const sec of sections) {
    if (sec.dataCard) dataCards.push(sec.dataCard);
  }

  return [
    {
      label: "Script",
      icon: FileText,
      present: !!hasScript,
      count: sections.length || (d.copyMarkdown ? 1 : 0),
      downloadable: !!hasScript,
      items: hasScript ? [{ url: `/api/yantri/deliverables/${d.id}/export-script`, name: `${safeTitle}-script.html` }] : [],
    },
    {
      label: "B-Roll Sheet",
      icon: Camera,
      present: bRollSheet.length > 0 || brollAssets.length > 0,
      count: bRollSheet.reduce((n, e) => n + e.shots.length, 0),
      downloadable: bRollSheet.length > 0,
      items: bRollSheet.length > 0 ? [{ url: `/api/yantri/deliverables/${d.id}/export-script?type=broll`, name: `${safeTitle}-broll-sheet.html` }] : [],
    },
    {
      label: "Stakeholder Cards",
      icon: Users,
      present: stakeholders.length > 0,
      count: stakeholders.length,
      downloadable: false,
      items: [],
    },
    {
      label: "Thumbnails & Images",
      icon: Image,
      present: imageAssets.length > 0,
      count: imageAssets.length,
      downloadable: imageAssets.length > 0,
      items: imageAssets.map((a, i) => ({ url: a.url, name: `${brandName}-${a.type.toLowerCase()}-${i + 1}.png` })),
    },
    {
      label: "Data Cards / Infographics",
      icon: BarChart3,
      present: dataCards.length > 0,
      count: dataCards.length,
      downloadable: false,
      items: [],
    },
    {
      label: "Music Brief",
      icon: Music,
      present: musicBrief.length > 0,
      count: musicBrief.length,
      downloadable: false,
      items: [],
    },
    {
      label: "Lower Thirds",
      icon: Clapperboard,
      present: lowerThirds.length > 0,
      count: lowerThirds.length,
      downloadable: false,
      items: [],
    },
    {
      label: "Voiceover Audio",
      icon: Film,
      present: audioAssets.length > 0,
      count: audioAssets.length,
      downloadable: audioAssets.length > 0,
      items: audioAssets.map((a, i) => ({ url: a.url, name: `${safeTitle}-voiceover-${i + 1}.mp3` })),
    },
  ];
}

// ─── Download helpers ───

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function downloadAllAssets(deliverable: ProductionDeliverable) {
  const checklist = getAssetChecklist(deliverable);
  for (const item of checklist) {
    if (!item.downloadable) continue;
    for (const asset of item.items) {
      triggerDownload(asset.url, asset.name);
      // Slight delay to avoid browser blocking multiple downloads
      await new Promise(r => setTimeout(r, 300));
    }
  }
}

// ─── Production Card ───

function ProductionCard({ d, onStartProduction }: { d: ProductionDeliverable; onStartProduction: (id: string) => void }) {
  const router = useRouter();
  const checklist = useMemo(() => getAssetChecklist(d), [d]);
  const [downloading, setDownloading] = useState(false);
  const readyCount = checklist.filter(c => c.present).length;
  const totalCount = checklist.length;
  const title = d.tree?.title ?? d.researchPrompt?.substring(0, 60) ?? "Untitled";

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      await downloadAllAssets(d);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              {d.brand && (
                <Badge variant="secondary" className="text-[9px] bg-[rgba(0,212,170,0.08)] text-[var(--accent-primary)]">
                  {d.brand.name}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[9px]">
                {PLATFORM_LABELS[d.platform] ?? d.platform}
              </Badge>
              <span className="text-[10px] text-[var(--text-muted)]">
                {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 shrink-0">
            {readyCount}/{totalCount} ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Asset Checklist */}
        <div className="grid grid-cols-2 gap-1.5">
          {checklist.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs",
                  item.present
                    ? "bg-emerald-500/5 text-[var(--text-primary)]"
                    : "bg-[var(--bg-deep)] text-[var(--text-muted)]"
                )}
              >
                <div className={cn("h-4 w-4 rounded-sm flex items-center justify-center shrink-0",
                  item.present ? "bg-emerald-500/20" : "bg-[var(--bg-surface)]"
                )}>
                  {item.present ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-[var(--text-muted)]/30" />
                  )}
                </div>
                <Icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.count > 0 && (
                  <span className="text-[9px] text-[var(--text-muted)] ml-auto">{item.count}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--border-subtle)]">
          <Button
            size="sm"
            className="h-7 text-[10px] bg-[var(--accent-primary)] hover:opacity-90"
            onClick={handleDownloadAll}
            disabled={downloading}
          >
            {downloading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Package className="h-3 w-3 mr-1" />}
            Download Pack
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px]"
            onClick={() => onStartProduction(d.id)}
          >
            <Play className="h-3 w-3 mr-1" />
            Start Production
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] text-[var(--text-muted)]"
            onClick={() => router.push(`/m/yantri/review/${d.id}`)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Production Tab ───

export function ProductionTab() {
  const [deliverables, setDeliverables] = useState<ProductionDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [startingProduction, setStartingProduction] = useState<string | null>(null);

  const fetchDeliverables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/yantri/deliverables?status=APPROVED");
      const data = await res.json();
      // Fetch full details for each deliverable (we need scriptData, postingPlan)
      const fullData = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (d: ProductionDeliverable) => {
          try {
            const detail = await fetch(`/api/yantri/deliverables/${d.id}`);
            return detail.ok ? detail.json() : d;
          } catch {
            return d;
          }
        })
      );
      setDeliverables(fullData);
    } catch {
      setDeliverables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  const brands = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of deliverables) {
      if (d.brand) map.set(d.brand.id, d.brand.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [deliverables]);

  const filtered = useMemo(() => {
    return deliverables.filter(d => {
      if (filterBrand !== "all" && d.brand?.id !== filterBrand) return false;
      if (filterPlatform !== "all" && d.platform !== filterPlatform) return false;
      return true;
    });
  }, [deliverables, filterBrand, filterPlatform]);

  const handleStartProduction = async (deliverableId: string) => {
    setStartingProduction(deliverableId);
    try {
      const d = deliverables.find(x => x.id === deliverableId);
      if (!d) return;
      const title = d.tree?.title ?? d.researchPrompt?.substring(0, 60) ?? "Untitled";
      const checklist = getAssetChecklist(d);
      const taskDescription = [
        `Production task for: ${title}`,
        `Brand: ${d.brand?.name ?? "Unknown"}`,
        `Platform: ${PLATFORM_LABELS[d.platform] ?? d.platform}`,
        `Deliverable: ${d.id}`,
        "",
        "Asset Checklist:",
        ...checklist.map(c => `${c.present ? "[x]" : "[ ]"} ${c.label} (${c.count})`),
        "",
        `Review: /m/yantri/review/${d.id}`,
      ].join("\n");

      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Produce: ${d.brand?.name ?? ""} — ${PLATFORM_LABELS[d.platform] ?? d.platform} — ${title.substring(0, 50)}`,
          description: taskDescription,
          priority: "HIGH",
          brandId: d.brand?.id,
          tags: ["production", d.platform.toLowerCase()],
        }),
      });

      // Mark as in production by updating status
      await fetch(`/api/yantri/deliverables/${deliverableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RELAYED" }),
      });

      fetchDeliverables();
    } finally {
      setStartingProduction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
          >
            <option value="all">All Brands</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
          >
            <option value="all">All Platforms</option>
            {Object.entries(PLATFORM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span className="text-xs text-[var(--text-muted)]">{filtered.length} approved</span>
        </div>
        <Button size="sm" variant="outline" onClick={fetchDeliverables}>
          <Search className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Deliverable Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-16 text-center">
          <Package className="h-8 w-8 mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No approved deliverables ready for production</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Approve content from the Studio tab to see it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(d => (
            <ProductionCard
              key={d.id}
              d={d}
              onStartProduction={handleStartProduction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
