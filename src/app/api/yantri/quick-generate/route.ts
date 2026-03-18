import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { routeToModel } from "@/lib/yantri/model-router";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBrandVoiceBlock, getBrandColorPalette } from "@/lib/yantri/brand-voice";
import { engineRouter, type ContentType } from "@/lib/yantri/engine-router";
import { SkillOrchestrator, type SkillFile } from "@/lib/skill-orchestrator";
import { getSkillPathsForContentType } from "@/lib/yantri/load-content-skills";
import { runSEOAnalysis, buildSEOPromptBlock, type SEOAnalysis } from "@/lib/yantri/seo-engine";
import { planAssets } from "@/lib/yantri/asset-planner";

/**
 * POST /api/yantri/quick-generate
 *
 * Skill-powered synchronous content generation.
 * Loads editorial skills, brand voice, and recommendation context
 * to produce intelligent content via the full intelligence stack.
 *
 * Body: {
 *   topic: string,
 *   brandId: string,
 *   contentType: "youtube_explainer" | "x_thread" | "carousel" | "quick_take",
 *   recommendationContext?: RecommendationContext
 * }
 */

// ─── Types ───

interface RecommendationContext {
  angle: string;
  reasoning: string;
  priority: string;
  urgency: string;
  assetsRequired: {
    images: string[];
    video: string[];
    graphics: string[];
    other: string[];
  };
  keyDataPoints: string[];
  stakeholders: string[];
  sensitivityLevel: string;
  suggestedTitle: string;
}

interface ContentTypeMapping {
  engineType: ContentType;
  platform: "YOUTUBE" | "X_THREAD" | "X_SINGLE" | "BLOG" | "LINKEDIN" | "META_REEL" | "META_CAROUSEL" | "META_POST";
  pipelineType: string;
  jsonStructure: string;
}

// ─── JSON Structure Templates (must be declared before CONTENT_TYPE_MAP) ───

const YOUTUBE_EXPLAINER_STRUCTURE = `Create a complete content package with this EXACT JSON structure:
{
  "script": {
    "sections": [
      { "type": "hook", "timeCode": "0:00-0:30", "text": "...", "visualNotes": "..." },
      { "type": "context", "timeCode": "0:30-2:00", "text": "...", "visualNotes": "..." },
      { "type": "thesis", "timeCode": "2:00-4:00", "text": "...", "visualNotes": "..." },
      { "type": "evidence", "timeCode": "4:00-8:00", "text": "...", "visualNotes": "..." },
      { "type": "counterpoint", "timeCode": "8:00-10:00", "text": "...", "visualNotes": "..." },
      { "type": "implications", "timeCode": "10:00-12:00", "text": "...", "visualNotes": "..." },
      { "type": "cta", "timeCode": "12:00-12:30", "text": "...", "visualNotes": "..." }
    ]
  },
  "titles": [
    { "text": "...", "strategy": "curiosity_gap" },
    { "text": "...", "strategy": "data_driven" },
    { "text": "...", "strategy": "provocative_question" }
  ],
  "description": "YouTube description (SEO optimized, 200+ words)",
  "tags": ["keyword1", "keyword2", "...15-20 relevant keywords"],
  "thumbnailBriefs": [
    { "concept": "...", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." },
    { "concept": "...", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." },
    { "concept": "...", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- Each script section "text" field must contain the ACTUAL script text the host reads aloud — not a summary
- HOOK: Must be a provocative opening — a surprising fact, bold claim, or dramatic question. NEVER start with "In this video", "Today we're going to discuss", "Hey guys", or any generic opener
- TITLES: Apply YouTube CTR formulas — curiosity gap ("X happened, here's why it matters"), data-driven ("$2.7B bet"), provocative question ("Is India ready?"). Each title must use a different proven formula
- Every claim must be backed by specific data from the research dossier — cite numbers, dates, and sources
- VISUAL NOTES: Must be SPECIFIC B-roll/graphic suggestions for the editor, not generic. Bad: "relevant footage". Good: "Archive clip of PM Modi at semiconductor plant inauguration, Feb 2026" or "Animated bar chart comparing India vs China chip production capacity 2020-2026"
- Each section's visualNotes should include: exact B-roll shots, specific data graphics/charts to create, name cards for stakeholders mentioned, and any text overlays the editor should add`;

const X_THREAD_STRUCTURE = `Create a complete thread with this EXACT JSON structure:
{
  "tweets": [
    { "position": 1, "text": "Hook tweet — MUST stand alone, stop the scroll (max 280 chars)", "type": "hook", "hasImage": true, "imageDescription": "Bold data card or visual that amplifies the hook", "hashtags": [] },
    { "position": 2, "text": "Context tweet — set the stage", "type": "context", "hasImage": false, "imageDescription": null, "hashtags": [] },
    { "position": 3, "text": "Data point tweet with specific numbers", "type": "evidence", "hasImage": true, "imageDescription": "Data visualization or comparison chart", "hashtags": [] },
    { "position": 4, "text": "...", "type": "analysis", "hasImage": false, "imageDescription": null, "hashtags": [] },
    { "position": 5, "text": "...", "type": "analysis", "hasImage": true, "imageDescription": "Quote card or infographic", "hashtags": [] },
    { "position": 6, "text": "...", "type": "evidence", "hasImage": false, "imageDescription": null, "hashtags": [] },
    { "position": 7, "text": "...", "type": "implication", "hasImage": false, "imageDescription": null, "hashtags": ["#relevant"] },
    { "position": 8, "text": "CTA tweet — question + follow prompt", "type": "cta", "hasImage": false, "imageDescription": null, "hashtags": [] }
  ],
  "threadStrategy": {
    "hookArchetype": "The Contradiction|The Data Bomb|The Question|The Prediction",
    "narrativeFlow": "Brief description of how tension builds across the thread",
    "hashtagStrategy": "Strategic placement — NOT every tweet, only 2-3 tweets with 1-2 relevant hashtags each",
    "visualAnchors": "Place images/data cards every 3-4 tweets to maintain scroll momentum"
  },
  "quoteTweetSuggestion": {
    "targetTweet": "position number of the best tweet to quote-tweet for cross-promotion",
    "quoteText": "Ready-to-post quote tweet text (max 280 chars) that reframes or amplifies the thread",
    "timing": "Post quote tweet 2-4 hours after thread for algorithm boost"
  },
  "titles": [
    { "text": "Thread title option 1", "strategy": "hook" },
    { "text": "Thread title option 2", "strategy": "data" }
  ],
  "description": "Brief summary of the thread (100 words)",
  "tags": ["keyword1", "keyword2", "...10-15 relevant hashtags"],
  "postingPlan": {
    "optimalTime": "HH:MM IST",
    "timeReasoning": "Why this time works for this topic and audience",
    "dayPreference": "Best day of week for this content"
  },
  "thumbnailBriefs": [
    { "concept": "Thread header image", "textOverlay": "4 words max", "colorScheme": "...", "composition": "1200x675" }
  ]
}

REQUIREMENTS:
- 7-10 tweets total, each MUST be under 280 characters — count carefully
- Tweet 1 is the HOOK — it MUST work as a standalone tweet that stops the scroll (this gets 10x the impressions). NEVER start with "Thread:", "🧵", or "A thread on...". Instead: lead with a surprising fact, bold claim, or provocative question
- Tweets 2-3 MUST include hard data — specific numbers, percentages, dollar amounts, dates. "India invested $2.7 billion" not "India made a large investment"
- Include specific data/numbers in at least 4 tweets total
- Visual anchors (hasImage: true) every 3-4 tweets to maintain scroll momentum — each imageDescription must describe a specific data card, chart, or infographic to create
- Strategic hashtag placement: NOT every tweet — only 2-3 tweets with 1-2 targeted hashtags
- Final tweet is engagement CTA: ask a genuine question that invites debate. NEVER use "Follow for more", "RT if you agree", or generic CTAs. Instead: "What do you think India should prioritize — chip design or manufacturing?"
- Include quote tweet suggestion for cross-promotion (reframe the best tweet with a new angle)
- Do NOT put external links in tweet text (40-50% reach suppression) — suggest link in self-reply instead
- Each tweet must flow naturally from the previous but also work somewhat standalone`;

const CAROUSEL_STRUCTURE = `Create a carousel with this EXACT JSON structure:
{
  "slides": [
    { "position": 1, "type": "HOOK", "role": "hook", "headline": "Bold 3-8 word hook", "body": "", "bodyText": "", "visualDescription": "Detailed slide visual: background, text layout, imagery (60-100 words)", "visualPrompt": "Same as visualDescription", "colorAccent": "#hex", "colorHex": "#hex", "textOverlay": "HOOK slide — large text only" },
    { "position": 2, "type": "SECONDARY_HOOK", "role": "secondary_hook", "headline": "...", "body": "...", "bodyText": "...", "visualDescription": "...", "visualPrompt": "...", "colorAccent": "#hex", "colorHex": "#hex", "textOverlay": "..." },
    { "position": 3, "type": "CONTEXT", "role": "context", "headline": "...", "body": "...", "bodyText": "...", "visualDescription": "...", "visualPrompt": "...", "colorAccent": "#hex", "colorHex": "#hex", "textOverlay": "..." },
    { "position": 4, "type": "DATA", "role": "data", "headline": "The Numbers", "body": "Key stat 1\\nKey stat 2\\nKey stat 3", "bodyText": "...", "visualDescription": "Infographic with data blocks, icons + numbers", "visualPrompt": "...", "colorAccent": "#hex", "colorHex": "#hex", "textOverlay": "..." },
    { "position": 5, "type": "ESCALATION", "role": "escalation", "headline": "...", "body": "...", "bodyText": "...", "visualDescription": "...", "visualPrompt": "...", "colorAccent": "#hex", "colorHex": "#hex", "textOverlay": "..." },
    { "position": 6, "type": "DATA", "role": "data", "headline": "...", "body": "...", "bodyText": "...", "visualDescription": "...", "visualPrompt": "...", "colorAccent": "#hex", "colorHex": "#hex", "textOverlay": "..." },
    { "position": 7, "type": "ESCALATION", "role": "escalation", "headline": "...", "body": "...", "bodyText": "...", "visualDescription": "...", "visualPrompt": "...", "colorAccent": "#hex", "colorHex": "#hex", "textOverlay": "..." },
    { "position": 8, "type": "CLIMAX", "role": "climax", "headline": "...", "body": "...", "bodyText": "...", "visualDescription": "...", "visualPrompt": "...", "colorAccent": "#hex", "colorHex": "#hex", "textOverlay": "..." },
    { "position": 9, "type": "CTA", "role": "cta", "headline": "...", "body": "...", "bodyText": "...", "visualDescription": "...", "visualPrompt": "...", "colorAccent": "#hex", "colorHex": "#hex", "textOverlay": "Save this for later" }
  ],
  "caption": "2200-char Instagram caption with line breaks, storytelling, question for comments, hashtags at end",
  "hashtags": ["#hashtag1", "#hashtag2", "...20-30 strategic hashtags mixing broad + niche"],
  "crossPost": {
    "facebook": true,
    "adaptations": "Facebook caption: longer storytelling, fewer hashtags (5-10), more questions for engagement"
  },
  "titles": [
    { "text": "Carousel title option 1", "strategy": "hook" },
    { "text": "Carousel title option 2", "strategy": "data" }
  ],
  "description": "Brief summary",
  "tags": ["#hashtag1", "#hashtag2", "...20-30 relevant hashtags"],
  "thumbnailBriefs": [
    { "concept": "Cover slide design", "textOverlay": "4 words max", "colorScheme": "...", "composition": "4:5 portrait 1080x1350" }
  ]
}

REQUIREMENTS:
- 8-10 slides with typed roles (HOOK, SECONDARY_HOOK, CONTEXT, DATA, ESCALATION, CLIMAX, CTA)
- HOOK slide (slide 1): MUST be a bold question or provocative statement — NO logos, NO brand names, NO "Swipe to learn". Example: "Did India just bet its future on chips?" in bold white text on dark striking background
- SECONDARY_HOOK (slide 2): Must work as an independent hook — if someone screenshots only this slide, it should make sense and be shareable
- Slides must follow a NARRATIVE ARC: Hook → Context → Rising tension (data) → Escalation → Climax (the big reveal/insight) → CTA. NOT just a list of facts
- DATA slides present ONE clear stat per slide with infographic-style visuals — big number, supporting text, icon
- CTA slide: clear actionable ask — "Save this to reference later" or "Share with someone who needs to see this" or "Drop a 🔥 if you agree". NOT generic "Follow for more"
- 4:5 portrait format (1080x1350px) for all slides
- Caption: 2200 chars with line breaks, storytelling hook in first line, engagement question, hashtags at end
- 20-30 hashtags mixing broad reach + niche targeting
- Include Facebook cross-post adaptations
- Each visualDescription must describe a complete, self-contained slide image (60-100 words)
- body and bodyText should contain the same content
- visualDescription and visualPrompt should contain the same content
- colorAccent and colorHex should contain the same hex value`;

const QUICK_TAKE_STRUCTURE = `Create a quick take with this EXACT JSON structure:
{
  "script": {
    "sections": [
      { "type": "hook", "timeCode": "0:00-0:15", "text": "...", "visualNotes": "..." },
      { "type": "context", "timeCode": "0:15-1:00", "text": "...", "visualNotes": "..." },
      { "type": "opinion", "timeCode": "1:00-3:00", "text": "...", "visualNotes": "..." },
      { "type": "implication", "timeCode": "3:00-4:00", "text": "...", "visualNotes": "..." },
      { "type": "cta", "timeCode": "4:00-4:30", "text": "...", "visualNotes": "..." }
    ]
  },
  "titles": [
    { "text": "...", "strategy": "hot_take" },
    { "text": "...", "strategy": "breaking" }
  ],
  "description": "YouTube description (150 words)",
  "tags": ["keyword1", "keyword2", "...10-15 keywords"],
  "thumbnailBriefs": [
    { "concept": "...", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- This is a SHORT opinion piece — more editorial, less research depth
- The host should have a clear, strong take
- Max 5 minutes runtime
- More conversational than a full explainer
- Apply hook engineering for the opening`;

// ─── Additional JSON Structure Templates ───

const YOUTUBE_SHORT_STRUCTURE = `Create a 60-second YouTube Short with this EXACT JSON structure:
{
  "script": {
    "hook": { "text": "...", "duration": "0:00-0:02", "visualNote": "..." },
    "segments": [
      { "text": "...", "duration": "0:02-0:15", "visualNote": "...", "textOverlay": "..." },
      { "text": "...", "duration": "0:15-0:35", "visualNote": "...", "textOverlay": "..." },
      { "text": "...", "duration": "0:35-0:50", "visualNote": "...", "textOverlay": "..." }
    ],
    "cta": { "text": "...", "duration": "0:50-0:58", "visualNote": "..." }
  },
  "totalDuration": "58 seconds",
  "titles": [
    { "text": "...", "strategy": "hook" },
    { "text": "...", "strategy": "curiosity" },
    { "text": "...", "strategy": "data" }
  ],
  "description": "YouTube Shorts description (100 words, SEO optimized)",
  "tags": ["keyword1", "keyword2", "...10-15 keywords"],
  "hashtags": ["#short1", "#short2", "...5 max"],
  "musicMood": "energetic|tense|uplifting|dramatic",
  "textOverlays": [
    { "text": "...", "timing": "0:02", "style": "bold|subtle|data" }
  ],
  "thumbnailBriefs": [
    { "concept": "...", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- HOOK in first 1.5 seconds — text overlay AND spoken word SIMULTANEOUSLY. The viewer must see bold text on screen while hearing the hook spoken aloud. Example: screen shows "India just spent $2.7 BILLION" while host says "India just made its biggest bet ever on semiconductor manufacturing"
- Vertical format (9:16, 1080x1920) — design every visual element for phone screens
- No intro/outro — jump straight into the most surprising fact or claim. NEVER start with "Hey guys" or "Welcome to"
- ONE KEY INSIGHT ONLY — don't try to explain everything. Pick the single most interesting angle and commit to it
- End with an OPEN LOOP or provocative question that drives comments — "But here's what nobody's talking about..." or "The real question is..." NOT "Subscribe for more" or "Like and follow"
- Max 60 seconds total — every second must earn its place
- Each segment's textOverlay should be a bold, standalone statement that works even on mute`;

const X_SINGLE_STRUCTURE = `Create a single tweet with this EXACT JSON structure:
{
  "tweets": [
    { "position": 1, "text": "Tweet text (max 280 chars)", "type": "main" }
  ],
  "variants": [
    { "text": "Provocative hot-take variant (max 280 chars)", "strategy": "provocative" },
    { "text": "Data-driven variant with specific number (max 280 chars)", "strategy": "data_driven" },
    { "text": "Question that invites debate (max 280 chars)", "strategy": "question" }
  ],
  "replyBait": {
    "selfReply": "A follow-up reply from the same account to boost engagement (max 280 chars). Add context, a source link, or a counter-perspective.",
    "anticipatedReplies": ["Likely reply angle 1", "Likely reply angle 2"],
    "replyStrategy": "How to engage with replies to maximize thread visibility"
  },
  "postingPlan": {
    "optimalTime": "HH:MM IST",
    "timeReasoning": "Why this specific time maximizes reach for this topic",
    "dayPreference": "Best day of week"
  },
  "titles": [
    { "text": "Main tweet", "strategy": "primary" }
  ],
  "description": "Brief context about this tweet",
  "tags": ["#hashtag1", "#hashtag2", "...3-5 relevant hashtags"],
  "mediaDescription": "Suggested image/graphic to accompany the tweet — data card, quote card, or comparison visual",
  "thumbnailBriefs": [
    { "concept": "Social card image", "textOverlay": "4 words max", "colorScheme": "...", "composition": "1200x675" }
  ]
}

REQUIREMENTS:
- MUST be under 280 characters — count carefully
- Provide 3 variants with different strategies (provocative, data-driven, question)
- Include reply bait: self-reply for engagement boost + anticipated reply angles
- Include optimal posting time with reasoning
- Media suggestion for higher engagement (data cards get 2x engagement)
- Strategic hashtag placement: 2-3 max in tweet body, NOT at the end
- Do NOT include external links in tweet text (40-50% reach suppression)
- If linking needed, suggest putting link in self-reply instead`;

const INSTAGRAM_REEL_STRUCTURE = `Create a 60-90 second Instagram Reel with this EXACT JSON structure:
{
  "script": {
    "hook": { "text": "...", "duration": "0:00-0:02", "visualNote": "..." },
    "segments": [
      { "text": "...", "duration": "0:02-0:20", "visualNote": "...", "textOverlay": "..." },
      { "text": "...", "duration": "0:20-0:45", "visualNote": "...", "textOverlay": "..." },
      { "text": "...", "duration": "0:45-1:05", "visualNote": "...", "textOverlay": "..." }
    ],
    "cta": { "text": "...", "duration": "1:05-1:15", "visualNote": "..." }
  },
  "totalDuration": "75 seconds",
  "titles": [
    { "text": "...", "strategy": "hook" },
    { "text": "...", "strategy": "curiosity" }
  ],
  "description": "Instagram caption (2200 chars max with line breaks)",
  "tags": ["#hashtag1", "#hashtag2", "...20-30 relevant hashtags"],
  "musicMood": "trending|energetic|dramatic|chill",
  "textOverlays": [
    { "text": "...", "timing": "0:02", "style": "bold|subtle|data" }
  ],
  "coverFrameDescription": "Description of the cover frame for the reel",
  "thumbnailBriefs": [
    { "concept": "Cover frame design", "textOverlay": "4 words max", "colorScheme": "...", "composition": "..." }
  ]
}

REQUIREMENTS:
- HOOK in first 2 seconds
- Vertical format (9:16, 1080x1920)
- Text overlays at key moments with timing
- Trending audio mood suggestion
- Caption with line breaks (2200 char max)
- 20-30 relevant hashtags
- CTA: save or share`;

const LINKEDIN_POST_STRUCTURE = `Create a LinkedIn post with this EXACT JSON structure:
{
  "post": {
    "text": "Full LinkedIn post text (1000-2000 chars with line breaks for readability)"
  },
  "titles": [
    { "text": "Post headline option 1", "strategy": "professional" },
    { "text": "Post headline option 2", "strategy": "thought_leadership" }
  ],
  "description": "Brief summary of the post angle",
  "tags": ["#keyword1", "#keyword2", "...5-8 professional hashtags"],
  "thumbnailBriefs": [
    { "concept": "Professional header image", "textOverlay": "4 words max", "colorScheme": "corporate blues", "composition": "1200x627" }
  ]
}

REQUIREMENTS:
- 1000-2000 characters
- Professional tone, data-driven insights
- Line breaks every 1-2 sentences for LinkedIn readability
- Hook in first line (before "see more" fold)
- End with question or CTA for engagement
- 5-8 professional hashtags`;

const LINKEDIN_ARTICLE_STRUCTURE = `Create a LinkedIn article with this EXACT JSON structure:
{
  "article": {
    "headline": "Article headline",
    "subtitle": "Article subtitle",
    "sections": [
      { "heading": "...", "text": "...", "type": "intro" },
      { "heading": "...", "text": "...", "type": "analysis" },
      { "heading": "...", "text": "...", "type": "analysis" },
      { "heading": "...", "text": "...", "type": "data" },
      { "heading": "...", "text": "...", "type": "implications" },
      { "heading": "...", "text": "...", "type": "conclusion" }
    ]
  },
  "titles": [
    { "text": "...", "strategy": "thought_leadership" },
    { "text": "...", "strategy": "data_driven" }
  ],
  "description": "Article summary for preview",
  "tags": ["#keyword1", "#keyword2", "...5-8 professional hashtags"],
  "thumbnailBriefs": [
    { "concept": "Article cover image", "textOverlay": "4 words max", "colorScheme": "professional", "composition": "1200x627" }
  ]
}

REQUIREMENTS:
- Long-form with 5-7 sections
- Professional, thought-leadership tone
- Data-backed arguments with cited sources
- Each section 200-400 words
- Strong headline that promises insight`;

const BLOG_POST_STRUCTURE = `Create an SEO-optimized blog post with this EXACT JSON structure:
{
  "article": {
    "headline": "H1 title with primary keyword",
    "metaDescription": "155 chars max SEO meta description",
    "sections": [
      { "heading": "H2 heading", "text": "...", "type": "intro" },
      { "heading": "H2 heading", "text": "...", "type": "body" },
      { "heading": "H2 heading", "text": "...", "type": "body" },
      { "heading": "H2 heading", "text": "...", "type": "body" },
      { "heading": "H2 heading", "text": "...", "type": "conclusion" }
    ]
  },
  "titles": [
    { "text": "...", "strategy": "seo_keyword" },
    { "text": "...", "strategy": "curiosity" }
  ],
  "description": "SEO meta description (155 chars max)",
  "tags": ["keyword1", "keyword2", "...10-15 SEO keywords"],
  "seo": {
    "primaryKeyword": "...",
    "secondaryKeywords": ["...", "..."],
    "slug": "url-friendly-slug"
  },
  "thumbnailBriefs": [
    { "concept": "Featured image", "textOverlay": "4 words max", "colorScheme": "editorial", "composition": "1200x630" }
  ]
}

REQUIREMENTS:
- SEO-optimized H1 with primary keyword
- H2 headings with secondary keywords
- Meta description under 155 characters
- 1500-3000 words total
- Internal and external link suggestions
- Readable paragraphs (3-4 sentences each)`;

const NEWSLETTER_STRUCTURE = `Create a newsletter with this EXACT JSON structure:
{
  "newsletter": {
    "subject": "Email subject line (50 chars max)",
    "previewText": "Preview text shown in inbox (90 chars max)",
    "sections": [
      { "heading": "...", "text": "...", "type": "lead" },
      { "heading": "...", "text": "...", "type": "analysis" },
      { "heading": "...", "text": "...", "type": "data" },
      { "heading": "...", "text": "...", "type": "takeaway" }
    ],
    "cta": { "text": "CTA button text", "description": "Where it links / what it does" }
  },
  "titles": [
    { "text": "Subject line option 1", "strategy": "curiosity" },
    { "text": "Subject line option 2", "strategy": "urgency" }
  ],
  "description": "Newsletter summary",
  "tags": ["topic1", "topic2"],
  "thumbnailBriefs": []
}

REQUIREMENTS:
- Subject line under 50 chars (high open rate)
- Preview text under 90 chars
- 3-5 sections, scannable format
- Clear CTA at the end
- Conversational but informative tone`;

const PODCAST_SCRIPT_STRUCTURE = `Create a podcast script with this EXACT JSON structure:
{
  "script": {
    "sections": [
      { "type": "intro", "timeCode": "0:00-2:00", "text": "...", "visualNotes": "Speaker notes / tone direction" },
      { "type": "segment_1", "timeCode": "2:00-8:00", "text": "...", "visualNotes": "..." },
      { "type": "segment_2", "timeCode": "8:00-16:00", "text": "...", "visualNotes": "..." },
      { "type": "segment_3", "timeCode": "16:00-22:00", "text": "...", "visualNotes": "..." },
      { "type": "wrap_up", "timeCode": "22:00-25:00", "text": "...", "visualNotes": "..." }
    ]
  },
  "titles": [
    { "text": "Episode title option 1", "strategy": "hook" },
    { "text": "Episode title option 2", "strategy": "descriptive" }
  ],
  "description": "Episode description / show notes (300 words)",
  "tags": ["keyword1", "keyword2", "...10-15 keywords"],
  "segments": [
    { "name": "...", "duration": "6 min", "summary": "..." }
  ],
  "thumbnailBriefs": [
    { "concept": "Podcast cover art", "textOverlay": "4 words max", "colorScheme": "...", "composition": "square 1400x1400" }
  ]
}

REQUIREMENTS:
- 20-30 minute episode format
- Clear segment structure with time codes
- Conversational host voice — not scripted reading
- Include discussion prompts and talking points
- Show notes with timestamps`;

const COMMUNITY_POST_STRUCTURE = `Create a YouTube community post with this EXACT JSON structure:
{
  "post": {
    "text": "Community post text (max 500 chars)"
  },
  "poll": {
    "question": "Poll question (optional, null if not applicable)",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
  },
  "titles": [
    { "text": "Post summary", "strategy": "engagement" }
  ],
  "description": "Brief context",
  "tags": [],
  "thumbnailBriefs": []
}

REQUIREMENTS:
- Max 500 characters for the post text
- Include a poll if the topic lends itself to audience opinion
- Engagement-focused: ask questions, tease upcoming content, or share quick takes
- Casual, direct tone — this is community interaction`;

// ─── Content Type Mapping ───

const CONTENT_TYPE_MAP: Record<string, ContentTypeMapping> = {
  youtube_explainer: {
    engineType: "VIDEO_SCRIPT",
    platform: "YOUTUBE",
    pipelineType: "cinematic",
    jsonStructure: YOUTUBE_EXPLAINER_STRUCTURE,
  },
  youtube_short: {
    engineType: "VIDEO_SHORT",
    platform: "YOUTUBE",
    pipelineType: "viral_micro",
    jsonStructure: YOUTUBE_SHORT_STRUCTURE,
  },
  x_thread: {
    engineType: "TWEET_THREAD",
    platform: "X_THREAD",
    pipelineType: "viral_micro",
    jsonStructure: X_THREAD_STRUCTURE,
  },
  x_single: {
    engineType: "TWEET_SINGLE",
    platform: "X_SINGLE",
    pipelineType: "viral_micro",
    jsonStructure: X_SINGLE_STRUCTURE,
  },
  carousel: {
    engineType: "INSTAGRAM_CAROUSEL",
    platform: "META_CAROUSEL",
    pipelineType: "carousel",
    jsonStructure: CAROUSEL_STRUCTURE,
  },
  instagram_carousel: {
    engineType: "INSTAGRAM_CAROUSEL",
    platform: "META_CAROUSEL",
    pipelineType: "carousel",
    jsonStructure: CAROUSEL_STRUCTURE,
  },
  instagram_reel: {
    engineType: "INSTAGRAM_REEL",
    platform: "META_REEL",
    pipelineType: "viral_micro",
    jsonStructure: INSTAGRAM_REEL_STRUCTURE,
  },
  linkedin_post: {
    engineType: "LINKEDIN_POST",
    platform: "LINKEDIN",
    pipelineType: "standard",
    jsonStructure: LINKEDIN_POST_STRUCTURE,
  },
  linkedin_article: {
    engineType: "LINKEDIN_ARTICLE",
    platform: "LINKEDIN",
    pipelineType: "standard",
    jsonStructure: LINKEDIN_ARTICLE_STRUCTURE,
  },
  blog_post: {
    engineType: "BLOG_ARTICLE",
    platform: "BLOG",
    pipelineType: "standard",
    jsonStructure: BLOG_POST_STRUCTURE,
  },
  newsletter: {
    engineType: "BLOG_ARTICLE",
    platform: "BLOG",
    pipelineType: "standard",
    jsonStructure: NEWSLETTER_STRUCTURE,
  },
  podcast_script: {
    engineType: "PODCAST_SCRIPT",
    platform: "YOUTUBE",
    pipelineType: "cinematic",
    jsonStructure: PODCAST_SCRIPT_STRUCTURE,
  },
  quick_take: {
    engineType: "VIDEO_SHORT",
    platform: "YOUTUBE",
    pipelineType: "cinematic",
    jsonStructure: QUICK_TAKE_STRUCTURE,
  },
  community_post: {
    engineType: "VIDEO_SHORT",
    platform: "YOUTUBE",
    pipelineType: "standard",
    jsonStructure: COMMUNITY_POST_STRUCTURE,
  },
};

// ─── Main Handler ───

export const POST = apiHandler(async (request: NextRequest, { session }) => {
  const body = await request.json();
    const { topic, brandId, contentType, recommendationContext } = body as {
      topic: string;
      brandId: string;
      contentType: string;
      recommendationContext?: RecommendationContext;
    };

    if (!topic || !brandId || !contentType) {
      return NextResponse.json(
        { error: "topic, brandId, and contentType are required" },
        { status: 400 }
      );
    }

    const mapping = CONTENT_TYPE_MAP[contentType];
    if (!mapping) {
      return NextResponse.json(
        { error: `Invalid contentType. Must be one of: ${Object.keys(CONTENT_TYPE_MAP).join(", ")}` },
        { status: 400 }
      );
    }

    // Load brand
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const voiceRules = parseSafe<string[]>(brand.voiceRules, []);
    const rec = recommendationContext;

    // ─── STEP 1: Load skills for this content type ───

    const orchestrator = new SkillOrchestrator();
    const baseSkillPaths = engineRouter.getSkillPaths(mapping.engineType);

    // Load additional platform skills alongside engine-router defaults
    const extraSkillPaths: string[] = [];
    if (contentType === "youtube_short") {
      extraSkillPaths.push("platforms/youtube/shorts-strategy");
      extraSkillPaths.push("platforms/x-twitter/algorithm-awareness");
    }
    if (contentType === "instagram_reel") {
      extraSkillPaths.push("platforms/meta/reel-production");
      extraSkillPaths.push("production/short-form/vertical-video-adaptation");
      extraSkillPaths.push("platforms/x-twitter/algorithm-awareness");
    }
    if (contentType === "x_thread") {
      extraSkillPaths.push("platforms/x-twitter/algorithm-awareness");
      extraSkillPaths.push("platforms/x-twitter/tweet-crafting");
      extraSkillPaths.push("platforms/x-twitter/visual-anchor-selection");
    }
    if (contentType === "x_single") {
      extraSkillPaths.push("platforms/x-twitter/reply-strategy");
      extraSkillPaths.push("platforms/x-twitter/tag-strategy");
    }
    if (contentType === "carousel" || contentType === "instagram_carousel") {
      extraSkillPaths.push("platforms/meta/story-strategy");
    }
    // Merge engine-router paths + inline extras + centralized helper (CORE + PLATFORM + VOICE skills)
    const helperPaths = getSkillPathsForContentType(contentType);
    const skillPaths = [...new Set([...baseSkillPaths, ...extraSkillPaths, ...helperPaths])];

    const loadedSkills = await Promise.all(
      skillPaths.map((p) => orchestrator.loadSkill(p).catch(() => null))
    );
    const skills = loadedSkills.filter((s): s is SkillFile => s !== null);

    // Load brand identity skill
    const brandSlug = brand.slug;
    const brandIdentity = await orchestrator
      .loadSkill(`brand/identity/${brandSlug}/identity.md`)
      .catch(() => null);
    const brandVoiceExamples = await orchestrator
      .loadSkill(`brand/identity/${brandSlug}/voice-examples.md`)
      .catch(() => null);
    const brandPlatformSkill = await orchestrator
      .loadSkill(`brand/identity/${brandSlug}/platforms.md`)
      .catch(() => null);

    // ─── STEP 2: Build brand voice block ───

    const brandVoice = getBrandVoiceBlock(
      brand.name,
      voiceRules,
      brand.tone ?? "neutral",
      brand.language ?? "English"
    );

    const brandColorPalette = await getBrandColorPalette(brand.name);

    // ─── STEP 3: Build skill context ───

    // Separate research skills from editorial/platform skills
    const researchSkill = skills.find((s) => s.path.includes("fact-dossier-building"));
    const factCheckSkill = skills.find((s) => s.path.includes("fact-check-shield"));
    const editorialSkills = skills.filter(
      (s) =>
        !s.path.includes("fact-dossier-building") &&
        !s.path.includes("fact-check-shield")
    );

    const editorialSkillContext = editorialSkills
      .map((s) => `## ${s.meta.name}\n${s.instructions}`)
      .join("\n\n");

    // ─── STEP 4: Guided research via Gemini ───

    const researchSystemPrompt = `You are a senior research analyst preparing a comprehensive fact dossier for content creation.
${researchSkill?.instructions ? `\n## RESEARCH METHODOLOGY\n${researchSkill.instructions}` : ""}
${factCheckSkill?.instructions ? `\n## FACT-CHECK PROTOCOL\n${factCheckSkill.instructions}` : ""}

Be thorough, factual, and cite sources where possible. For each claim, note the source. For each stakeholder, note their position and recent statements. For data points, find the most recent authoritative numbers.`;

    const researchUserPrompt = `Research this topic thoroughly for a ${contentType.replace(/_/g, " ")} piece by ${brand.name}.

TOPIC: ${topic}
${rec?.angle ? `EDITORIAL ANGLE: ${rec.angle}` : ""}
${rec?.keyDataPoints?.length ? `KEY DATA POINTS TO VERIFY: ${rec.keyDataPoints.join(", ")}` : ""}
${rec?.stakeholders?.length ? `KEY STAKEHOLDERS: ${rec.stakeholders.join(", ")}` : ""}
${rec?.sensitivityLevel ? `SENSITIVITY LEVEL: ${rec.sensitivityLevel}` : ""}
${rec?.reasoning ? `EDITORIAL REASONING: ${rec.reasoning}` : ""}

Provide a comprehensive research dossier including:
- Key facts and verified data points (with sources)
- Timeline of events (with dates)
- Key stakeholders and their positions
- Statistics and numbers (with attribution)
- Different perspectives and viewpoints
- Geopolitical implications (especially for India)
- Context and background needed for the audience
- Potential counterarguments and their evidence

Return a well-structured report.`;

    const [researchResult, seoAnalysis] = await Promise.all([
      routeToModel("research", researchSystemPrompt, researchUserPrompt),
      runSEOAnalysis(topic, brand.name, brand.language ?? "English").catch((e) => {
        console.error("[quick-generate] SEO analysis failed:", e?.message || e);
        return null as SEOAnalysis | null;
      }),
    ]);
    const research = researchResult.raw;

    if (!research || research.trim().length < 100) {
      return NextResponse.json(
        { error: "Research phase failed — insufficient data returned" },
        { status: 500 }
      );
    }

    // ─── STEP 5: Generate content via Claude (creative writing) ───

    const contentSystemPrompt = `You are a world-class content creator for ${brand.name}. Return ONLY valid JSON.

## YOUR BRAND VOICE
${brandVoice}
${brandIdentity?.instructions ? `\n## BRAND IDENTITY\n${brandIdentity.instructions}` : ""}
${brandVoiceExamples?.instructions ? `\n## VOICE EXAMPLES\n${brandVoiceExamples.instructions}` : ""}
${brandPlatformSkill?.instructions ? `\n## PLATFORM STRATEGY\n${brandPlatformSkill.instructions}` : ""}

## YOUR EDITORIAL SKILLS
${editorialSkillContext}

## CONTENT TYPE: ${contentType.replace(/_/g, " ")}
## PLATFORM: ${engineRouter.getPlatform(mapping.engineType)}
${brandColorPalette ? `## COLOR PALETTE: ${brandColorPalette.description}` : ""}
${seoAnalysis ? `\n${buildSEOPromptBlock(seoAnalysis, mapping.platform)}` : ""}

Apply every skill instruction above to produce exceptional content. Don't just write — think editorially.
Use the hook engineering principles. Use the title engineering formulas. Use the narrative arc structure.
Every choice should be deliberate and backed by the skill frameworks above.

## BANNED PHRASES — Do NOT use any of these:
"In this video", "Today we discuss", "Today we're going to", "Let's dive in", "Without further ado", "Stay tuned", "Don't forget to like and subscribe", "Hey guys", "What's up guys", "Welcome back to", "Before we begin", "Let me explain", "So basically", "As you all know".
${seoAnalysis ? "Apply the SEO intelligence above: use primary keyword in titles, include platform-specific hashtags/keywords, structure descriptions for search discovery." : ""}
${contentType === "youtube_short" ? `
## SHORT-FORM OPTIMIZATION (YouTube Shorts)
- HOOK in first 1.5 seconds (text overlay + spoken) — this is non-negotiable
- Vertical 9:16 (1080x1920) — design every visual for phone screens
- No intro/outro — jump straight into value
- One key insight only — don't try to cover everything
- End with subscribe CTA overlay
- 3 title options optimized for YouTube Shorts algorithm
- Suggest trending sound/music mood
- Max 5 hashtags` : ""}
${contentType === "instagram_reel" ? `
## SHORT-FORM OPTIMIZATION (Instagram Reels)
- HOOK in first 2 seconds — pattern interrupt required
- Vertical 9:16 (1080x1920) — phone-first design
- Text overlays at key moments with specific timing
- Suggest trending audio mood
- Caption: 2200 char max with strategic line breaks
- 20-30 relevant hashtags (mix of broad + niche)
- CTA: save or share (not follow)
- Include cover frame description for grid aesthetic` : ""}`;

    const contentUserPrompt = `Create a ${contentType.replace(/_/g, " ")} for ${brand.name} on ${engineRouter.getPlatform(mapping.engineType)}.

TOPIC: ${topic}
${rec?.angle ? `ANGLE: ${rec.angle}` : "ANGLE: Use your best editorial judgment"}
${rec?.suggestedTitle ? `SUGGESTED TITLE: ${rec.suggestedTitle}` : ""}
${rec?.priority ? `PRIORITY: ${rec.priority}` : ""}
${rec?.urgency ? `URGENCY: ${rec.urgency}` : ""}

RESEARCH DOSSIER:
${research}

${mapping.jsonStructure}

Return ONLY the JSON, no other text.`;

    const contentResult = await routeToModel(
      "drafting",
      contentSystemPrompt,
      contentUserPrompt,
      { temperature: 0.7, maxTokens: 8192 }
    );

    const parsed = contentResult.parsed as Record<string, unknown> | null;

    if (!parsed) {
      return NextResponse.json(
        {
          error: "Content generation failed — could not parse AI response",
          raw: contentResult.raw?.slice(0, 500),
        },
        { status: 500 }
      );
    }

    // ─── STEP 6: Save deliverable + assets ───

    const deliverable = await prisma.deliverable.create({
      data: {
        brandId,
        platform: mapping.platform,
        pipelineType: mapping.pipelineType,
        status: "REVIEW",
        copyMarkdown: buildCopyMarkdown(parsed, contentType),
        scriptData:
          contentType === "youtube_explainer" ||
          contentType === "quick_take" ||
          contentType === "x_thread" ||
          contentType === "x_single"
            ? (parsed as Record<string, unknown> as any)
            : undefined,
        carouselData: (contentType === "carousel" || contentType === "instagram_carousel") ? (parsed as Record<string, unknown> as any) : undefined,
        postingPlan: parsed.tags
          ? ({
              tags: parsed.tags,
              description: parsed.description,
              ...(seoAnalysis ? { seo: {
                primaryKeyword: seoAnalysis.primaryKeyword,
                secondaryKeywords: seoAnalysis.secondaryKeywords,
                searchVolumeTrend: seoAnalysis.searchVolumeTrend,
                competitionLevel: seoAnalysis.competitionLevel,
                seoTitle: seoAnalysis.seoTitle,
                metaDescription: seoAnalysis.metaDescription,
                suggestedSlug: seoAnalysis.suggestedSlug,
              }} : {}),
            } as any)
          : seoAnalysis
            ? ({ seo: {
                primaryKeyword: seoAnalysis.primaryKeyword,
                secondaryKeywords: seoAnalysis.secondaryKeywords,
                searchVolumeTrend: seoAnalysis.searchVolumeTrend,
                competitionLevel: seoAnalysis.competitionLevel,
                seoTitle: seoAnalysis.seoTitle,
                metaDescription: seoAnalysis.metaDescription,
                suggestedSlug: seoAnalysis.suggestedSlug,
              }} as any)
            : undefined,
        researchPrompt: topic,
        factDossierId: null,
      },
    });

    // Plan what assets are needed (NO generation yet — user generates on demand)
    const plannedAssets = planAssets(contentType, mapping.platform, parsed, topic, brand.name);
    if (plannedAssets.length > 0) {
      await prisma.asset.createMany({
        data: plannedAssets.map((planned) => ({
          deliverableId: deliverable.id,
          type: planned.type as any,
          url: "",  // No image yet — user generates on demand
          promptUsed: planned.prompt,
          slideIndex: planned.slideIndex ?? null,
          metadata: {
            label: planned.label,
            description: planned.description,
            dimensions: planned.dimensions,
            required: planned.required,
            platformNote: planned.platformNote,
            status: "planned",
          },
        })),
      });
    }

    // Save research as NarrativeTree + FactDossier
    const tree = await prisma.narrativeTree.create({
      data: {
        title: topic,
        summary: research.slice(0, 500),
        status: "IN_PRODUCTION",
        urgency: rec?.urgency === "breaking" ? "high" : "normal",
        createdById: session.user.id,
        signalData: {
          topic,
          generatedAt: new Date().toISOString(),
          angle: rec?.angle ?? null,
          skillsUsed: skills.map((s) => s.meta.name),
          modelUsed: contentResult.model,
        } as any,
      },
    });

    await prisma.factDossier.create({
      data: {
        treeId: tree.id,
        structuredData: parsed as any,
        sources: extractSources(research),
        visualAssets: [],
        rawResearch: research,
      },
    });

    // Link deliverable to tree
    await prisma.deliverable.update({
      where: { id: deliverable.id },
      data: { treeId: tree.id },
    });

    // ─── STEP 7: Fire voiceover generation in background ───

    fireVoiceover(parsed, contentType, deliverable.id, brand.language ?? "English").catch(
      (err) => console.error("[quick-generate] Voiceover error:", err)
    );

    // ─── STEP 8: Log skill executions ───

    logSkillExecutions(
      skills,
      brandIdentity,
      brandVoiceExamples,
      brandPlatformSkill,
      { topic, contentType, brandId },
      deliverable.id,
      session.user.id,
      contentResult.model
    ).catch((err) =>
      console.error("[quick-generate] Skill logging error:", err)
    );

    return NextResponse.json({
      deliverableId: deliverable.id,
      treeId: tree.id,
      contentType,
      platform: mapping.platform,
      status: "REVIEW",
      skillsLoaded: skills.map((s) => s.meta.name),
      modelUsed: contentResult.model,
      brandVoiceApplied: brand.name,
      seo: seoAnalysis ?? undefined,
    });
});

// ─── Voiceover Generation ───

async function fireVoiceover(
  parsed: Record<string, unknown>,
  contentType: string,
  deliverableId: string,
  language: string
) {
  // Only generate voiceover for short-form video content
  const voiceoverTypes = ["youtube_short", "instagram_reel", "quick_take"];
  if (!voiceoverTypes.includes(contentType)) return;

  try {
    const { generateVoiceover } = await import("@/lib/yantri/elevenlabs");

    // Extract script text based on content type structure
    let scriptText = "";

    if (contentType === "quick_take") {
      // quick_take uses sections-based script
      const script = parsed.script as {
        sections?: Array<{ type: string; text: string }>;
      };
      scriptText = (script?.sections ?? []).map((s) => s.text).join(" ");
    } else {
      // youtube_short and instagram_reel use hook/segments/cta structure
      const script = parsed.script as {
        hook?: { text: string };
        segments?: Array<{ text: string }>;
        cta?: { text: string };
      };
      const parts: string[] = [];
      if (script?.hook?.text) parts.push(script.hook.text);
      for (const seg of script?.segments ?? []) {
        if (seg.text) parts.push(seg.text);
      }
      if (script?.cta?.text) parts.push(script.cta.text);
      scriptText = parts.join(" ");
    }

    if (scriptText.length < 10) {
      console.log("[quick-generate] Script too short for voiceover, skipping");
      return;
    }

    const result = await generateVoiceover(scriptText, {
      stability: 0.6,
      similarityBoost: 0.8,
    });

    // Store audio as base64 data URI (consistent with image storage)
    const audioBase64 = result.audio.toString("base64");
    const audioDataUri = `data:audio/mpeg;base64,${audioBase64}`;

    await prisma.asset.create({
      data: {
        deliverableId,
        type: "AUDIO",
        url: audioDataUri,
        promptUsed: "AI Voiceover",
        metadata: {
          voiceId: result.voiceId,
          modelId: result.modelId,
          language,
          contentType,
          scriptLength: scriptText.length,
          estimatedDurationSec: Math.round(scriptText.length / 15),
          audioSizeBytes: result.audio.length,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    console.log(
      `[quick-generate] Voiceover generated: ${result.audio.length} bytes, ~${Math.round(scriptText.length / 15)}s`
    );
  } catch (err) {
    console.error(
      `[quick-generate] Voiceover failed for ${contentType}:`,
      err instanceof Error ? err.message : err
    );
    // Non-blocking — content is still useful without voiceover
  }
}

// ─── Skill Execution Logging ───

async function logSkillExecutions(
  skills: SkillFile[],
  brandIdentity: SkillFile | null,
  brandVoiceExamples: SkillFile | null,
  brandPlatformSkill: SkillFile | null,
  context: { topic: string; contentType: string; brandId: string },
  deliverableId: string,
  userId: string,
  modelUsed: string
) {
  const allSkills = [
    ...skills,
    brandIdentity,
    brandVoiceExamples,
    brandPlatformSkill,
  ].filter((s): s is SkillFile => s !== null);

  for (const skill of allSkills) {
    try {
      const dbSkill = await prisma.skill.upsert({
        where: { path: skill.path },
        create: {
          path: skill.path,
          domain: skill.domain,
          module: skill.meta.module,
          name: skill.meta.name,
        },
        update: {},
      });

      await prisma.skillExecution.create({
        data: {
          skillId: dbSkill.id,
          deliverableId,
          brandId: context.brandId,
          platform: CONTENT_TYPE_MAP[context.contentType]?.platform,
          inputContext: context as object,
          outputSummary: { usage: "prompt_context", contentType: context.contentType },
          modelUsed,
          status: "completed",
          executedById: userId,
        },
      });
    } catch {
      // Don't let logging failure break the response
    }
  }
}

// ─── Helpers ───

function parseSafe<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (Array.isArray(value)) return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function buildCopyMarkdown(
  parsed: Record<string, unknown>,
  contentType: string
): string {
  const titles = (parsed.titles as Array<{ text: string }>) ?? [];
  const title = titles[0]?.text ?? "Untitled";
  const description = (parsed.description as string) ?? "";

  // Script-based types (youtube_explainer, quick_take, podcast_script)
  if (contentType === "youtube_explainer" || contentType === "quick_take" || contentType === "podcast_script") {
    const script = parsed.script as {
      sections?: Array<{ type: string; text: string }>;
    };
    const sections = script?.sections ?? [];
    const fullText = sections
      .map((s) => `**[${s.type.toUpperCase()}]**\n${s.text}`)
      .join("\n\n");
    return `# ${title}\n\n${fullText}\n\n---\n\n${description}`;
  }

  // Short-form video types (youtube_short, instagram_reel)
  if (contentType === "youtube_short" || contentType === "instagram_reel") {
    const script = parsed.script as {
      hook?: { text: string };
      segments?: Array<{ text: string; textOverlay?: string }>;
      cta?: { text: string };
    };
    const parts: string[] = [];
    if (script?.hook) parts.push(`**[HOOK]**\n${script.hook.text}`);
    for (const seg of script?.segments ?? []) {
      parts.push(`${seg.text}${seg.textOverlay ? `\n_Overlay: ${seg.textOverlay}_` : ""}`);
    }
    if (script?.cta) parts.push(`**[CTA]**\n${script.cta.text}`);
    return `# ${title}\n\n${parts.join("\n\n")}\n\n---\n\n${description}`;
  }

  // Thread
  if (contentType === "x_thread") {
    const tweets = (parsed.tweets as Array<{
      position: number;
      text: string;
    }>) ?? [];
    const threadText = tweets
      .map((t) => `**Tweet ${t.position}:**\n${t.text}`)
      .join("\n\n");
    return `# ${title}\n\n${threadText}`;
  }

  // Single tweet
  if (contentType === "x_single") {
    const tweets = (parsed.tweets as Array<{ text: string }>) ?? [];
    const variants = (parsed.variants as Array<{ text: string; strategy: string }>) ?? [];
    const mainTweet = tweets[0]?.text ?? "";
    const variantText = variants.map((v) => `- **${v.strategy}:** ${v.text}`).join("\n");
    return `# ${title}\n\n${mainTweet}\n\n**Variants:**\n${variantText}`;
  }

  // Carousel
  if (contentType === "carousel" || contentType === "instagram_carousel") {
    const slides = (parsed.slides as Array<{
      position: number;
      type?: string;
      headline: string;
      body?: string;
      bodyText?: string;
    }>) ?? [];
    const slideText = slides
      .map((s) => `**Slide ${s.position}${s.type ? ` [${s.type}]` : ""}: ${s.headline}**\n${s.body ?? s.bodyText ?? ""}`)
      .join("\n\n");
    const caption = (parsed.caption as string) ?? "";
    const crossPost = parsed.crossPost as { facebook?: boolean; adaptations?: string } | undefined;
    const crossPostText = crossPost?.facebook ? `\n\n**Facebook Cross-Post:** ${crossPost.adaptations ?? "Adapt caption for Facebook"}` : "";
    return `# ${title}\n\n${slideText}\n\n---\n\n**Caption:** ${caption}${crossPostText}`;
  }

  // LinkedIn post
  if (contentType === "linkedin_post") {
    const post = parsed.post as { text?: string };
    return `# ${title}\n\n${post?.text ?? description}`;
  }

  // Article-based types (linkedin_article, blog_post)
  if (contentType === "linkedin_article" || contentType === "blog_post") {
    const article = parsed.article as {
      headline?: string;
      sections?: Array<{ heading: string; text: string }>;
    };
    const sections = article?.sections ?? [];
    const fullText = sections
      .map((s) => `## ${s.heading}\n\n${s.text}`)
      .join("\n\n");
    return `# ${article?.headline ?? title}\n\n${fullText}`;
  }

  // Newsletter
  if (contentType === "newsletter") {
    const newsletter = parsed.newsletter as {
      subject?: string;
      sections?: Array<{ heading: string; text: string }>;
      cta?: { text: string };
    };
    const sections = newsletter?.sections ?? [];
    const fullText = sections
      .map((s) => `## ${s.heading}\n\n${s.text}`)
      .join("\n\n");
    const cta = newsletter?.cta ? `\n\n**CTA:** ${newsletter.cta.text}` : "";
    return `# ${newsletter?.subject ?? title}\n\n${fullText}${cta}`;
  }

  // Community post
  if (contentType === "community_post") {
    const post = parsed.post as { text?: string };
    const poll = parsed.poll as { question?: string; options?: string[] };
    let text = `# ${title}\n\n${post?.text ?? description}`;
    if (poll?.question) {
      text += `\n\n**Poll:** ${poll.question}\n${(poll.options ?? []).map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
    }
    return text;
  }

  return `# ${title}\n\n${description}`;
}

function extractSources(research: string): string[] {
  const urlRegex = /https?:\/\/[^\s)>\]]+/g;
  const matches = research.match(urlRegex) ?? [];
  return [...new Set(matches)].slice(0, 20);
}
