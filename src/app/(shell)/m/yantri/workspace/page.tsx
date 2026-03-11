"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, ArrowRight, Radio, GitBranch, Send } from "lucide-react";

interface PipelineRun {
  id: string;
  title: string;
  status: string;
  urgency: string;
  createdBy: string;
  createdAt: string;
  deliverables: number;
  platforms: string[];
}

const STAGE_ORDER = ["INCOMING", "APPROVED", "IN_PRODUCTION", "COMPLETED"];

function stageColor(status: string) {
  switch (status) {
    case "INCOMING": return "bg-[rgba(59,130,246,0.1)] text-blue-700";
    case "EVALUATING": return "bg-[rgba(245,158,11,0.1)] text-amber-700";
    case "APPROVED": return "bg-[rgba(16,185,129,0.1)] text-emerald-700";
    case "IN_PRODUCTION": return "bg-[rgba(168,85,247,0.1)] text-purple-700";
    case "COMPLETED": return "bg-[var(--bg-elevated)] text-gray-600";
    default: return "bg-[var(--bg-elevated)] text-gray-600";
  }
}

export default function YantriWorkspacePage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/yantri/pipeline/status");
        if (res.ok) {
          const data = await res.json();
          setRuns(Array.isArray(data) ? data : data.runs || []);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Workspace</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Active signal-to-deliverable pipeline runs</p>
        </div>
        <Button size="sm" className="bg-[var(--accent-primary)] hover:bg-[#236b8a]" onClick={() => window.location.href = "/m/khabri/signals"}>
          <Radio className="h-4 w-4 mr-2" />
          Browse Signals
        </Button>
      </div>

      {/* Pipeline stages overview */}
      <div className="flex items-center gap-2 mb-6 text-xs text-[var(--text-secondary)] flex-wrap">
        {STAGE_ORDER.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2">
            {i > 0 && <ArrowRight className="h-3 w-3 text-[var(--text-muted)]" />}
            <div className="flex items-center gap-1">
              {stage === "pending" && <Radio className="h-3 w-3" />}
              {stage === "researching" && <Zap className="h-3 w-3" />}
              {stage === "drafting" && <GitBranch className="h-3 w-3" />}
              {stage === "distributed" && <Send className="h-3 w-3" />}
              <span className="capitalize">{stage}</span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                {runs.filter((r) => r.status === stage).length}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {runs.length === 0 ? (
        <Card className="border-[var(--border-subtle)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-10 w-10 text-[var(--text-muted)] mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">No active pipeline runs.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Promote a signal from Khabri or trigger the pipeline from a narrative tree to start.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <Card key={run.id} className="border-[var(--border-subtle)] hover:border-[#2E86AB]/30 transition-colors cursor-pointer"
              onClick={() => window.location.href = "/m/yantri/narrative-trees/" + run.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{run.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                    <span>{run.deliverables} deliverable{run.deliverables !== 1 ? "s" : ""}</span>
                    {run.platforms.length > 0 && (
                      <span>{run.platforms.join(", ")}</span>
                    )}
                    <span>by {run.createdBy}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {run.urgency !== "normal" && (
                    <Badge className={run.urgency === "breaking" ? "bg-[rgba(239,68,68,0.1)]0 text-white text-[9px]" : "bg-[rgba(245,158,11,0.1)]0 text-white text-[9px]"}>
                      {run.urgency}
                    </Badge>
                  )}
                  <Badge className={"text-[10px] font-semibold " + stageColor(run.status)}>
                    {run.status.replace("_", " ")}
                  </Badge>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(run.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
