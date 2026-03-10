"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, ArrowRight, Radio, GitBranch, Send } from "lucide-react";

interface PipelineRun {
  id: string;
  signalTitle: string;
  brandName: string;
  status: string;
  startedAt: string;
}

const STAGE_ORDER = ["pending", "researching", "drafting", "review", "approved", "distributed"];

function stageColor(status: string) {
  switch (status) {
    case "pending": return "bg-gray-100 text-gray-600";
    case "researching": return "bg-amber-50 text-amber-700";
    case "drafting": return "bg-blue-50 text-blue-700";
    case "review": return "bg-purple-50 text-purple-700";
    case "approved": return "bg-emerald-50 text-emerald-700";
    case "distributed": return "bg-teal-50 text-teal-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

export default function YantriWorkspacePage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/pipeline/runs");
        if (res.ok) {
          const data = await res.json();
          setRuns(data.runs || []);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Workspace</h1>
          <p className="text-sm text-[#6B7280] mt-1">Active signal-to-deliverable pipeline runs</p>
        </div>
        <Button size="sm" className="bg-[#2E86AB] hover:bg-[#236b8a]" onClick={() => window.location.href = "/m/khabri/signals"}>
          <Radio className="h-4 w-4 mr-2" />
          Browse Signals
        </Button>
      </div>

      {/* Pipeline stages overview */}
      <div className="flex items-center gap-2 mb-6 text-xs text-[#6B7280] flex-wrap">
        {STAGE_ORDER.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2">
            {i > 0 && <ArrowRight className="h-3 w-3 text-[#D1D5DB]" />}
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
        <Card className="border-[#E5E7EB]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-10 w-10 text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">No active pipeline runs.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Promote a signal from Khabri or trigger the pipeline from a narrative tree to start.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <Card key={run.id} className="border-[#E5E7EB]">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">{run.signalTitle}</h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">{run.brandName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={"text-[10px] font-semibold " + stageColor(run.status)}>
                    {run.status}
                  </Badge>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {new Date(run.startedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
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
