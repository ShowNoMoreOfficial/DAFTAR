"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
  Sparkles,
  X,
  PenTool,
  Layers,
  Calendar,
  Archive,
  Shield,
  Clock,
  AlertTriangle,
  ArrowRight,
  Check,
  Square,
  CheckSquare,
  ExternalLink,
  RotateCcw,
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

interface Recommendation {
  rank: number;
  brand: { id: string; name: string };
  platform: string;
  contentType: string;
  angle: string;
  reasoning: string;
  priority: string;
  urgency: string;
  estimatedLength: string;
  suggestedTitle: string;
  assetsRequired: {
    images?: string[];
    video?: string[];
    graphics?: string[];
    other?: string[];
  };
  keyDataPoints: string[];
  stakeholders: string[];
  sensitivityLevel: string;
  timeliness: string;
}

interface TopicAssessment {
  passesEditorialGate: boolean;
  relevanceScore: number;
  differentiationScore: number;
  urgencyLevel: string;
  crossBrandPotential: boolean;
}

interface GenerationItem {
  rec: Recommendation;
  status: "pending" | "researching" | "writing" | "images" | "done" | "error";
  deliverableId?: string;
  error?: string;
}

type FlowState = "input" | "analyzing" | "recommendations" | "generating" | "done";

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

const CONTENT_TYPE_LABELS: Record<string, string> = {
  youtube_explainer: "YouTube Explainer",
  youtube_short: "YouTube Short",
  x_thread: "X Thread",
  x_single: "X Post",
  instagram_carousel: "Instagram Carousel",
  instagram_reel: "Instagram Reel",
  linkedin_post: "LinkedIn Post",
  linkedin_article: "LinkedIn Article",
  blog_post: "Blog Post",
  newsletter: "Newsletter",
  podcast_script: "Podcast Script",
  quick_take: "Quick Take",
  community_post: "Community Post",
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "CRITICAL", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  high: { label: "HIGH PRIORITY", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  medium: { label: "MEDIUM", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  low: { label: "LOW", color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-deep)]", border: "border-[var(--border-subtle)]" },
};

const URGENCY_LABELS: Record<string, string> = {
  immediate: "IMMEDIATE",
  within_24h: "WITHIN 24H",
  within_48h: "WITHIN 48H",
  evergreen: "EVERGREEN",
};

const SENSITIVITY_CONFIG: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  green: { icon: Shield, color: "text-emerald-400", label: "Green" },
  yellow: { icon: AlertTriangle, color: "text-yellow-400", label: "Yellow" },
  orange: { icon: AlertTriangle, color: "text-orange-400", label: "Orange" },
  red: { icon: AlertTriangle, color: "text-red-400", label: "Red" },
};

// Map recommendation contentType to quick-generate contentType
function mapContentType(ct: string): string {
  const map: Record<string, string> = {
    youtube_explainer: "youtube_explainer",
    youtube_short: "quick_take",
    x_thread: "x_thread",
    x_single: "x_thread",
    instagram_carousel: "carousel",
    instagram_reel: "quick_take",
    linkedin_post: "x_thread",
    linkedin_article: "x_thread",
    blog_post: "x_thread",
    quick_take: "quick_take",
    community_post: "x_thread",
  };
  return map[ct] || "youtube_explainer";
}

// ─── Helpers ───

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

  useEffect(() => {
    const urlTab = searchParams.get("tab") as TabId;
    if (urlTab && TABS.some((t) => t.id === urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

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

      <div className="flex-1 overflow-auto">
        {activeTab === "studio" && <StudioTab />}
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "library" && <LibraryTab />}
      </div>
    </div>
  );
}

// ─── STUDIO TAB (AI Recommendation Flow + Pipeline) ───

function StudioTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  // Recommendation flow state
  const [flowState, setFlowState] = useState<FlowState>("input");
  const [topic, setTopic] = useState(searchParams.get("topic") || "");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [topicAssessment, setTopicAssessment] = useState<TopicAssessment | null>(null);
  const [researchSummary, setResearchSummary] = useState("");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [analysisStep, setAnalysisStep] = useState(0);
  const [genItems, setGenItems] = useState<GenerationItem[]>([]);
  const [recError, setRecError] = useState("");
  const autoTriggered = useRef(false);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-trigger from ?auto=true
  useEffect(() => {
    if (searchParams.get("auto") === "true" && topic.trim() && !autoTriggered.current) {
      autoTriggered.current = true;
      handleGetRecommendations();
    }
  }, [searchParams, topic]);

  // ─── Analysis flow ───

  const handleGetRecommendations = async () => {
    if (!topic.trim()) return;
    setFlowState("analyzing");
    setRecError("");
    setAnalysisStep(0);

    // Animate steps
    const stepTimer = setInterval(() => {
      setAnalysisStep((s) => Math.min(s + 1, 3));
    }, 2000);

    try {
      const res = await fetch("/api/yantri/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      clearInterval(stepTimer);
      setAnalysisStep(4);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Recommendation failed");
      }

      const data = await res.json();
      const recs: Recommendation[] = data.recommendations || [];
      setRecommendations(recs);
      setTopicAssessment(data.topicAssessment || null);
      setResearchSummary(data.researchSummary || "");

      // Pre-select high + critical priority
      const preSelected = new Set<number>();
      recs.forEach((r, i) => {
        if (r.priority === "critical" || r.priority === "high") preSelected.add(i);
      });
      setSelectedIndices(preSelected);
      setFlowState("recommendations");
    } catch (err) {
      clearInterval(stepTimer);
      setRecError(err instanceof Error ? err.message : "Failed to get recommendations");
      setFlowState("input");
    }
  };

  // ─── Generation flow ───

  const handleGenerateSelected = async () => {
    const selected = recommendations.filter((_, i) => selectedIndices.has(i));
    if (selected.length === 0) return;

    const items: GenerationItem[] = selected.map((rec) => ({
      rec,
      status: "pending" as const,
    }));
    setGenItems(items);
    setFlowState("generating");

    // Generate in parallel
    const promises = items.map(async (item, idx) => {
      // Update status: researching
      setGenItems((prev) => prev.map((g, i) => i === idx ? { ...g, status: "researching" as const } : g));

      try {
        const res = await fetch("/api/yantri/quick-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic.trim(),
            brandId: item.rec.brand.id,
            contentType: mapContentType(item.rec.contentType),
            recommendationContext: {
              angle: item.rec.angle,
              reasoning: item.rec.reasoning,
              priority: item.rec.priority,
              urgency: item.rec.urgency,
              assetsRequired: item.rec.assetsRequired,
              keyDataPoints: item.rec.keyDataPoints,
              stakeholders: item.rec.stakeholders,
              sensitivityLevel: item.rec.sensitivityLevel,
              suggestedTitle: item.rec.suggestedTitle,
            },
          }),
        });

        setGenItems((prev) => prev.map((g, i) => i === idx ? { ...g, status: "writing" as const } : g));

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");

        setGenItems((prev) => prev.map((g, i) => i === idx ? { ...g, status: "done" as const, deliverableId: data.deliverableId } : g));
      } catch (err) {
        setGenItems((prev) => prev.map((g, i) =>
          i === idx ? { ...g, status: "error" as const, error: err instanceof Error ? err.message : "Failed" } : g
        ));
      }
    });

    await Promise.all(promises);
    setFlowState("done");
    fetchData(); // Refresh pipeline
  };

  // ─── Reset ───

  const handleReset = () => {
    setFlowState("input");
    setTopic("");
    setRecommendations([]);
    setTopicAssessment(null);
    setResearchSummary("");
    setSelectedIndices(new Set());
    setGenItems([]);
    setRecError("");
    autoTriggered.current = false;
  };

  // ─── Toggle selection ───

  const toggleSelection = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // ─── Pipeline helpers ───

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

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" /></div>;
  }

  // ─── Analysis step labels ───
  const ANALYSIS_STEPS = [
    "Researching topic...",
    "Evaluating editorial gates...",
    "Detecting angles across brands...",
    "Ranking platform-content matches...",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] p-6">
      {/* ═══════════════════════════════════════════════════ */}
      {/* RECOMMENDATION FLOW                                */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* State 1: Topic Input */}
      {flowState === "input" && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 mb-4 shrink-0">
          <p className="text-xs font-medium text-[var(--text-secondary)] mb-3">What&apos;s the story?</p>
          <div className="flex items-start gap-3">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && topic.trim()) { e.preventDefault(); handleGetRecommendations(); } }}
              placeholder="Describe a topic, signal, or event to get intelligent content recommendations..."
              rows={2}
              className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-deep)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
            />
            <Button
              className="bg-[var(--accent-primary)] hover:opacity-90 shrink-0 h-11 px-4"
              disabled={!topic.trim()}
              onClick={handleGetRecommendations}
            >
              <Brain className="h-4 w-4 mr-2" /> Get Recommendations
            </Button>
          </div>
          {recError && (
            <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{recError}</div>
          )}
        </div>
      )}

      {/* State 2: Analyzing */}
      {flowState === "analyzing" && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 mb-4 shrink-0">
          <div className="flex items-center gap-3 mb-5">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Analyzing topic against editorial framework</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Brand strategies, performance data, and platform intelligence...</p>
            </div>
          </div>
          <div className="space-y-2.5 ml-1">
            {ANALYSIS_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {analysisStep > i ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : analysisStep === i ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)] shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-[var(--border-default)] shrink-0" />
                )}
                <span className={cn(
                  "text-xs",
                  analysisStep > i ? "text-emerald-400" : analysisStep === i ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                )}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State 3: Recommendations */}
      {flowState === "recommendations" && (
        <div className="mb-4 shrink-0 space-y-3">
          {/* Topic assessment bar */}
          {topicAssessment && (
            <div className="flex items-center gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5">
              <span className="text-xs font-semibold text-[var(--text-primary)]">Editorial Gate</span>
              <Badge variant={topicAssessment.passesEditorialGate ? "default" : "destructive"} className="text-[10px] h-5">
                {topicAssessment.passesEditorialGate ? "PASSED" : "FAILED"}
              </Badge>
              <span className="text-[10px] text-[var(--text-muted)]">
                Relevance {topicAssessment.relevanceScore}/10 &middot; Differentiation {topicAssessment.differentiationScore}/10
                {topicAssessment.crossBrandPotential && " \u00B7 Cross-brand"}
              </span>
              <div className="flex-1" />
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleReset}>
                <RotateCcw className="h-3 w-3 mr-1" /> New Topic
              </Button>
            </div>
          )}

          {/* Recommendation cards */}
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {recommendations.map((rec, idx) => {
              const selected = selectedIndices.has(idx);
              const pConfig = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.medium;
              const sConfig = SENSITIVITY_CONFIG[rec.sensitivityLevel] || SENSITIVITY_CONFIG.green;
              const SensIcon = sConfig.icon;

              const assetList = [
                ...(rec.assetsRequired.images || []),
                ...(rec.assetsRequired.video || []),
                ...(rec.assetsRequired.graphics || []),
                ...(rec.assetsRequired.other || []),
              ];

              return (
                <div
                  key={idx}
                  onClick={() => toggleSelection(idx)}
                  className={cn(
                    "rounded-xl border p-4 transition-all cursor-pointer",
                    selected
                      ? "border-[var(--accent-primary)]/50 bg-[rgba(0,212,170,0.04)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)]"
                  )}
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      {selected ? (
                        <CheckSquare className="h-4.5 w-4.5 text-[var(--accent-primary)]" />
                      ) : (
                        <Square className="h-4.5 w-4.5 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Priority + Urgency badges */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)]">#{rec.rank}</span>
                        <Badge className={cn("text-[10px] h-5 font-bold", pConfig.color, pConfig.bg, "border", pConfig.border)}>
                          {pConfig.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-5 font-medium">
                          {URGENCY_LABELS[rec.urgency] || rec.urgency}
                        </Badge>
                      </div>

                      {/* Content type + Brand */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {CONTENT_TYPE_LABELS[rec.contentType] || rec.contentType}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-[rgba(0,212,170,0.08)] text-[var(--accent-primary)]">
                          {rec.brand.name}
                        </Badge>
                      </div>

                      {/* Angle */}
                      <p className="text-xs font-medium text-[var(--text-primary)] mb-1.5 leading-relaxed">
                        ANGLE: &ldquo;{rec.angle}&rdquo;
                      </p>

                      {/* Reasoning */}
                      <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">{rec.reasoning}</p>

                      {/* Meta grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-[10px]">
                        {assetList.length > 0 && (
                          <div>
                            <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wider">Needs</span>
                            <p className="text-[var(--text-secondary)] mt-0.5">{assetList.slice(0, 3).join(" \u00B7 ")}{assetList.length > 3 ? ` +${assetList.length - 3}` : ""}</p>
                          </div>
                        )}
                        {rec.keyDataPoints.length > 0 && (
                          <div>
                            <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wider">Data</span>
                            <p className="text-[var(--text-secondary)] mt-0.5">{rec.keyDataPoints.slice(0, 3).join(", ")}</p>
                          </div>
                        )}
                        {rec.stakeholders.length > 0 && (
                          <div>
                            <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wider">People</span>
                            <p className="text-[var(--text-secondary)] mt-0.5">{rec.stakeholders.slice(0, 3).join(", ")}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          {rec.estimatedLength && (
                            <span className="flex items-center gap-1 text-[var(--text-muted)]">
                              <Clock className="h-3 w-3" /> {rec.estimatedLength}
                            </span>
                          )}
                          <span className={cn("flex items-center gap-1", sConfig.color)}>
                            <SensIcon className="h-3 w-3" /> {sConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
            <Button
              className="bg-[var(--accent-primary)] hover:opacity-90"
              disabled={selectedIndices.size === 0}
              onClick={handleGenerateSelected}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Selected ({selectedIndices.size})
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> New Topic
            </Button>
          </div>
        </div>
      )}

      {/* State 4: Generating */}
      {flowState === "generating" && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 mb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-primary)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Generating {genItems.length} content piece{genItems.length !== 1 ? "s" : ""}...
            </p>
          </div>
          <div className="space-y-3">
            {genItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] px-4 py-3">
                <div className="pt-0.5">
                  {item.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : item.status === "error" ? (
                    <X className="h-4 w-4 text-red-400" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    {CONTENT_TYPE_LABELS[item.rec.contentType] || item.rec.contentType} — {item.rec.brand.name}
                  </p>
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      {item.status === "pending" && <span className="text-[var(--text-muted)]">Queued...</span>}
                      {item.status === "researching" && <><Loader2 className="h-3 w-3 animate-spin text-amber-400" /><span className="text-amber-400">Researching topic...</span></>}
                      {item.status === "writing" && <><Loader2 className="h-3 w-3 animate-spin text-purple-400" /><span className="text-purple-400">Writing with editorial skills...</span></>}
                      {item.status === "images" && <><Loader2 className="h-3 w-3 animate-spin text-cyan-400" /><span className="text-cyan-400">Generating visuals...</span></>}
                      {item.status === "done" && <span className="text-emerald-400">Complete</span>}
                      {item.status === "error" && <span className="text-red-400">{item.error}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State 5: Done */}
      {flowState === "done" && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 mb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {genItems.filter((g) => g.status === "done").length} content piece{genItems.filter((g) => g.status === "done").length !== 1 ? "s" : ""} generated!
            </p>
          </div>
          <div className="space-y-2 mb-4">
            {genItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)] px-4 py-2.5">
                {item.status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-red-400 shrink-0" />
                )}
                <span className="text-xs font-medium text-[var(--text-primary)] flex-1">
                  {CONTENT_TYPE_LABELS[item.rec.contentType] || item.rec.contentType} — {item.rec.brand.name}
                </span>
                {item.deliverableId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-[var(--accent-primary)]"
                    onClick={() => router.push(`/m/yantri/review/${item.deliverableId}`)}
                  >
                    Review <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
                {item.status === "error" && (
                  <span className="text-[10px] text-red-400">{item.error}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-[var(--accent-primary)] hover:opacity-90" onClick={handleReset}>
              <Sparkles className="h-4 w-4 mr-2" /> New Topic
            </Button>
            {genItems.some((g) => g.deliverableId) && (
              <Button
                variant="outline"
                onClick={() => {
                  const first = genItems.find((g) => g.deliverableId);
                  if (first) router.push(`/m/yantri/review/${first.deliverableId}`);
                }}
              >
                <ArrowRight className="h-4 w-4 mr-2" /> Go to Review
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* PIPELINE KANBAN                                    */}
      {/* ═══════════════════════════════════════════════════ */}

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
