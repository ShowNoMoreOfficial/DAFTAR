import * as cheerio from "cheerio";

// ─── Types ───────────────────────────────────────────────

export interface ScrapedArticle {
  title: string;
  content: string;
  url: string;
  source: string;
  publishedAt: string | null;
  wordCount: number;
}

export interface ScrapeResult {
  articles: ScrapedArticle[];
  errors: { url: string; error: string }[];
}

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
}

// ─── Constants ───────────────────────────────────────────

const USER_AGENT =
  "Mozilla/5.0 (compatible; DaftarBot/1.0; +https://daftar.app)";

// Rate limiting: max concurrent fetches and delay between batches
const MAX_CONCURRENT = 5;
const BATCH_DELAY_MS = 1000;
const FETCH_TIMEOUT_MS = 15000;

// Elements to strip from article body
const NOISE_SELECTORS = [
  "script",
  "style",
  "nav",
  "header",
  "footer",
  "aside",
  "iframe",
  ".ad",
  ".advertisement",
  ".social-share",
  ".comments",
  ".related-articles",
  "[role='navigation']",
  "[role='banner']",
  "[role='complementary']",
];

// ─── Core Fetch with Timeout & Retries ───────────────────

async function fetchWithRetry(
  url: string,
  retries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        FETCH_TIMEOUT_MS
      );

      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        // Rate limited — back off exponentially
        const retryAfter =
          parseInt(response.headers.get("Retry-After") || "5") * 1000;
        const backoff = retryAfter * Math.pow(2, attempt);
        console.warn(
          `[Scraper] Rate limited on ${url}, waiting ${backoff}ms`
        );
        await sleep(backoff);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      // Exponential backoff on network errors
      await sleep(1000 * Math.pow(2, attempt));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
}

// ─── RSS Feed Parser ─────────────────────────────────────

function parseRSSFeed(xml: string, feedUrl: string): RSSItem[] {
  const $ = cheerio.load(xml, { xml: true });
  const items: RSSItem[] = [];

  // Standard RSS 2.0
  $("item").each((_, el) => {
    const $el = $(el);
    items.push({
      title: $el.find("title").first().text().trim(),
      link:
        $el.find("link").first().text().trim() ||
        $el.find("link").attr("href") ||
        "",
      description: $el.find("description").first().text().trim(),
      pubDate: $el.find("pubDate").first().text().trim() || null,
    });
  });

  // Atom feeds
  if (items.length === 0) {
    $("entry").each((_, el) => {
      const $el = $(el);
      items.push({
        title: $el.find("title").first().text().trim(),
        link:
          $el.find("link[rel='alternate']").attr("href") ||
          $el.find("link").attr("href") ||
          "",
        description:
          $el.find("summary").first().text().trim() ||
          $el.find("content").first().text().trim(),
        pubDate:
          $el.find("published").first().text().trim() ||
          $el.find("updated").first().text().trim() ||
          null,
      });
    });
  }

  // Resolve relative URLs
  const baseUrl = new URL(feedUrl).origin;
  return items.map((item) => ({
    ...item,
    link: item.link.startsWith("http")
      ? item.link
      : `${baseUrl}${item.link}`,
  }));
}

// ─── HTML Article Extractor ──────────────────────────────

function extractArticleContent(
  html: string,
  url: string
): { title: string; content: string } {
  const $ = cheerio.load(html);

  // Extract title: prefer og:title, then <title>, then first <h1>
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled";

  // Remove noise elements
  NOISE_SELECTORS.forEach((sel) => $(sel).remove());

  // Try common article selectors in order of specificity
  const ARTICLE_SELECTORS = [
    "article",
    '[role="main"]',
    ".article-body",
    ".post-content",
    ".entry-content",
    ".story-body",
    "#article-body",
    ".article__body",
    "main",
  ];

  let content = "";
  for (const selector of ARTICLE_SELECTORS) {
    const el = $(selector).first();
    if (el.length > 0) {
      content = el.text().trim();
      break;
    }
  }

  // Fallback: grab all paragraph text from body
  if (!content || content.length < 100) {
    content = $("body p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 30) // Skip short nav/footer paragraphs
      .join("\n\n");
  }

  // Clean up whitespace: collapse multiple newlines and spaces
  content = content
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { title: cleanText(title), content: cleanText(content) };
}

// ─── Text Cleaning ───────────────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[^\x20-\x7E\u00A0-\u024F\u0900-\u097F]/g, "") // ASCII + Latin Extended + Devanagari
    .trim();
}

// ─── URL Classification ─────────────────────────────────

function isRSSUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("/rss") ||
    lower.includes("/feed") ||
    lower.includes("/atom") ||
    lower.endsWith(".xml") ||
    lower.includes("format=xml")
  );
}

function extractSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Strip www. and .com/.in/.org etc.
    return hostname
      .replace(/^www\./, "")
      .replace(/\.(com|org|net|in|co\.in|co\.uk)$/, "")
      .split(".")
      .pop()!;
  } catch {
    return url;
  }
}

// ─── Batch Processing ────────────────────────────────────

async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number,
  delayMs: number
): Promise<{ results: R[]; errors: { item: T; error: string }[] }> {
  const results: R[] = [];
  const errors: { item: T; error: string }[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const settled = await Promise.allSettled(
      batch.map((item) => processor(item))
    );

    for (let j = 0; j < settled.length; j++) {
      const result = settled[j];
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        errors.push({
          item: batch[j],
          error: result.reason?.message || "Unknown error",
        });
      }
    }

    // Delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return { results, errors };
}

// ─── Public API ──────────────────────────────────────────

/**
 * Scrape articles from a list of RSS feed URLs and/or standard web pages.
 * Handles both RSS/Atom feeds (extracts all items) and regular HTML pages
 * (extracts the main article content).
 *
 * Rate-limits to MAX_CONCURRENT parallel fetches with BATCH_DELAY_MS
 * between batches. Retries failed fetches with exponential backoff.
 */
export async function scrapeUrls(urls: string[]): Promise<ScrapeResult> {
  const allArticles: ScrapedArticle[] = [];
  const allErrors: { url: string; error: string }[] = [];

  // Separate RSS feeds from regular pages
  const rssUrls = urls.filter(isRSSUrl);
  const pageUrls = urls.filter((u) => !isRSSUrl(u));

  // Phase 1: Fetch and parse RSS feeds
  if (rssUrls.length > 0) {
    const { results: feeds, errors: feedErrors } = await processBatch(
      rssUrls,
      async (feedUrl) => {
        const xml = await fetchWithRetry(feedUrl);
        const items = parseRSSFeed(xml, feedUrl);
        return { feedUrl, items };
      },
      MAX_CONCURRENT,
      BATCH_DELAY_MS
    );

    for (const err of feedErrors) {
      allErrors.push({ url: err.item, error: err.error });
    }

    // Collect all article URLs from RSS items
    const rssArticleUrls = feeds.flatMap((f) =>
      f.items.map((item) => ({
        url: item.link,
        title: item.title,
        description: item.description,
        pubDate: item.pubDate,
        source: extractSourceName(f.feedUrl),
      }))
    );

    // For RSS items, we already have title + description.
    // Only fetch full page if description is too short.
    for (const item of rssArticleUrls) {
      if (item.description && item.description.length > 200) {
        allArticles.push({
          title: item.title,
          content: cleanText(item.description),
          url: item.url,
          source: item.source,
          publishedAt: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : null,
          wordCount: item.description.split(/\s+/).length,
        });
      } else {
        // Need to fetch the full page
        pageUrls.push(item.url);
      }
    }
  }

  // Phase 2: Fetch and extract individual pages
  if (pageUrls.length > 0) {
    const { results: pages, errors: pageErrors } = await processBatch(
      pageUrls,
      async (pageUrl) => {
        const html = await fetchWithRetry(pageUrl);
        const { title, content } = extractArticleContent(html, pageUrl);
        return {
          title,
          content,
          url: pageUrl,
          source: extractSourceName(pageUrl),
          publishedAt: null as string | null,
          wordCount: content.split(/\s+/).length,
        };
      },
      MAX_CONCURRENT,
      BATCH_DELAY_MS
    );

    allArticles.push(...pages);

    for (const err of pageErrors) {
      allErrors.push({ url: err.item, error: err.error });
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = allArticles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  return { articles: deduped, errors: allErrors };
}

/**
 * Scrape a single URL and return the extracted article.
 */
export async function scrapeSingleUrl(
  url: string
): Promise<ScrapedArticle> {
  const html = await fetchWithRetry(url);

  if (isRSSUrl(url)) {
    const items = parseRSSFeed(html, url);
    if (items.length === 0) throw new Error("No items found in RSS feed");
    const first = items[0];
    return {
      title: first.title,
      content: cleanText(first.description),
      url: first.link || url,
      source: extractSourceName(url),
      publishedAt: first.pubDate
        ? new Date(first.pubDate).toISOString()
        : null,
      wordCount: first.description.split(/\s+/).length,
    };
  }

  const { title, content } = extractArticleContent(html, url);
  return {
    title,
    content,
    url,
    source: extractSourceName(url),
    publishedAt: null,
    wordCount: content.split(/\s+/).length,
  };
}

// ─── Helpers ─────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
