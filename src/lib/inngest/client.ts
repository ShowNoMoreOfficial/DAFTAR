import { Inngest } from "inngest";

// ─── Event Schemas ───────────────────────────────────────
// Each event has a typed payload so functions receive
// fully-typed data at invocation time.

type DaftarEvents = {
  /**
   * Khabri: A raw signal has been ingested and needs enrichment
   * via the SkillOrchestrator (credibility scoring, geo-relevance,
   * deduplication, event detection).
   */
  "khabri/signal.process": {
    data: {
      signalId: string;
      trendId: string;
      source: string;
      title: string;
    };
  };

  /**
   * Yantri: A narrative is ready and deliverables need to be
   * generated across platforms. Multi-step pipeline:
   * draft → asset generation → finalization.
   */
  "yantri/deliverable.generate": {
    data: {
      narrativeTreeId: string;
      brandId: string;
      platforms: string[]; // e.g. ["YOUTUBE", "X_THREAD", "META_REEL"]
      narrativeMarkdown: string;
    };
  };

  /**
   * Relay: A finalized deliverable should be published to
   * the target platform via its API.
   */
  "relay/post.publish": {
    data: {
      postId: string;
      platform: string;
      brandId: string;
      content: string;
      scheduledAt?: string; // ISO string, if scheduled for later
    };
  };
};

// ─── Inngest Client ──────────────────────────────────────
// Single instance shared across all functions and the serve route.

export const inngest = new Inngest({
  id: "daftar",
  schemas: new Map() as never, // Inngest infers from the generic
}) as Inngest<{ id: "daftar"; events: DaftarEvents }>;

// Re-export the event type map for use in function definitions
export type { DaftarEvents };
