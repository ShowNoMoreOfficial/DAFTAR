import { NextResponse } from "next/server";
import { getAuthSession, badRequest, unauthorized, handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { callClaude } from "@/lib/yantri/anthropic";
import { callGeminiResearch } from "@/lib/yantri/gemini";
import { SkillOrchestrator, type SkillFile } from "@/lib/skill-orchestrator";
import { runSEOAnalysis, type SEOAnalysis } from "@/lib/yantri/seo-engine";

// ─── Types ────────────────────────────────────────────────

interface ContentRecommendation {
  rank: number;
  brand: { id: string; name: string };
  platform: string;
  contentType: string;
  angle: string;
  reasoning: string;
  priority: "critical" | "high" | "medium" | "low";
  urgency: "immediate" | "within_24h" | "within_48h" | "evergreen";
  estimatedLength: string;
  suggestedTitle: string;
  assetsRequired: {
    images?: string[];
    video?: string[];
    graphics?: string[];
    other?: string[];
  };
  keyDataPoints: string[];
  stakeholders: string[];
  sensitivityLevel: "green" | "yellow" | "orange" | "red";
  timeliness: string;
}

interface TopicAssessment {
  passesEditorialGate: boolean;
  relevanceScore: number;
  differentiationScore: number;
  urgencyLevel: string;
  crossBrandPotential: boolean;
}

interface RecommendResponse {
  recommendations: ContentRecommendation[];
  topicAssessment: TopicAssessment;
  researchSummary: string;
  seo?: SEOAnalysis;
}

// ─── Helpers ──────────────────────────────────────────────

async function loadSkillSafe(
  orchestrator: SkillOrchestrator,
  skillPath: string
): Promise<SkillFile | null> {
  try {
    return await orchestrator.loadSkill(skillPath);
  } catch {
    return null;
  }
}

function parseBrandJsonField(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parsePlatforms(
  value: string | null
): Array<{ name: string; role?: string }> {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Truncate skill instructions to keep prompt lean */
function trimSkill(skill: SkillFile | null, maxChars = 600): string {
  if (!skill?.instructions) return "";
  const text = skill.instructions;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n[truncated]";
}

// Allow up to 60s on Vercel (Gemini research + Claude generation)
export const maxDuration = 60;

// ─── POST /api/yantri/recommend ───────────────────────────

export async function POST(request: Request) {
  try {
    // ── Step 0: Auth ──
    const session = await getAuthSession();
    if (!session) return unauthorized();
    console.log("[recommend] Step 0 PASS: user =", session.user.id, "role =", session.user.role);

    // ── Step 1: Parse input ──
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid request body");
    }
    const topic = body?.topic;
    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return badRequest("topic is required (min 3 chars)");
    }
    const trimmedTopic = topic.trim();
    console.log("[recommend] Step 1 PASS: topic =", trimmedTopic.slice(0, 80));

    const signalMetadata = body?.signalMetadata as {
      signalId?: string;
      content?: string;
      source?: string;
      sourceCredibility?: number;
      eventType?: string;
      stakeholders?: unknown;
      sentiment?: string;
      trendName?: string;
      trendLifecycle?: string;
      trendVelocity?: number;
    } | undefined;

    const userId = session.user.id;
    const userRole = session.user.role;
    const accessibleBrandIds: string[] = session.user.accessibleBrandIds ?? [];

    // ── Step 2+3: Research + Skills + DB queries IN PARALLEL ──
    // This is the key optimization: run Gemini, skill loading, and DB queries concurrently
    const orchestrator = new SkillOrchestrator();

    const brandWhere = userRole === "ADMIN" ? {} : { id: { in: accessibleBrandIds } };

    const [
      researchResult,
      skillResults,
      brands,
      performanceData,
      performanceAggregates,
      skillLearningLogs,
      recentSignals,
      activeTrends,
      seoAnalysis,
    ] = await Promise.all([
      // Gemini research (with timeout race)
      Promise.race([
        callGeminiResearch(
          "You are a thorough research analyst. Provide factual, well-sourced research.",
          `Research this topic thoroughly: "${trimmedTopic}"
Provide: key facts, timeline, stakeholders, statistics, different perspectives, India implications.
Be concise but comprehensive. Max 2000 words.`
        ).catch((e) => {
          console.error("[recommend] Gemini research failed:", e?.message || e);
          return `Topic: ${trimmedTopic} (research unavailable)`;
        }),
        new Promise<string>((resolve) =>
          setTimeout(() => resolve(`Topic: ${trimmedTopic} (research timed out)`), 20000)
        ),
      ]),
      // Load only 4 core skills (not 11)
      Promise.all([
        loadSkillSafe(orchestrator, "narrative/editorial/topic-selection.md"),
        loadSkillSafe(orchestrator, "narrative/editorial/angle-detection.md"),
        loadSkillSafe(orchestrator, "narrative/editorial/sensitivity-classification.md"),
        loadSkillSafe(orchestrator, "narrative/editorial/timeliness-optimizer.md"),
      ]).catch(() => [null, null, null, null] as (SkillFile | null)[]),
      // Brands
      prisma.brand.findMany({
        where: brandWhere,
        include: { platforms: true },
      }).catch((e) => {
        console.error("[recommend] Brand query failed:", e?.message);
        return [] as Awaited<ReturnType<typeof prisma.brand.findMany>>;
      }),
      // Performance (light query)
      prisma.contentPerformance.findMany({
        where: {},
        orderBy: { lastUpdated: "desc" },
        take: 10,
      }).catch(() => [] as Awaited<ReturnType<typeof prisma.contentPerformance.findMany>>),
      // Performance aggregates by platform (avg score per platform+contentType)
      prisma.$queryRaw<Array<{ platform: string; avg_score: number; count: number }>>`
        SELECT platform,
               AVG(CASE
                 WHEN "performanceTier" = 'top' THEN 9
                 WHEN "performanceTier" = 'above_avg' THEN 7
                 WHEN "performanceTier" = 'average' THEN 5
                 WHEN "performanceTier" = 'below_avg' THEN 3
                 ELSE 1
               END) as avg_score,
               COUNT(*)::int as count
        FROM content_performances
        WHERE "performanceTier" IS NOT NULL
        GROUP BY platform
        ORDER BY avg_score DESC
      `.catch(() => [] as Array<{ platform: string; avg_score: number; count: number }>),
      // Learning logs
      prisma.skillLearningLog.findMany({
        where: { source: "auto", periodEnd: { gte: new Date(Date.now() - 30 * 86400000) } },
        orderBy: { periodEnd: "desc" },
        take: 10,
      }).catch(() => [] as Awaited<ReturnType<typeof prisma.skillLearningLog.findMany>>),
      // Signals
      prisma.signal.findMany({
        orderBy: { detectedAt: "desc" },
        take: 5,
      }).catch(() => [] as Awaited<ReturnType<typeof prisma.signal.findMany>>),
      // Trends
      prisma.trend.findMany({
        where: { lifecycle: "emerging" },
        take: 5,
      }).catch(() => [] as Awaited<ReturnType<typeof prisma.trend.findMany>>),
      // SEO keyword analysis
      runSEOAnalysis(trimmedTopic).catch((e) => {
        console.error("[recommend] SEO analysis failed:", e?.message || e);
        return null as SEOAnalysis | null;
      }),
    ]);

    const researchSummary = researchResult;
    const [topicSelectionSkill, angleDetectionSkill, sensitivitySkill, timelinessSkill] = skillResults;

    console.log("[recommend] Step 2+3 PASS: research =", researchSummary?.length,
      "skills =", skillResults.filter(Boolean).length,
      "brands =", brands.length,
      "perf =", performanceData.length,
      "perfAgg =", performanceAggregates.length,
      "learningLogs =", skillLearningLogs.length,
      "seo =", seoAnalysis ? "yes" : "no");

    if (brands.length === 0) {
      console.log("[recommend] No brands for role", userRole, "ids", accessibleBrandIds);
      return NextResponse.json({ error: "No brands accessible" }, { status: 403 });
    }

    const brandIds = brands.map((b) => b.id);

    // Load brand identity + past deliverables in parallel
    const [brandIdentitySkills, pastDeliverables] = await Promise.all([
      Promise.all(
        brands.map(async (b) => ({
          brandId: b.id,
          skill: await loadSkillSafe(orchestrator, `brand/identity/${b.slug}/identity.md`),
        }))
      ),
      prisma.deliverable.findMany({
        where: { brandId: { in: brandIds } },
        select: { platform: true, pipelineType: true, status: true, copyMarkdown: true, tree: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }).catch(() => []),
    ]);

    const brandIdentityMap = new Map(brandIdentitySkills.map((b) => [b.brandId, b.skill]));

    // ── Step 7: Build LEAN prompt ──
    // Trim skills to 600 chars each instead of full content
    const skillSection = (label: string, skill: SkillFile | null) => {
      const trimmed = trimSkill(skill, 600);
      return trimmed ? `## ${label}\n${trimmed}\n` : "";
    };

    const systemPrompt = `You are Daftar's editorial intelligence engine for a media agency.

${skillSection("TOPIC SELECTION", topicSelectionSkill)}
${skillSection("ANGLE DETECTION", angleDetectionSkill)}
${skillSection("SENSITIVITY", sensitivitySkill)}
${skillSection("TIMELINESS", timelinessSkill)}

## CONTENT TYPES
youtube_explainer, youtube_short, x_thread, x_single, instagram_carousel, instagram_reel, linkedin_post, linkedin_article, blog_post, newsletter, podcast_script, quick_take, community_post

## BRANDS
${brands.map((b) => {
  const covers = parseBrandJsonField(b.editorialCovers);
  const never = parseBrandJsonField(b.editorialNever);
  const platforms = parsePlatforms(b.activePlatforms);
  const voiceRules = Array.isArray(b.voiceRules)
    ? (b.voiceRules as string[]).join("; ")
    : typeof b.voiceRules === "string" ? b.voiceRules : "";
  const identity = trimSkill(brandIdentityMap.get(b.id) ?? null, 400);
  return `### ${b.name} (id: ${b.id})
- Voice: ${b.tone || "N/A"} / ${b.language || "N/A"}
- Rules: ${voiceRules || "N/A"}
- Covers: ${covers.join(", ") || "N/A"}
- Never: ${never.join(", ") || "N/A"}
- Platforms: ${platforms.map((p) => `${p.name} (${p.role || "general"})`).join(", ") || "N/A"}
${identity ? `- Identity: ${identity}` : ""}`;
}).join("\n")}

## RECENT PERFORMANCE
${performanceData.length > 0
  ? performanceData.slice(0, 5).map((p) => {
      const m = (p.metrics ?? {}) as Record<string, unknown>;
      return `- ${p.platform} | tier: ${p.performanceTier || "?"} | score: ${typeof m.engagementRate === "number" ? m.engagementRate.toFixed(1) + "%" : "?"} eng | angle: ${p.narrativeAngle || "?"} | hook: ${p.hookType || "?"}`;
    }).join("\n")
  : "No performance data yet."}

## PLATFORM PERFORMANCE TRENDS
${performanceAggregates.length > 0
  ? performanceAggregates.map((a) =>
      `- ${a.platform}: avg score ${Number(a.avg_score).toFixed(1)}/10 across ${a.count} pieces. ${Number(a.avg_score) >= 7 ? "STRONG — prioritize this platform." : Number(a.avg_score) >= 5 ? "Average — room for improvement." : "WEAK — reconsider approach."}`
    ).join("\n")
  : "No aggregate performance data yet — recommendations are based on editorial judgment."}
${skillLearningLogs.length > 0
  ? "\n## SKILL LEARNINGS (recent)\n" + skillLearningLogs.slice(0, 5).map((l) => {
      const e = (l.entry ?? {}) as Record<string, unknown>;
      return `- [${l.source}] ${e.type || "feedback"}: ${e.diagnosis || e.pattern || e.recommendation || "see log"}`;
    }).join("\n")
  : ""}

## RECENT CONTENT (avoid duplication)
${pastDeliverables.length > 0
  ? pastDeliverables.slice(0, 5).map((d) =>
      `- ${d.tree?.title || d.copyMarkdown?.slice(0, 50) || "Untitled"} (${d.platform}, ${d.status})`
    ).join("\n")
  : "No prior deliverables."}

## TRENDING
${recentSignals.length > 0
  ? recentSignals.slice(0, 3).map((s) =>
      `- ${s.title} (${s.eventType || "signal"}, ${s.sentiment || "neutral"})`
    ).join("\n")
  : "No recent signals."}
${activeTrends.length > 0
  ? activeTrends.slice(0, 3).map((t) =>
      `- ${t.name} (${t.lifecycle}, velocity: ${t.velocityScore ?? "?"})`
    ).join("\n")
  : ""}

${seoAnalysis ? `## SEO INTELLIGENCE
Primary Keyword: ${seoAnalysis.primaryKeyword}
Secondary Keywords: ${seoAnalysis.secondaryKeywords.slice(0, 5).join(", ")}
Long-tail Keywords: ${seoAnalysis.longTailKeywords.slice(0, 3).join(", ")}
Search Trend: ${seoAnalysis.searchVolumeTrend} | Competition: ${seoAnalysis.competitionLevel}
YouTube Keywords: ${seoAnalysis.youtubeKeywords.slice(0, 6).join(", ")}
Twitter Hashtags: ${seoAnalysis.twitterHashtags.slice(0, 5).map((h) => `#${h}`).join(" ")}
Instagram Hashtags: ${seoAnalysis.instagramHashtags.slice(0, 8).map((h) => `#${h}`).join(" ")}

USE THIS SEO DATA: Include primary keyword in suggested titles. Use platform-specific hashtags/keywords in recommendations. Factor search trend and competition into priority ranking.` : ""}`;

    const signalContext = signalMetadata
      ? `\nSIGNAL: ${signalMetadata.source || "?"} (credibility: ${signalMetadata.sourceCredibility ?? "?"}, type: ${signalMetadata.eventType || "?"}, sentiment: ${signalMetadata.sentiment || "?"})\nContext: ${signalMetadata.content?.slice(0, 500) || "N/A"}\n`
      : "";

    const userPrompt = `Topic: "${trimmedTopic}"
${signalContext}
Research:
${researchSummary.slice(0, 4000)}

Return JSON with 3-5 ranked content recommendations:
{
  "recommendations": [{
    "rank": 1,
    "brand": { "id": "actual-brand-id", "name": "Brand Name" },
    "platform": "YOUTUBE|X_THREAD|INSTAGRAM|LINKEDIN",
    "contentType": "youtube_explainer|x_thread|...",
    "angle": "specific editorial angle",
    "reasoning": "why this angle, platform, timing",
    "priority": "critical|high|medium|low",
    "urgency": "immediate|within_24h|within_48h|evergreen",
    "estimatedLength": "duration/length",
    "suggestedTitle": "working title",
    "assetsRequired": { "images": [], "video": [], "graphics": [], "other": [] },
    "keyDataPoints": [],
    "stakeholders": [],
    "sensitivityLevel": "green|yellow|orange|red",
    "timeliness": "publish window"
  }],
  "topicAssessment": {
    "passesEditorialGate": true,
    "relevanceScore": 9,
    "differentiationScore": 8,
    "urgencyLevel": "high",
    "crossBrandPotential": true
  }
}

Use ACTUAL brand IDs. Each brand gets a DIFFERENT angle. Return ONLY valid JSON.`;

    console.log("[recommend] Step 7 PASS: system =", systemPrompt.length, "user =", userPrompt.length);

    // ── Step 8: Call Claude ──
    let result: { parsed: unknown; raw: string };
    try {
      result = await callClaude(systemPrompt, userPrompt, {
        maxTokens: 4096,
        temperature: 0.4,
      });
      console.log("[recommend] Step 8 PASS: raw =", result.raw?.length);
    } catch (claudeErr) {
      const msg = claudeErr instanceof Error ? claudeErr.message : String(claudeErr);
      console.error("[recommend] Step 8 FAIL:", msg);
      return NextResponse.json(
        { error: "Content recommendation engine is temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    // ── Step 9: Parse response ──
    const parsed = result.parsed as RecommendResponse | null;

    if (!parsed?.recommendations) {
      console.error("[recommend] Step 9 FAIL: parse. Raw:", result.raw?.slice(0, 300));
      return NextResponse.json(
        { error: "Failed to parse recommendations. Please try again." },
        { status: 502 }
      );
    }
    console.log("[recommend] Step 9 PASS:", parsed.recommendations.length, "recs");

    // ── Step 9b: Cross-platform short-form variants ──
    const crossPlatformVariants: ContentRecommendation[] = [];
    for (const rec of parsed.recommendations) {
      if (rec.contentType === "youtube_short") {
        crossPlatformVariants.push({
          ...rec,
          rank: rec.rank + 0.5,
          platform: "INSTAGRAM",
          contentType: "instagram_reel",
          reasoning: `Cross-platform adaptation of the YouTube Short. Instagram Reels algorithm favors similar vertical content but needs platform-specific hashtags and caption style.`,
          priority: "medium",
        });
      }
      if (rec.contentType === "instagram_reel") {
        crossPlatformVariants.push({
          ...rec,
          rank: rec.rank + 0.5,
          platform: "YOUTUBE",
          contentType: "youtube_short",
          reasoning: `Cross-platform adaptation of the Instagram Reel. YouTube Shorts algorithm rewards high retention and fast hooks — adapt the first 1.5 seconds.`,
          priority: "medium",
        });
      }
    }
    if (crossPlatformVariants.length > 0) {
      parsed.recommendations.push(...crossPlatformVariants);
      // Re-sort by rank
      parsed.recommendations.sort((a, b) => a.rank - b.rank);
      console.log("[recommend] Added", crossPlatformVariants.length, "cross-platform variants");
    }

    // Fire-and-forget skill execution logging
    const loadedSkillPaths = [
      topicSelectionSkill && "narrative/editorial/topic-selection.md",
      angleDetectionSkill && "narrative/editorial/angle-detection.md",
      sensitivitySkill && "narrative/editorial/sensitivity-classification.md",
      timelinessSkill && "narrative/editorial/timeliness-optimizer.md",
    ].filter(Boolean) as string[];

    Promise.all(
      loadedSkillPaths.map((skillPath) =>
        orchestrator
          .executeSkill({
            skillPath,
            context: { topic: trimmedTopic, action: "recommend" },
            executedById: userId,
            skipLlm: true,
          })
          .catch(() => {})
      )
    ).catch(() => {});

    console.log("[recommend] DONE:", parsed.recommendations.length, "recommendations", seoAnalysis ? "(with SEO)" : "");
    return NextResponse.json({
      recommendations: parsed.recommendations,
      topicAssessment: parsed.topicAssessment ?? null,
      researchSummary,
      seo: seoAnalysis ?? undefined,
    });
  } catch (error) {
    console.error("[recommend] UNHANDLED ERROR:", error);
    return handleApiError(error);
  }
}
