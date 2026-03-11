/**
 * Brand Voice Helper — Generates brand-specific voice enforcement blocks
 * for injection into content engine prompts.
 */

// ─── Known Brand Color Palettes ─────────────────────────────────────────────

const BRAND_COLOR_PALETTES: Record<string, { colors: string[]; description: string }> = {
  "the squirrels": {
    colors: ["#1B3A5C", "#FFFFFF", "#2E86AB", "#F0F4F8"],
    description: "Navy (#1B3A5C), White (#FFFFFF), Teal (#2E86AB), Light grey (#F0F4F8) — editorial, credibility-first",
  },
  "breaking tube": {
    colors: ["#D32F2F", "#000000", "#FFFFFF", "#FFD600"],
    description: "Red (#D32F2F), Black (#000000), White (#FFFFFF), Yellow (#FFD600) — bold, high-energy news",
  },
};

export function getBrandColorPalette(brandName: string): { colors: string[]; description: string } | null {
  const key = brandName.toLowerCase().trim();
  return BRAND_COLOR_PALETTES[key] ?? null;
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

  const key = brandName.toLowerCase().trim();
  const isSquirrels = key === "the squirrels";
  const isBreakingTube = key === "breaking tube";

  // Language constraint
  const langConstraint = isBreakingTube
    ? `Language: Hinglish (Hindi-English mix) — this is the brand's native register`
    : `Language: ${language} ONLY — no code-switching`;

  // Hard constraints vary by brand
  let hardConstraints: string;
  if (isSquirrels) {
    hardConstraints = `HARD CONSTRAINTS:
- NEVER use clickbait: "SHOCKING", "DESTROYED", "EXPOSED", ALL CAPS
- NEVER sound like Indian TV news
- NEVER use Hinglish or Hindi phrases (for The Squirrels)
- NEVER use filler: "basically", "actually", "you know"
- NEVER hedge excessively
- Every claim must cite its source from the research dossier
- Precision over sensationalism`;
  } else if (isBreakingTube) {
    hardConstraints = `HARD CONSTRAINTS:
- NEVER use pure English academic tone — keep it conversational Hinglish
- NEVER lose analytical depth for the sake of entertainment
- NEVER use clickbait without substance backing it up
- NEVER copy mainstream Hindi news anchors' style
- Every claim must cite its source from the research dossier
- Energy over stuffiness, but always backed by data`;
  } else {
    hardConstraints = `HARD CONSTRAINTS:
- NEVER use clickbait: "SHOCKING", "DESTROYED", "EXPOSED", ALL CAPS
- NEVER use filler: "basically", "actually", "you know"
- Every claim must cite its source from the research dossier
- Maintain brand voice consistency throughout`;
  }

  // Signature phrases vary by brand
  let signaturePhrases: string;
  if (isSquirrels) {
    signaturePhrases = `SIGNATURE PHRASES (use naturally):
- "The data suggests..." / "The evidence points to..."
- "Here's what's actually happening..."
- "The non-obvious implication is..."
- "Three things to watch..."
- "What nobody's talking about is..."`;
  } else if (isBreakingTube) {
    signaturePhrases = `SIGNATURE PHRASES (use naturally):
- "Isko samjho..." / "Yeh important hai kyunki..."
- "Data dekho toh..."
- "Sabse interesting baat yeh hai..."
- "Iska matlab kya hai India ke liye?"
- "Toh actual picture kya hai..."`;
  } else {
    signaturePhrases = `SIGNATURE PHRASES (develop brand-specific phrases that feel natural and authoritative)`;
  }

  // Structural requirements
  const structuralReqs = `STRUCTURAL REQUIREMENTS:
- Open with a provocative rhetorical hook — a claim, contradiction, or question
- Include 1-2 historical parallels to establish analytical credibility
- Weave data into narrative — every statistic must include context (comparable figure, percentage, or scale translation)
- Use pointed analytical questions that reframe the story
- India-first framing: connect every analysis to "what does this mean for India?"`;

  return `
BRAND VOICE ENFORCEMENT — ${brandName}:
Tone: ${tone}
${langConstraint}

MANDATORY VOICE RULES:
${numberedRules}

${structuralReqs}

${signaturePhrases}

${hardConstraints}
`.trim();
}

/**
 * Returns brand-aware colorMood string for NanoBanana visual generation.
 */
export function getBrandColorMood(brandName: string, fallback: string = "bold, high contrast"): string {
  const key = brandName.toLowerCase().trim();
  if (key === "the squirrels") {
    return "navy editorial, teal accent, high contrast";
  }
  if (key === "breaking tube") {
    return "red and black bold, yellow accent, high energy contrast";
  }
  return fallback;
}
