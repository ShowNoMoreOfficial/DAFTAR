/**
 * Carousel Engine — Meta Carousel Agent (Instagram + Facebook cross-post)
 *
 * Generates 8-10 slide carousel packages with:
 * - Typed slides (HOOK, DATA, CONTEXT, ESCALATION, CLIMAX, CTA)
 * - 2200-char SEO captions with line breaks
 * - 20-30 strategic hashtags
 * - Cross-post adaptations for Facebook
 * - Per-slide visual descriptions for image generation
 */

import { routeToModel } from "@/lib/yantri/model-router";
import { getBrandVoiceBlock } from "@/lib/yantri/brand-voice";

export interface CarouselSlide {
  position: number;
  type: "HOOK" | "SECONDARY_HOOK" | "CONTEXT" | "DATA" | "ESCALATION" | "CLIMAX" | "CTA";
  /** @deprecated Use `type` instead */
  role: "hook" | "secondary_hook" | "context" | "escalation" | "data" | "climax" | "cta";
  headline: string;
  body: string;
  /** @deprecated Use `body` instead */
  bodyText: string;
  visualDescription: string;
  /** @deprecated Use `visualDescription` instead */
  visualPrompt: string;
  colorAccent: string;
  /** @deprecated Use `colorAccent` instead */
  colorHex: string;
  textOverlay: string;
}

export interface CrossPostAdaptation {
  facebook: boolean;
  adaptations: string;
}

export interface CarouselStrategyResult {
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  narrativeArc: string;
  slideCount: number;
  crossPost: CrossPostAdaptation;
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

CAROUSEL ARCHITECTURE — 8-10 SLIDES:
1. HOOK (Slide 1): Stop the scroll INSTANTLY. Bold statement, shocking number, or provocative question. Large text on bold background.
2. SECONDARY_HOOK (Slide 2): Must stand alone as independent hook — amplify or reframe slide 1.
3. CONTEXT (Slides 3-4): Set the stage. What happened? Why now? Key background.
4. DATA (Slide 5-6): Present ONE clear stat/fact per slide. Infographic style with icons + numbers.
5. ESCALATION (Slides 7-8): Build tension and depth. Implications, consequences, expert quotes.
6. CLIMAX (Slide 9): The core insight. The "so what" moment.
7. CTA (Final Slide): Prioritize SAVES, SHARES, and DMs. "Save this for later" or "Share with someone who needs to see this."

VISUAL RULES — 4:5 PORTRAIT FORMAT (1080x1350px):
- Consistent color palette across all slides
- Each slide must be visually self-contained (readable without swiping)
- Large, readable text (min 24pt equivalent)
- Dark backgrounds for data slides, bold colors for hook slides
- Brand watermark area (bottom-right corner)

CAPTION STRATEGY — 2200 CHARACTERS:
- First line: keyword-rich hook (visible before "more" fold)
- Line breaks every 1-2 sentences for readability
- Storytelling format: expand on the carousel narrative
- Include a question to drive comments
- Hashtags at the END of caption (separated by line breaks)

CROSS-POSTING — FACEBOOK ADAPTATION:
- Facebook captions can be longer — expand storytelling
- Fewer hashtags for Facebook (5-10 vs 20-30)
- Facebook audiences engage more with questions and polls
- Same visual slides work on both platforms

OUTPUT FORMAT (respond in JSON only):
{
  "narrativeArc": "One sentence describing the story arc",
  "slides": [
    {
      "position": 1,
      "type": "HOOK",
      "headline": "Bold 3-8 word headline",
      "body": "Supporting text (max 30 words) or empty for hook slides",
      "visualDescription": "Detailed description of the slide visual: background color, text layout, icons, imagery. 60-100 words. Must describe a complete, self-contained slide image.",
      "colorAccent": "#hex accent color for this slide",
      "textOverlay": "2-5 words that appear prominently ON the image"
    }
  ],
  "caption": "2200 character Instagram caption with line breaks, storytelling, question, and hashtags at end",
  "hashtags": ["#tag1", "#tag2", "...20-30 strategic hashtags mixing broad + niche"],
  "crossPost": {
    "facebook": true,
    "adaptations": "Specific changes for Facebook: longer caption suggestions, fewer hashtags, engagement strategy differences"
  },
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "postingTime": { "time_ist": "12:30 PM", "reasoning": "Peak engagement reasoning" }
}`;
}

export async function runCarouselEngine(params: CarouselEngineParams): Promise<CarouselStrategyResult> {
  if (!params.narrativeAngle?.trim()) throw new Error("CarouselEngine: narrativeAngle is required");
  if (!params.brandName?.trim()) throw new Error("CarouselEngine: brandName is required");

  const systemPrompt = buildCarouselSystemPrompt(params);
  const userMessage = `Break this narrative into a visually consistent, swipeable Instagram carousel with Facebook cross-post. Narrative: "${params.narrativeAngle}". Create the full slide deck with visual descriptions, 2200-char caption, 20-30 hashtags, and Facebook adaptations.`;

  const result = await routeToModel("drafting", systemPrompt, userMessage, { temperature: 0.5 });

  if (!result.parsed) {
    throw new Error(`CarouselEngine: model returned unparseable response. Raw (first 300 chars): ${result.raw.slice(0, 300)}`);
  }

  const parsed = result.parsed as Record<string, unknown>;
  const rawSlides = (parsed.slides as Array<Record<string, unknown>>) ?? [];

  // Normalize slides: map new field names and maintain backward compat
  const slides: CarouselSlide[] = rawSlides.map((s) => {
    const slideType = ((s.type as string) ?? "").toUpperCase() as CarouselSlide["type"];
    const roleMap: Record<string, CarouselSlide["role"]> = {
      HOOK: "hook",
      SECONDARY_HOOK: "secondary_hook",
      CONTEXT: "context",
      DATA: "data",
      ESCALATION: "escalation",
      CLIMAX: "climax",
      CTA: "cta",
    };
    return {
      position: (s.position as number) ?? 0,
      type: slideType || "CONTEXT",
      role: (s.role as CarouselSlide["role"]) ?? roleMap[slideType] ?? "context",
      headline: (s.headline as string) ?? "",
      body: (s.body as string) ?? (s.bodyText as string) ?? "",
      bodyText: (s.bodyText as string) ?? (s.body as string) ?? "",
      visualDescription: (s.visualDescription as string) ?? (s.visualPrompt as string) ?? "",
      visualPrompt: (s.visualPrompt as string) ?? (s.visualDescription as string) ?? "",
      colorAccent: (s.colorAccent as string) ?? (s.colorHex as string) ?? "",
      colorHex: (s.colorHex as string) ?? (s.colorAccent as string) ?? "",
      textOverlay: (s.textOverlay as string) ?? "",
    };
  });

  const crossPostRaw = parsed.crossPost as Record<string, unknown> | undefined;

  return {
    slides,
    caption: (parsed.caption as string) ?? "",
    hashtags: (parsed.hashtags as string[]) ?? [],
    narrativeArc: (parsed.narrativeArc as string) ?? "",
    slideCount: slides.length,
    crossPost: {
      facebook: (crossPostRaw?.facebook as boolean) ?? true,
      adaptations: (crossPostRaw?.adaptations as string) ?? "Facebook caption can be longer with fewer hashtags",
    },
    model: result.model,
    raw: result.raw,
  };
}
