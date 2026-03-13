"use client";

import { useState } from "react";
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  ThumbsUp,
  X,
  Send,
} from "lucide-react";

type FeedbackType = "bug" | "suggestion" | "content_quality" | "ux_issue";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message,
          rating,
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setIsOpen(false);
        setMessage("");
        setRating(null);
      }, 2000);
    } catch {
      alert("Failed to send feedback. Try again.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 p-3 rounded-full bg-[var(--accent-primary)] text-white shadow-lg hover:opacity-90 transition-opacity"
        title="Send Feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          Send Feedback
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {sent ? (
          <div className="text-center py-4">
            <p className="text-[var(--accent-primary)] font-medium">
              Thanks! Feedback recorded.
            </p>
          </div>
        ) : (
          <>
            {/* Type selector */}
            <div className="flex gap-2">
              {(
                [
                  { key: "bug", icon: Bug, label: "Bug" },
                  { key: "suggestion", icon: Lightbulb, label: "Idea" },
                  { key: "content_quality", icon: ThumbsUp, label: "Content" },
                  { key: "ux_issue", icon: MessageSquarePlus, label: "UX" },
                ] as const
              ).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors ${
                    type === key
                      ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30"
                      : "bg-[var(--bg-deep)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Rating (for content quality) */}
            {type === "content_quality" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  Quality:
                </span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={`w-8 h-8 rounded-full text-xs font-medium ${
                      rating === n
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-[var(--bg-deep)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            {/* Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === "bug"
                  ? "What went wrong? What did you expect?"
                  : type === "suggestion"
                    ? "What would make this better?"
                    : type === "content_quality"
                      ? "How was the generated content?"
                      : "What felt confusing or hard to use?"
              }
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-primary)]"
            />

            {/* Current page */}
            <p className="text-xs text-[var(--text-muted)]">
              Page: {typeof window !== "undefined" ? window.location.pathname : ""}
            </p>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || sending}
              className="w-full py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : "Send Feedback"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
