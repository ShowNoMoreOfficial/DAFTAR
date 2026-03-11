"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DeliverableViewer } from "@/components/client/deliverable-viewer";
import { Loader2, ShieldAlert } from "lucide-react";

interface Deliverable {
  id: string;
  title: string;
  type: "video_script" | "twitter_thread" | "article" | "graphic" | "social_post";
  brandName: string;
  content: string;
  metadata: {
    platform?: string;
    wordCount?: number;
    estimatedReadTime?: string;
    createdAt: string;
  };
  status: "pending" | "ready_for_review" | "approved" | "revision_requested";
  feedback: string | null;
}

// Mock deliverables keyed by token
const MOCK_DELIVERABLES: Record<string, Deliverable> = {
  "abc123-demo": {
    id: "del_001",
    title: "Why AI Will NOT Replace Journalists — A Thread",
    type: "twitter_thread",
    brandName: "Breaking Tube",
    content: `🧵 1/7 Everyone says AI will replace journalists. Here's why that's dead wrong — and why the REAL disruption is something nobody's talking about.

2/7 AI can summarize. AI can rewrite. But AI cannot sit in a courtroom for 14 hours, read body language, and ask the ONE question that cracks a case open.

3/7 Journalism isn't "content creation." It's accountability infrastructure. The moment you remove the human, you remove the conscience.

4/7 What AI WILL replace: the copy-paste merchants. The aggregators. The "according to sources" crowd who never had sources to begin with.

5/7 The real disruption? Distribution. AI won't write better stories — it'll make sure the RIGHT stories reach the RIGHT people at the RIGHT time.

6/7 Smart newsrooms aren't replacing reporters with AI. They're giving reporters AI-powered research tools, letting them do in 2 hours what used to take 2 weeks.

7/7 The future isn't AI vs. Journalists. It's AI-augmented journalism vs. everything else. And the augmented side wins every time. 🔥`,
    metadata: {
      platform: "X / Twitter",
      wordCount: 168,
      estimatedReadTime: "2 min thread",
      createdAt: "2026-03-08T14:30:00Z",
    },
    status: "ready_for_review",
    feedback: null,
  },
  "def456-demo": {
    id: "del_002",
    title: "The Squirrels — Episode 12 Cold Open Script",
    type: "video_script",
    brandName: "The Squirrels",
    content: `COLD OPEN — INT. NEWSROOM — NIGHT

[WIDE SHOT: The newsroom is empty except for ARJUN (28), hunched over his desk, three monitors glowing. Coffee cups form a small fortress around his keyboard.]

ARJUN (V.O.)
They say every great story starts with a question. Mine started with a spreadsheet.

[He clicks through financial documents. Numbers highlighted in red.]

ARJUN (V.O.)
₹400 crore. Vanished from the Municipal Development Fund. Not stolen — "reallocated." Funny word, that.

[CUT TO: His phone buzzes. Unknown number. He stares at it.]

ARJUN
(answering)
Hello?

VOICE (O.S.)
Stop digging, Arjun. Some stories aren't meant to be told.

[BEAT. Arjun slowly smiles.]

ARJUN
That's exactly what they said about the last one.

[He hangs up. Opens a new document. Types: "THE MISSING 400"]

SMASH CUT TO: TITLE CARD

[END COLD OPEN — 45 seconds]`,
    metadata: {
      platform: "YouTube",
      wordCount: 142,
      estimatedReadTime: "45 sec runtime",
      createdAt: "2026-03-09T09:15:00Z",
    },
    status: "ready_for_review",
    feedback: null,
  },
};

export default function PortalPage() {
  const { token } = useParams<{ token: string }>();
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [actionComplete, setActionComplete] = useState<"approved" | "revision_requested" | null>(null);

  useEffect(() => {
    // Simulate async token lookup
    const timer = setTimeout(() => {
      const found = MOCK_DELIVERABLES[token];
      if (found) {
        setDeliverable(found);
      } else {
        setInvalid(true);
      }
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [token]);

  async function handleAction(action: "APPROVE" | "REVISE", feedback?: string) {
    if (!deliverable) return;

    const res = await fetch("/api/client/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action, feedback: feedback || null }),
    });

    if (res.ok) {
      setActionComplete(action === "APPROVE" ? "approved" : "revision_requested");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading deliverable...</p>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)]">
          <ShieldAlert className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Invalid or Expired Link</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          This review link is no longer valid. Please contact your account manager for a new link.
        </p>
      </div>
    );
  }

  if (actionComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            actionComplete === "approved" ? "bg-[rgba(16,185,129,0.1)]" : "bg-[rgba(245,158,11,0.1)]"
          }`}
        >
          {actionComplete === "approved" ? (
            <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          )}
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {actionComplete === "approved" ? "Deliverable Approved!" : "Revision Requested"}
        </h2>
        <p className="mt-1 max-w-sm text-center text-sm text-[var(--text-muted)]">
          {actionComplete === "approved"
            ? "Thank you! Your approval has been recorded. Our team will proceed with publishing."
            : "Your feedback has been sent to the team. They'll revise and send you an updated version."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Brand & meta header */}
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-md bg-[var(--accent-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-primary)]">
            {deliverable!.brandName}
          </span>
          <span className="text-xs text-[var(--text-muted)]">•</span>
          <span className="text-xs text-[var(--text-muted)]">{deliverable!.metadata.platform}</span>
        </div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{deliverable!.title}</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Submitted{" "}
          {new Date(deliverable!.metadata.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          {deliverable!.metadata.wordCount && ` · ${deliverable!.metadata.wordCount} words`}
          {deliverable!.metadata.estimatedReadTime && ` · ${deliverable!.metadata.estimatedReadTime}`}
        </p>
      </div>

      <DeliverableViewer
        type={deliverable!.type}
        content={deliverable!.content}
        onApprove={() => handleAction("APPROVE")}
        onRequestRevision={(feedback) => handleAction("REVISE", feedback)}
      />
    </div>
  );
}
