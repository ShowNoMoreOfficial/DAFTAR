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
  timeCode: string;
  text: string;
  visualNotes: string;
}

interface ScriptData {
  script?: { sections?: ScriptSection[] };
  titles?: Array<{ text: string; strategy: string }>;
  description?: string;
  tags?: string[];
  thumbnailBriefs?: Array<{ concept: string; textOverlay: string; colorScheme: string; composition: string }>;
  // X thread
  tweets?: Array<{ position: number; text: string; type: string }>;
  // Carousel
  slides?: Array<{ position: number; role: string; headline: string; bodyText: string; visualPrompt: string; textOverlay: string; colorHex: string }>;
  caption?: string;
}

type CarouselData = ScriptData;
type PostingPlan = { tags?: string[]; description?: string };

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
  DRAFTED: { label: "Draft", color: "text-purple-400", bg: "bg-purple-500/10" },
  APPROVED: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  KILLED: { label: "Killed", color: "text-red-400", bg: "bg-red-500/10" },
  REVISION_REQUESTED: { label: "Revision Requested", color: "text-amber-400", bg: "bg-amber-500/10" },
};

const SECTION_ICONS: Record<string, string> = {
  hook: "🎣",
  context: "📋",
  thesis: "💡",
  evidence: "📊",
  counterpoint: "⚖️",
  implications: "🔮",
  cta: "📢",
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
        setTimeout(() => router.push("/m/yantri/workspace"), 1000);
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
        <Button variant="outline" onClick={() => router.push("/m/yantri/workspace")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspace
        </Button>
      </div>
    );
  }

  // Extract structured data from scriptData or carouselData
  const structured: ScriptData = deliverable.scriptData ?? deliverable.carouselData ?? {};
  const titles = structured.titles ?? [];
  const tags = structured.tags ?? (deliverable.postingPlan as PostingPlan)?.tags ?? [];
  const description = structured.description ?? (deliverable.postingPlan as PostingPlan)?.description ?? "";
  const sections = structured.script?.sections ?? [];
  const tweets = structured.tweets ?? [];
  const slides = structured.slides ?? [];
  const caption = structured.caption ?? "";
  const thumbnailBriefs = structured.thumbnailBriefs ?? [];
  const statusInfo = STATUS_STYLES[deliverable.status] ?? STATUS_STYLES.REVIEW;

  const isReviewable = deliverable.status === "REVIEW" || deliverable.status === "DRAFTED" || deliverable.status === "REVISION_REQUESTED";

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/m/yantri/workspace")}
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
          <Badge className="bg-emerald-500/10 text-emerald-400 text-sm px-4 py-1.5">
            Approved — Task Created
          </Badge>
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

      {/* ─── Script Sections (YouTube / Quick Take) ─── */}
      {sections.length > 0 && (
        <Card className="mb-4 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Film className="h-4 w-4 text-[var(--accent-primary)]" />
                Script
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-[var(--text-muted)] text-xs"
                onClick={() => copyText(sections.map((s) => `[${s.timeCode}] ${s.type.toUpperCase()}\n${s.text}`).join("\n\n"), "script")}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied === "script" ? "Copied!" : "Copy All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((s, i) => (
              <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{SECTION_ICONS[s.type] ?? "📝"}</span>
                  <span className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                    {s.type}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-auto font-mono">
                    {s.timeCode}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {s.text}
                </p>
                {s.visualNotes && (
                  <div className="mt-3 rounded-md bg-[var(--bg-surface)] px-3 py-2 border border-[var(--border-subtle)]">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Visual Notes</p>
                    <p className="text-xs text-[var(--text-secondary)]">{s.visualNotes}</p>
                  </div>
                )}
              </div>
            ))}
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
            <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {deliverable.copyMarkdown}
            </div>
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
