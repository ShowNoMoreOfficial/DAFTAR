/**
 * YouTube Explainer Engine
 *
 * Generates a complete YouTube explainer video package:
 * - Full script with 6-act structure and production cues
 * - 3 title options (data-first, question, consequence)
 * - SEO description with timestamps
 * - Tags and thumbnail brief
 *
 * Uses model-router to send creative content to Gemini.
 */

import { routeToModel } from "@/lib/yantri/model-router";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExplainerSection {
  act: number;
  title: string;
  timestamp: string;
  script: string;
  productionCues: string[];
  visualAnchors: string[];
  bRollSuggestions: string[];
}

export interface ExplainerResult {
  script: {
    sections: ExplainerSection[];
    fullScript: string;
    runtimeEstimate: string;
    actStructure: string;
    wordCount: number;
  };
  titles: {
    dataFirst: string;
    question: string;
    consequence: string;
  };
  description: string;
  tags: string[];
  thumbnailBrief: {
    visual: string;
    textOverlay: string;
    emotion: string;
    colorMood: string;
  };
  postingPlan: {
    timeIST: string;
    timeReasoning: string;
    endScreenCTA: string;
    pinnedComment: string;
  };
  model: string;
  raw: string;
}

export interface YouTubeExplainerParams {
  narrativeAngle: string;
  brandName: string;
  brandTone: string;
  voiceRules: string;
  language: string;
  researchResults: string;
  trendHeadline: string;
  hook: string;
  tone: string;
  targetRuntime?: string;
}

// ─── Prompt Builder ─────────────────────────────────────────────────────────

function buildExplainerPrompt(params: YouTubeExplainerParams): string {
  const runtime = params.targetRuntime ?? "10-15";

  return `You are the YouTube Explainer Engine for ${params.brandName} — a world-class scriptwriter who turns complex topics into compelling, retention-optimized explainer videos.

NARRATIVE ANGLE: ${params.narrativeAngle}
SOURCE TREND: ${params.trendHeadline}
BRAND: ${params.brandName}
BRAND TONE: ${params.brandTone}
VOICE RULES: ${params.voiceRules}
LANGUAGE: ${params.language}
OPENING HOOK: ${params.hook}
TONE DIRECTIVE: ${params.tone}
TARGET RUNTIME: ${runtime} minutes

RESEARCH DOSSIER:
${params.researchResults}

SCRIPT STRUCTURE — 6-ACT EXPLAINER FORMAT:
ACT 1 — THE HOOK (0:00-0:30): Open with a startling fact, contradiction, or question. The viewer must feel "I NEED to know this." Use the opening hook as a starting point.
ACT 2 — THE CONTEXT (0:30-3:00): Set the stage. Who, what, where, when. Ground the viewer in reality with verifiable facts.
ACT 3 — THE ESCALATION (3:00-7:00): Build tension. Layer data points, reveal connections, show the stakes getting higher.
ACT 4 — THE REVELATION (7:00-10:00): The core insight. The thing nobody else is saying. The "aha" moment.
ACT 5 — THE IMPLICATIONS (10:00-${runtime === "15-20" ? "18:00" : "13:00"}): What does this mean for the viewer? Connect to their world. Show consequences.
ACT 6 — THE CLOSE (final 1-2 min): Strong callback to the hook. End with a thought-provoking question or call-to-action.

PRODUCTION CUES: Include [GRAPHIC: ...], [B-ROLL: ...], [DATA VIZ: ...], [MUSIC: ...] inline in the script.

OUTPUT FORMAT (respond in JSON only):
{
  "script": {
    "sections": [
      {
        "act": 1,
        "title": "THE HOOK",
        "timestamp": "0:00-0:30",
        "script": "Complete script text with inline production cues...",
        "productionCues": ["GRAPHIC: Title card with...", "MUSIC: Tension-building ambient"],
        "visualAnchors": ["Close-up of host", "Data graphic overlay"],
        "bRollSuggestions": ["Stock footage of...", "Screen recording of..."]
      }
    ],
    "fullScript": "Complete concatenated script text...",
    "runtimeEstimate": "12-14 minutes",
    "actStructure": "6-act escalation with circular close",
    "wordCount": 2200
  },
  "titles": {
    "dataFirst": "Title leading with a shocking statistic or fact",
    "question": "Title as a compelling question",
    "consequence": "Title showing stakes or consequences"
  },
  "description": "Full YouTube description with timestamps, sources, and links section...",
  "tags": ["tag1", "tag2", "tag3"],
  "thumbnailBrief": {
    "visual": "Detailed thumbnail visual description",
    "textOverlay": "3-4 words max for thumbnail text",
    "emotion": "The emotion the thumbnail should convey",
    "colorMood": "Color palette direction"
  },
  "postingPlan": {
    "timeIST": "6:00 PM",
    "timeReasoning": "Why this time is optimal",
    "endScreenCTA": "What to say in the last 20 seconds",
    "pinnedComment": "First comment to pin for engagement"
  }
}`;
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export async function runYouTubeExplainerEngine(
  params: YouTubeExplainerParams
): Promise<ExplainerResult> {
  if (!params.narrativeAngle?.trim()) {
    throw new Error("YouTubeExplainerEngine: narrativeAngle is required");
  }
  if (!params.brandName?.trim()) {
    throw new Error("YouTubeExplainerEngine: brandName is required");
  }

  const systemPrompt = buildExplainerPrompt(params);
  const userMessage = `Write the complete YouTube explainer video script with full production package for: "${params.narrativeAngle}". Make it retention-optimized and fact-dense.`;

  const result = await routeToModel("drafting", systemPrompt, userMessage, {
    maxTokens: 16384,
    temperature: 0.5,
  });

  if (!result.parsed) {
    throw new Error(
      `YouTubeExplainerEngine: model returned unparseable response. Raw (first 300 chars): ${result.raw.slice(0, 300)}`
    );
  }

  const parsed = result.parsed as Record<string, unknown>;
  const script = (parsed.script ?? {}) as Record<string, unknown>;
  const titles = (parsed.titles ?? {}) as Record<string, string>;
  const thumbnailBrief = (parsed.thumbnailBrief ?? {}) as Record<string, string>;
  const postingPlan = (parsed.postingPlan ?? {}) as Record<string, string>;

  return {
    script: {
      sections: (script.sections as ExplainerSection[]) ?? [],
      fullScript: (script.fullScript as string) ?? "",
      runtimeEstimate: (script.runtimeEstimate as string) ?? "",
      actStructure: (script.actStructure as string) ?? "",
      wordCount: (script.wordCount as number) ?? 0,
    },
    titles: {
      dataFirst: titles.dataFirst ?? titles.data_first ?? "",
      question: titles.question ?? "",
      consequence: titles.consequence ?? "",
    },
    description: (parsed.description as string) ?? "",
    tags: (parsed.tags as string[]) ?? [],
    thumbnailBrief: {
      visual: thumbnailBrief.visual ?? "",
      textOverlay: thumbnailBrief.textOverlay ?? thumbnailBrief.text_overlay ?? "",
      emotion: thumbnailBrief.emotion ?? "",
      colorMood: thumbnailBrief.colorMood ?? thumbnailBrief.color_mood ?? "",
    },
    postingPlan: {
      timeIST: postingPlan.timeIST ?? postingPlan.time_ist ?? "",
      timeReasoning: postingPlan.timeReasoning ?? postingPlan.time_reasoning ?? "",
      endScreenCTA: postingPlan.endScreenCTA ?? postingPlan.end_screen_cta ?? "",
      pinnedComment: postingPlan.pinnedComment ?? postingPlan.pinned_comment ?? "",
    },
    model: result.model,
    raw: result.raw,
  };
}
