"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PipelineProgress, derivePipelineStages } from "@/components/yantri/pipeline-progress";
import { getContentTypeIcon, getContentTypeLabel, getPlatformLabel, CONTENT_TYPES } from "@/components/yantri/content-type-icons";
import {
  ArrowLeft, Loader2, Radio, FileText, Lightbulb, PenTool, CheckCircle,
  XCircle, RotateCcw, Save, ChevronDown, ChevronRight, ExternalLink, Clock,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface PipelineDetail {
  id: string;
  signal: { topic: string; source: string; createdAt: string; url?: string };
  factDossier: {
    id: string;
    content: Record<string, unknown>;
    status: string;
    keyFacts?: string[];
    sources?: string[];
    statistics?: string[];
  } | null;
  strategyDecision: {
    id: string;
    contentType: string;
    platform: string;
    angle: string;
    hook: string;
    tone: string;
    priority: string;
    reasoning: string;
    estimatedLength?: string;
    keyPoints?: string[];
  } | null;
  deliverables: {
    id: string;
    status: string;
    contentType: string;
    platform: string;
    version: number;
    assets: {
      script?: { sections: { type: string; duration: string; text: string; visualNotes?: string }[] };
      titles?: { text: string; strategy: string }[];
      description?: string;
      tags?: string[];
      thumbnailBriefs?: { concept: string; textOverlay: string; colorScheme: string; expression: string; composition: string }[];
      tweets?: { position: number | string; text: string; media?: string | null }[];
      slides?: { position: number | string; text: string; visualDescription: string }[];
      caption?: string;
    };
  }[];
  pipelineStatus: string;
  brand?: { id: string; name: string };
}

// ── Collapsible Section ──────────────────────────────────────────────────────

function Section({
  title, icon, children, defaultOpen = false, id,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-[#E5E7EB]" id={id}>
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F8F9FA]/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-[#1A1A1A]">{title}</h2>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-[#6B7280]" /> : <ChevronRight className="h-4 w-4 text-[#6B7280]" />}
      </button>
      {open && <CardContent className="pt-0 px-4 pb-4">{children}</CardContent>}
    </Card>
  );
}

// ── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    breaking: "bg-red-500 text-white",
    trending: "bg-amber-500 text-white",
    evergreen: "bg-emerald-100 text-emerald-700",
  };
  return (
    <Badge className={colors[priority] || "bg-gray-100 text-gray-600"}>
      {priority}
    </Badge>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.id as string;

  const [data, setData] = useState<PipelineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Manual strategy override state
  const [overrideType, setOverrideType] = useState("");
  const [overridePlatform, setOverridePlatform] = useState("");
  const [overrideAngle, setOverrideAngle] = useState("");
  const [overrideHook, setOverrideHook] = useState("");

  // Review actions state
  const [revisionNotes, setRevisionNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Selected title for deliverable
  const [selectedTitle, setSelectedTitle] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/yantri/narrative-trees/${pipelineId}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      /* silent */
    }
    setLoading(false);
  }, [pipelineId]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function generateStrategy() {
    if (!data?.factDossier?.id || !data?.brand?.id) return;
    setActionLoading("strategy");
    try {
      const res = await fetch("/api/yantri/strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factDossierId: data.factDossier.id, brandId: data.brand.id }),
      });
      if (res.ok) {
        toast.success("Strategy generated");
        load();
      } else {
        toast.error("Failed to generate strategy");
      }
    } catch {
      toast.error("Network error");
    }
    setActionLoading(null);
  }

  async function approveDeliverable(deliverableId: string) {
    setActionLoading("approve");
    try {
      const res = await fetch(`/api/yantri/deliverables/${deliverableId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedTitleIndex: selectedTitle }),
      });
      if (res.ok) {
        toast.success("Deliverable approved — PMS task created");
        load();
      } else {
        toast.error("Failed to approve");
      }
    } catch {
      toast.error("Network error");
    }
    setActionLoading(null);
  }

  async function rejectDeliverable(deliverableId: string) {
    if (!rejectReason.trim()) return;
    setActionLoading("reject");
    try {
      const res = await fetch(`/api/yantri/deliverables/${deliverableId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        toast.success("Deliverable rejected");
        setRejectReason("");
        setShowRejectInput(false);
        load();
      }
    } catch {
      toast.error("Network error");
    }
    setActionLoading(null);
  }

  async function requestRevision(deliverableId: string) {
    if (!revisionNotes.trim()) return;
    setActionLoading("revise");
    try {
      const res = await fetch(`/api/yantri/deliverables/${deliverableId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: revisionNotes }),
      });
      if (res.ok) {
        toast.success("Revision requested — new version will be generated");
        setRevisionNotes("");
        setShowRevisionInput(false);
        load();
      }
    } catch {
      toast.error("Network error");
    }
    setActionLoading(null);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#6B7280]">Pipeline not found.</p>
        <Link href="/m/yantri/workspace">
          <Button variant="outline" size="sm" className="mt-4">Back to Workspace</Button>
        </Link>
      </div>
    );
  }

  const stages = derivePipelineStages(data.pipelineStatus);
  const latestDeliverable = data.deliverables?.[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/m/yantri/workspace">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-[#1A1A1A] truncate">{data.signal.topic}</h1>
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-0.5">
            {data.brand && <span className="font-medium">{data.brand.name}</span>}
            <span>&middot;</span>
            <Clock className="h-3 w-3" />
            <span>{new Date(data.signal.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Pipeline Progress */}
      <Card className="border-[#E5E7EB]">
        <CardContent className="p-4 flex justify-center">
          <PipelineProgress
            stages={stages}
            onStageClick={(stage) => {
              document.getElementById(`section-${stage}`)?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </CardContent>
      </Card>

      {/* Section 1: Signal */}
      <Section title="Signal" icon={<Radio className="h-4 w-4 text-[#2E86AB]" />} defaultOpen id="section-signal">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Topic</span>
            <span className="text-[#1A1A1A] font-medium">{data.signal.topic}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Source</span>
            <Badge variant="secondary" className="text-xs">{data.signal.source}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Submitted</span>
            <span className="text-[#1A1A1A]">{new Date(data.signal.createdAt).toLocaleString("en-IN")}</span>
          </div>
          {data.signal.url && (
            <div className="flex justify-between">
              <span className="text-[#6B7280]">URL</span>
              <a href={data.signal.url} target="_blank" rel="noopener noreferrer" className="text-[#2E86AB] flex items-center gap-1">
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </Section>

      {/* Section 2: FactDossier */}
      <Section title="Fact Dossier" icon={<FileText className="h-4 w-4 text-[#2E86AB]" />} defaultOpen={!!data.factDossier} id="section-dossier">
        {!data.factDossier ? (
          <p className="text-sm text-[#9CA3AF] italic">Dossier not yet generated.</p>
        ) : (
          <div className="space-y-3">
            {data.factDossier.keyFacts && data.factDossier.keyFacts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Key Facts</h3>
                <ul className="list-disc list-inside text-sm text-[#1A1A1A] space-y-1">
                  {data.factDossier.keyFacts.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            {data.factDossier.sources && data.factDossier.sources.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Sources</h3>
                <ul className="list-disc list-inside text-sm text-[#2E86AB] space-y-1">
                  {data.factDossier.sources.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {data.factDossier.statistics && data.factDossier.statistics.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Statistics</h3>
                <ul className="list-disc list-inside text-sm text-[#1A1A1A] space-y-1">
                  {data.factDossier.statistics.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            <details className="mt-2">
              <summary className="text-xs text-[#6B7280] cursor-pointer hover:text-[#2E86AB]">View full dossier JSON</summary>
              <pre className="mt-2 text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-3 overflow-auto max-h-60">
                {JSON.stringify(data.factDossier.content, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </Section>

      {/* Section 3: Strategy Decision */}
      <Section title="Strategy Decision" icon={<Lightbulb className="h-4 w-4 text-[#A23B72]" />} defaultOpen={!!data.strategyDecision} id="section-strategy">
        {!data.strategyDecision ? (
          <div className="text-center py-4">
            <p className="text-sm text-[#9CA3AF] mb-3">No strategy decision yet.</p>
            <Button
              size="sm"
              className="bg-[#2E86AB] hover:bg-[#236b8a]"
              onClick={generateStrategy}
              disabled={!data.factDossier || actionLoading === "strategy"}
            >
              {actionLoading === "strategy" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
              Generate Strategy
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#6B7280] text-xs">Content Type</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(() => { const Icon = getContentTypeIcon(data.strategyDecision!.contentType); return <Icon className="h-4 w-4 text-[#2E86AB]" />; })()}
                  <span className="font-medium text-[#1A1A1A]">{getContentTypeLabel(data.strategyDecision!.contentType)}</span>
                </div>
              </div>
              <div>
                <span className="text-[#6B7280] text-xs">Platform</span>
                <p className="font-medium text-[#1A1A1A] mt-0.5">{getPlatformLabel(data.strategyDecision!.platform)}</p>
              </div>
              <div>
                <span className="text-[#6B7280] text-xs">Angle</span>
                <p className="font-medium text-[#1A1A1A] mt-0.5">{data.strategyDecision!.angle}</p>
              </div>
              <div>
                <span className="text-[#6B7280] text-xs">Hook</span>
                <p className="font-medium text-[#1A1A1A] mt-0.5">{data.strategyDecision!.hook}</p>
              </div>
              <div>
                <span className="text-[#6B7280] text-xs">Tone</span>
                <p className="font-medium text-[#1A1A1A] mt-0.5">{data.strategyDecision!.tone}</p>
              </div>
              <div>
                <span className="text-[#6B7280] text-xs">Priority</span>
                <div className="mt-0.5"><PriorityBadge priority={data.strategyDecision!.priority} /></div>
              </div>
            </div>
            {data.strategyDecision!.reasoning && (
              <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-3">
                <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">AI Reasoning</span>
                <p className="text-sm text-[#1A1A1A] mt-1">{data.strategyDecision!.reasoning}</p>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={generateStrategy} disabled={actionLoading === "strategy"}>
              {actionLoading === "strategy" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RotateCcw className="h-3 w-3 mr-1" />}
              Regenerate Strategy
            </Button>
          </div>
        )}
      </Section>

      {/* Section 4: Manual Strategy Override */}
      <Section title="Manual Strategy Override" icon={<PenTool className="h-4 w-4 text-[#6B7280]" />} id="section-override">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#6B7280] font-medium">Content Type</label>
            <select
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
              value={overrideType}
              onChange={(e) => setOverrideType(e.target.value)}
            >
              <option value="">Select...</option>
              {Object.entries(CONTENT_TYPES).map(([key, ct]) => (
                <option key={key} value={key}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#6B7280] font-medium">Platform</label>
            <select
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
              value={overridePlatform}
              onChange={(e) => setOverridePlatform(e.target.value)}
            >
              <option value="">Select...</option>
              <option value="youtube">YouTube</option>
              <option value="x_twitter">X/Twitter</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="blog">Blog</option>
              <option value="newsletter">Newsletter</option>
              <option value="podcast">Podcast</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#6B7280] font-medium">Custom Angle</label>
            <Input className="mt-1" placeholder="e.g., contrarian deep dive" value={overrideAngle} onChange={(e) => setOverrideAngle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[#6B7280] font-medium">Custom Hook</label>
            <Input className="mt-1" placeholder="e.g., rhetorical question" value={overrideHook} onChange={(e) => setOverrideHook(e.target.value)} />
          </div>
        </div>
        <Button size="sm" className="mt-3 bg-[#A23B72] hover:bg-[#8a3261]" disabled={!overrideType || !overridePlatform}>
          Use My Strategy
        </Button>
      </Section>

      {/* Section 5: Generated Content */}
      {latestDeliverable && (
        <Section title="Generated Content" icon={<FileText className="h-4 w-4 text-[#2E86AB]" />} defaultOpen id="section-content">
          <div className="space-y-4">
            {/* Version info */}
            {data.deliverables.length > 1 && (
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                {data.deliverables.map((d, i) => (
                  <Badge key={d.id} variant={i === 0 ? "default" : "secondary"} className="text-[10px]">
                    v{d.version || data.deliverables.length - i}{" "}
                    ({d.status.replace(/_/g, " ")})
                  </Badge>
                ))}
              </div>
            )}

            {/* Script sections */}
            {latestDeliverable.assets.script?.sections && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Script</h3>
                <div className="space-y-2">
                  {latestDeliverable.assets.script.sections.map((sec, i) => (
                    <details key={i} className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg">
                      <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-[#1A1A1A] flex items-center justify-between">
                        <span className="capitalize">{sec.type}</span>
                        <span className="text-xs text-[#9CA3AF]">{sec.duration}</span>
                      </summary>
                      <div className="px-3 pb-3 text-sm text-[#1A1A1A] whitespace-pre-wrap">{sec.text}</div>
                      {sec.visualNotes && (
                        <div className="px-3 pb-3 text-xs text-[#6B7280] italic">Visual: {sec.visualNotes}</div>
                      )}
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Tweets (for thread) */}
            {latestDeliverable.assets.tweets && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Thread</h3>
                <div className="space-y-2">
                  {latestDeliverable.assets.tweets.map((t, i) => (
                    <div key={i} className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px]">{t.position}</Badge>
                        <span className="text-[10px] text-[#9CA3AF]">{t.text.length}/280</span>
                      </div>
                      <p className="text-sm text-[#1A1A1A]">{t.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slides (for carousel) */}
            {latestDeliverable.assets.slides && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Carousel Slides</h3>
                <div className="grid grid-cols-2 gap-2">
                  {latestDeliverable.assets.slides.map((s, i) => (
                    <div key={i} className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-3">
                      <Badge variant="secondary" className="text-[10px] mb-1">Slide {s.position}</Badge>
                      <p className="text-sm font-medium text-[#1A1A1A]">{s.text}</p>
                      <p className="text-xs text-[#6B7280] mt-1 italic">{s.visualDescription}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Titles */}
            {latestDeliverable.assets.titles && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Title Options</h3>
                <div className="space-y-2">
                  {latestDeliverable.assets.titles.map((t, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTitle === i ? "border-[#2E86AB] bg-[#2E86AB]/5" : "border-[#E5E7EB] hover:border-[#2E86AB]/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="title"
                        checked={selectedTitle === i}
                        onChange={() => setSelectedTitle(i)}
                        className="accent-[#2E86AB]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{t.text}</p>
                        <p className="text-xs text-[#6B7280]">Strategy: {t.strategy}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {latestDeliverable.assets.description && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Description</h3>
                <Textarea
                  className="text-sm border-[#E5E7EB] min-h-[100px]"
                  defaultValue={latestDeliverable.assets.description}
                />
              </div>
            )}

            {/* Caption (carousel/reel) */}
            {latestDeliverable.assets.caption && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Caption</h3>
                <Textarea
                  className="text-sm border-[#E5E7EB] min-h-[80px]"
                  defaultValue={latestDeliverable.assets.caption}
                />
              </div>
            )}

            {/* Tags */}
            {latestDeliverable.assets.tags && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {latestDeliverable.assets.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Thumbnail Briefs */}
            {latestDeliverable.assets.thumbnailBriefs && (
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Thumbnail Briefs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {latestDeliverable.assets.thumbnailBriefs.map((tb, i) => (
                    <Card key={i} className="border-[#E5E7EB]">
                      <CardContent className="p-3 space-y-1 text-xs">
                        <p className="font-medium text-[#1A1A1A]">{tb.concept}</p>
                        <p className="text-[#6B7280]">Text: &ldquo;{tb.textOverlay}&rdquo;</p>
                        <p className="text-[#6B7280]">Colors: {tb.colorScheme}</p>
                        <p className="text-[#6B7280]">Expression: {tb.expression}</p>
                        <p className="text-[#6B7280]">Composition: {tb.composition}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Section 6: Actions */}
      {latestDeliverable && (
        <Card className="border-[#E5E7EB]" id="section-review">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Actions</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={latestDeliverable.status === "approved" || !!actionLoading}
                onClick={() => approveDeliverable(latestDeliverable.id)}
              >
                {actionLoading === "approve" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500 text-amber-600 hover:bg-amber-50"
                disabled={!!actionLoading}
                onClick={() => { setShowRevisionInput(!showRevisionInput); setShowRejectInput(false); }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Request Revision
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
                disabled={!!actionLoading}
                onClick={() => { setShowRejectInput(!showRejectInput); setShowRevisionInput(false); }}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
              <Button size="sm" variant="ghost">
                <Save className="h-3 w-3 mr-1" />
                Save Draft
              </Button>
            </div>

            {showRevisionInput && (
              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                <Textarea
                  placeholder="Describe what needs to change..."
                  className="text-sm"
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                />
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={!revisionNotes.trim() || actionLoading === "revise"}
                  onClick={() => requestRevision(latestDeliverable.id)}
                >
                  {actionLoading === "revise" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Submit Revision Request
                </Button>
              </div>
            )}

            {showRejectInput && (
              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                <Textarea
                  placeholder="Reason for rejection..."
                  className="text-sm"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={!rejectReason.trim() || actionLoading === "reject"}
                  onClick={() => rejectDeliverable(latestDeliverable.id)}
                >
                  {actionLoading === "reject" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Confirm Rejection
                </Button>
              </div>
            )}

            {latestDeliverable.status === "approved" && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                This deliverable has been approved and sent to production.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
