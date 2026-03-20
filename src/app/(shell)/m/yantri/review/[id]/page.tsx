"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Film,
  MessageSquare,
  Image,
  Hash,
  FileText,
  Palette,
  Camera,
  Users,
  BarChart3,
  Clapperboard,
  Music,
  Calendar,
  Sparkles,
  MonitorPlay,
  Download,
  RefreshCw,
  Package,
  ExternalLink,
  Play,
  Search,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { FileTransferSection } from "@/app/(shell)/files/page";

// ─── Types ───

interface Asset {
  id: string;
  type: string;
  url: string;
  promptUsed: string | null;
  slideIndex: number | null;
  metadata: Record<string, unknown> | null;
}

interface DeliverableDetail {
  id: string;
  status: string;
  platform: string;
  pipelineType: string;
  copyMarkdown: string | null;
  scriptData: ScriptData | null;
  carouselData: CarouselData | null;
  postingPlan: PostingPlan | null;
  researchPrompt: string | null;
  createdAt: string;
  brand: { id: string; name: string } | null;
  tree: { id: string; title: string; dossier?: { rawResearch: string | null } | null } | null;
  assets: Asset[];
}

interface ScriptSection {
  type: string;
  text?: string;
  // Original format
  timeCode?: string;
  visualNotes?: string;
  // Editorial pack format
  position?: number;
  title?: string;
  duration?: string;
  visualNote?: string;
  bRoll?: string[];
  dataCards?: string[];
  lowerThirds?: Array<{ text: string; timing: string }>;
  musicMood?: string;
  // Cinematic format
  timestamp?: string;
  script?: string;
  productionCues?: string[];
  visualAnchors?: string[];
}

interface ScriptData {
  script?: { sections?: ScriptSection[]; totalDuration?: string };
  titles?: Array<{ text: string; type?: string; strategy: string }>;
  description?: string;
  tags?: string[];
  thumbnailBriefs?: Array<{ concept: string; textOverlay: string; colorScheme: string; composition: string }>;
  endScreen?: { cta: string; suggestedVideo: string };
  // X thread
  tweets?: Array<{ position: number; text: string; type: string }>;
  // Carousel
  slides?: Array<{ position: number; role: string; headline: string; bodyText: string; visualPrompt: string; textOverlay: string; colorHex: string }>;
  caption?: string;
}

type CarouselData = ScriptData;

interface BRollShot { description: string; source: string; duration: string; priority: string }
interface BRollSheetEntry { section: number; shots: BRollShot[] }
interface KeyStakeholder { name: string; title: string; relevance: string; photoNeeded: boolean; nameCardText: string }
interface VisualAnchorItem { type: string; description: string; data: string; section: number }
interface EventMarker { date: string; event: string; visualTreatment: string }
interface AnimationBrief { section: number; type: string; description: string; duration: string }
interface MusicBriefEntry { section: string; mood: string; tempo: string; reference: string }

interface PostingPlan {
  tags?: string[];
  description?: string;
  revisionNotes?: string;
  revisionRequestedAt?: string;
  // Editorial pack production brief
  bRollSheet?: BRollSheetEntry[];
  keyStakeholders?: KeyStakeholder[];
  visualAnchors?: VisualAnchorItem[];
  eventMarkers?: EventMarker[];
  animationBriefs?: AnimationBrief[];
  musicBrief?: MusicBriefEntry[];
}

/** Safely parse JSON fields that might be double-serialized strings */
function safeParseJson<T>(value: T | string | null | undefined): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return null; }
  }
  return value as T;
}

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

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  PLANNED: { label: "Queued", color: "text-blue-400", bg: "bg-blue-500/10" },
  RESEARCHING: { label: "Researching", color: "text-amber-400", bg: "bg-amber-500/10" },
  REVIEW: { label: "Ready for Review", color: "text-purple-400", bg: "bg-purple-500/10" },
  DRAFTED: { label: "Revision Requested", color: "text-orange-400", bg: "bg-orange-500/10" },
  APPROVED: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  KILLED: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10" },
  RELAYED: { label: "Publishing", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  PUBLISHED: { label: "Published", color: "text-[var(--accent-primary)]", bg: "bg-[rgba(0,212,170,0.1)]" },
};

const SECTION_ICONS: Record<string, string> = {
  hook: "🎣",
  HOOK: "🎣",
  context: "📋",
  CONTEXT: "📋",
  thesis: "💡",
  THESIS: "💡",
  evidence: "📊",
  EVIDENCE: "📊",
  counterpoint: "⚖️",
  COUNTERPOINT: "⚖️",
  escalation: "📈",
  ESCALATION: "📈",
  implications: "🔮",
  IMPLICATIONS: "🔮",
  cta: "📢",
  CTA: "📢",
  opinion: "🎯",
  implication: "🔮",
};

export default function DeliverableReviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [deliverable, setDeliverable] = useState<DeliverableDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [selectedTitle, setSelectedTitle] = useState(0);
  const [copied, setCopied] = useState("");
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [prodTab, setProdTab] = useState<"broll" | "stakeholders" | "visuals" | "production">("broll");
  const [generatingAssets, setGeneratingAssets] = useState<Set<string>>(new Set());

  const fetchDeliverable = useCallback(async () => {
    try {
      const res = await fetch(`/api/yantri/deliverables/${id}`);
      if (!res.ok) throw new Error("Failed to load deliverable");
      const data = await res.json();
      setDeliverable(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDeliverable();
  }, [fetchDeliverable]);

  const handleAction = async (action: "approve" | "kill" | "revision") => {
    setActing(true);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "revision" && revisionNotes.trim()) {
        body.revisionNotes = revisionNotes.trim();
      }
      const res = await fetch(`/api/yantri/deliverables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Action failed");
      await fetchDeliverable();
      if (action === "approve") {
        setTimeout(() => router.push("/content-studio"), 1000);
      }
      if (action === "revision") {
        setShowRevisionBox(false);
        setRevisionNotes("");
      }
    } catch {
      setError("Action failed");
    } finally {
      setActing(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleGenerateImage = async (assetId: string, prompt: string | null) => {
    if (!prompt) return;
    setGeneratingAssets((prev) => new Set(prev).add(assetId));
    try {
      const res = await fetch("/api/yantri/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, prompt }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchDeliverable();
      } else {
        alert(data.error || "Image generation failed. Try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setGeneratingAssets((prev) => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
    }
  };

  const handleGenerateAllRequired = async () => {
    if (!deliverable) return;
    const requiredAssets = deliverable.assets.filter((a) => {
      const meta = a.metadata as Record<string, unknown> | null;
      const hasImage = a.url?.startsWith("data:") || a.url?.startsWith("http");
      return !hasImage && meta?.required && a.promptUsed;
    });
    for (const asset of requiredAssets) {
      await handleGenerateImage(asset.id, asset.promptUsed);
      await new Promise((r) => setTimeout(r, 2000));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (error || !deliverable) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-red-400">{error || "Deliverable not found"}</p>
        <Button variant="outline" onClick={() => router.push("/content-studio")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Content Studio
        </Button>
      </div>
    );
  }

  // Extract structured data — handle double-serialized JSON strings
  const structured: ScriptData = safeParseJson(deliverable.scriptData) ?? safeParseJson(deliverable.carouselData) ?? {};
  const posting = safeParseJson<PostingPlan>(deliverable.postingPlan);
  const titles = structured.titles ?? [];
  const tags = structured.tags ?? posting?.tags ?? [];
  const description = structured.description ?? posting?.description ?? "";
  const sections = structured.script?.sections ?? [];
  const tweets = structured.tweets ?? [];
  const slides = structured.slides ?? [];
  const caption = structured.caption ?? "";
  const thumbnailBriefs = structured.thumbnailBriefs ?? [];
  const endScreen = structured.endScreen;
  const statusInfo = STATUS_STYLES[deliverable.status] ?? STATUS_STYLES.REVIEW;
  const previousRevisionNotes = posting?.revisionNotes;
  const imageAssets = deliverable.assets.filter(
    (a) => a.type === "IMAGE" || a.type === "THUMBNAIL" || a.type === "CAROUSEL_SLIDE" || a.type === "SOCIAL_CARD" || a.type === "BROLL"
  );
  const videoAssets = deliverable.assets.filter((a) => a.type === "VIDEO_CLIP");

  // Editorial pack production brief (stored in postingPlan)
  const bRollSheet = posting?.bRollSheet ?? [];
  const keyStakeholders = posting?.keyStakeholders ?? [];
  const visualAnchors = posting?.visualAnchors ?? [];
  const eventMarkers = posting?.eventMarkers ?? [];
  const animationBriefs = posting?.animationBriefs ?? [];
  const musicBrief = posting?.musicBrief ?? [];
  const hasProductionBrief = bRollSheet.length > 0 || keyStakeholders.length > 0 || visualAnchors.length > 0 || eventMarkers.length > 0;
  const isEditorialPack = deliverable.pipelineType === "editorial_pack" || hasProductionBrief;

  const isReviewable = deliverable.status === "REVIEW" || deliverable.status === "DRAFTED";

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/content-studio")}
            className="text-[var(--text-muted)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {deliverable.tree?.title ?? deliverable.researchPrompt ?? "Content Review"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {deliverable.brand && (
                <Badge variant="secondary" className="text-[10px] bg-[rgba(0,212,170,0.08)] text-[var(--accent-primary)]">
                  {deliverable.brand.name}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px]">
                {PLATFORM_LABELS[deliverable.platform] ?? deliverable.platform}
              </Badge>
              <Badge className={cn("text-[10px]", statusInfo.bg, statusInfo.color)}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {isReviewable && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              disabled={acting}
              onClick={() => handleAction("kill")}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              disabled={acting}
              onClick={() => setShowRevisionBox(!showRevisionBox)}
            >
              Request Revision
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={acting}
              onClick={() => handleAction("approve")}
            >
              {acting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Approve & Create Task
            </Button>
          </div>
        )}

        {deliverable.status === "APPROVED" && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => {
                window.open(`/api/yantri/deliverables/${deliverable.id}/export-script`, "_blank");
              }}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Export Script
            </Button>
            {(bRollSheet.length > 0) && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  window.open(`/api/yantri/deliverables/${deliverable.id}/export-script?type=broll`, "_blank");
                }}
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                B-Roll Sheet
              </Button>
            )}
            <Button
              size="sm"
              className="text-xs bg-[var(--accent-primary)] hover:opacity-90"
              onClick={async () => {
                const downloadable = deliverable.assets.filter(
                  a => a.url && (a.url.startsWith("http") || a.url.startsWith("data:"))
                );
                // Export script first
                window.open(`/api/yantri/deliverables/${deliverable.id}/export-script`, "_blank");
                // Then download each asset with delay
                for (const asset of downloadable) {
                  const a = document.createElement("a");
                  a.href = asset.url;
                  a.download = `${(deliverable.brand?.name ?? "asset").toLowerCase()}-${asset.type.toLowerCase()}-${asset.slideIndex ?? 0}.png`;
                  a.target = "_blank";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  await new Promise(r => setTimeout(r, 300));
                }
              }}
            >
              <Package className="h-3.5 w-3.5 mr-1.5" />
              Download All
            </Button>
            <Badge className="bg-emerald-500/10 text-emerald-400 text-sm px-4 py-1.5">
              Approved
            </Badge>
          </div>
        )}
      </div>

      {/* ─── Revision Notes Box ─── */}
      {showRevisionBox && (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-amber-400">Revision Notes</p>
            <textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Describe what needs to change..."
              rows={3}
              className="w-full rounded-lg border border-amber-500/20 bg-[var(--bg-deep)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-amber-400"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={acting || !revisionNotes.trim()}
                onClick={() => handleAction("revision")}
              >
                Submit Revision Request
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRevisionBox(false)}
                className="text-[var(--text-muted)]"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Previous Revision Notes ─── */}
      {previousRevisionNotes && (
        <Card className="mb-4 border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Revision Notes</p>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{previousRevisionNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* ─── Title Options ─── */}
      {titles.length > 0 && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--accent-primary)]" />
              Title Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {titles.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedTitle(i)}
                className={cn(
                  "w-full text-left rounded-lg border px-4 py-3 transition-colors",
                  selectedTitle === i
                    ? "border-[var(--accent-primary)] bg-[rgba(0,212,170,0.06)]"
                    : "border-[var(--border-default)] bg-[var(--bg-deep)] hover:border-[var(--border-hover)]"
                )}
              >
                <p className="text-sm font-medium text-[var(--text-primary)]">{t.text}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-wider">
                  {t.strategy?.replace(/_/g, " ")}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ─── Script Sections (YouTube / Quick Take / Editorial Pack) ─── */}
      {sections.length > 0 && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Film className="h-4 w-4 text-[var(--accent-primary)]" />
                Script
                {structured.script?.totalDuration && (
                  <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">
                    ({structured.script.totalDuration})
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[var(--text-muted)] text-xs"
                  onClick={() => window.open(`/api/yantri/deliverables/${deliverable.id}/export-script`, "_blank")}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[var(--text-muted)] text-xs"
                  onClick={() => copyText(sections.map((s) => `[${s.timeCode ?? s.duration ?? ""}] ${s.type.toUpperCase()}${s.title ? ` — ${s.title}` : ""}\n${s.text ?? s.script ?? ""}`).join("\n\n"), "script")}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copied === "script" ? "Copied!" : "Copy All"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((s, i) => {
              const sectionText = s.text ?? s.script ?? "";
              const timeDisplay = s.timeCode ?? s.duration ?? s.timestamp ?? "";
              const visualDisplay = s.visualNotes ?? s.visualNote ?? "";

              return (
                <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{SECTION_ICONS[s.type] ?? "📝"}</span>
                    <span className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                      {s.type}
                    </span>
                    {s.title && (
                      <span className="text-xs text-[var(--text-secondary)]">
                        — {s.title}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--text-muted)] ml-auto font-mono">
                      {timeDisplay}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                    {sectionText}
                  </p>
                  {visualDisplay && (
                    <div className="mt-3 rounded-md bg-[var(--bg-surface)] px-3 py-2 border border-[var(--border-subtle)]">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Visual Notes</p>
                      <p className="text-xs text-[var(--text-secondary)]">{visualDisplay}</p>
                    </div>
                  )}
                  {/* Editorial pack extras */}
                  {s.bRoll && s.bRoll.length > 0 && (
                    <div className="mt-3 rounded-md bg-[var(--bg-surface)] px-3 py-2 border border-[var(--border-subtle)]">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Camera className="h-3 w-3" /> B-Roll
                      </p>
                      <ul className="text-xs text-[var(--text-secondary)] space-y-0.5">
                        {s.bRoll.map((b, bi) => <li key={bi}>• {b}</li>)}
                      </ul>
                    </div>
                  )}
                  {s.dataCards && s.dataCards.length > 0 && (
                    <div className="mt-2 rounded-md bg-[var(--bg-surface)] px-3 py-2 border border-[var(--border-subtle)]">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" /> Data Cards
                      </p>
                      <ul className="text-xs text-[var(--text-secondary)] space-y-0.5">
                        {s.dataCards.map((d, di) => <li key={di}>• {d}</li>)}
                      </ul>
                    </div>
                  )}
                  {s.lowerThirds && s.lowerThirds.length > 0 && (
                    <div className="mt-2 rounded-md bg-[var(--bg-surface)] px-3 py-2 border border-[var(--border-subtle)]">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Lower Thirds</p>
                      <div className="space-y-1">
                        {s.lowerThirds.map((lt, lti) => (
                          <div key={lti} className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-secondary)]">{lt.text}</span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">{lt.timing}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {s.musicMood && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Music className="h-3 w-3 text-[var(--text-muted)]" />
                      <span className="text-[10px] text-[var(--text-muted)]">Mood: {s.musicMood}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ─── X Thread (Tweets) ─── */}
      {tweets.length > 0 && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[var(--accent-primary)]" />
                Thread ({tweets.length} tweets)
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-[var(--text-muted)] text-xs"
                onClick={() => copyText(tweets.map((t) => t.text).join("\n\n---\n\n"), "thread")}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied === "thread" ? "Copied!" : "Copy All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tweets.map((t, i) => (
              <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase">
                    Tweet {t.position} — {t.type}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {t.text.length}/280
                  </span>
                </div>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                  {t.text}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ─── Carousel Slides ─── */}
      {slides.length > 0 && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Image className="h-4 w-4 text-[var(--accent-primary)]" />
              Carousel Slides ({slides.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {slides.map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4"
                  style={{ borderLeftColor: s.colorHex, borderLeftWidth: "3px" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase">
                      Slide {s.position} — {s.role}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">{s.headline}</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.bodyText}</p>
                  {s.textOverlay && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-2 italic">
                      Overlay: &quot;{s.textOverlay}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
            {caption && (
              <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Caption</p>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{caption}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Description ─── */}
      {description && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                Description
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-[var(--text-muted)] text-xs"
                onClick={() => copyText(description, "desc")}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied === "desc" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Tags ─── */}
      {tags.length > 0 && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Hash className="h-4 w-4 text-[var(--accent-primary)]" />
                Tags ({tags.length})
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-[var(--text-muted)] text-xs"
                onClick={() => copyText(tags.join(", "), "tags")}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied === "tags" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs bg-[var(--bg-deep)] text-[var(--text-secondary)]">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Thumbnail Briefs ─── */}
      {thumbnailBriefs.length > 0 && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Palette className="h-4 w-4 text-[var(--accent-primary)]" />
              Thumbnail Concepts ({thumbnailBriefs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {thumbnailBriefs.map((tb, i) => (
                <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
                  <p className="text-[10px] font-bold text-[var(--accent-primary)] uppercase mb-2">
                    Concept {i + 1}
                  </p>
                  <p className="text-xs text-[var(--text-primary)] mb-2">{tb.concept}</p>
                  <div className="space-y-1 text-[10px] text-[var(--text-muted)]">
                    <p><span className="font-semibold">Text:</span> &quot;{tb.textOverlay}&quot;</p>
                    <p><span className="font-semibold">Colors:</span> {tb.colorScheme}</p>
                    <p><span className="font-semibold">Composition:</span> {tb.composition}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── End Screen ─── */}
      {endScreen && (endScreen.cta || endScreen.suggestedVideo) && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <MonitorPlay className="h-4 w-4 text-[var(--accent-primary)]" />
              End Screen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {endScreen.cta && (
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
                  <p className="text-[10px] font-bold text-[var(--accent-primary)] uppercase mb-2">Call to Action</p>
                  <p className="text-sm text-[var(--text-primary)]">{endScreen.cta}</p>
                </div>
              )}
              {endScreen.suggestedVideo && (
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
                  <p className="text-[10px] font-bold text-[var(--accent-primary)] uppercase mb-2">Suggested Next Video</p>
                  <p className="text-sm text-[var(--text-primary)]">{endScreen.suggestedVideo}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Production Brief (Editorial Pack) ─── */}
      {isEditorialPack && hasProductionBrief && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Clapperboard className="h-4 w-4 text-[var(--accent-primary)]" />
              Production Brief
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tab bar */}
            <div className="flex gap-1 mb-4 border-b border-[var(--border-subtle)] pb-2">
              {bRollSheet.length > 0 && (
                <button
                  onClick={() => setProdTab("broll")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                    prodTab === "broll"
                      ? "bg-[rgba(0,212,170,0.1)] text-[var(--accent-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-deep)]"
                  )}
                >
                  <Camera className="h-3 w-3" />
                  B-Roll Sheet
                </button>
              )}
              {keyStakeholders.length > 0 && (
                <button
                  onClick={() => setProdTab("stakeholders")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                    prodTab === "stakeholders"
                      ? "bg-[rgba(0,212,170,0.1)] text-[var(--accent-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-deep)]"
                  )}
                >
                  <Users className="h-3 w-3" />
                  Stakeholders
                </button>
              )}
              {visualAnchors.length > 0 && (
                <button
                  onClick={() => setProdTab("visuals")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                    prodTab === "visuals"
                      ? "bg-[rgba(0,212,170,0.1)] text-[var(--accent-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-deep)]"
                  )}
                >
                  <BarChart3 className="h-3 w-3" />
                  Visual Anchors
                </button>
              )}
              {(eventMarkers.length > 0 || animationBriefs.length > 0 || musicBrief.length > 0) && (
                <button
                  onClick={() => setProdTab("production")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                    prodTab === "production"
                      ? "bg-[rgba(0,212,170,0.1)] text-[var(--accent-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-deep)]"
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  Events & Animations
                </button>
              )}
            </div>

            {/* B-Roll Sheet Tab — Enhanced with stock links */}
            {prodTab === "broll" && bRollSheet.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-muted)]">{bRollSheet.reduce((n, e) => n + e.shots.length, 0)} total shots</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] text-[var(--text-muted)]"
                    onClick={() => window.open(`/api/yantri/deliverables/${deliverable.id}/export-script?type=broll`, "_blank")}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export B-Roll Sheet
                  </Button>
                </div>
                {bRollSheet.map((entry, ei) => (
                  <div key={ei}>
                    <p className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">
                      Section {entry.section}
                    </p>
                    <div className="space-y-2">
                      {entry.shots.map((shot, si) => {
                        const searchTerms = shot.description.replace(/[^\w\s]/g, "").split(" ").filter((w: string) => w.length > 3).slice(0, 3).join(" ");
                        const pexelsUrl = `https://www.pexels.com/search/videos/${encodeURIComponent(searchTerms)}/`;
                        const pixabayUrl = `https://pixabay.com/videos/search/${encodeURIComponent(searchTerms)}/`;
                        return (
                          <div key={si} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="text-xs text-[var(--text-primary)]">{shot.description}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <Badge variant="secondary" className="text-[9px]">{shot.source}</Badge>
                                  <span className="text-[10px] text-[var(--text-muted)]">{shot.duration}</span>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "text-[9px]",
                                      shot.priority === "must-have"
                                        ? "bg-red-500/10 text-red-400"
                                        : "bg-blue-500/10 text-blue-400"
                                    )}
                                  >
                                    {shot.priority}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            {/* Stock footage search links */}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border-subtle)]">
                              <Search className="h-3 w-3 text-[var(--text-muted)]" />
                              <span className="text-[9px] text-[var(--text-muted)]">Find footage:</span>
                              <a
                                href={pexelsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                              >
                                Pexels <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                              <a
                                href={pixabayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-green-400 hover:underline flex items-center gap-0.5"
                              >
                                Pixabay <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stakeholders Tab */}
            {prodTab === "stakeholders" && keyStakeholders.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {keyStakeholders.map((person, pi) => (
                  <div key={pi} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{person.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{person.title}</p>
                      </div>
                      {person.photoNeeded && (
                        <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-400">
                          Photo Needed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-2">{person.relevance}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Name Card: &quot;{person.nameCardText}&quot;
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Visual Anchors Tab */}
            {prodTab === "visuals" && visualAnchors.length > 0 && (
              <div className="space-y-3">
                {visualAnchors.map((va, vi) => (
                  <div key={vi} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[9px] uppercase">{va.type}</Badge>
                      <span className="text-[10px] text-[var(--text-muted)]">Section {va.section}</span>
                    </div>
                    <p className="text-xs text-[var(--text-primary)] mb-1">{va.description}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-surface)] rounded px-2 py-1 font-mono">
                      {va.data}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Events & Animations Tab */}
            {prodTab === "production" && (
              <div className="space-y-6">
                {/* Event Markers */}
                {eventMarkers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
                      <Calendar className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                      Event Markers
                    </p>
                    <div className="space-y-2">
                      {eventMarkers.map((em, emi) => (
                        <div key={emi} className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-3">
                          <span className="text-[10px] font-mono text-[var(--accent-primary)] whitespace-nowrap mt-0.5">{em.date}</span>
                          <div className="flex-1">
                            <p className="text-xs text-[var(--text-primary)]">{em.event}</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">{em.visualTreatment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Animation Briefs */}
                {animationBriefs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                      Animation Briefs
                    </p>
                    <div className="space-y-2">
                      {animationBriefs.map((ab, abi) => (
                        <div key={abi} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="secondary" className="text-[9px] uppercase">{ab.type}</Badge>
                            <span className="text-[10px] text-[var(--text-muted)]">Section {ab.section}</span>
                            <span className="text-[10px] text-[var(--text-muted)] ml-auto font-mono">{ab.duration}</span>
                          </div>
                          <p className="text-xs text-[var(--text-primary)]">{ab.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Music Brief */}
                {musicBrief.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
                      <Music className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                      Music Brief
                    </p>
                    <div className="space-y-2">
                      {musicBrief.map((mb, mbi) => (
                        <div key={mbi} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase">
                              Sections {mb.section}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">{mb.tempo}</span>
                          </div>
                          <p className="text-xs text-[var(--text-primary)]">Mood: {mb.mood}</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1">Reference: {mb.reference}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Visual Assets (smart asset cards with generate buttons) ─── */}
      {imageAssets.length > 0 && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Image className="h-4 w-4 text-[var(--accent-primary)]" />
              Visual Assets ({imageAssets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {imageAssets.map((asset) => {
                const meta = (asset.metadata as Record<string, unknown>) || {};
                const hasImage = asset.url && (asset.url.startsWith("data:") || asset.url.startsWith("http"));
                const isGenerating = generatingAssets.has(asset.id) || meta.status === "generating";
                const isFailed = meta.status === "failed";
                const metaLabel = typeof meta.label === "string" ? meta.label : asset.type;
                const metaDesc = typeof meta.description === "string" ? meta.description : "";
                const metaPlatform = typeof meta.platformNote === "string" ? meta.platformNote : "";
                const metaDims = meta.dimensions as { width: number; height: number } | undefined;

                return (
                  <div key={asset.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden">
                    {/* Image area */}
                    <div className="aspect-video relative bg-[var(--bg-deep)]">
                      {hasImage ? (
                        <>
                          <img
                            src={asset.url}
                            alt={metaLabel}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          <a
                            href={asset.url}
                            download={`${deliverable.tree?.title || "asset"}-${metaLabel}.png`}
                            className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleGenerateImage(asset.id, asset.promptUsed)}
                            className="absolute top-2 left-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition"
                            title="Generate a new version"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </>
                      ) : isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
                          <span className="text-xs text-[var(--text-muted)]">Generating with Gemini...</span>
                        </div>
                      ) : isFailed ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                          <AlertTriangle className="w-6 h-6 text-red-400" />
                          <span className="text-xs text-red-400">Generation failed</span>
                          <button
                            onClick={() => handleGenerateImage(asset.id, asset.promptUsed)}
                            className="text-xs text-[var(--accent-primary)] underline"
                          >
                            Try again
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
                          <ImageIcon className="w-8 h-8 text-[var(--text-muted)]" />
                          <button
                            onClick={() => handleGenerateImage(asset.id, asset.promptUsed)}
                            className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition flex items-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generate Image
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Info area */}
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {metaLabel}
                          {asset.slideIndex != null ? ` — Slide ${asset.slideIndex + 1}` : ""}
                        </span>
                        {!!meta.required && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                            Required
                          </span>
                        )}
                      </div>
                      {metaDesc && (
                        <p className="text-xs text-[var(--text-secondary)]">{metaDesc}</p>
                      )}
                      {metaPlatform && (
                        <p className="text-[10px] text-[var(--text-muted)]">{metaPlatform}</p>
                      )}
                      {metaDims && (
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {metaDims.width}x{metaDims.height}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Generate All Required button */}
            {deliverable.assets.some((a) => {
              const m = (a.metadata as Record<string, unknown>) || {};
              const hasImg = a.url?.startsWith("data:") || a.url?.startsWith("http");
              return !hasImg && m.required;
            }) && (
              <button
                onClick={handleGenerateAllRequired}
                className="w-full py-3 rounded-lg border border-[var(--accent-primary)] text-[var(--accent-primary)] text-sm font-medium hover:bg-[var(--accent-primary)]/10 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate All Required Assets
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Video Clips (Remotion Specs) ─── */}
      {videoAssets.length > 0 && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Film className="h-4 w-4 text-purple-400" />
              Video Compositions ({videoAssets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {videoAssets.map((asset) => {
              const meta = asset.metadata as Record<string, unknown> | null;
              const compositions = (meta?.compositions ?? []) as Array<{ id: string; output: string; duration: number }>;
              const renderCmd = (meta?.renderAllCommand as string) ?? "";

              return (
                <div key={asset.id} className="rounded-lg border border-purple-500/20 bg-[var(--bg-deep)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="text-[9px] bg-purple-500/10 text-purple-400">
                      Remotion Project — {compositions.length} composition{compositions.length !== 1 ? "s" : ""}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[var(--text-muted)] text-xs h-7"
                      onClick={() => {
                        navigator.clipboard.writeText(renderCmd);
                        setCopied(`video-${asset.id}`);
                        setTimeout(() => setCopied(""), 2000);
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copied === `video-${asset.id}` ? "Copied!" : "Copy render cmd"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {compositions.map((comp, ci) => (
                      <div key={ci} className="rounded-md bg-[var(--bg-surface)] p-2.5 border border-[var(--border-subtle)]">
                        <div className="text-[11px] font-medium text-[var(--text-primary)]">{comp.id}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {comp.output} — {comp.duration.toFixed(1)}s
                        </div>
                      </div>
                    ))}
                  </div>
                  {renderCmd && (
                    <div className="mt-3 rounded-md bg-[#0d1117] p-2.5 overflow-x-auto">
                      <code className="text-[10px] text-green-400 whitespace-pre-wrap break-all font-mono">
                        {renderCmd.length > 300 ? renderCmd.slice(0, 300) + "..." : renderCmd}
                      </code>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ─── Raw Copy (fallback if no structured data) ─── */}
      {sections.length === 0 && tweets.length === 0 && slides.length === 0 && deliverable.copyMarkdown && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                Content
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-[var(--text-muted)] text-xs"
                onClick={() => copyText(deliverable.copyMarkdown!, "copy")}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied === "copy" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-[var(--text-primary)] leading-relaxed">
              <MarkdownContent content={deliverable.copyMarkdown!} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Shared Files (Google Drive) ─── */}
      {deliverable.brand && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardContent className="pt-5">
            <FileTransferSection
              brandId={deliverable.brand.id}
              brandName={deliverable.brand.name}
              deliverableId={deliverable.id}
            />
          </CardContent>
        </Card>
      )}

      {/* ─── Bottom Action Bar ─── */}
      {isReviewable && (
        <div className="fixed bottom-0 left-0 md:left-16 lg:left-[260px] right-0 z-30 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Review complete? Approve to create a production task.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                disabled={acting}
                onClick={() => handleAction("kill")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                disabled={acting}
                onClick={() => setShowRevisionBox(!showRevisionBox)}
              >
                Request Revision
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                disabled={acting}
                onClick={() => handleAction("approve")}
              >
                {acting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve & Create Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
