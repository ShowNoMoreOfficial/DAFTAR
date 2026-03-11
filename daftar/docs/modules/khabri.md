# Khabri -- Signal Intelligence

## What it does

Khabri is the signal intelligence module. It detects, tracks, and analyzes news signals from multiple sources to identify trends, anomalies, and narratives relevant to the organization's brands. Every hour, a background job scrapes 12 RSS feeds (Indian news, world affairs, tech, finance), deduplicates against existing signals using vector similarity, enriches each signal via LLM-based skill orchestration (classifying event type, impact score, sentiment, stakeholders, geo-relevance), and stores the results with 768-dimension vector embeddings for semantic search.

The module provides trend lifecycle tracking (emerging, peaking, declining, resurgent), anomaly detection based on volume spikes and velocity scoring, narrative extraction that maps related signals into narrative trees, and geographic intelligence breakdowns.

All API routes implement a **dual-source fallback pattern**: they first attempt to read from the local PostgreSQL database. If no local data is found, they fall back to an external API at `khabri.stallone.co.in`. This allows the system to work during the transition from external to local data.

## Database models

### Signal
- `id` (cuid, PK)
- `trendId` (String -- FK to Trend, cascade delete)
- `title` (String)
- `content` (Text, optional)
- `source` (String -- e.g. "ndtv", "bbc", "techcrunch")
- `sourceCredibility` (Float, optional -- 0-1 score, computed by tier: tier1=0.92, tier2=0.82, unknown=0.65)
- `eventType` (String, optional -- "war", "political", "economic", "social", etc.)
- `stakeholders` (Json, optional -- key people/organizations involved)
- `eventMarkers` (Json, optional -- timestamps, locations, key facts)
- `visualAnchors` (Json, optional -- image URLs, video clips, infographic links)
- `geoRelevance` (Json, optional -- e.g. `{ "india": 0.9, "us": 0.3, "global": 0.7 }`)
- `sentiment` (String, optional -- "positive", "negative", "neutral", "mixed")
- `embedding` (vector(768), optional -- pgvector embedding for similarity search)
- `detectedAt` (DateTime, default now)
- `isDuplicate` (Boolean, default false)
- `duplicateOfId` (String, optional)
- Indexes: `[trendId]`, `[source]`, `[detectedAt]`

### Trend
- `id` (cuid, PK)
- `name` (String)
- `description` (Text, optional)
- `lifecycle` (String, default "emerging" -- "emerging", "peaking", "declining", "resurgent")
- `velocityScore` (Float, optional -- higher means faster-growing)
- `signals` (relation to Signal[])
- `relatedTrends` / `relatedFrom` (relation to TrendRelation[])
- `createdAt` / `updatedAt` (DateTime)
- Index: `[lifecycle]`

### TrendRelation
- `id` (cuid, PK)
- `sourceTrendId` (String -- FK to Trend, cascade delete)
- `relatedTrendId` (String -- FK to Trend, cascade delete)
- `relationship` (String -- "causes", "related_to", "contradicts", "escalates")
- `strength` (Float -- 0-1)
- Unique constraint: `[sourceTrendId, relatedTrendId]`

## API routes

### Signals

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/khabri/signals` | Yes | List signals with pagination. Params: `page`, `pageSize`. Local DB first (non-duplicate signals ordered by detectedAt desc), falls back to external API. Maps local signals to a normalized shape with `category`, `entities`, `sentiment` fields. |
| GET | `/api/khabri/signals/search?q=...` | Yes | Search signals by title or content (case-insensitive contains). Params: `q` (required), `page`, `pageSize`. Local DB first, falls back to external `searchSignals()`. |

### Trends

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/khabri/trends` | Yes | List trends with pagination. Params: `page`, `pageSize`. Returns trends with signal counts, velocity scores, lifecycle status. Local DB first, falls back to external API. |
| GET | `/api/khabri/trends/top` | Yes | Top trends by velocity score. Params: `limit` (default 10). Local DB first, falls back to external API. |

### Narratives

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/khabri/narratives` | Yes | List narratives (locally backed by NarrativeTree model). Params: `page`, `pageSize`. Returns summary, keywords (from signal titles), signal count, phase (EMERGENCE/PEAK/RESOLUTION mapped from NarrativeStatus). Local DB first, falls back to external API. |
| GET | `/api/khabri/narratives/[id]` | Yes | Get single narrative with signals, dossier data, and content pieces. Local DB loads NarrativeTree with nodes and dossier, falls back to external API. |
| GET | `/api/khabri/narratives/[id]/timeline` | Yes | Get narrative timeline. Builds chronological timeline from narrative nodes and dossier timeline events. Each entry has `id`, `timestamp`, `summary`, `type` (signal or event). |
| GET | `/api/khabri/narratives/[id]/stakeholders` | Yes | Get stakeholders for a narrative. Extracts from dossier quotes and signal stakeholder data. Returns `name`, `role`, `mentions`. |

### Anomalies

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/khabri/anomalies` | Yes | Detect anomalies. Params: `severity` (filter). Local detection: compares 24h signal count vs 7-day daily average. Spike > 2x = ELEVATED, > 3x = HIGH, > 4x = CRITICAL. Falls back to external API. |
| GET | `/api/khabri/anomalies/trending` | Yes | Get trending anomalies. Local: finds trends with velocityScore > 5, classifies as ELEVATED/HIGH/CRITICAL. Falls back to external API. |

### Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/khabri/analytics/categories` | Yes | Category distribution. Params: `hours` (default 24). Groups signals by `eventType`, returns counts and percentages. Local DB first, falls back to external API. |
| GET | `/api/khabri/analytics/sentiment` | Yes | Sentiment analysis. Params: `hours` (default 24), `interval` ("hour" or "day"), `source` ("external", "local", or both). Returns both external API sentiment timeline and local signal sentiment breakdown. |
| PATCH | `/api/khabri/analytics/sentiment` | Yes | Editorial sentiment override. Body: `{ signalId, sentiment }`. Updates a specific signal's sentiment (positive, negative, neutral, mixed). |
| GET | `/api/khabri/analytics/volume` | Yes | Signal volume over time. Params: `hours` (default 24), `interval` ("hour" or "day"). Returns time-bucketed signal counts. Local DB first, falls back to external API. |

### Geo

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/khabri/geo/hotspots` | Yes | Geographic hotspots. Params: `hours` (default 24), `limit` (default 10). External API only (no local fallback). |
| GET | `/api/khabri/geo/[countryCode]` | Yes | Country-specific intelligence. External API only (no local fallback). |

### Request/Response shapes

**GET /api/khabri/signals (response):**
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "source": "ndtv",
      "category": "political",
      "isEnriched": true,
      "entities": [{ "name": "string", "type": "person", "salience": 0.8 }],
      "sentiment": { "label": "NEGATIVE", "score": -0.5 },
      "createdAt": "ISO date",
      "publishedAt": "ISO date"
    }
  ],
  "meta": { "total": 250, "page": 1, "pageSize": 25, "hasMore": true, "source": "local" }
}
```

**GET /api/khabri/anomalies (response):**
```json
{
  "data": [
    {
      "id": "local-volume-spike-2026-03-11",
      "type": "KEYWORD_SPIKE",
      "severity": "ELEVATED",
      "subject": "Signal Volume Spike",
      "description": "45 signals in last 24h vs 15 daily average",
      "deviation": 3.0,
      "baseline": 15,
      "current": 45,
      "detectedAt": "ISO date"
    }
  ],
  "meta": { "total": 1, "page": 1, "pageSize": 25, "hasMore": false, "source": "local" }
}
```

## UI pages

All Khabri pages are under `src/app/(shell)/m/khabri/`.

| Path | Page | Description |
|------|------|-------------|
| `/m/khabri` | Dashboard | Main Khabri dashboard with overview of signals, trends, and anomalies |
| `/m/khabri/signals` | Signals | Browse and search all detected signals with filtering |
| `/m/khabri/trends` | Trends | View and explore trend lifecycle, velocity scores, and related trends |
| `/m/khabri/narratives` | Narratives | Narrative clusters with timeline and stakeholder views |
| `/m/khabri/geo` | Geo Intelligence | Geographic hotspot visualization and country-level intelligence |
| `/m/khabri/analytics` | Analytics | Volume charts, sentiment analysis, category distribution |

Layout: `src/app/(shell)/m/khabri/layout.tsx` -- shared navigation across Khabri sub-pages.

## Background jobs (Inngest)

### khabriHourlyScan (cron: `0 * * * *`)

**File:** `src/lib/inngest/khabri-workflows.ts`

Runs every hour at :00. Concurrency limited to 1 (prevents overlap if previous run is slow). Retries: 1.

**Pipeline steps:**

1. **scrape-feeds** -- Scrapes 12 monitored RSS feeds:
   - Indian news: NDTV, The Hindu, Times of India, Indian Express, LiveMint
   - World affairs: BBC World, NYT World, Al Jazeera
   - Tech: TechCrunch, The Hacker News
   - Finance: Economic Times, MoneyControl
   - Truncates content to 5000 chars per article for step serialization

2. **deduplicate** -- Checks each scraped article against existing signals using `checkDuplicate()` (vector similarity). Filters out duplicates.

3. **enrich-batch-N** -- Processes new articles in batches of 5 via SkillOrchestrator. Uses the `signals/detection/event-detection.md` skill to classify each signal:
   - `eventType` (political, economic, social, etc.)
   - `impactScore` (0-10)
   - `sentiment` (positive, negative, neutral, mixed)
   - `stakeholders` (array of names)
   - `geoRelevance` (country-score map)
   - Falls back to defaults if skill execution fails

4. **resolve-trends** -- Assigns each signal to a trend via keyword matching against active trends (emerging/peaking). Creates an "Unclassified Signals" catch-all trend if needed. Matches when 2+ words overlap between trend name and signal title.

5. **persist-signals** -- Vectorizes and stores all enriched signals via `insertSignalWithEmbedding()`. Computes source credibility: tier1 sources (reuters, bbc, nytimes, thehindu, etc.) get 0.92, tier2 (ndtv, techcrunch, etc.) get 0.82, unknown sources get 0.65.

6. **check-anomalies** -- Analyzes hourly signal volume over the last 7 days using the `detectAnomaly()` algorithm. Emits `KHABRI_VOLUME_ANOMALY` event if a spike is detected.

7. **emit-urgent-signals** -- For signals with impactScore > 8.0, emits `KHABRI_URGENT_SIGNAL_DETECTED` event and triggers the `khabri/signal.process` Inngest event for deep enrichment.

## Known issues and gaps

1. **~~UI reads from EXTERNAL API~~ FIXED.** Khabri UI now reads from local DB first, with external API (`khabri.stallone.co.in`) as fallback only when local data is sparse. The dual-source fallback pattern remains for resilience.
2. **Geo routes are external-only** -- `/api/khabri/geo/hotspots` and `/api/khabri/geo/[countryCode]` have no local DB fallback. They always call the external API.
3. **Trend clustering is keyword-based** -- Trend assignment uses simple word overlap matching (2+ words) rather than embedding similarity. This leads to many signals being assigned to the "Unclassified Signals" catch-all trend.
4. **No manual signal creation** -- There is no POST endpoint for manually creating signals. All signals come from the hourly scrape or external API.
5. **Narrative data comes from NarrativeTree** -- The narratives endpoints use the Yantri NarrativeTree model locally, which creates a tight coupling between Khabri and Yantri.
6. **Sentiment override is disconnected** -- The PATCH endpoint on `/api/khabri/analytics/sentiment` updates signal sentiment, but this doesn't trigger re-computation of trend-level sentiment aggregates.
7. **Duplicate detection may miss paraphrased content** -- Deduplication uses `checkDuplicate()` which relies on vector similarity, but the threshold and approach may miss semantically similar articles with different wording.

## Dependencies on other modules

- **Yantri** -- NarrativeTree model is used for narrative endpoints. Khabri signals feed into Yantri narrative trees as nodes. The Yantri trend import page reads from Khabri trends.
- **Skill Orchestrator** -- The hourly scan uses `skillOrchestrator.executeSkill()` for signal enrichment, which depends on the configured LLM (Gemini).
- **Vector Store** -- `src/lib/khabri/vector-store.ts` provides `generateEmbedding()`, `insertSignalWithEmbedding()`, and `checkDuplicate()`. Uses pgvector for 768-dimension embeddings.
- **Event Bus** -- Emits `KHABRI_VOLUME_ANOMALY` and `KHABRI_URGENT_SIGNAL_DETECTED` events that GI and other modules listen to.
- **External API** -- Falls back to `khabri.stallone.co.in` for all data when local DB is empty. Functions: `getSignals()`, `getTrends()`, `getTopTrends()`, `getNarratives()`, `getNarrativeTree()`, `getNarrativeTimeline()`, `getNarrativeStakeholders()`, `getAnomalies()`, `getTrendingAnomalies()`, `getCategoryDistribution()`, `getSentimentAnalysis()`, `getSignalVolume()`, `getGeoHotspots()`, `getCountryIntel()`, `searchSignals()`.
- **Scraper** -- `src/lib/khabri/scraper.ts` handles RSS feed scraping with `scrapeUrls()`.
- **Anomaly Detection** -- `src/lib/khabri/algorithms/anomaly.ts` provides `detectAnomaly()` for volume spike detection.
