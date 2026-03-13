# Khabri Intelligence Feed — Deep Diagnostic Audit

**Date:** 2026-03-13
**Auditor:** Claude (automated deep audit)
**Status:** CRITICAL ISSUES FOUND — pipeline is non-functional end-to-end

---

## Executive Summary

Khabri is architecturally complete but **operationally broken**. The hourly scan cron exists in Inngest but has **never run** (only 6 hand-seeded signals from March 10). Multiple critical issues prevent the pipeline from operating:

| Issue | Severity | Impact |
|-------|----------|--------|
| Khabri external API returns 401 (invalid key) | HIGH | Fallback data source dead |
| `GOOGLE_AI_API_KEY` env var missing (code expects it, Vercel has `GEMINI_API_KEY`) | CRITICAL | Embeddings disabled → no dedup, no vector search |
| `khabriHourlyScan` not in `vercel.json` crons | HIGH | Inngest cron never triggered in production |
| `signal.ready_for_narrative` event has no listener | HIGH | Auto-escalation to narrative trees broken |
| Narrative tree dedup broken → 13 copies of same story | HIGH | Data pollution |
| 9 of 11 FactDossiers are empty shells (0 facts, 0 stats, 0 quotes) | HIGH | Research synthesis failing silently |
| All 6 signals have sentiment "negative" — no diversity | MEDIUM | Seeded test data, not real ingestion |
| No `learning-loop` or `overdue-check` in vercel.json crons | MEDIUM | Learning loop never runs |

---

## 1. Database State Snapshot

### Row Counts

| Table | Count | Assessment |
|-------|-------|------------|
| signals | 6 | All from seed script (March 10) |
| trends | 3 | All from seed script |
| narrative_trees | 24 | 13 are duplicates of "Rupee falls..." |
| narrative_nodes | 17 | |
| fact_dossiers | 11 | 9 are empty shells |
| content_pieces | 3 | 2 PLANNED + 1 DRAFTED |
| deliverables | 12 | Mix of REVIEW, RELAYED, KILLED, APPROVED |

### Signal Data Quality

All 6 signals are from **seed data** (March 10, 2026). Zero signals from RSS ingestion.

```
ALL signals have: sentiment = "negative"
Sources: PTI, Economic Times, Mint, Reuters, Bloomberg, The Hindu
Event types: economic (4), political (1), social (1)
Credibility scores: 0.80-0.95 (reasonable range)
Duplicates: none (isDuplicate = false for all)
Age: 3 days old, no new signals since
```

### Trends

| Trend | Lifecycle | Velocity | Signals |
|-------|-----------|----------|---------|
| India-Iran Economic Corridor Tensions | peaking | 7.5 | 3 |
| Indian Tech Layoffs Q1 2026 | emerging | 4.2 | 2 |
| Rupee Depreciation Against Dollar | declining | 2.1 | 1 |

### Narrative Tree Duplication Problem

| Title | Copies |
|-------|--------|
| Rupee falls to 87.5 against dollar, RBI intervenes | **13** |
| TCS and Wipro follow suit with hiring freeze for FY27 | 2 |
| India-Iran Corridor: Geopolitical Chessboard | 2 |

**Root cause:** The `ingestSignal()` function in `src/lib/yantri/ingest-helper.ts` uses semantic similarity via pgvector to dedup. But `GOOGLE_AI_API_KEY` is not set → embeddings disabled → every signal creates a new tree instead of merging into existing ones.

### FactDossier Quality

| Created | Has Facts | Has Stats | Has Quotes |
|---------|-----------|-----------|------------|
| 2026-03-11 16:35 | 5 | 5 | 3 |
| 2026-03-11 20:20 | 5 | 5 | 3 |
| 2026-03-11 15:40 | 0 | 0 | 0 |
| 2026-03-12+ (9 records) | 0 | 0 | 0 |

Only 2 of 11 dossiers contain actual research. The remaining 9 are empty shells — the `factDossierSync` Inngest function is likely failing silently during LLM synthesis.

---

## 2. Architecture Map

### File Inventory

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| External API client | `src/lib/khabri.ts` | ~200 | Wrapper for khabri.stallone.co.in |
| Type definitions | `src/types/khabri.ts` | ~216 | Signal, Trend, Anomaly, Narrative types |
| RSS Scraper | `src/lib/khabri/scraper.ts` | ~200 | 12 RSS feed scraper |
| Vector Store | `src/lib/khabri/vector-store.ts` | ~150 | pgvector embeddings + dedup |
| Anomaly Detection | `src/lib/khabri/algorithms/anomaly.ts` | ~80 | Z-score spike detection |
| Hourly Scan | `src/lib/inngest/khabri-workflows.ts` | ~200 | Inngest cron: scrape + enrich + store |
| Signal Enrichment | `src/lib/inngest/functions.ts` | ~150 | Multi-step signal enrichment |
| Ingest Helper | `src/lib/yantri/ingest-helper.ts` | ~150 | Signal → NarrativeTree creation |
| Gap Analysis | `src/lib/yantri/inngest/functions.ts` | ~150 | Tree → Dossier → ContentPiece |
| Strategist | `src/lib/yantri/strategist.ts` | ~354 | Brand-platform assignment |
| Deliverable Pipelines | `src/lib/yantri/inngest/deliverable-pipelines.ts` | ~400 | Platform-specific content gen |

### API Routes (27 total touching Khabri)

**Khabri module:** (17 routes)
- `GET /api/khabri/signals` — List signals (local DB → external fallback)
- `GET /api/khabri/signals/search` — Full-text search
- `GET /api/khabri/signals/:id` — Single signal
- `GET /api/khabri/trends` — List trends
- `GET /api/khabri/trends/top` — Top N trends
- `GET /api/khabri/trends/:id/signals` — Signals in a trend
- `GET /api/khabri/narratives` — List narrative trees
- `GET /api/khabri/narratives/:id` — Single narrative
- `GET /api/khabri/narratives/:id/timeline` — Timeline events
- `GET /api/khabri/narratives/:id/stakeholders` — Stakeholders
- `GET /api/khabri/anomalies` — Volume anomalies
- `GET /api/khabri/anomalies/trending` — Trending anomalies
- `GET /api/khabri/analytics/sentiment` — Sentiment timeline
- `GET /api/khabri/analytics/volume` — Signal volume
- `GET /api/khabri/analytics/categories` — Category distribution
- `GET /api/khabri/geo/hotspots` — Geographic hotspots
- `GET /api/khabri/geo/:countryCode` — Country intel

**Signals module:** (7 routes)
- `POST /api/signals/ingest` — Manual signal ingestion
- `POST /api/signals/promote` — Promote trend → NarrativeTree
- `GET /api/signals/trends` — Trends with lifecycle filter
- `GET /api/signals/trends/:id` — Single trend detail
- `GET /api/signals/trends/:id/signals` — Signals in trend
- `GET /api/signals/trends/:id/related` — Related trend graph
- `GET /api/signals/velocity` — Real-time velocity rankings

### External Data Sources

1. **12 RSS feeds** — NDTV, The Hindu, ToI, Indian Express, LiveMint, BBC, NYT, Al Jazeera, TechCrunch, Hacker News, Economic Times, MoneyControl
2. **Khabri external API** (`khabri.stallone.co.in`) — **DEAD** (401 Invalid API key)
3. **Google Generative AI** — text-embedding-004 for vectors — **NOT CONFIGURED** (wrong env var name)

---

## 3. Pipeline Flow Analysis

### Intended Flow

```
RSS Feeds (12 sources)
    ↓  [khabriHourlyScan — cron every hour]
Scrape → Dedup (vector) → Enrich (skills) → Trend Resolution → Insert DB
    ↓  [for urgent signals, impactScore > 8.0]
khabri/signal.process event
    ↓  [processSignal — multi-step enrichment]
Credibility scoring → Geo-mapping → Event detection → Escalation check
    ↓  [if BREAKING or CRISIS]
signal.ready_for_narrative event
    ↓  [ingestSignal()]
Create/merge NarrativeTree → yantri/tree.created event
    ↓  [gapAnalysisOnIngest]
Gap analysis → Build FactDossier → Run Strategist → Create ContentPieces
    ↓  [contentPiecePipeline]
Draft content → Fact-check → Create Deliverable
    ↓  [platform pipeline]
viralMicroPipeline | carouselPipeline | cinematicPipeline | reelPipeline
    ↓
Status: REVIEW → Editor approval → Publish via Relay
```

### What's Actually Working vs Broken

| Pipeline Stage | Status | Problem |
|----------------|--------|---------|
| RSS scraping (scraper.ts) | ✅ Code works | Never triggered (no cron) |
| Deduplication (vector-store.ts) | ❌ BROKEN | `GOOGLE_AI_API_KEY` not set → embeddings disabled |
| Skill enrichment (event-detection.md) | ✅ Code works | Never triggered |
| Trend resolution | ✅ Code works | Never triggered |
| Signal insert + embedding | ❌ BROKEN | No embeddings stored (missing API key) |
| Anomaly detection | ✅ Code works | Never triggered (no data flow) |
| `khabri/signal.process` event → processSignal | ✅ Code works | Never triggered |
| `signal.ready_for_narrative` → ? | ❌ BROKEN | **No Inngest listener exists** |
| ingestSignal() → NarrativeTree | ⚠️ Partial | Works when called manually but creates duplicates (no embedding dedup) |
| gapAnalysisOnIngest → FactDossier | ⚠️ Partial | Fires but dossiers are empty (LLM synthesis failing) |
| contentPiecePipeline | ✅ Works | Only 3 pieces created (manual testing) |
| Deliverable pipelines | ✅ Works | 12 deliverables generated successfully |
| Publishing via Relay | ✅ Works | 2 RELAYED deliverables confirm real platform posts |

---

## 4. Critical Issues Detail

### ISSUE 1: `khabriHourlyScan` never runs in production

**Severity:** CRITICAL
**Root cause:** The Inngest cron `khabriHourlyScan` is registered with Inngest (via `/api/inngest` route) but Inngest needs to be able to call this endpoint. In production on Vercel, the Inngest cloud service invokes crons — but the function registration must happen via the Inngest dashboard or by Inngest discovering the function at deploy time.

**Evidence:** Zero signals from RSS ingestion. All 6 signals are hand-seeded test data from March 10.

**Additionally:** `vercel.json` only has crons for `relay-executor` and `performance-sync`. The `learning-loop` and `overdue-check` crons are not configured there either. However, Inngest crons are separate from Vercel crons — they're managed by the Inngest platform itself. The real question is whether the Inngest cloud is properly connected.

**Fix needed:**
1. Verify Inngest cloud dashboard shows `khabri-hourly-scan` function registered
2. Verify Inngest can reach `/api/inngest` endpoint on production
3. Check Inngest event logs for any cron execution attempts

### ISSUE 2: Env var mismatch — `GOOGLE_AI_API_KEY` vs `GEMINI_API_KEY`

**Severity:** CRITICAL
**Root cause:** `src/lib/khabri/vector-store.ts` line 38 reads `process.env.GOOGLE_AI_API_KEY`. But the Vercel env has `GEMINI_API_KEY`. The rest of the codebase (Yantri, embeddings, image gen) correctly uses `GEMINI_API_KEY`.

**Impact:**
- `insertSignalWithEmbedding()` → embeddings disabled, stores null vectors
- `checkDuplicate()` → always returns "not duplicate" → every signal creates new tree
- Vector similarity search → broken → narrative tree deduplication broken

**Evidence:** 13 copies of "Rupee falls to 87.5 against dollar, RBI intervenes" in narrative_trees

**Fix:** Change `vector-store.ts` line 38 from `GOOGLE_AI_API_KEY` to `GEMINI_API_KEY`

### ISSUE 3: External Khabri API dead (401)

**Severity:** HIGH
**Root cause:** `KHABRI_API_KEY` returns 401 "Invalid API key" against `https://khabri.stallone.co.in/api/v1/`

**Impact:** All 17 Khabri API routes have a "local DB first, fallback to external API" pattern. With only 6 stale signals locally AND the external API dead, the Intelligence dashboard shows almost nothing.

**Fix:** Either fix the API key or remove external API dependency entirely (the RSS scraper makes it unnecessary)

### ISSUE 4: `signal.ready_for_narrative` event has no handler

**Severity:** HIGH
**Root cause:** In `src/lib/inngest/functions.ts`, the `processSignal` function emits `signal.ready_for_narrative` via `daftarEvents.emitEvent()` when a signal is assessed as BREAKING/CRISIS. But:
1. This is an in-process EventEmitter, not an Inngest event
2. No code listens for this event
3. The bridge from Khabri signals → Yantri narrative trees only works when a user manually clicks "Research" on the Intelligence page

**Impact:** High-priority signals never auto-flow into the narrative pipeline. The only path is manual user action.

**Fix:** Create an Inngest function that:
1. Listens for `khabri/signal.process` completion
2. If escalation level is BREAKING/CRISIS, calls `ingestSignal()` to create a NarrativeTree
3. This closes the automation gap

### ISSUE 5: FactDossiers mostly empty

**Severity:** HIGH
**Root cause:** 9 of 11 FactDossiers have `structuredData.facts = []`, `stats = []`, `quotes = []`. Only the 2 earliest dossiers (March 11) have real data.

**Likely cause:** The `factDossierSync` Inngest function calls Gemini to synthesize research. If the LLM call fails or returns malformed JSON, the dossier is created as an empty shell. There's no error propagation or retry visible.

**Fix:** Add structured error handling and retry logic in `factDossierSync`. Log LLM response for debugging.

### ISSUE 6: No Vercel crons for learning-loop or overdue-check

**Severity:** MEDIUM
**Root cause:** `vercel.json` only lists `relay-executor` and `performance-sync`. The `/api/cron/learning-loop` and `/api/cron/overdue-check` endpoints exist but are never called.

**Fix:** Add to `vercel.json`:
```json
{ "path": "/api/cron/learning-loop", "schedule": "0 3 * * *" },
{ "path": "/api/cron/overdue-check", "schedule": "0 */4 * * *" }
```

---

## 5. Frontend Analysis

### Intelligence Page (`/intelligence`)

Three tabs: **Signals**, **Trends**, **Research**

#### Signals Tab
- Calls: `GET /api/khabri/signals?page={page}&pageSize=25`
- Search: `GET /api/khabri/signals/search?q={query}`
- Actions per signal:
  - **Create Content** → navigates to `/content-studio?topic={title}&signalId={id}&auto=true` ✅
  - **Research** → `POST /api/yantri/fact-engine` with `{ signalId }` → creates NarrativeTree + FactDossier ✅
  - **Open Source** → external link ✅

#### Trends Tab
- Calls: `GET /api/khabri/trends?page={page}&pageSize=20`
- Expand trend: `GET /api/khabri/trends/{id}/signals?limit=10`
- Actions per trend:
  - **Create Content** → `/content-studio?topic={topic}&auto=true` ✅
  - **View Signals** → expands card with lazy-loaded signals ✅

#### Research Tab
- Calls: `GET /api/yantri/narrative-trees?status={status}`
- Status filter: All, Incoming, Evaluating, Approved, In Production, Completed, Skipped
- Actions: Click tree → navigates to `/m/yantri/narrative-trees/{treeId}` ✅

### Frontend Assessment

The frontend is **well-implemented and functional**. The problem is entirely backend/data:
- API calls are correct
- Navigation flows work
- Query params passed correctly
- No hardcoded mock data (all from real API calls)

---

## 6. Event Chain Completeness

```
✅ khabriHourlyScan [cron: 0 * * * *]
   └─ Scrape → Dedup → Enrich → Trends → Insert → Anomalies
   └─ Emits: khabri/signal.process (urgent only)
         ✅ processSignal [listens: khabri/signal.process]
            └─ Credibility → Geo → Event → Escalation
            └─ Emits: signal.ready_for_narrative (in-process EventEmitter)
                  ❌ NO LISTENER — broken link

✅ ingestSignal() [called manually or via /api/yantri/fact-engine]
   └─ Embed → Dedup → Summarize → Create NarrativeTree
   └─ Emits: yantri/tree.created
         ✅ gapAnalysisOnIngest [listens: tree.created, tree.updated]
            └─ Gap analysis → Check dossier
            └─ Emits: yantri/dossier.build (if no dossier)
                  ✅ factDossierSync [listens: yantri/dossier.build]
                     └─ Synthesize FactDossier via Gemini
            └─ Runs strategist → Creates ContentPieces

✅ contentPiecePipeline [listens: yantri/pipeline.run]
   └─ Draft → Fact-check → Create Deliverable
   └─ Emits: yantri/deliverable.{type}
         ✅ viralMicroPipeline [listens: yantri/deliverable.viral-micro]
         ✅ carouselPipeline [listens: yantri/deliverable.carousel]
         ✅ cinematicPipeline [listens: yantri/deliverable.cinematic]
         ✅ reelPipeline [listens: yantri/deliverable.reel]
```

**Broken links:**
1. `signal.ready_for_narrative` → nothing (auto-escalation dead)
2. `khabriHourlyScan` → never fires (Inngest cron not triggering)
3. Vector dedup → disabled (wrong env var)

---

## 7. Recommended Fixes (Priority Order)

### P0 — Must fix for pipeline to work at all

1. **Fix env var mismatch** — Change `vector-store.ts:38` from `GOOGLE_AI_API_KEY` to `GEMINI_API_KEY`
2. **Verify Inngest cron fires** — Check Inngest dashboard for `khabri-hourly-scan` registration. If not registered, the Inngest cloud may not be discovering functions at `/api/inngest`.
3. **Fix or rotate Khabri API key** — Current key returns 401. Either update the key in Vercel env or remove external API dependency.

### P1 — Must fix for automation

4. **Wire `signal.ready_for_narrative`** — Create Inngest function listening for `khabri/signal.enriched` or a new event, that calls `ingestSignal()` for BREAKING/CRISIS signals.
5. **Fix FactDossier synthesis** — Debug why 9 of 11 dossiers are empty. Add error logging to `factDossierSync`.
6. **Deduplicate existing narrative trees** — Clean up the 13 copies of "Rupee falls..." and other duplicates.

### P2 — Should fix for operational completeness

7. **Add missing Vercel crons** — Add `learning-loop` and `overdue-check` to `vercel.json`.
8. **Add production monitoring** — Log scan success/failure counts to a persistent store or monitoring service.
9. **Seed fresh test data** — Run the hourly scan once manually to populate real RSS-scraped signals.

---

## 8. Verification Commands

After fixes, verify with these checks:

```bash
# 1. Check embeddings work
# After fixing env var, call /api/signals/ingest with a test signal
# Verify the signal has a non-null embedding in DB

# 2. Check hourly scan fires
# Go to Inngest dashboard → Functions → khabri-hourly-scan
# Check for recent runs

# 3. Check signal count growing
# SELECT count(*) FROM signals WHERE "detectedAt" > NOW() - INTERVAL '1 day';

# 4. Check dedup works
# Ingest the same signal twice → verify narrative_trees count doesn't increase

# 5. Check dossier quality
# After a tree is created, check its FactDossier has facts.length > 0
```

---

## Appendix: Environment Variables

| Variable | Status | Used By |
|----------|--------|---------|
| `DATABASE_URL` | ✅ Set (Production) | Prisma |
| `GEMINI_API_KEY` | ✅ Set | Yantri, embeddings, image gen |
| `GOOGLE_AI_API_KEY` | ❌ NOT SET | vector-store.ts (should use GEMINI_API_KEY) |
| `KHABRI_API_KEY` | ⚠️ Set but INVALID | External Khabri API fallback |
| `INNGEST_EVENT_KEY` | ✅ Set | Inngest event bus |
| `INNGEST_SIGNING_KEY` | ✅ Set | Inngest webhook verification |
| `ANTHROPIC_API_KEY` | ✅ Set | GI chat (Claude) |
| `ELEVENLABS_API_KEY` | ✅ Set | Voice generation |
| `CRON_SECRET` | ❓ Unknown | Vercel cron auth (not in env list) |
