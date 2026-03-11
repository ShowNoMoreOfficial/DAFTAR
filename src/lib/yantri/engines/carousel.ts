/**
 * Carousel Engine — Meta Carousel Agent (Instagram)
 */

import { routeToModel } from "@/lib/yantri/model-router";
import { getBrandVoiceBlock } from "@/lib/yantri/brand-voice";

export interface CarouselSlide {
  position: number;
  role: "hook" | "secondary_hook" | "context" | "escalation" | "data" | "climax" | "cta";
  headline: string;
  bodyText: string;
  visualPrompt: string;
  textOverlay: string;
  colorHex: string;
}

export interface CarouselStrategyResult {
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  narrativeArc: string;
  slideCount: number;
  model: string;
  raw: string;
}

export interface CarouselEngineParams {
  narrativeAngle: string;
  brandName: string;
  brandTone: string;
  voiceRules: string;
  language: string;
  researchResults: string;
  trendHeadline: string;
}

function buildCarouselSystemPrompt(params: CarouselEngineParams): string {
  return `You are the Meta Carousel Agent — a world-class Instagram carousel architect for ${params.brandName}, optimized for the 2025/2026 algorithm.

NARRATIVE ANGLE: ${params.narrativeAngle}
SOURCE TREND: ${params.trendHeadline}
BRAND: ${params.brandName}
BRAND TONE: ${params.brandTone}
VOICE RULES: ${params.voiceRules}
LANGUAGE: ${params.language}

RESEARCH DOSSIER:
${params.researchResults}

${getBrandVoiceBlock(params.brandName, params.voiceRules, params.brandTone, params.language)}

CAROUSEL ARCHITECTURE — 8-12 SLIDES:
1. SCROLLSTOPPER HOOK (Slide 1): Stop the scroll INSTANTLY.
2. SECONDARY HOOK (Slide 2): Must stand alone as independent hook.
3. CONTEXT (Slides 3-4): Set the stage.
4. ESCALATION (Slides 5-8): Build tension and depth.
5. CLIMAX (Slides 9-10): The core insight.
6. CTA (Final Slide): Prioritize SAVES, SHARES, and DMs.

VISUAL RULES — 4:5 PORTRAIT FORMAT (1080x1350px)
SEO-FRIENDLY CAPTION — KEYWORD-DRIVEN (not hashtag-driven)

OUTPUT FORMAT (respond in JSON only):
{
  "narrativeArc": "One sentence describing the story arc",
  "slides": [
    {
      "position": 1,
      "role": "hook",
      "headline": "Bold 3-8 word headline",
      "bodyText": "Max 30 words",
      "visualPrompt": "Detailed structural prompt for 4:5 portrait slide image. 60-100 words.",
      "textOverlay": "2-5 words that appear ON the image",
      "colorHex": "#hex"
    }
  ],
  "caption": "SEO-optimized Instagram caption (200-400 words)...",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "postingTime": { "time_ist": "12:30 PM", "reasoning": "Peak engagement reasoning" }
}`;
}

export async function runCarouselEngine(params: CarouselEngineParams): Promise<CarouselStrategyResult> {
  if (!params.narrativeAngle?.trim()) throw new Error("CarouselEngine: narrativeAngle is required");
  if (!params.brandName?.trim()) throw new Error("CarouselEngine: brandName is required");

  const systemPrompt = buildCarouselSystemPrompt(params);
  const userMessage = `Break this narrative into a visually consistent, swipeable Instagram carousel. Narrative: "${params.narrativeAngle}". Create the full slide deck with visual prompts and caption.`;

  const result = await routeToModel("drafting", systemPrompt, userMessage, { temperature: 0.5 });

  if (!result.parsed) {
    throw new Error(`CarouselEngine: model returned unparseable response. Raw (first 300 chars): ${result.raw.slice(0, 300)}`);
  }

  const parsed = result.parsed as Record<string, unknown>;
  const slides = (parsed.slides as CarouselSlide[]) ?? [];

  return {
    slides,
    caption: (parsed.caption as string) ?? "",
    hashtags: (parsed.hashtags as string[]) ?? [],
    narrativeArc: (parsed.narrativeArc as string) ?? "",
    slideCount: slides.length,
    model: result.model,
    raw: result.raw,
  };
}
