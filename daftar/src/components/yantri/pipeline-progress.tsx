"use client";

import { cn } from "@/lib/utils";

export type PipelineStage = "signal" | "dossier" | "strategy" | "content" | "review";
export type StageStatus = "complete" | "in_progress" | "waiting";

interface PipelineProgressProps {
  stages: Record<PipelineStage, StageStatus>;
  onStageClick?: (stage: PipelineStage) => void;
  className?: string;
}

const STAGE_META: { key: PipelineStage; label: string }[] = [
  { key: "signal", label: "Signal" },
  { key: "dossier", label: "Dossier" },
  { key: "strategy", label: "Strategy" },
  { key: "content", label: "Content" },
  { key: "review", label: "Review" },
];

export function PipelineProgress({ stages, onStageClick, className }: PipelineProgressProps) {
  return (
    <div className={cn("flex items-center gap-0", className)}>
      {STAGE_META.map((stage, i) => {
        const status = stages[stage.key];
        return (
          <div key={stage.key} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  "w-8 h-0.5 transition-colors",
                  status === "complete" || stages[STAGE_META[i - 1].key] === "complete"
                    ? "bg-[#2E86AB]"
                    : "bg-[#E5E7EB]"
                )}
              />
            )}
            <button
              type="button"
              onClick={() => onStageClick?.(stage.key)}
              className="flex flex-col items-center gap-1 group"
              title={stage.label}
            >
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 transition-all",
                  status === "complete" && "bg-[#2E86AB] border-[#2E86AB]",
                  status === "in_progress" && "bg-white border-[#2E86AB] animate-pulse shadow-[0_0_0_3px_rgba(46,134,171,0.2)]",
                  status === "waiting" && "bg-white border-[#E5E7EB]"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  status === "complete" && "text-[#2E86AB]",
                  status === "in_progress" && "text-[#2E86AB] font-semibold",
                  status === "waiting" && "text-[#9CA3AF]"
                )}
              >
                {stage.label}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Derive pipeline stages from a pipeline status string */
export function derivePipelineStages(pipelineStatus: string): Record<PipelineStage, StageStatus> {
  const order: PipelineStage[] = ["signal", "dossier", "strategy", "content", "review"];
  const currentIdx = order.indexOf(pipelineStatus as PipelineStage);
  const stages: Record<PipelineStage, StageStatus> = {
    signal: "waiting",
    dossier: "waiting",
    strategy: "waiting",
    content: "waiting",
    review: "waiting",
  };
  for (let i = 0; i < order.length; i++) {
    if (i < currentIdx) stages[order[i]] = "complete";
    else if (i === currentIdx) stages[order[i]] = "in_progress";
    else stages[order[i]] = "waiting";
  }
  // If status is "approved" or "completed", everything is complete
  if (pipelineStatus === "approved" || pipelineStatus === "completed") {
    for (const k of order) stages[k] = "complete";
  }
  return stages;
}
