import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { scrapeUrls } from "@/lib/khabri/scraper";
import {
  insertSignalWithEmbedding,
  checkDuplicate,
} from "@/lib/khabri/vector-store";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";

// Allow up to 60s for the scan (RSS fetching + dedup + DB writes)
export const maxDuration = 60;

// 12 monitored RSS feeds (same as khabri-workflows.ts)
const MONITORED_FEEDS = [
  "https://feeds.feedburner.com/ndtvnews-top-stories",
  "https://www.thehindu.com/news/national/feeder/default.rss",
  "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
  "https://indianexpress.com/feed/",
  "https://www.livemint.com/rss/news",
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  "https://www.aljazeera.com/xml/rss/all.xml",
  "https://techcrunch.com/feed/",
  "https://feeds.feedburner.com/TheHackersNews",
  "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
  "https://www.moneycontrol.com/rss/latestnews.xml",
];

const SOURCE_TIERS: Record<string, number> = {
  reuters: 0.92, bbc: 0.92, nytimes: 0.92, thehindu: 0.92,
  indianexpress: 0.92, livemint: 0.92,
  ndtv: 0.82, aljazeera: 0.82, techcrunch: 0.82,
  moneycontrol: 0.82, timesofindia: 0.82, economictimes: 0.82,
};

function sourceCredibility(source: string): number {
  const lower = source.toLowerCase();
  for (const [key, score] of Object.entries(SOURCE_TIERS)) {
    if (lower.includes(key)) return score;
  }
  return 0.65;
}

/**
 * POST /api/khabri/scan
 * Admin-only manual RSS scan. Scrapes all 12 feeds, deduplicates via
 * vector similarity, inserts new signals, and triggers enrichment.
 */
export async function POST() {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    console.log("[khabri/scan] Manual scan triggered by", session.user.name);

    // 1. Scrape all feeds
    const { articles, errors } = await scrapeUrls(MONITORED_FEEDS);
    console.log(`[khabri/scan] Scraped ${articles.length} articles, ${errors.length} errors`);

    if (articles.length === 0) {
      return NextResponse.json({
        message: "Scan complete — no articles found",
        articlesScraped: 0,
        signalsCreated: 0,
        duplicatesSkipped: 0,
        feedErrors: errors.length,
      });
    }

    // 2. Ensure an "Unclassified Signals" trend exists for new signals
    let unclassifiedTrend = await prisma.trend.findFirst({
      where: { name: "Unclassified Signals" },
    });
    if (!unclassifiedTrend) {
      unclassifiedTrend = await prisma.trend.create({
        data: {
          name: "Unclassified Signals",
          description: "Signals that haven't been assigned to a narrative trend",
          lifecycle: "emerging",
        },
      });
    }

    // Get active trends for keyword matching
    const activeTrends = await prisma.trend.findMany({
      where: { lifecycle: { in: ["emerging", "peaking"] } },
      select: { id: true, name: true },
    });

    // 3. Deduplicate and insert (cap at 30 per scan to avoid timeout)
    let signalsCreated = 0;
    let duplicatesSkipped = 0;
    const newSignalIds: string[] = [];

    for (const article of articles.slice(0, 30)) {
      try {
        // Vector dedup
        const { isDuplicate } = await checkDuplicate(
          article.title,
          article.content
        );
        if (isDuplicate) {
          duplicatesSkipped++;
          continue;
        }

        // Simple keyword-based trend matching
        let trendId = unclassifiedTrend.id;
        for (const trend of activeTrends) {
          const trendWords = trend.name.toLowerCase().split(/\s+/);
          const titleWords = article.title.toLowerCase().split(/\s+/);
          const overlap = trendWords.filter((w) =>
            titleWords.some((tw) => tw.includes(w) || w.includes(tw))
          );
          if (overlap.length >= 2) {
            trendId = trend.id;
            break;
          }
        }

        const signalId = await insertSignalWithEmbedding({
          trendId,
          title: article.title,
          content: article.content.slice(0, 5000),
          source: article.source,
          sourceCredibility: sourceCredibility(article.source),
          eventType: "news",
          sentiment: "neutral",
        });

        newSignalIds.push(signalId);
        signalsCreated++;
      } catch (err) {
        console.warn("[khabri/scan] Failed to process article:", (err as Error).message);
      }
    }

    // 4. Trigger Inngest enrichment for each new signal
    for (const signalId of newSignalIds) {
      try {
        await inngest.send({
          name: "khabri/signal.process",
          data: {
            signalId,
            trendId: unclassifiedTrend.id,
            source: "manual-scan",
            title: "", // enrichment re-reads from DB
          },
        });
      } catch {
        // Non-critical — enrichment can be retried later
      }
    }

    console.log(`[khabri/scan] Done: ${signalsCreated} created, ${duplicatesSkipped} dupes`);

    return NextResponse.json({
      message: "Scan complete",
      articlesScraped: articles.length,
      signalsCreated,
      duplicatesSkipped,
      feedErrors: errors.length,
      enrichmentTriggered: newSignalIds.length,
    });
  } catch (err) {
    console.error("[khabri/scan] Scan failed:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Scan failed" },
      { status: 500 }
    );
  }
}
