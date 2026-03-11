/**
 * Twitter/X Thread Engine
 *
 * Generates a complete X/Twitter thread package:
 * - Hook tweet (first tweet that stops the scroll)
 * - Body tweets with data, context, escalation
 * - Close tweet with CTA
 * - Image prompts for visual anchors
 * - Engagement strategy (reply playbook)
 *
 * Optimized for 2025/2026 X algorithm: threads with 4-8 tweets,
 * data-first hooks, source-cited claims, engagement-bait close.
 */

import { routeToModel } from "@/lib/yantri/model-router";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ThreadTweet {
  position: number;
  text: string;
  characterCount: number;
  type: "hook" | "data" | "context" | "escalation" | "revelation" | "close";
  hookArchetype?: string;
  imagePrompt?: string;
}

export interface ThreadResult {
  platform: "x";
  tweets: ThreadTweet[];
  threadLength: number;
  hookArchetype: string;
  imagePrompts: string[];
  engagementStrategy: {
    bestReplyAngle: string;
    quoteRetweetBait: string;
    anticipatedPushback: string;
    pinnedReply: string;
    sourceReplies: string[];
  };
  postingPlan: {
    timeIST: string;
    timeReasoning: string;
    hashtags: string[];
    threadPacing: string;
  };
  model: string;
  raw: string;
}

export interface TwitterThreadParams {
  narrativeAngle: string;
  brandName: string;
  brandTone: string;
  voiceRules: string;
  language: string;
  researchResults: string;
  trendHeadline: string;
  hook: string;
  tone: string;
}

// ─── Prompt Builder ─────────────────────────────────────────────────────────

function buildThreadPrompt(params: TwitterThreadParams): string {
  return `You are the X/Twitter Thread Engine for ${params.brandName} — an expert at crafting high-engagement, data-dense threads that go viral on X.

NARRATIVE ANGLE: ${params.narrativeAngle}
SOURCE TREND: ${params.trendHeadline}
BRAND: ${params.brandName}
BRAND TONE: ${params.brandTone}
VOICE RULES: ${params.voiceRules}
LANGUAGE: ${params.language}
OPENING HOOK: ${params.hook}
TONE DIRECTIVE: ${params.tone}

RESEARCH DOSSIER:
${params.researchResults}

HOOK ARCHETYPES (choose the most viral-worthy):
- The Number That Should Not Exist: Lead with a statistic so shocking it demands explanation
- The Contradiction: Two facts that shouldn't coexist but do
- The Question Nobody Is Asking: Reframe the narrative with an overlooked question
- The System Reveal: Show hidden mechanics behind a visible event
- The Timeline Compression: Show how fast something changed
- The Scale Translation: Make abstract numbers viscerally relatable
- The Uncomfortable Comparison: Compare two things that reframe everything
- The Source Authority: Lead with who said it, not what was said

THREAD ARCHITECTURE (4-8 tweets):
1. HOOK TWEET: Stop the scroll. One powerful hook. Under 280 chars. No hashtags.
2. CONTEXT TWEET(S): Ground the reader. Who, what, when. Cite sources inline.
3. DATA TWEET(S): The numbers. Make them visceral. Use comparisons.
4. ESCALATION TWEET(S): Reveal connections, build stakes, show implications.
5. REVELATION TWEET: The insight nobody else is offering.
6. CLOSE TWEET: Strong CTA (retweet, follow, or thought-provoking question). Under 280 chars.

RULES:
- Every tweet must be under 280 characters
- No hashtags IN the thread text (they go in posting plan only)
- Every factual claim must cite its source inline: (Source: ...)
- No emojis unless the brand voice explicitly uses them
- Thread should read as a complete narrative even if someone only sees 2-3 tweets

OUTPUT FORMAT (respond in JSON only):
{
  "hookArchetype": "The Number That Should Not Exist",
  "tweets": [
    {
      "position": 1,
      "text": "Complete tweet text under 280 chars...",
      "characterCount": 241,
      "type": "hook",
      "hookArchetype": "The Number That Should Not Exist",
      "imagePrompt": "Detailed prompt for a data visualization image or null"
    }
  ],
  "threadLength": 6,
  "imagePrompts": ["Prompt for thread header image", "Prompt for data viz"],
  "engagementStrategy": {
    "bestReplyAngle": "The reply that will generate the most engagement",
    "quoteRetweetBait": "What makes this thread quote-retweet-worthy",
    "anticipatedPushback": "The likely counter-argument and how to address it",
    "pinnedReply": "Source links and additional context to pin as first reply",
    "sourceReplies": ["Source 1: url/description", "Source 2: url/description"]
  },
  "postingPlan": {
    "timeIST": "8:30 PM",
    "timeReasoning": "Peak engagement window reasoning",
    "hashtags": ["#tag1", "#tag2"],
    "threadPacing": "Post all tweets within 2 minutes for algorithm boost"
  }
}`;
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export async function runTwitterThreadEngine(
  params: TwitterThreadParams
): Promise<ThreadResult> {
  if (!params.narrativeAngle?.trim()) {
    throw new Error("TwitterThreadEngine: narrativeAngle is required");
  }
  if (!params.brandName?.trim()) {
    throw new Error("TwitterThreadEngine: brandName is required");
  }

  const systemPrompt = buildThreadPrompt(params);
  const userMessage = `Analyze the research, choose the best hook archetype, and craft a complete X thread for: "${params.narrativeAngle}". Make it data-dense and scroll-stopping.`;

  const result = await routeToModel("drafting", systemPrompt, userMessage, {
    temperature: 0.6,
  });

  if (!result.parsed) {
    throw new Error(
      `TwitterThreadEngine: model returned unparseable response. Raw (first 300 chars): ${result.raw.slice(0, 300)}`
    );
  }

  const parsed = result.parsed as Record<string, unknown>;
  const engagement = (parsed.engagementStrategy ?? {}) as Record<string, unknown>;
  const posting = (parsed.postingPlan ?? {}) as Record<string, unknown>;

  return {
    platform: "x",
    tweets: (parsed.tweets as ThreadTweet[]) ?? [],
    threadLength: (parsed.threadLength as number) ?? 0,
    hookArchetype: (parsed.hookArchetype as string) ?? "",
    imagePrompts: (parsed.imagePrompts as string[]) ?? [],
    engagementStrategy: {
      bestReplyAngle: (engagement.bestReplyAngle as string) ?? "",
      quoteRetweetBait: (engagement.quoteRetweetBait as string) ?? "",
      anticipatedPushback: (engagement.anticipatedPushback as string) ?? "",
      pinnedReply: (engagement.pinnedReply as string) ?? "",
      sourceReplies: (engagement.sourceReplies as string[]) ?? [],
    },
    postingPlan: {
      timeIST: (posting.timeIST as string) ?? (posting.time_ist as string) ?? "",
      timeReasoning: (posting.timeReasoning as string) ?? (posting.time_reasoning as string) ?? "",
      hashtags: (posting.hashtags as string[]) ?? [],
      threadPacing: (posting.threadPacing as string) ?? (posting.thread_pacing as string) ?? "",
    },
    model: result.model,
    raw: result.raw,
  };
}
