/**
 * Brand Voice Helper — Generates brand-specific voice enforcement blocks
 * for injection into content engine prompts.
 *
 * All brand-specific data (voice rules, colors, constraints) comes from
 * the Brand model in the database. No hardcoded brand names.
 */

import { prisma } from "@/lib/prisma";

// ─── Brand Color Palette (DB-driven) ───────────────────────────────────────

export async function getBrandColorPalette(
  brandName: string
): Promise<{ colors: string[]; description: string } | null> {
  try {
    const brand = await prisma.brand.findFirst({
      where: { name: { equals: brandName, mode: "insensitive" } },
      select: { config: true },
    });
    if (!brand?.config) return null;
    const cfg = typeof brand.config === "string"
      ? JSON.parse(brand.config)
      : brand.config;
    const palette = cfg?.colorPalette;
    if (palette && typeof palette === "object" && Array.isArray(palette.colors)) {
      return { colors: palette.colors, description: palette.description || "" };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Brand Voice Block Generator ─────────────────────────────────────────────

export function getBrandVoiceBlock(
  brandName: string,
  voiceRules: string | string[],
  tone: string,
  language: string
): string {
  const rulesArray = Array.isArray(voiceRules)
    ? voiceRules
    : voiceRules
        .split(/[;\n]/)
        .map((r) => r.trim())
        .filter(Boolean);

  const numberedRules = rulesArray.map((r, i) => `${i + 1}. ${r}`).join("\n");

  // Language constraint — derived from the brand's language setting
  const langLower = (language || "english").toLowerCase();
  const isHinglish = langLower.includes("hinglish") || langLower.includes("hindi");
  const langConstraint = isHinglish
    ? `Language: Hinglish (Hindi-English mix) — this is the brand's native register`
    : `Language: ${language} ONLY — no code-switching`;

  // Hard constraints — generic unless voice rules specify otherwise
  const hardConstraints = isHinglish
    ? `HARD CONSTRAINTS:
- NEVER use pure English academic tone — keep it conversational
- NEVER lose analytical depth for the sake of entertainment
- NEVER use clickbait without substance backing it up
- Every claim must cite its source from the research dossier
- Energy over stuffiness, but always backed by data`
    : `HARD CONSTRAINTS:
- NEVER use clickbait: "SHOCKING", "DESTROYED", "EXPOSED", ALL CAPS
- NEVER use filler: "basically", "actually", "you know"
- NEVER hedge excessively
- Every claim must cite its source from the research dossier
- Precision over sensationalism`;

  // Structural requirements
  const structuralReqs = `STRUCTURAL REQUIREMENTS:
- Open with a provocative rhetorical hook — a claim, contradiction, or question
- Include 1-2 historical parallels to establish analytical credibility
- Weave data into narrative — every statistic must include context
- Use pointed analytical questions that reframe the story`;

  return `
BRAND VOICE ENFORCEMENT — ${brandName}:
Tone: ${tone}
${langConstraint}

MANDATORY VOICE RULES:
${numberedRules}

${structuralReqs}

${hardConstraints}
`.trim();
}

// ─── Brand Color Mood (DB-driven with fallback) ─────────────────────────────

export async function getBrandColorMood(
  brandName: string,
  fallback: string = "bold, high contrast"
): Promise<string> {
  try {
    const brand = await prisma.brand.findFirst({
      where: { name: { equals: brandName, mode: "insensitive" } },
      select: { config: true, tone: true },
    });
    if (brand?.config) {
      const cfg = typeof brand.config === "string"
        ? JSON.parse(brand.config)
        : brand.config;
      if (cfg?.colorPalette?.colorMood) return cfg.colorPalette.colorMood as string;
    }
    // Generate a generic color mood from tone
    if (brand?.tone) {
      const t = brand.tone.toLowerCase();
      if (t.includes("analytical") || t.includes("editorial")) return "editorial, teal accent, high contrast";
      if (t.includes("energetic") || t.includes("bold")) return "bold, high energy contrast";
    }
    return fallback;
  } catch {
    return fallback;
  }
}
