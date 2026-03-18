import { inngest } from "./client";
import { scrapeUrls, type ScrapedArticle } from "@/lib/khabri/scraper";
import {
  insertSignalWithEmbedding,
  checkDuplicate,
} from "@/lib/khabri/vector-store";
import { detectAnomaly, type TimeSeriesPoint } from "@/lib/khabri/algorithms/anomaly";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import { prisma } from "@/lib/prisma";
import { daftarEvents } from "@/lib/event-bus";

// ─── Feed Configuration ──────────────────────────────────
// These are the default sources Khabri monitors hourly.
// In production, this would come from a DB config table.

const MONITORED_FEEDS = [
  // Indian news — primary audience
  "https://feeds.feedburner.com/ndtvnews-top-stories",
  "https://www.thehindu.com/news/national/feeder/default.rss",
  "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
  "https://indianexpress.com/feed/",
  "https://www.livemint.com/rss/news",
  // Geopolitics & world affairs
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  "https://www.aljazeera.com/xml/rss/all.xml",
  // Tech & business
  "https://techcrunch.com/feed/",
  "https://feeds.feedburner.com/TheHackersNews",
  // Finance
  "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
  "https://www.moneycontrol.com/rss/latestnews.xml",
];

// ─── Hourly Scan Cron Job ────────────────────────────────
// Runs every hour. Scrapes all monitored feeds, enriches via
// skill orchestrator, vectorizes, and emits events for high-impact signals.

export const khabriHourlyScan = inngest.createFunction(
  {
    id: "khabri-hourly-scan",
    name: "Khabri: Hourly Intelligence Scan",
    retries: 1,
    // Limit to 1 concurrent scan — prevent overlap if previous run is slow
    concurrency: [{ limit: 1 }],
  },
  [{ cron: "0 * * * *" }, { event: "khabri/scan.trigger" }],
  async ({ step }) => {
    // ──────────────────────────────────────────────────────
    // Step 1: Scrape all monitored feeds
    // ──────────────────────────────────────────────────────
    const scrapeResult = await step.run("scrape-feeds", async () => {
      const result = await scrapeUrls(MONITORED_FEEDS);
      return {
        articleCount: result.articles.length,
        errorCount: result.errors.length,
        articles: result.articles.map((a) => ({
          title: a.title,
          content: a.content.slice(0, 5000), // Truncate for step serialization
          url: a.url,
          source: a.source,
          publishedAt: a.publishedAt,
          wordCount: a.wordCount,
        })),
        errors: result.errors,
      };
    });

    if (scrapeResult.articleCount === 0) {
      return { status: "no_articles", errors: scrapeResult.errors };
    }

    // ──────────────────────────────────────────────────────
    // Step 2: Deduplicate against existing signals
    // ──────────────────────────────────────────────────────
    const newArticles = await step.run("deduplicate", async () => {
      const unique: ScrapedArticle[] = [];

      for (const article of scrapeResult.articles as ScrapedArticle[]) {
        const { isDuplicate } = await checkDuplicate(
          article.title,
          article.content
        );
        if (!isDuplicate) {
          unique.push(article);
        }
      }

      return unique;
    });

    if (newArticles.length === 0) {
      return {
        status: "all_duplicates",
        scraped: scrapeResult.articleCount,
        new: 0,
      };
    }

    // ──────────────────────────────────────────────────────
    // Step 3: Enrich each article via SkillOrchestrator
    // ──────────────────────────────────────────────────────
    // Uses the event-detection skill to classify and score each signal.
    // The skill returns: eventType, impactScore, sentiment, stakeholders.
    interface EnrichedSignal {
      article: ScrapedArticle;
      impactScore: number;
      eventType: string;
      sentiment: string;
      stakeholders: string[];
      geoRelevance: Record<string, number>;
    }

    const enrichedSignals: EnrichedSignal[] = [];

    // Process in batches of 5 to avoid overwhelming the LLM
    for (let i = 0; i < newArticles.length; i += 5) {
      const batch = newArticles.slice(i, i + 5);
      const batchKey = `enrich-batch-${Math.floor(i / 5)}`;

      const batchResults = await step.run(batchKey, async () => {
        const results: EnrichedSignal[] = [];

        for (const article of batch) {
          try {
            const result = await skillOrchestrator.executeSkill({
              skillPath: "signals/detection/event-detection.md",
              context: {
                signal: {
                  title: article.title,
                  content: article.content.slice(0, 3000),
                  source: article.source,
                  url: article.url,
                },
              },
            });

            if (result.success) {
              const output = result.output as {
                eventType?: string;
                impactScore?: number;
                sentiment?: string;
                stakeholders?: string[];
                geoRelevance?: Record<string, number>;
              };

              results.push({
                article,
                impactScore: output.impactScore ?? 5.0,
                eventType: output.eventType ?? "general",
                sentiment: output.sentiment ?? "neutral",
                stakeholders: output.stakeholders ?? [],
                geoRelevance: output.geoRelevance ?? { india: 0.5, global: 0.5 },
              });
            } else {
              // Skill failed — still save with defaults
              results.push({
                article,
                impactScore: 5.0,
                eventType: "unclassified",
                sentiment: "neutral",
                stakeholders: [],
                geoRelevance: { india: 0.5, global: 0.5 },
              });
            }
          } catch {
            // Individual article failure shouldn't stop the batch
            results.push({
              article,
              impactScore: 5.0,
              eventType: "error",
              sentiment: "neutral",
              stakeholders: [],
              geoRelevance: { india: 0.5, global: 0.5 },
            });
          }
        }

        return results;
      });

      enrichedSignals.push(...batchResults);
    }

    // ──────────────────────────────────────────────────────
    // Step 4: Resolve or create trends for each signal
    // ──────────────────────────────────────────────────────
    const trendMap = await step.run("resolve-trends", async () => {
      // Get existing active trends
      const activeTrends = await prisma.trend.findMany({
        where: { lifecycle: { in: ["emerging", "peaking"] } },
        select: { id: true, name: true },
      });

      // Simple keyword matching to assign signals to trends.
      // In production, use embedding similarity for trend clustering.
      const map: Record<string, string> = {};

      // Create a catch-all "Unclassified" trend if needed
      let unclassifiedTrend = activeTrends.find(
        (t) => t.name === "Unclassified Signals"
      );
      if (!unclassifiedTrend) {
        const created = await prisma.trend.create({
          data: {
            name: "Unclassified Signals",
            description: "Signals that haven't been assigned to a narrative trend",
            lifecycle: "emerging",
          },
        });
        unclassifiedTrend = { id: created.id, name: created.name };
      }

      for (const signal of enrichedSignals) {
        // Try to match to an existing trend by keyword overlap
        let matched = false;
        for (const trend of activeTrends) {
          const trendWords = trend.name.toLowerCase().split(/\s+/);
          const titleWords = signal.article.title.toLowerCase().split(/\s+/);
          const overlap = trendWords.filter((w) =>
            titleWords.some((tw) => tw.includes(w) || w.includes(tw))
          );

          if (overlap.length >= 2) {
            map[signal.article.url] = trend.id;
            matched = true;
            break;
          }
        }

        if (!matched) {
          map[signal.article.url] = unclassifiedTrend.id;
        }
      }

      return map;
    });

    // ──────────────────────────────────────────────────────
    // Step 5: Vectorize and persist all enriched signals
    // ──────────────────────────────────────────────────────
    const savedSignals = await step.run("persist-signals", async () => {
      const saved: { id: string; impactScore: number; title: string }[] = [];

      for (const signal of enrichedSignals) {
        try {
          const trendId =
            trendMap[signal.article.url] ||
            Object.values(trendMap)[0]; // fallback

          const signalId = await insertSignalWithEmbedding({
            trendId,
            title: signal.article.title,
            content: signal.article.content,
            source: signal.article.source,
            sourceCredibility: computeSourceCredibility(signal.article.source),
            eventType: signal.eventType,
            sentiment: signal.sentiment,
            stakeholders: { names: signal.stakeholders },
            geoRelevance: signal.geoRelevance,
          });

          saved.push({
            id: signalId,
            impactScore: signal.impactScore,
            title: signal.article.title,
          });
        } catch (err) {
          console.error(
            `[Khabri] Failed to persist signal: ${signal.article.title}`,
            err
          );
        }
      }

      return saved;
    });

    // ──────────────────────────────────────────────────────
    // Step 6: Check for volume anomalies across recent signals
    // ──────────────────────────────────────────────────────
    await step.run("check-anomalies", async () => {
      // Count signals per hour over the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const hourlyVolume = await prisma.$queryRaw<
        { hour: Date; count: bigint }[]
      >`
        SELECT date_trunc('hour', "detectedAt") AS hour,
               COUNT(*) AS count
        FROM signals
        WHERE "detectedAt" >= ${sevenDaysAgo}
        GROUP BY hour
        ORDER BY hour ASC
      `;

      if (hourlyVolume.length > 3) {
        const timeSeries: TimeSeriesPoint[] = hourlyVolume.map((row) => ({
          timestamp: row.hour.toISOString(),
          volume: Number(row.count),
        }));

        const anomaly = detectAnomaly(timeSeries);

        if (anomaly.isAnomaly) {
          daftarEvents.emitEvent("KHABRI_VOLUME_ANOMALY", {
            severity: anomaly.severity,
            spikePercentage: anomaly.spikePercentage,
            zScore: anomaly.zScore,
            latestVolume: anomaly.stats.latest,
            meanVolume: anomaly.stats.mean,
          });
        }
      }
    });

    // ──────────────────────────────────────────────────────
    // Step 7: Emit urgent signal events for high-impact items
    // ──────────────────────────────────────────────────────
    await step.run("emit-urgent-signals", async () => {
      const urgentSignals = savedSignals.filter(
        (s) => s.impactScore > 8.0
      );

      for (const signal of urgentSignals) {
        daftarEvents.emitEvent("KHABRI_URGENT_SIGNAL_DETECTED", {
          signalId: signal.id,
          title: signal.title,
          impactScore: signal.impactScore,
          detectedAt: new Date().toISOString(),
        });

        // Also trigger the enrichment pipeline for deep processing
        await inngest.send({
          name: "khabri/signal.process",
          data: {
            signalId: signal.id,
            trendId: trendMap[signal.title] || "",
            source: "hourly-scan",
            title: signal.title,
          },
        });
      }

      return {
        urgentCount: urgentSignals.length,
        signals: urgentSignals.map((s) => s.title),
      };
    });

    return {
      status: "completed",
      scraped: scrapeResult.articleCount,
      errors: scrapeResult.errorCount,
      deduplicated: newArticles.length,
      enriched: enrichedSignals.length,
      saved: savedSignals.length,
      urgent: savedSignals.filter((s) => s.impactScore > 8.0).length,
    };
  }
);

// ─── Auto-Escalation: Signal → Narrative Tree ──────────────
// Listens for khabri/signal.escalate events (fired when processSignal
// detects BREAKING/CRISIS). Fetches the signal from DB and calls
// ingestSignal() to create/merge into a NarrativeTree.

export const autoEscalateSignal = inngest.createFunction(
  {
    id: "khabri-auto-escalate-signal",
    name: "Khabri: Auto-Escalate Signal to Narrative",
    retries: 2,
  },
  { event: "khabri/signal.escalate" },
  async ({ event, step }) => {
    const { signalId, title, escalationLevel } = event.data;

    const result = await step.run("ingest-into-narrative", async () => {
      // Fetch the full signal from DB
      const signal = await prisma.signal.findUnique({
        where: { id: signalId },
      });

      if (!signal) {
        return { error: `Signal ${signalId} not found` };
      }

      // Use the ingest helper to create/merge into a NarrativeTree
      const { ingestSignal } = await import("@/lib/yantri/ingest-helper");

      const ingestResult = await ingestSignal(
        {
          title: signal.title,
          content: signal.content ?? null,
          source: signal.source,
          signalId: signal.id,
          urgency: escalationLevel === "BREAKING" ? "breaking" : "high",
        },
        "system" // createdById
      );

      return {
        treeId: ingestResult.treeId,
        title: ingestResult.title,
        isNew: ingestResult.isNew,
        merged: ingestResult.merged,
      };
    });

    return {
      signalId,
      escalationLevel,
      ...result,
    };
  }
);

// ─── Source Credibility Heuristic ─────────────────────────
// Quick credibility score based on source reputation.
// The full credibility skill runs during deep enrichment.

function computeSourceCredibility(source: string): number {
  const tier1 = [
    "reuters", "ap", "bbc", "nytimes", "bloomberg",
    "thehindu", "indianexpress", "livemint",
  ];
  const tier2 = [
    "ndtv", "aljazeera", "techcrunch", "moneycontrol",
    "timesofindia", "economictimes",
  ];

  const lower = source.toLowerCase();

  if (tier1.some((s) => lower.includes(s))) return 0.92;
  if (tier2.some((s) => lower.includes(s))) return 0.82;
  return 0.65; // Unknown source baseline
}
