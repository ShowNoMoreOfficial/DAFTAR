/**
 * Yantri Engine Router
 *
 * Given a deliverable's content type (VIDEO_SCRIPT, TWEET_THREAD, etc.),
 * determines the exact sequence of .md skill files the generation pipeline
 * must execute. Each content type maps to a multi-stage skill chain:
 *
 *   1. Research / fact-gathering skills
 *   2. Narrative / voice calibration skills
 *   3. Platform-specific formatting skills
 *   4. Production support skills (thumbnails, captions, etc.)
 */

// ─── Types ────────────────────────────────────────────────

export type ContentType =
  | "VIDEO_SCRIPT"
  | "VIDEO_SHORT"
  | "TWEET_SINGLE"
  | "TWEET_THREAD"
  | "INSTAGRAM_REEL"
  | "INSTAGRAM_CAROUSEL"
  | "INSTAGRAM_STORY"
  | "LINKEDIN_POST"
  | "LINKEDIN_ARTICLE"
  | "FACEBOOK_POST"
  | "BLOG_ARTICLE"
  | "IMAGE_ASSET"
  | "PODCAST_SCRIPT";

export interface SkillChain {
  contentType: ContentType;
  platform: string;
  stages: SkillStage[];
}

export interface SkillStage {
  name: string;
  skillPath: string;
  required: boolean;
}

// ─── Shared Stages ────────────────────────────────────────

const RESEARCH_STAGE: SkillStage = {
  name: "research",
  skillPath: "narrative/research/fact-dossier-building.md",
  required: true,
};

const TOPIC_SELECTION: SkillStage = {
  name: "topic-selection",
  skillPath: "narrative/editorial/topic-selection.md",
  required: true,
};

const HOOK_ENGINEERING: SkillStage = {
  name: "hook-engineering",
  skillPath: "narrative/voice/hook-engineering.md",
  required: true,
};

const AUDIENCE_CALIBRATION: SkillStage = {
  name: "audience-calibration",
  skillPath: "narrative/audience/audience-calibration.md",
  required: false,
};

const FACT_CHECK: SkillStage = {
  name: "fact-check",
  skillPath: "narrative/research/fact-check-shield.md",
  required: true,
};

// ─── Platform-Specific Chains ─────────────────────────────

const CHAINS: Record<ContentType, SkillStage[]> = {
  VIDEO_SCRIPT: [
    RESEARCH_STAGE,
    TOPIC_SELECTION,
    {
      name: "narrative-arc",
      skillPath: "narrative/editorial/narrative-arc-construction.md",
      required: true,
    },
    HOOK_ENGINEERING,
    AUDIENCE_CALIBRATION,
    {
      name: "documentary-planning",
      skillPath: "production/long-form/documentary-planning.md",
      required: true,
    },
    {
      name: "title-engineering",
      skillPath: "platforms/youtube/title-engineering.md",
      required: true,
    },
    {
      name: "description-optimization",
      skillPath: "platforms/youtube/description-optimization.md",
      required: true,
    },
    {
      name: "thumbnail-strategy",
      skillPath: "production/support/thumbnail-strategy.md",
      required: false,
    },
    FACT_CHECK,
  ],

  VIDEO_SHORT: [
    RESEARCH_STAGE,
    HOOK_ENGINEERING,
    {
      name: "explainer-shorts",
      skillPath: "production/short-form/explainer-shorts.md",
      required: true,
    },
    {
      name: "vertical-adaptation",
      skillPath: "production/short-form/vertical-video-adaptation.md",
      required: true,
    },
    {
      name: "shorts-strategy",
      skillPath: "platforms/youtube/shorts-strategy.md",
      required: true,
    },
    FACT_CHECK,
  ],

  TWEET_SINGLE: [
    RESEARCH_STAGE,
    HOOK_ENGINEERING,
    {
      name: "tweet-crafting",
      skillPath: "platforms/x-twitter/tweet-crafting.md",
      required: true,
    },
    {
      name: "visual-anchor",
      skillPath: "platforms/x-twitter/visual-anchor-selection.md",
      required: false,
    },
    {
      name: "algorithm-awareness",
      skillPath: "platforms/x-twitter/algorithm-awareness.md",
      required: false,
    },
    FACT_CHECK,
  ],

  TWEET_THREAD: [
    RESEARCH_STAGE,
    TOPIC_SELECTION,
    {
      name: "narrative-arc",
      skillPath: "narrative/editorial/narrative-arc-construction.md",
      required: true,
    },
    HOOK_ENGINEERING,
    {
      name: "thread-architecture",
      skillPath: "platforms/x-twitter/thread-architecture.md",
      required: true,
    },
    {
      name: "tag-strategy",
      skillPath: "platforms/x-twitter/tag-strategy.md",
      required: false,
    },
    FACT_CHECK,
  ],

  INSTAGRAM_REEL: [
    RESEARCH_STAGE,
    HOOK_ENGINEERING,
    {
      name: "reel-production",
      skillPath: "platforms/meta/reel-production.md",
      required: true,
    },
    {
      name: "vertical-adaptation",
      skillPath: "production/short-form/vertical-video-adaptation.md",
      required: true,
    },
    {
      name: "instagram-seo",
      skillPath: "platforms/meta/instagram-seo.md",
      required: false,
    },
    FACT_CHECK,
  ],

  INSTAGRAM_CAROUSEL: [
    RESEARCH_STAGE,
    TOPIC_SELECTION,
    {
      name: "narrative-arc",
      skillPath: "narrative/editorial/narrative-arc-construction.md",
      required: true,
    },
    {
      name: "carousel-design",
      skillPath: "platforms/meta/carousel-design.md",
      required: true,
    },
    {
      name: "instagram-seo",
      skillPath: "platforms/meta/instagram-seo.md",
      required: false,
    },
    FACT_CHECK,
  ],

  INSTAGRAM_STORY: [
    HOOK_ENGINEERING,
    {
      name: "story-strategy",
      skillPath: "platforms/meta/story-strategy.md",
      required: true,
    },
    FACT_CHECK,
  ],

  LINKEDIN_POST: [
    RESEARCH_STAGE,
    HOOK_ENGINEERING,
    {
      name: "professional-tone",
      skillPath: "platforms/linkedin/professional-tone-calibration.md",
      required: true,
    },
    {
      name: "b2b-angle",
      skillPath: "platforms/linkedin/b2b-angle-extraction.md",
      required: false,
    },
    {
      name: "creator-mode",
      skillPath: "platforms/linkedin/creator-mode-optimization.md",
      required: false,
    },
    FACT_CHECK,
  ],

  LINKEDIN_ARTICLE: [
    RESEARCH_STAGE,
    TOPIC_SELECTION,
    {
      name: "narrative-arc",
      skillPath: "narrative/editorial/narrative-arc-construction.md",
      required: true,
    },
    HOOK_ENGINEERING,
    AUDIENCE_CALIBRATION,
    {
      name: "article-vs-post",
      skillPath: "platforms/linkedin/article-vs-post-decision.md",
      required: true,
    },
    {
      name: "professional-tone",
      skillPath: "platforms/linkedin/professional-tone-calibration.md",
      required: true,
    },
    FACT_CHECK,
  ],

  FACEBOOK_POST: [
    RESEARCH_STAGE,
    HOOK_ENGINEERING,
    {
      name: "group-strategy",
      skillPath: "platforms/meta/facebook-group-strategy.md",
      required: true,
    },
    FACT_CHECK,
  ],

  BLOG_ARTICLE: [
    RESEARCH_STAGE,
    TOPIC_SELECTION,
    {
      name: "narrative-arc",
      skillPath: "narrative/editorial/narrative-arc-construction.md",
      required: true,
    },
    HOOK_ENGINEERING,
    AUDIENCE_CALIBRATION,
    {
      name: "content-seo",
      skillPath: "platforms/seo/content-seo.md",
      required: true,
    },
    {
      name: "on-page-seo",
      skillPath: "platforms/seo/on-page-seo.md",
      required: false,
    },
    FACT_CHECK,
  ],

  IMAGE_ASSET: [
    {
      name: "visual-anchor",
      skillPath: "platforms/x-twitter/visual-anchor-selection.md",
      required: true,
    },
    {
      name: "thumbnail-strategy",
      skillPath: "production/support/thumbnail-strategy.md",
      required: true,
    },
    {
      name: "motion-graphics-brief",
      skillPath: "production/support/motion-graphics-brief.md",
      required: false,
    },
  ],

  PODCAST_SCRIPT: [
    RESEARCH_STAGE,
    TOPIC_SELECTION,
    {
      name: "narrative-arc",
      skillPath: "narrative/editorial/narrative-arc-construction.md",
      required: true,
    },
    HOOK_ENGINEERING,
    {
      name: "interview-prep",
      skillPath: "production/long-form/interview-podcast-prep.md",
      required: true,
    },
    FACT_CHECK,
  ],
};

// ─── Platform inference ───────────────────────────────────

const TYPE_TO_PLATFORM: Record<ContentType, string> = {
  VIDEO_SCRIPT: "youtube",
  VIDEO_SHORT: "youtube",
  TWEET_SINGLE: "x",
  TWEET_THREAD: "x",
  INSTAGRAM_REEL: "instagram",
  INSTAGRAM_CAROUSEL: "instagram",
  INSTAGRAM_STORY: "instagram",
  LINKEDIN_POST: "linkedin",
  LINKEDIN_ARTICLE: "linkedin",
  FACEBOOK_POST: "facebook",
  BLOG_ARTICLE: "blog",
  IMAGE_ASSET: "multi",
  PODCAST_SCRIPT: "podcast",
};

// ─── Router Class ─────────────────────────────────────────

export class EngineRouter {
  /**
   * Resolve the full skill chain for a given content type.
   * Returns the ordered list of skill stages to execute.
   */
  resolve(contentType: ContentType): SkillChain {
    const stages = CHAINS[contentType];
    if (!stages) {
      throw new Error(
        `[EngineRouter] Unknown content type: ${contentType}. ` +
          `Valid types: ${Object.keys(CHAINS).join(", ")}`
      );
    }

    return {
      contentType,
      platform: TYPE_TO_PLATFORM[contentType] ?? "unknown",
      stages,
    };
  }

  /**
   * Extract only the skill file paths from a chain (for loading).
   */
  getSkillPaths(contentType: ContentType): string[] {
    const chain = this.resolve(contentType);
    return chain.stages.map((s) => s.skillPath);
  }

  /**
   * Get the primary drafting skill (the platform-specific one).
   * This is the skill that actually produces the content draft,
   * as opposed to research/fact-check stages.
   */
  getPrimaryDraftSkill(contentType: ContentType): SkillStage {
    const chain = this.resolve(contentType);
    // The primary draft skill is the first platform-specific stage
    // (i.e., starts with "platforms/" or "production/")
    const draftSkill = chain.stages.find(
      (s) =>
        s.skillPath.startsWith("platforms/") ||
        s.skillPath.startsWith("production/")
    );
    return draftSkill ?? chain.stages[chain.stages.length - 1];
  }

  /**
   * Check whether a content type is valid.
   */
  isValidType(type: string): type is ContentType {
    return type in CHAINS;
  }

  /**
   * List all supported content types.
   */
  listTypes(): ContentType[] {
    return Object.keys(CHAINS) as ContentType[];
  }

  /**
   * Get the inferred platform for a content type.
   */
  getPlatform(contentType: ContentType): string {
    return TYPE_TO_PLATFORM[contentType] ?? "unknown";
  }
}

export const engineRouter = new EngineRouter();
