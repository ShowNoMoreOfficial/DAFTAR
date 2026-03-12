import { NextResponse } from "next/server";
import { getAuthSession, badRequest, unauthorized, handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { callClaude } from "@/lib/yantri/anthropic";
import { callGeminiResearch } from "@/lib/yantri/gemini";
import { SkillOrchestrator, type SkillFile } from "@/lib/skill-orchestrator";

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
}

// ─── Helpers ──────────────────────────────────────────────

async function loadSkillSafe(
  orchestrator: SkillOrchestrator,
  skillPath: string
): Promise<SkillFile | null> {
  try {
    return await orchestrator.loadSkill(skillPath);
  } catch {
    console.warn(`[recommend] Skill not found: ${skillPath}`);
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

// ─── POST /api/yantri/recommend ───────────────────────────

export async function POST(request: Request) {
  try {
    // ── Step 0: Auth ──
    const session = await getAuthSession();
    if (!session) return unauthorized();
    console.log("[recommend] Step 0 PASS: auth, user =", session.user.id, "role =", session.user.role);

    // ── Step 1: Parse input ──
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch (e) {
      console.error("[recommend] Step 1 FAIL: body parse", e);
      return badRequest("Invalid request body");
    }
    const topic = body?.topic;
    if (!topic || typeof topic !== "string" || (topic as string).trim().length < 3) {
      return badRequest("topic is required (min 3 chars)");
    }
    console.log("[recommend] Step 1 PASS: topic =", (topic as string).trim().slice(0, 80));

    // Optional signal metadata for enriched recommendations
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

    // ── Step 2: Research (Gemini) ──
    let researchSummary = "";
    try {
      researchSummary = await callGeminiResearch(
        "You are a thorough research analyst. Provide factual, well-sourced research.",
        `You are a senior political and economic research analyst.
Research this topic thoroughly: "${(topic as string).trim()}"

Provide a comprehensive research dossier including:
- Key facts and verified data points
- Timeline of events (with dates)
- Key stakeholders and their positions
- Statistics and numbers (with sources)
- Different perspectives and viewpoints
- Geopolitical implications (especially for India)
- Context and background needed to understand the story

Be thorough, factual, and cite sources where possible.
Return your findings as a well-structured report.`
      );
      console.log("[recommend] Step 2 PASS: research length =", researchSummary?.length);
    } catch (geminiErr) {
      console.error("[recommend] Step 2 FAIL: Gemini research", geminiErr);
      researchSummary = `Topic: ${(topic as string).trim()} (research unavailable — proceeding with editorial judgment)`;
    }

    // ── Step 3: Load skills ──
    const orchestrator = new SkillOrchestrator();
    let topicSelectionSkill: SkillFile | null = null;
    let angleDetectionSkill: SkillFile | null = null;
    let sensitivitySkill: SkillFile | null = null;
    let timelinessSkill: SkillFile | null = null;
    let platformFirstSkill: SkillFile | null = null;
    let evergreenVsTimelySkill: SkillFile | null = null;
    let competitiveNarrativeSkill: SkillFile | null = null;
    let contrarianAngleSkill: SkillFile | null = null;
    let contentBenchmarkingSkill: SkillFile | null = null;
    let performanceAttributionSkill: SkillFile | null = null;
    let sentimentFeedbackSkill: SkillFile | null = null;

    try {
      [
        topicSelectionSkill,
        angleDetectionSkill,
        sensitivitySkill,
        timelinessSkill,
        platformFirstSkill,
        evergreenVsTimelySkill,
        competitiveNarrativeSkill,
        contrarianAngleSkill,
        contentBenchmarkingSkill,
        performanceAttributionSkill,
        sentimentFeedbackSkill,
      ] = await Promise.all([
        loadSkillSafe(orchestrator, "narrative/editorial/topic-selection.md"),
        loadSkillSafe(orchestrator, "narrative/editorial/angle-detection.md"),
        loadSkillSafe(orchestrator, "narrative/editorial/sensitivity-classification.md"),
        loadSkillSafe(orchestrator, "narrative/editorial/timeliness-optimizer.md"),
        loadSkillSafe(orchestrator, "distribution/platform-first-vs-repurpose.md"),
        loadSkillSafe(orchestrator, "distribution/evergreen-vs-timely.md"),
        loadSkillSafe(orchestrator, "narrative/editorial/competitive-narrative-analysis.md"),
        loadSkillSafe(orchestrator, "narrative/editorial/contrarian-angle-detection.md"),
        loadSkillSafe(orchestrator, "analytics/performance/content-benchmarking.md"),
        loadSkillSafe(orchestrator, "analytics/performance/performance-attribution.md"),
        loadSkillSafe(orchestrator, "analytics/feedback/sentiment-feedback-loop.md"),
      ]);
      const loaded = [topicSelectionSkill, angleDetectionSkill, sensitivitySkill, timelinessSkill,
        platformFirstSkill, evergreenVsTimelySkill, competitiveNarrativeSkill, contrarianAngleSkill,
        contentBenchmarkingSkill, performanceAttributionSkill, sentimentFeedbackSkill].filter(Boolean).length;
      console.log("[recommend] Step 3 PASS: skills loaded =", loaded, "/ 11");
    } catch (skillErr) {
      console.error("[recommend] Step 3 FAIL: skill loading", skillErr);
      // Continue without skills
    }

    // ── Step 4: Load brands ──
    const brandWhere =
      userRole === "ADMIN"
        ? {}
        : { id: { in: accessibleBrandIds } };

    let brands: Awaited<ReturnType<typeof prisma.brand.findMany>>;
    try {
      brands = await prisma.brand.findMany({
        where: brandWhere,
        include: { platforms: true },
      });
      console.log("[recommend] Step 4 PASS: brands =", brands.length);
    } catch (brandErr) {
      console.error("[recommend] Step 4 FAIL: brand query", brandErr);
      return NextResponse.json({ error: "Failed to load brands" }, { status: 500 });
    }

    if (brands.length === 0) {
      console.log("[recommend] Step 4: No brands accessible for role", userRole, "brandIds", accessibleBrandIds);
      return NextResponse.json(
        { error: "No brands accessible" },
        { status: 403 }
      );
    }

    const brandIds = brands.map((b) => b.id);

    // Load brand identity skills in parallel
    const brandIdentitySkills = await Promise.all(
      brands.map(async (b) => {
        const slug = b.slug;
        const skill = await loadSkillSafe(
          orchestrator,
          `brand/identity/${slug}/identity.md`
        );
        return { brandId: b.id, skill };
      })
    );

    const brandIdentityMap = new Map(
      brandIdentitySkills.map((b) => [b.brandId, b.skill])
    );

    // ── Step 5: Performance history ──
    let pastDeliverables: Awaited<ReturnType<typeof prisma.deliverable.findMany>> = [];
    let performanceData: Awaited<ReturnType<typeof prisma.contentPerformance.findMany>> = [];
    let skillLearningLogs: Awaited<ReturnType<typeof prisma.skillLearningLog.findMany>> = [];
    try {
      [pastDeliverables, performanceData, skillLearningLogs] = await Promise.all([
        prisma.deliverable.findMany({
          where: { brandId: { in: brandIds } },
          include: { tree: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.contentPerformance.findMany({
          where: { brandId: { in: brandIds } },
          orderBy: { lastUpdated: "desc" },
          take: 20,
        }),
        prisma.skillLearningLog.findMany({
          where: {
            source: "auto",
            periodEnd: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { periodEnd: "desc" },
          take: 30,
        }),
      ]);
      console.log("[recommend] Step 5 PASS: deliverables =", pastDeliverables.length, "perf =", performanceData.length, "learning =", skillLearningLogs.length);
    } catch (perfErr) {
      console.error("[recommend] Step 5 FAIL: performance queries", perfErr);
      // Continue with empty data
    }

    // ── Step 6: Signals & trends ──
    let recentSignals: Awaited<ReturnType<typeof prisma.signal.findMany>> = [];
    let activeTrends: Awaited<ReturnType<typeof prisma.trend.findMany>> = [];
    try {
      [recentSignals, activeTrends] = await Promise.all([
        prisma.signal.findMany({
          orderBy: { detectedAt: "desc" },
          take: 10,
        }),
        prisma.trend.findMany({
          where: { lifecycle: "emerging" },
          take: 10,
        }),
      ]);
      console.log("[recommend] Step 6 PASS: signals =", recentSignals.length, "trends =", activeTrends.length);
    } catch (sigErr) {
      console.error("[recommend] Step 6 FAIL: signal/trend queries", sigErr);
      // Continue with empty data
    }

    // ──────────────────────────────────────────────────────
    // 6 + 7. BUILD THE RICH RECOMMENDATION PROMPT
    // ──────────────────────────────────────────────────────

    const skillSection = (label: string, skill: SkillFile | null) =>
      skill ? `## ${label}\n${skill.instructions}\n` : "";

    const systemPrompt = `You are Daftar's editorial intelligence engine. You make content decisions for a media agency.

You have access to deep editorial knowledge:

${skillSection("TOPIC SELECTION FRAMEWORK", topicSelectionSkill)}
${skillSection("ANGLE DETECTION (5 Lenses)", angleDetectionSkill)}
${skillSection("SENSITIVITY CLASSIFICATION", sensitivitySkill)}
${skillSection("TIMELINESS ANALYSIS", timelinessSkill)}
${skillSection("PLATFORM-FIRST vs REPURPOSE DECISION", platformFirstSkill)}
${skillSection("EVERGREEN vs TIMELY CLASSIFICATION", evergreenVsTimelySkill)}
${skillSection("COMPETITIVE NARRATIVE ANALYSIS", competitiveNarrativeSkill)}
${skillSection("CONTRARIAN ANGLE DETECTION", contrarianAngleSkill)}

## PERFORMANCE ANALYTICS FRAMEWORK
${skillSection("CONTENT BENCHMARKING", contentBenchmarkingSkill)}
${skillSection("PERFORMANCE ATTRIBUTION", performanceAttributionSkill)}
${skillSection("SENTIMENT FEEDBACK LOOP", sentimentFeedbackSkill)}

## CONTENT TYPE KNOWLEDGE
Available types: youtube_explainer, youtube_short, x_thread, x_single, instagram_carousel, instagram_reel, linkedin_post, linkedin_article, blog_post, newsletter, podcast_script, quick_take, community_post

## BRANDS
${brands
  .map((b) => {
    const covers = parseBrandJsonField(b.editorialCovers);
    const never = parseBrandJsonField(b.editorialNever);
    const platforms = parsePlatforms(b.activePlatforms);
    const voiceRules = Array.isArray(b.voiceRules)
      ? (b.voiceRules as string[]).join("; ")
      : typeof b.voiceRules === "string"
        ? b.voiceRules
        : "";
    const identitySkill = brandIdentityMap.get(b.id);
    return `
### ${b.name}
- Voice: ${b.tone || "N/A"} / ${b.language || "N/A"}
- Rules: ${voiceRules || "N/A"}
- Covers: ${covers.join(", ") || "N/A"}
- Never covers: ${never.join(", ") || "N/A"}
- Active platforms: ${platforms.map((p) => `${p.name} (${p.role || "general"})`).join(", ") || "N/A"}
- Identity: ${identitySkill?.instructions?.slice(0, 800) || "Not available"}
`;
  })
  .join("\n")}

## RECENT PERFORMANCE
${
  performanceData.length > 0
    ? `${performanceData
        .map(
          (p) =>
            `- ${p.platform} | tier: ${p.performanceTier || "unknown"} | delta: ${p.benchmarkDelta != null ? `${p.benchmarkDelta > 0 ? "+" : ""}${p.benchmarkDelta}%` : "N/A"} | angle: ${p.narrativeAngle || "N/A"} | hook: ${p.hookType || "N/A"} | skills: ${p.skillsUsed?.join(", ") || "N/A"}`
        )
        .join("\n")}`
    : "No performance data yet — recommend based on editorial judgment."
}

## SKILL LEARNING INSIGHTS (last 30 days)
${
  skillLearningLogs.length > 0
    ? skillLearningLogs
        .slice(0, 15)
        .map((log) => {
          const entry = log.entry as Record<string, unknown> | null;
          const summary = entry?.summary || entry?.insight || entry?.observation || "N/A";
          return `- [${log.skillId}] ${String(summary).slice(0, 200)}`;
        })
        .join("\n")
    : "No skill learning data yet — system will learn from published content performance."
}

## RECENT CONTENT (avoid duplication)
${
  pastDeliverables.length > 0
    ? pastDeliverables
        .slice(0, 10)
        .map(
          (d) =>
            `- ${d.tree?.title || d.copyMarkdown?.slice(0, 60) || "Untitled"} (${d.platform}, ${d.pipelineType}, ${d.status})`
        )
        .join("\n")
    : "No prior deliverables."
}

## CURRENT TRENDING SIGNALS
${
  recentSignals.length > 0
    ? recentSignals
        .slice(0, 5)
        .map(
          (s) =>
            `- ${s.title} (credibility: ${s.sourceCredibility ?? "N/A"}, type: ${s.eventType || "N/A"}, sentiment: ${s.sentiment || "N/A"})`
        )
        .join("\n")
    : "No recent signals."
}

## ACTIVE TRENDS
${
  activeTrends.length > 0
    ? activeTrends
        .slice(0, 5)
        .map(
          (t) =>
            `- ${t.name} (lifecycle: ${t.lifecycle}, velocity: ${t.velocityScore ?? "N/A"})`
        )
        .join("\n")
    : "No active trends."
}`;

    const signalContext = signalMetadata
      ? `
SIGNAL INTELLIGENCE (verified data from Intelligence system):
- Source: ${signalMetadata.source || "unknown"} (credibility: ${signalMetadata.sourceCredibility ?? "N/A"})
- Event type: ${signalMetadata.eventType || "N/A"}
- Sentiment: ${signalMetadata.sentiment || "N/A"}
- Trend: ${signalMetadata.trendName || "N/A"} (${signalMetadata.trendLifecycle || "unknown"}, velocity: ${signalMetadata.trendVelocity ?? "N/A"})
- Stakeholders: ${signalMetadata.stakeholders ? JSON.stringify(signalMetadata.stakeholders) : "N/A"}
- Additional context: ${signalMetadata.content?.slice(0, 1000) || "N/A"}

USE this verified intelligence to make MORE PRECISE recommendations. The signal data gives you confirmed facts about the topic.
`
      : "";

    const userPrompt = `A new topic has arrived:
"${topic.trim()}"
${signalContext}
Research findings:
${researchSummary.slice(0, 6000)}

Apply your editorial intelligence framework:

1. RUN the 4-gate topic selection test (relevance → so-what → differentiation → capacity)
2. For each brand that should cover this, RUN the 5-lens angle detection
3. For each angle, DECIDE the best content type and platform
4. RANK all recommendations by: editorial value × platform fit × timeliness × brand alignment
5. For each recommendation, specify EXACTLY what assets are needed:
   - YouTube Explainer: script sections, B-roll list, thumbnail concept, title options, description, tags
   - X Thread: tweet count, visual anchors per tweet, hashtags
   - Carousel: slide count, data visualizations needed, visual style
   - Short/Reel: hook, key visual, text overlays
   - Blog: SEO keywords, header image concept, internal links
   - etc.

Return as JSON:
{
  "recommendations": [
    {
      "rank": 1,
      "brand": { "id": "brand-id-here", "name": "Brand Name" },
      "platform": "YOUTUBE",
      "contentType": "youtube_explainer",
      "angle": "The specific editorial angle to take",
      "reasoning": "2-3 sentences explaining why — reference editorial framework, performance data, platform fit, timeliness",
      "priority": "critical|high|medium|low",
      "urgency": "immediate|within_24h|within_48h|evergreen",
      "estimatedLength": "12-15 minutes",
      "suggestedTitle": "Working title",
      "assetsRequired": {
        "images": ["thumbnail concept", "data visualization X"],
        "video": ["B-roll list items"],
        "graphics": ["lower thirds", "data cards"],
        "other": ["stakeholder photos", "map graphics"]
      },
      "keyDataPoints": ["$2.7B subsidy", "Tata Group Dholera plant", "2027 target"],
      "stakeholders": ["Person A", "Person B"],
      "sensitivityLevel": "green|yellow|orange|red",
      "timeliness": "Breaking — publish within 6 hours"
    }
  ],
  "topicAssessment": {
    "passesEditorialGate": true,
    "relevanceScore": 9,
    "differentiationScore": 8,
    "urgencyLevel": "high",
    "crossBrandPotential": true
  }
}

IMPORTANT:
- Use ACTUAL brand IDs from the brand list above.
- Recommend 3-5 items ranked by priority.
- Each brand should get a DIFFERENT angle (not the same take).
- If a brand should NOT cover this topic (editorial never / misalignment), exclude it.
- Be specific in assetsRequired — not generic placeholders.
- Return ONLY valid JSON, no markdown.`;

    // ── Step 7: Build prompt ──
    console.log("[recommend] Step 7 PASS: systemPrompt length =", systemPrompt.length, "userPrompt length =", userPrompt.length);

    // ── Step 8: Call Claude ──
    let result: { parsed: unknown; raw: string };
    try {
      result = await callClaude(systemPrompt, userPrompt, {
        maxTokens: 8192,
        temperature: 0.4,
      });
      console.log("[recommend] Step 8 PASS: Claude responded, raw length =", result.raw?.length);
    } catch (claudeErr) {
      console.error("[recommend] Step 8 FAIL: Claude API call", claudeErr);
      return NextResponse.json(
        { error: "Content recommendation engine is temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    // ── Step 9: Parse response ──
    const parsed = result.parsed as RecommendResponse | null;

    if (!parsed?.recommendations) {
      console.error(
        "[recommend] Step 9 FAIL: parse. Raw:",
        result.raw?.slice(0, 500)
      );
      return NextResponse.json(
        { error: "Failed to parse recommendations from AI response. Please try again." },
        { status: 502 }
      );
    }
    console.log("[recommend] Step 9 PASS: parsed", parsed.recommendations.length, "recommendations");

    // ──────────────────────────────────────────────────────
    // 9. LOG skill executions
    // ──────────────────────────────────────────────────────
    const loadedSkillPaths = [
      topicSelectionSkill && "narrative/editorial/topic-selection.md",
      angleDetectionSkill && "narrative/editorial/angle-detection.md",
      sensitivitySkill && "narrative/editorial/sensitivity-classification.md",
      timelinessSkill && "narrative/editorial/timeliness-optimizer.md",
      platformFirstSkill && "distribution/platform-first-vs-repurpose.md",
      evergreenVsTimelySkill && "distribution/evergreen-vs-timely.md",
      competitiveNarrativeSkill && "narrative/editorial/competitive-narrative-analysis.md",
      contrarianAngleSkill && "narrative/editorial/contrarian-angle-detection.md",
      // Performance skills
      contentBenchmarkingSkill && "analytics/performance/content-benchmarking.md",
      performanceAttributionSkill && "analytics/performance/performance-attribution.md",
      sentimentFeedbackSkill && "analytics/feedback/sentiment-feedback-loop.md",
    ].filter(Boolean) as string[];

    // Fire-and-forget skill execution logging
    Promise.all(
      loadedSkillPaths.map((skillPath) =>
        orchestrator
          .executeSkill({
            skillPath,
            context: { topic: topic.trim(), action: "recommend" },
            executedById: userId,
            skipLlm: true,
          })
          .catch(() => {})
      )
    ).catch(() => {});

    // ──────────────────────────────────────────────────────
    // 11. RETURN
    // ──────────────────────────────────────────────────────
    console.log("[recommend] DONE: returning", parsed.recommendations.length, "recommendations");
    return NextResponse.json({
      recommendations: parsed.recommendations,
      topicAssessment: parsed.topicAssessment ?? null,
      researchSummary,
    });
  } catch (error) {
    console.error("[recommend] UNHANDLED ERROR:", error);
    return handleApiError(error);
  }
}
