/**
 * Editorial Pack Engine — Comprehensive YouTube Long-Form Production Packs
 *
 * Generates a complete editorial pack in TWO LLM calls:
 *   Call 1 (Script + Editorial): script, titles, description, tags, thumbnails, end screen
 *   Call 2 (Production Assets): B-roll sheet, stakeholders, visual anchors, event markers,
 *                                animation briefs, music brief
 *
 * Loads 10 production skill files for context injection.
 */

import { SkillOrchestrator, type SkillFile } from "@/lib/skill-orchestrator";
import { routeToModel } from "@/lib/yantri/model-router";
import { getBrandVoiceBlock } from "@/lib/yantri/brand-voice";

// ─── Types ────────────────────────────────────────────────

export interface EditorialScriptSection {
  position: number;
  type: "HOOK" | "CONTEXT" | "THESIS" | "EVIDENCE" | "COUNTERPOINT" | "ESCALATION" | "IMPLICATIONS" | "CTA";
  title: string;
  duration: string;
  text: string;
  visualNote: string;
  bRoll: string[];
  dataCards: string[];
  lowerThirds: Array<{ text: string; timing: string }>;
  musicMood: string;
}

export interface TitleOption {
  text: string;
  type: "HOOK" | "DATA" | "QUESTION";
  strategy: string;
}

export interface ThumbnailConcept {
  concept: string;
  textOverlay: string;
  composition: string;
  colorScheme: string;
}

export interface EndScreen {
  cta: string;
  suggestedVideo: string;
}

export interface EditorialScriptResult {
  script: {
    totalDuration: string;
    sections: EditorialScriptSection[];
  };
  titles: TitleOption[];
  description: string;
  tags: string[];
  thumbnailConcepts: ThumbnailConcept[];
  endScreen: EndScreen;
}

export interface BRollShot {
  description: string;
  source: "stock" | "archive" | "custom";
  duration: string;
  priority: "must-have" | "nice-to-have";
}

export interface BRollSheetEntry {
  section: number;
  shots: BRollShot[];
}

export interface KeyStakeholder {
  name: string;
  title: string;
  relevance: string;
  photoNeeded: boolean;
  nameCardText: string;
}

export interface VisualAnchor {
  type: "data-card" | "map" | "timeline" | "chart";
  description: string;
  data: string;
  section: number;
}

export interface EventMarker {
  date: string;
  event: string;
  visualTreatment: string;
}

export interface AnimationBrief {
  section: number;
  type: "motion-graphic" | "transition" | "data-viz";
  description: string;
  duration: string;
}

export interface MusicBriefEntry {
  section: string;
  mood: string;
  tempo: string;
  reference: string;
}

export interface ProductionBriefResult {
  bRollSheet: BRollSheetEntry[];
  keyStakeholders: KeyStakeholder[];
  visualAnchors: VisualAnchor[];
  eventMarkers: EventMarker[];
  animationBriefs: AnimationBrief[];
  musicBrief: MusicBriefEntry[];
}

export interface EditorialPackResult {
  scriptResult: EditorialScriptResult;
  productionBrief: ProductionBriefResult;
  model: string;
  raw: string;
}

export interface EditorialPackParams {
  narrativeAngle: string;
  brandName: string;
  brandTone: string;
  voiceRules: string;
  language: string;
  researchResults: string;
  trendHeadline: string;
  targetRuntime?: string;
}

// ─── Skill Loader ─────────────────────────────────────────

const EDITORIAL_PACK_SKILL_PATHS = [
  "narrative/voice/hook-engineering",
  "narrative/editorial/narrative-arc-construction",
  "platforms/youtube/title-engineering",
  "platforms/youtube/description-optimization",
  "platforms/youtube/thumbnail-strategy",
  "production/long-form/documentary-planning",
  "production/support/broll-sheet-generation",
  "production/support/edit-decision-list",
  "production/support/motion-graphics-brief",
  "production/support/visual-anchor-selection",
];

let cachedPackSkillContext: string | null = null;

async function loadPackSkillContext(): Promise<string> {
  if (cachedPackSkillContext) return cachedPackSkillContext;

  const orchestrator = new SkillOrchestrator();
  const skills = await Promise.all(
    EDITORIAL_PACK_SKILL_PATHS.map((s) =>
      orchestrator.loadSkill(s).catch(() => null)
    )
  );

  const loaded = skills.filter((s): s is SkillFile => s !== null);
  if (loaded.length === 0) {
    cachedPackSkillContext = "";
    return "";
  }

  cachedPackSkillContext = loaded
    .map((s) => {
      const instructions =
        s.instructions.length > 500
          ? s.instructions.slice(0, 500) + "\n[truncated]"
          : s.instructions;
      return `## ${s.meta.name}\n${instructions}`;
    })
    .join("\n\n");

  return cachedPackSkillContext;
}

// ─── Call 1: Script + Editorial ───────────────────────────

function buildScriptPrompt(
  params: EditorialPackParams,
  skillContext: string
): { systemPrompt: string; userMessage: string } {
  const runtime = params.targetRuntime ?? "12-15";

  const systemPrompt = `You are the Editorial Pack Architect for ${params.brandName} — you create comprehensive YouTube Explainer editorial packs that give the production team EVERYTHING they need.

${skillContext}

BRAND: ${params.brandName}
BRAND TONE: ${params.brandTone}
VOICE RULES: ${params.voiceRules}
LANGUAGE: ${params.language}
TARGET RUNTIME: ${runtime} minutes

${getBrandVoiceBlock(params.brandName, params.voiceRules, params.brandTone, params.language)}

You must return a COMPLETE editorial pack as valid JSON. No preamble, no markdown fences.

The script should follow a 7-SECTION structure:
1. HOOK (0:00–0:45) — Provocative opening that makes viewers stay
2. CONTEXT (0:45–2:30) — Background the audience needs
3. THESIS (2:30–4:00) — Your central argument or revelation
4. EVIDENCE (4:00–7:00) — Data, examples, expert references
5. COUNTERPOINT (7:00–9:00) — "But what about..." — address objections
6. IMPLICATIONS (9:00–${runtime === "15-20" ? "14:00" : "12:00"}) — What this means going forward
7. CTA (final 1–2 minutes) — Call to action, channel pitch

Each section MUST include:
- Full script text the host reads (conversational, not academic)
- Visual notes describing what viewers see on screen
- Specific B-roll shots needed
- Data cards / graphics to display
- Lower thirds with timing
- Music mood for that section

OUTPUT FORMAT (respond in JSON only):
{
  "script": {
    "totalDuration": "${runtime} minutes",
    "sections": [
      {
        "position": 1,
        "type": "HOOK",
        "title": "Section title",
        "duration": "0:00-0:45",
        "text": "Full script text the host reads...",
        "visualNote": "What viewers see on screen",
        "bRoll": ["Specific B-roll shot 1", "Shot 2"],
        "dataCards": ["$2.7B subsidy announcement graphic"],
        "lowerThirds": [{ "text": "Name — Title", "timing": "0:15" }],
        "musicMood": "tension-building"
      }
    ]
  },
  "titles": [
    { "text": "Title option 1", "type": "HOOK", "strategy": "Why this works" },
    { "text": "Title option 2", "type": "DATA", "strategy": "Why this works" },
    { "text": "Title option 3", "type": "QUESTION", "strategy": "Why this works" }
  ],
  "description": "Full YouTube description with chapter timestamps...",
  "tags": ["tag1", "tag2", "...20 tags total"],
  "thumbnailConcepts": [
    { "concept": "Visual concept description", "textOverlay": "Bold text on thumbnail", "composition": "Layout description", "colorScheme": "Colors used" }
  ],
  "endScreen": { "cta": "Subscribe call to action text", "suggestedVideo": "Topic for suggested next video" }
}`;

  const userMessage = `Create a complete YouTube Explainer editorial pack for: "${params.narrativeAngle}"

SOURCE TREND: ${params.trendHeadline}

RESEARCH DOSSIER:
${params.researchResults}

Generate the FULL script with all 7 sections, 3 title options, SEO-optimized description with chapter timestamps, 20 tags, 3 thumbnail concepts, and end screen CTA.`;

  return { systemPrompt, userMessage };
}

// ─── Call 2: Production Assets ────────────────────────────

function buildProductionPrompt(
  params: EditorialPackParams,
  sectionTitles: string[]
): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You are the Production Brief Specialist for ${params.brandName}. Given a video script outline, you create comprehensive production briefs with exact specifications for the editing team.

You must return valid JSON. No preamble, no markdown fences.

OUTPUT FORMAT:
{
  "bRollSheet": [
    { "section": 1, "shots": [
      { "description": "Specific B-roll description", "source": "stock|archive|custom", "duration": "5s", "priority": "must-have|nice-to-have" }
    ]}
  ],
  "keyStakeholders": [
    { "name": "Person Name", "title": "Their Title/Role", "relevance": "Why they matter in this story", "photoNeeded": true, "nameCardText": "Name — Title" }
  ],
  "visualAnchors": [
    { "type": "data-card|map|timeline|chart", "description": "What to show", "data": "The actual data or specification", "section": 1 }
  ],
  "eventMarkers": [
    { "date": "2024-01-15", "event": "What happened", "visualTreatment": "How to visualize it" }
  ],
  "animationBriefs": [
    { "section": 1, "type": "motion-graphic|transition|data-viz", "description": "What the animation should show", "duration": "3s" }
  ],
  "musicBrief": [
    { "section": "1-3", "mood": "tension-building", "tempo": "moderate", "reference": "Hans Zimmer style" }
  ]
}`;

  const userMessage = `Create a complete production brief for a YouTube video about "${params.narrativeAngle}".

BRAND: ${params.brandName} (${params.brandTone}, ${params.language})

SCRIPT SECTIONS:
${sectionTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

RESEARCH CONTEXT:
${params.researchResults.slice(0, 2000)}

Generate:
- B-roll sheet with 3-5 shots per section (mix of stock, archive, custom)
- Key stakeholders who need name cards and photos
- Visual anchors: data cards, maps, timelines, charts
- Event markers with dates and visual treatments
- Animation briefs for motion graphics
- Music brief with mood per section group`;

  return { systemPrompt, userMessage };
}

// ─── Engine Entry Point ───────────────────────────────────

export async function runEditorialPackEngine(
  params: EditorialPackParams
): Promise<EditorialPackResult> {
  if (!params.narrativeAngle?.trim())
    throw new Error("EditorialPackEngine: narrativeAngle is required");
  if (!params.brandName?.trim())
    throw new Error("EditorialPackEngine: brandName is required");

  // Load skill context
  const skillContext = await loadPackSkillContext();

  // ── Call 1: Script + Editorial ──
  const { systemPrompt: scriptSys, userMessage: scriptMsg } =
    buildScriptPrompt(params, skillContext);

  const scriptResult = await routeToModel("drafting", scriptSys, scriptMsg, {
    maxTokens: 16384,
    temperature: 0.5,
  });

  if (!scriptResult.parsed) {
    throw new Error(
      `EditorialPackEngine: Script call returned unparseable response. Raw (first 300 chars): ${scriptResult.raw.slice(0, 300)}`
    );
  }

  const scriptParsed = scriptResult.parsed as Record<string, unknown>;
  const script = (scriptParsed.script ?? {}) as Record<string, unknown>;
  const sections = (script.sections ?? []) as EditorialScriptSection[];

  const editorialScript: EditorialScriptResult = {
    script: {
      totalDuration: (script.totalDuration as string) ?? params.targetRuntime ?? "12-15 minutes",
      sections,
    },
    titles: (scriptParsed.titles as TitleOption[]) ?? [],
    description: (scriptParsed.description as string) ?? "",
    tags: (scriptParsed.tags as string[]) ?? [],
    thumbnailConcepts: (scriptParsed.thumbnailConcepts as ThumbnailConcept[]) ?? [],
    endScreen: (scriptParsed.endScreen as EndScreen) ?? { cta: "", suggestedVideo: "" },
  };

  // ── Call 2: Production Assets ──
  const sectionTitles = sections.map(
    (s) => `[${s.type}] ${s.title} (${s.duration})`
  );

  const { systemPrompt: prodSys, userMessage: prodMsg } =
    buildProductionPrompt(params, sectionTitles);

  const prodResult = await routeToModel("packaging", prodSys, prodMsg, {
    maxTokens: 8192,
    temperature: 0.3,
  });

  let productionBrief: ProductionBriefResult;

  if (!prodResult.parsed) {
    // Fallback: empty production brief rather than failing the entire pack
    productionBrief = {
      bRollSheet: [],
      keyStakeholders: [],
      visualAnchors: [],
      eventMarkers: [],
      animationBriefs: [],
      musicBrief: [],
    };
  } else {
    const prodParsed = prodResult.parsed as Record<string, unknown>;
    productionBrief = {
      bRollSheet: (prodParsed.bRollSheet as BRollSheetEntry[]) ?? [],
      keyStakeholders: (prodParsed.keyStakeholders as KeyStakeholder[]) ?? [],
      visualAnchors: (prodParsed.visualAnchors as VisualAnchor[]) ?? [],
      eventMarkers: (prodParsed.eventMarkers as EventMarker[]) ?? [],
      animationBriefs: (prodParsed.animationBriefs as AnimationBrief[]) ?? [],
      musicBrief: (prodParsed.musicBrief as MusicBriefEntry[]) ?? [],
    };
  }

  return {
    scriptResult: editorialScript,
    productionBrief,
    model: scriptResult.model,
    raw: scriptResult.raw,
  };
}

// ─── Deliverable Storage Helper ───────────────────────────

/**
 * Converts an EditorialPackResult into the shape expected by Prisma's
 * Deliverable.update() — call with spread: `data: { ...toDeliverableData(result) }`
 */
export function toDeliverableData(result: EditorialPackResult) {
  return {
    scriptData: JSON.stringify({
      script: result.scriptResult.script,
      titles: result.scriptResult.titles,
      thumbnailBriefs: result.scriptResult.thumbnailConcepts,
      endScreen: result.scriptResult.endScreen,
    }),
    copyMarkdown: result.scriptResult.description,
    postingPlan: JSON.stringify({
      bRollSheet: result.productionBrief.bRollSheet,
      keyStakeholders: result.productionBrief.keyStakeholders,
      visualAnchors: result.productionBrief.visualAnchors,
      eventMarkers: result.productionBrief.eventMarkers,
      animationBriefs: result.productionBrief.animationBriefs,
      musicBrief: result.productionBrief.musicBrief,
    }),
    tags: result.scriptResult.tags,
  };
}
