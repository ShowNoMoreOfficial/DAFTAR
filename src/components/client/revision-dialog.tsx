"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface RevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: string) => void;
}

export function RevisionDialog({ open, onOpenChange, onSubmit }: RevisionDialogProps) {
  const [feedback, setFeedback] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim()) return;
    onSubmit(feedback.trim());
    setFeedback("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Request Revision</h2>
            <p className="text-xs text-[#9CA3AF]">Tell us what needs to change</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 text-[#9CA3AF] hover:bg-[#F8F9FA] hover:text-[#6B7280]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="revision-feedback" className="mb-1.5 block text-sm font-medium text-[#6B7280]">
              Feedback <span className="text-red-400">*</span>
            </label>
            <textarea
              id="revision-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Please describe what changes you'd like — be as specific as possible..."
              rows={5}
              required
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#D1D5DB] focus:border-[#2E86AB] focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20"
            />
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {feedback.trim().length === 0
                ? "Feedback is required to submit a revision request."
                : `${feedback.trim().length} characters`}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F8F9FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedback.trim()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
            >
              Submit Revision Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
