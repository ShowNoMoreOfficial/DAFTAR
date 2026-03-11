/**
 * Cinematic Engine — YouTube Long-Form Pipeline
 */

import { routeToModel } from "@/lib/yantri/model-router";
import { getBrandVoiceBlock } from "@/lib/yantri/brand-voice";

export interface ScriptSection {
  title: string;
  timestamp: string;
  script: string;
  productionCues: string[];
  visualAnchors: string[];
}

export interface StoryboardFrame {
  frameNumber: number;
  timestamp: string;
  shotType: string;
  description: string;
  visualPrompt: string;
  duration: string;
  transitionTo: string;
}

export interface BRollAsset {
  id: number;
  description: string;
  generationPrompt: string;
  duration: string;
  placementTimestamp: string;
  style: "cinematic" | "documentary" | "data_viz" | "archival" | "ambient";
}

export interface CinematicResult {
  script: {
    sections: ScriptSection[];
    fullScript: string;
    runtimeEstimate: string;
    actStructure: string;
  };
  storyboard: StoryboardFrame[];
  brollAssets: BRollAsset[];
  postingPlan: Record<string, unknown>;
  model: string;
  raw: string;
}

export interface CinematicEngineParams {
  narrativeAngle: string;
  brandName: string;
  brandTone: string;
  voiceRules: string;
  language: string;
  researchResults: string;
  trendHeadline: string;
  targetRuntime?: string;
}

function buildScriptwriterPrompt(params: CinematicEngineParams): string {
  const runtime = params.targetRuntime ?? "10-15";

  return `You are the Cinematic Scriptwriter for ${params.brandName} — a YouTube long-form script architect.

NARRATIVE ANGLE: ${params.narrativeAngle}
SOURCE TREND: ${params.trendHeadline}
BRAND: ${params.brandName}
BRAND TONE: ${params.brandTone}
VOICE RULES: ${params.voiceRules}
LANGUAGE: ${params.language}
TARGET RUNTIME: ${runtime} minutes

RESEARCH DOSSIER:
${params.researchResults}

${getBrandVoiceBlock(params.brandName, params.voiceRules, params.brandTone, params.language)}

Write a complete ${runtime}-minute video script following a 6-act structure:
ACT 1 — THE HOOK (0:00 - 0:30)
ACT 2 — THE CONTEXT (0:30 - 3:00)
ACT 3 — THE ESCALATION (3:00 - 7:00)
ACT 4 — THE REVELATION (7:00 - 10:00)
ACT 5 — THE IMPLICATIONS (10:00 - ${runtime === "15-20" ? "18:00" : "13:00"})
ACT 6 — THE CLOSE (final 1-2 minutes)

Include storyboard frames and 5-10 B-roll assets.

OUTPUT FORMAT (respond in JSON only):
{
  "script": {
    "sections": [{ "title": "...", "timestamp": "...", "script": "...", "productionCues": [], "visualAnchors": [] }],
    "fullScript": "Complete concatenated script text...",
    "runtimeEstimate": "12-14 minutes",
    "actStructure": "6-act escalation with circular close"
  },
  "storyboard": [{ "frameNumber": 1, "timestamp": "0:00", "shotType": "close-up", "description": "...", "visualPrompt": "...", "duration": "5s", "transitionTo": "cut" }],
  "brollAssets": [{ "id": 1, "description": "...", "generationPrompt": "...", "duration": "8s", "placementTimestamp": "1:30-1:38", "style": "cinematic" }],
  "postingPlan": {
    "titles": { "data_first": "...", "question": "...", "consequence": "..." },
    "thumbnail": { "visual": "...", "textOverlay": "...", "emotion": "...", "colorMood": "..." },
    "description": "...",
    "tags": [],
    "time_ist": "6:00 PM",
    "time_reasoning": "..."
  }
}`;
}

export async function runCinematicEngine(params: CinematicEngineParams): Promise<CinematicResult> {
  if (!params.narrativeAngle?.trim()) throw new Error("CinematicEngine: narrativeAngle is required");
  if (!params.brandName?.trim()) throw new Error("CinematicEngine: brandName is required");

  const systemPrompt = buildScriptwriterPrompt(params);
  const userMessage = `Write the complete YouTube script with storyboard and B-roll plan for: "${params.narrativeAngle}". Include all production cues and visual asset prompts.`;

  const isCredibilityBrand = params.brandName.toLowerCase().trim() === "the squirrels";
  const result = await routeToModel("drafting", systemPrompt, userMessage, { maxTokens: 16384, temperature: isCredibilityBrand ? 0.4 : 0.5 });

  if (!result.parsed) {
    throw new Error(`CinematicEngine: model returned unparseable response. Raw (first 300 chars): ${result.raw.slice(0, 300)}`);
  }

  const parsed = result.parsed as Record<string, unknown>;
  const script = (parsed.script ?? {}) as Record<string, unknown>;

  return {
    script: {
      sections: (script.sections as ScriptSection[]) ?? [],
      fullScript: (script.fullScript as string) ?? "",
      runtimeEstimate: (script.runtimeEstimate as string) ?? "",
      actStructure: (script.actStructure as string) ?? "",
    },
    storyboard: (parsed.storyboard as StoryboardFrame[]) ?? [],
    brollAssets: (parsed.brollAssets as BRollAsset[]) ?? [],
    postingPlan: (parsed.postingPlan as Record<string, unknown>) ?? {},
    model: result.model,
    raw: result.raw,
  };
}
