"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquareWarning } from "lucide-react";
import { RevisionDialog } from "./revision-dialog";

interface DeliverableViewerProps {
  type: string;
  content: string;
  onApprove: () => void;
  onRequestRevision: (feedback: string) => void;
}

export function DeliverableViewer({
  type,
  content,
  onApprove,
  onRequestRevision,
}: DeliverableViewerProps) {
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleApprove() {
    setSubmitting(true);
    await onApprove();
    setSubmitting(false);
  }

  function handleRevisionSubmit(feedback: string) {
    setSubmitting(true);
    onRequestRevision(feedback);
    setRevisionOpen(false);
  }

  return (
    <div>
      {/* Content card */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm">
        {/* Type label */}
        <div className="border-b border-[var(--border-subtle)] px-6 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {type.replace(/_/g, " ")}
          </span>
        </div>

        {/* Content body */}
        <div className="px-6 py-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[var(--text-primary)]">
            {content}
          </pre>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleApprove}
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-8 py-5 text-lg font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
        >
          <CheckCircle2 className="h-6 w-6" />
          {submitting ? "Submitting..." : "Approve"}
        </button>
        <button
          onClick={() => setRevisionOpen(true)}
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-red-600 px-8 py-5 text-lg font-semibold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
        >
          <MessageSquareWarning className="h-6 w-6" />
          Request Revision
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
        Your response will be recorded and sent to the content team.
      </p>

      <RevisionDialog
        open={revisionOpen}
        onOpenChange={setRevisionOpen}
        onSubmit={handleRevisionSubmit}
      />
    </div>
  );
}
