/**
 * Centralized skill loading for content generation.
 *
 * Maps every content type to the exact set of editorial, platform,
 * and voice skills it needs.  Used by quick-generate and recommend
 * routes to inject the full intelligence stack into LLM prompts.
 */

import { SkillOrchestrator } from "@/lib/skill-orchestrator";

const orchestrator = new SkillOrchestrator();

// ─── Core skills loaded for EVERY content type ───────────

const CORE_SKILLS = [
  "narrative/editorial/topic-selection.md",
  "narrative/editorial/angle-detection.md",
  "narrative/voice/hook-engineering.md",
  "narrative/audience/audience-calibration.md",
  "narrative/research/fact-dossier-building.md",
];

// ─── Platform-specific skills ────────────────────────────

const PLATFORM_SKILLS: Record<string, string[]> = {
  youtube_explainer: [
    "platforms/youtube/title-engineering.md",
    "platforms/youtube/description-optimization.md",
    "platforms/youtube/thumbnail-strategy.md",
    "narrative/editorial/narrative-arc-construction.md",
    "production/long-form/documentary-planning.md",
    "production/support/broll-sheet-generation.md",
    "platforms/x-twitter/visual-anchor-selection.md",
    "narrative/voice/attention-grabbing.md",
  ],
  youtube_short: [
    "platforms/youtube/shorts-strategy.md",
    "platforms/youtube/title-engineering.md",
    "narrative/voice/hook-engineering.md",
    "narrative/voice/attention-grabbing.md",
  ],
  x_thread: [
    "platforms/x-twitter/thread-architecture.md",
    "platforms/x-twitter/algorithm-awareness.md",
    "platforms/x-twitter/tweet-crafting.md",
    "narrative/voice/hook-engineering.md",
    "platforms/x-twitter/visual-anchor-selection.md",
  ],
  x_single: [
    "platforms/x-twitter/tweet-crafting.md",
    "platforms/x-twitter/algorithm-awareness.md",
    "platforms/x-twitter/tag-strategy.md",
  ],
  instagram_carousel: [
    "platforms/meta/carousel-design.md",
    "platforms/meta/instagram-seo.md",
    "narrative/editorial/narrative-arc-construction.md",
    "platforms/x-twitter/visual-anchor-selection.md",
  ],
  carousel: [
    "platforms/meta/carousel-design.md",
    "platforms/meta/instagram-seo.md",
    "narrative/editorial/narrative-arc-construction.md",
    "platforms/x-twitter/visual-anchor-selection.md",
  ],
  instagram_reel: [
    "platforms/meta/reel-production.md",
    "production/short-form/vertical-video-adaptation.md",
    "platforms/meta/instagram-seo.md",
    "narrative/voice/hook-engineering.md",
  ],
  linkedin_post: [
    "platforms/linkedin/professional-tone-calibration.md",
    "platforms/linkedin/creator-mode-optimization.md",
  ],
  linkedin_article: [
    "platforms/linkedin/professional-tone-calibration.md",
    "platforms/linkedin/article-vs-post-decision.md",
    "narrative/editorial/narrative-arc-construction.md",
  ],
  blog_post: [
    "platforms/seo/content-seo.md",
    "platforms/seo/on-page-seo.md",
    "platforms/seo/keyword-research.md",
    "narrative/editorial/narrative-arc-construction.md",
  ],
  quick_take: [
    "platforms/youtube/shorts-strategy.md",
    "narrative/voice/hook-engineering.md",
    "narrative/voice/attention-grabbing.md",
  ],
  community_post: [
    "platforms/youtube/community-post-strategy.md",
  ],
  newsletter: [
    "narrative/editorial/narrative-arc-construction.md",
    "narrative/audience/audience-calibration.md",
  ],
  podcast_script: [
    "narrative/editorial/narrative-arc-construction.md",
    "production/long-form/interview-podcast-prep.md",
  ],

  // Special key: editorial decision skills for recommend route
  _editorial: [
    "narrative/editorial/topic-selection.md",
    "narrative/editorial/angle-detection.md",
    "narrative/editorial/timeliness-optimizer.md",
    "narrative/editorial/sensitivity-classification.md",
    "narrative/editorial/competitive-narrative-analysis.md",
    "distribution/platform-first-vs-repurpose.md",
    "distribution/evergreen-vs-timely.md",
  ],
};

// ─── Voice / quality skills for ALL content types ────────

const VOICE_SKILLS = [
  "narrative/voice/human-voice.md",       // Anti-AI-detection
  "narrative/voice/emotional-mapping.md",  // Emotional tone
];

// ─── Public API ──────────────────────────────────────────

/**
 * Returns de-duplicated skill file paths for a content type.
 * Combines CORE + PLATFORM + VOICE skills.
 * Use this to merge into an existing SkillOrchestrator loading flow.
 */
export function getSkillPathsForContentType(contentType: string): string[] {
  const isEditorial = contentType === "_editorial";
  return [
    ...(isEditorial ? [] : CORE_SKILLS),
    ...(PLATFORM_SKILLS[contentType] || []),
    ...(isEditorial ? [] : VOICE_SKILLS),
  ];
}

/**
 * Load and format all skills for a content type into a prompt-ready string.
 * Each skill's instructions are trimmed to 300 lines.
 */
export async function loadSkillsForContentType(
  contentType: string
): Promise<string> {
  const skillPaths = getSkillPathsForContentType(contentType);
  const unique = [...new Set(skillPaths)];

  const loaded = await Promise.all(
    unique.map(async (p) => {
      try {
        const skill = await orchestrator.loadSkill(p);
        if (skill?.instructions) {
          const trimmed = skill.instructions
            .split("\n")
            .slice(0, 300)
            .join("\n");
          return `## ${skill.meta.name || p}\n${trimmed}`;
        }
      } catch {
        // Skill not found — skip silently
      }
      return null;
    })
  );

  const skillContext = loaded.filter(Boolean).join("\n\n---\n\n");

  console.log(
    `[skills] Loaded ${loaded.filter(Boolean).length}/${unique.length} skills for ${contentType}`
  );

  return skillContext;
}
