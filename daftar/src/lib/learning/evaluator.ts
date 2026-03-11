/**
 * Learning Loop — Performance Evaluator
 *
 * Evaluates a batch of content performance records, computes per-post
 * "success scores", and generates structured feedback payloads for any
 * underperforming content — especially hook failures.
 */

// ─── Types ────────────────────────────────────────────────

interface PerformanceMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  retention?: number; // 0-100 %
  ctr?: number; // 0-100 %
  watchTime?: number; // seconds
  saves?: number;
}

export interface PerformanceRecord {
  id: string;
  deliverableId: string;
  brandId: string;
  platform: string;
  metrics: PerformanceMetrics;
  skillsUsed: string[];
  hookType: string | null;
  narrativeAngle: string | null;
  performanceTier: string | null;
  benchmarkDelta: number | null;
  publishedAt: Date | string | null;
}

export interface PostScore {
  id: string;
  deliverableId: string;
  platform: string;
  brandId: string;
  successScore: number; // 0-10
  tier: "top" | "above_avg" | "average" | "below_avg" | "poor";
  hookScore: number; // 0-10, isolated hook effectiveness
  engagementScore: number; // 0-10
  reachScore: number; // 0-10
}

export interface HookFailureFeedback {
  postId: string;
  deliverableId: string;
  platform: string;
  brandId: string;
  hookType: string | null;
  skillsUsed: string[];
  successScore: number;
  hookScore: number;
  diagnosis: string;
  suggestedSkillPaths: string[];
  metrics: {
    ctr: number | null;
    retention: number | null;
    engagementRate: number | null;
  };
}

export interface EvaluationResult {
  totalPosts: number;
  avgSuccessScore: number;
  scores: PostScore[];
  hookFailures: HookFailureFeedback[];
  summary: {
    top: number;
    aboveAvg: number;
    average: number;
    belowAvg: number;
    poor: number;
    hookFailureRate: number; // 0-1
  };
}

// ─── Platform-specific benchmarks ─────────────────────────

const PLATFORM_BENCHMARKS: Record<
  string,
  { ctr: number; retention: number; engagementRate: number }
> = {
  youtube: { ctr: 4.5, retention: 45, engagementRate: 3.5 },
  instagram: { ctr: 3.0, retention: 0, engagementRate: 4.0 },
  x: { ctr: 1.5, retention: 0, engagementRate: 2.0 },
  linkedin: { ctr: 2.5, retention: 0, engagementRate: 3.0 },
  facebook: { ctr: 2.0, retention: 0, engagementRate: 2.5 },
};

const DEFAULT_BENCHMARK = { ctr: 2.5, retention: 30, engagementRate: 3.0 };

// ─── Scoring helpers ──────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function computeEngagementRate(m: PerformanceMetrics): number {
  const views = m.views || 1;
  const interactions = (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saves ?? 0);
  return (interactions / views) * 100;
}

function scoreHook(m: PerformanceMetrics, platform: string): number {
  const bench = PLATFORM_BENCHMARKS[platform] ?? DEFAULT_BENCHMARK;

  // Hook effectiveness = weighted average of CTR + early retention
  const ctr = m.ctr ?? 0;
  const retention = m.retention ?? 0;

  const ctrScore = clamp((ctr / bench.ctr) * 5, 0, 10);

  // Retention matters most for video platforms
  const isVideo = platform === "youtube" || platform === "instagram";
  if (isVideo && bench.retention > 0) {
    const retScore = clamp((retention / bench.retention) * 5, 0, 10);
    return Math.round(((ctrScore * 0.5 + retScore * 0.5) * 100)) / 100;
  }

  return Math.round(ctrScore * 100) / 100;
}

function scoreEngagement(m: PerformanceMetrics, platform: string): number {
  const bench = PLATFORM_BENCHMARKS[platform] ?? DEFAULT_BENCHMARK;
  const rate = computeEngagementRate(m);
  return clamp(Math.round(((rate / bench.engagementRate) * 5) * 100) / 100, 0, 10);
}

function scoreReach(m: PerformanceMetrics): number {
  const views = m.views ?? 0;
  // Simple log-scale: 100 views = 2, 1k = 4, 10k = 6, 100k = 8, 1M = 10
  if (views <= 0) return 0;
  return clamp(Math.round((Math.log10(views) * 2) * 100) / 100, 0, 10);
}

function tierFromScore(score: number): PostScore["tier"] {
  if (score >= 8.0) return "top";
  if (score >= 6.5) return "above_avg";
  if (score >= 4.5) return "average";
  if (score >= 3.0) return "below_avg";
  return "poor";
}

function diagnoseHookFailure(
  hookScore: number,
  m: PerformanceMetrics,
  platform: string,
  hookType: string | null,
): string {
  const bench = PLATFORM_BENCHMARKS[platform] ?? DEFAULT_BENCHMARK;
  const parts: string[] = [];

  const ctr = m.ctr ?? 0;
  if (ctr < bench.ctr * 0.6) {
    parts.push(`CTR (${ctr.toFixed(1)}%) is well below ${platform} benchmark (${bench.ctr}%)`);
  }

  const retention = m.retention ?? 0;
  if (bench.retention > 0 && retention < bench.retention * 0.6) {
    parts.push(
      `Retention (${retention.toFixed(0)}%) drops early — first 30s not compelling enough`
    );
  }

  if (hookType) {
    parts.push(`Hook type "${hookType}" underperformed (score: ${hookScore.toFixed(1)}/10)`);
  } else {
    parts.push("No hook type tagged — consider classifying hooks for better tracking");
  }

  if (parts.length === 0) {
    parts.push("Hook metrics are marginally below threshold — minor optimization needed");
  }

  return parts.join(". ") + ".";
}

function suggestSkillPaths(platform: string, hookType: string | null): string[] {
  const paths: string[] = [];

  // Always suggest the platform hook skill
  const platformDir =
    platform === "x" ? "x-twitter" : platform === "facebook" ? "meta" : platform;
  paths.push(`platforms/${platformDir}/title-engineering.md`);

  if (platform === "youtube") {
    paths.push("platforms/youtube/shorts-strategy.md");
    paths.push("platforms/youtube/end-screen-card-strategy.md");
  }
  if (platform === "instagram") {
    paths.push("platforms/meta/reel-production.md");
    paths.push("platforms/meta/carousel-design.md");
  }
  if (platform === "x") {
    paths.push("platforms/x-twitter/tweet-crafting.md");
    paths.push("platforms/x-twitter/algorithm-awareness.md");
  }
  if (platform === "linkedin") {
    paths.push("platforms/linkedin/professional-tone-calibration.md");
  }

  if (hookType === "question") {
    paths.push("narrative/editorial/hook-development.md");
  }

  return paths;
}

// ─── Main evaluator ───────────────────────────────────────

const HOOK_FAILURE_THRESHOLD = 4.0; // hookScore below this = failure

export function evaluatePerformanceData(
  performanceRecords: PerformanceRecord[]
): EvaluationResult {
  const scores: PostScore[] = [];
  const hookFailures: HookFailureFeedback[] = [];

  for (const record of performanceRecords) {
    const m = (record.metrics ?? {}) as PerformanceMetrics;
    const platform = record.platform;

    const hookSc = scoreHook(m, platform);
    const engSc = scoreEngagement(m, platform);
    const reachSc = scoreReach(m);

    // Weighted composite: hook 40%, engagement 35%, reach 25%
    const successScore =
      Math.round((hookSc * 0.4 + engSc * 0.35 + reachSc * 0.25) * 100) / 100;

    const tier = tierFromScore(successScore);

    scores.push({
      id: record.id,
      deliverableId: record.deliverableId,
      platform,
      brandId: record.brandId,
      successScore,
      tier,
      hookScore: hookSc,
      engagementScore: engSc,
      reachScore: reachSc,
    });

    // Flag hook failures
    if (hookSc < HOOK_FAILURE_THRESHOLD) {
      hookFailures.push({
        postId: record.id,
        deliverableId: record.deliverableId,
        platform,
        brandId: record.brandId,
        hookType: record.hookType,
        skillsUsed: record.skillsUsed,
        successScore,
        hookScore: hookSc,
        diagnosis: diagnoseHookFailure(hookSc, m, platform, record.hookType),
        suggestedSkillPaths: suggestSkillPaths(platform, record.hookType),
        metrics: {
          ctr: m.ctr ?? null,
          retention: m.retention ?? null,
          engagementRate:
            Math.round(computeEngagementRate(m) * 100) / 100,
        },
      });
    }
  }

  const tierCounts = { top: 0, aboveAvg: 0, average: 0, belowAvg: 0, poor: 0 };
  for (const s of scores) {
    if (s.tier === "top") tierCounts.top++;
    else if (s.tier === "above_avg") tierCounts.aboveAvg++;
    else if (s.tier === "average") tierCounts.average++;
    else if (s.tier === "below_avg") tierCounts.belowAvg++;
    else tierCounts.poor++;
  }

  const avgSuccessScore =
    scores.length > 0
      ? Math.round(
          (scores.reduce((s, p) => s + p.successScore, 0) / scores.length) * 100
        ) / 100
      : 0;

  return {
    totalPosts: scores.length,
    avgSuccessScore,
    scores,
    hookFailures,
    summary: {
      ...tierCounts,
      hookFailureRate:
        scores.length > 0
          ? Math.round((hookFailures.length / scores.length) * 100) / 100
          : 0,
    },
  };
}
