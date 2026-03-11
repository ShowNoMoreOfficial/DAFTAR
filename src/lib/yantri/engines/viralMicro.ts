/**
 * Viral Micro-Content Engine — X & LinkedIn Pipeline
 */

import { routeToModel } from "@/lib/yantri/model-router";
import { getBrandVoiceBlock } from "@/lib/yantri/brand-voice";

export interface ViralMicroResult {
  platform: "x" | "linkedin";
  primaryPost: string;
  hook: string;
  bodyContent: string;
  cta: string;
  characterCount: number;
  hookArchetype: string;
  imagePrompt: string | null;
  linkedinVariant: string | null;
  engagementStrategy: Record<string, unknown>;
  postingPlan: Record<string, unknown>;
  model: string;
  raw: string;
}

export interface ViralMicroParams {
  narrativeAngle: string;
  brandName: string;
  brandTone: string;
  voiceRules: string;
  language: string;
  researchResults: string;
  trendHeadline: string;
  targetPlatform: "x" | "linkedin" | "both";
}

function buildViralMicroPrompt(params: ViralMicroParams): string {
  return `You are the Viral Micro-Content Engine for ${params.brandName} — a specialist in crafting high-engagement, scroll-stopping micro-content for X (Twitter) and LinkedIn.

NARRATIVE ANGLE: ${params.narrativeAngle}
SOURCE TREND: ${params.trendHeadline}
BRAND: ${params.brandName}
BRAND TONE: ${params.brandTone}
VOICE RULES: ${params.voiceRules}
LANGUAGE: ${params.language}
TARGET PLATFORM: ${params.targetPlatform}

RESEARCH DOSSIER:
${params.researchResults}

${getBrandVoiceBlock(params.brandName, params.voiceRules, params.brandTone, params.language)}

PHASE 1 — SIGNAL ANALYSIS:
Identify the SINGLE most viral-worthy data point, contradiction, or insight.

PHASE 2 — VIRAL COPYWRITING:
For X: HOOK + BODY + CTA under 280 chars or 3-5 tweet thread.
For LinkedIn: HOOK + BODY (400-800 words) + CTA with generous line breaks.

PHASE 3 — ASSET GENERATION:
Generate detailed image prompt if an image would increase engagement.

PHASE 4 — LINKEDIN VARIANT:
${params.targetPlatform === "both" ? "Also generate a LinkedIn variant." : "Skip if target is single platform."}

OUTPUT FORMAT (respond in JSON only):
{
  "signalAnalysis": { "chosenSignal": "...", "viralityScore": 8, "reasoning": "..." },
  "primaryPost": "Complete post text ready to publish",
  "hook": "Just the hook line",
  "bodyContent": "The body section",
  "cta": "The call-to-action line",
  "characterCount": 240,
  "hookArchetype": "The Contradiction",
  "imagePrompt": "Detailed image generation prompt or null",
  "linkedinVariant": ${params.targetPlatform === "both" ? '"Complete LinkedIn variant post text"' : "null"},
  "engagementStrategy": { "bestReplyAngle": "...", "quoteRetweetBait": "...", "anticipatedPushback": "..." },
  "postingPlan": { "time_ist": "8:30 PM", "time_reasoning": "...", "hashtags": ["#tag1"], "thread_follow_up": "..." }
}`;
}

export async function runViralMicroEngine(params: ViralMicroParams): Promise<ViralMicroResult> {
  if (!params.narrativeAngle?.trim()) throw new Error("ViralMicroEngine: narrativeAngle is required");
  if (!params.brandName?.trim()) throw new Error("ViralMicroEngine: brandName is required");

  const systemPrompt = buildViralMicroPrompt(params);
  const userMessage = `Analyze the research, identify the most viral signal, and craft the complete micro-content for: "${params.narrativeAngle}". Make it scroll-stopping.`;

  const result = await routeToModel("drafting", systemPrompt, userMessage, { temperature: 0.45 });

  if (!result.parsed) {
    throw new Error(`ViralMicroEngine: model returned unparseable response. Raw (first 300 chars): ${result.raw.slice(0, 300)}`);
  }

  const parsed = result.parsed as Record<string, unknown>;

  return {
    platform: params.targetPlatform === "linkedin" ? "linkedin" : "x",
    primaryPost: (parsed.primaryPost as string) ?? "",
    hook: (parsed.hook as string) ?? "",
    bodyContent: (parsed.bodyContent as string) ?? "",
    cta: (parsed.cta as string) ?? "",
    characterCount: (parsed.characterCount as number) ?? 0,
    hookArchetype: (parsed.hookArchetype as string) ?? "",
    imagePrompt: (parsed.imagePrompt as string) ?? null,
    linkedinVariant: (parsed.linkedinVariant as string) ?? null,
    engagementStrategy: (parsed.engagementStrategy as Record<string, unknown>) ?? {},
    postingPlan: (parsed.postingPlan as Record<string, unknown>) ?? {},
    model: result.model,
    raw: result.raw,
  };
}
