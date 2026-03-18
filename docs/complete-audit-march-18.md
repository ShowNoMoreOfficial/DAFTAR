# DAFTAR — Complete Project Audit

**Date:** March 18, 2026
**Auditor:** Claude Code (automated)
**Repo:** https://github.com/ShowNoMoreOfficial/DAFTAR.git
**Live:** https://daftar-one.vercel.app

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Health Score** | **72 / 100** |
| Critical Issues | 5 |
| High Issues | 5 |
| Medium Issues | 6 |
| Passed Checks | 18 |

The platform is architecturally sound with a clean build, strong auth coverage, and a well-designed dual-LLM strategy. The main weaknesses are **broken asset URLs (52%)**, **missing error handling in 56% of API routes**, **stale signal data**, **zero OAuth accounts** (no one has logged in via OAuth), and **29 npm vulnerabilities**. No security-critical exploits found.

---

## 1. Database Health

### 1.1 Table Sizes (Top 15)

| Table | Size |
|-------|------|
| assets | 23 MB |
| skill_executions | 2,520 kB |
| fact_dossiers | 480 kB |
| skills | 336 kB |
| deliverables | 312 kB |
| narrative_trees | 144 kB |
| tasks | 128 kB |
| signals | 120 kB |
| content_posts | 120 kB |
| articles | 112 kB |
| gi_conversations | 104 kB |
| announcements | 104 kB |
| gi_predictions | 96 kB |
| expenses | 96 kB |
| content_pieces | 96 kB |

**Total database footprint:** ~28 MB across 30+ tables. `assets` dominates at 23 MB (base64-encoded images stored in DB).

### 1.2 Row Counts (All Tables)

| Table | Rows | Status |
|-------|------|--------|
| users | 8 | Seed data |
| brands | 2 | The Squirrels, Breaking Tube |
| signals | 6 | Stale (all from March 10) |
| trends | 3 | |
| narrative_trees | 23 | 5 duplicate groups |
| narratives | 0 | Empty |
| narrative_nodes | 7 | |
| fact_dossiers | 18 | |
| content_pieces | 3 | All PLANNED |
| deliverables | 26 | Mixed statuses |
| assets | 77 | 52% broken URLs |
| tasks | 9 | |
| task_comments | 0 | Empty |
| task_activities | 13 | |
| skills | 155 | Synced from disk |
| skill_executions | 596 | Active |
| content_posts | 28 | |
| post_analytics | 0 | Empty |
| content_performances | 6 | |
| announcements | 5 | |
| notifications | 2 | |
| invoices | 1 | |
| expenses | 56 | |
| platform_connections | 0 | **None** — Relay can't publish |
| team_feedbacks | 1 | |
| gi_conversations | 3 | |
| gi_predictions | 18 | |
| gi_autonomous_actions | 18 | |
| gi_learning_logs | 24 | |
| gi_pattern_logs | 0 | Empty |
| prompt_templates | 0 | Empty |
| platform_rules | 0 | Empty |
| platform_configs | 5 | |
| credibility_scores | 0 | Empty |
| user_streaks | 7 | |
| departments | 8 | |
| department_members | 6 | |
| clients | 2 | |
| user_brand_access | 16 | 8 users x 2 brands |
| accounts | 0 | **No OAuth accounts** |
| sessions | 0 | **No active sessions** |
| articles | 5 | Vritti |
| article_categories | 4 | |
| ad_campaigns | N/A | Table not found (uses `ppc_campaigns`) |

### 1.3 Data Quality

#### Duplicate Signals
None found.

#### Duplicate Narrative Trees
**5 groups of duplicates detected:**
- "Okay, I will create a research dossier on the topi..." (3x)
- "Okay, I will compile a research dossier on the Cha..." (3x)
- "Okay, I will create a comprehensive research dossi..." (3x)
- "Okay, I will compile a research dossier on the top..." (2x)
- "Okay, I will create a research dossier on the Indi..." (2x)

These appear to be LLM-generated summaries stored as trees — likely from repeated pipeline runs without deduplication.

#### Orphaned Records
| Check | Count |
|-------|-------|
| Orphan assets (no deliverable) | 0 |
| Orphan tasks (missing assignee) | 0 |
| Orphan notifications (missing user) | 0 |
| Orphan dept members (missing user) | 0 |

**No orphaned records.** Referential integrity is clean.

### 1.4 Signal Freshness

| Metric | Value |
|--------|-------|
| Total signals | 6 |
| Last 24 hours | 0 |
| Last 7 days | 0 |
| Oldest | March 10, 2026 |
| Newest | March 10, 2026 |

**All signals are 8+ days stale.** The Khabri scan cron either isn't running or RSS sources aren't yielding new signals.

### 1.5 Deliverable Pipeline State

| Status | Platform | Pipeline | Count |
|--------|----------|----------|-------|
| PLANNED | YOUTUBE | standard | 1 |
| REVIEW | X_THREAD | viral_micro | 6 |
| REVIEW | YOUTUBE | cinematic | 4 |
| REVIEW | META_REEL | viral_micro | 3 |
| REVIEW | META_CAROUSEL | carousel | 2 |
| REVIEW | META_POST | instagram_story | 1 |
| REVIEW | X_SINGLE | viral_micro | 1 |
| REVIEW | YOUTUBE | viral_micro | 1 |
| APPROVED | X_THREAD | viral_micro | 2 |
| RELAYED | YOUTUBE | viral_micro | 1 |
| RELAYED | X_SINGLE | viral_micro | 1 |
| RELAYED | YOUTUBE | cinematic | 1 |
| RELAYED | X_THREAD | viral_micro | 1 |
| KILLED | X_SINGLE | viral_micro | 1 |

**26 deliverables total.** 18 in REVIEW (69%), 2 APPROVED, 4 RELAYED, 1 KILLED, 1 PLANNED.

### 1.6 Asset Health

| Type | Total | HTTP URLs | Base64 | Null | Broken |
|------|-------|-----------|--------|------|--------|
| SOCIAL_CARD | 22 | 1 | 8 | 0 | **13** |
| THUMBNAIL | 24 | 2 | 5 | 0 | **17** |
| CAROUSEL_SLIDE | 20 | 11 | 0 | 0 | **9** |
| IMAGE | 11 | 10 | 0 | 0 | **1** |
| **TOTAL** | **77** | **24** | **13** | **0** | **40** |

**40 out of 77 assets (52%) have broken URLs** — not HTTP, not base64, not null. These are likely local file paths or placeholder strings that were never resolved to real URLs.

### 1.7 User Accounts

| Role | Name | Email | Active | Brands | OAuth | Dept |
|------|------|-------|--------|--------|-------|------|
| ADMIN | Lavan | lavan@shownomore.com | true | 2 | 0 | Yes |
| ADMIN | ShowNo More | shownomoreofficial@gmail.com | true | 2 | 0 | No |
| ADMIN | Stallone | stallone@shownomore.com | true | 2 | 0 | Yes |
| HEAD_HR | Muskan | muskan@shownomore.com | true | 2 | 0 | Yes |
| MEMBER | Deepak | deepaks@shownomore.com | true | 2 | 0 | Yes |
| MEMBER | Parth | parth@shownomore.com | true | 2 | 0 | Yes |
| MEMBER | Sudhanshu | sudhanshu@shownomore.com | true | 2 | 0 | Yes |
| CLIENT | Bhupendra Chaubey | thesquirrels@shownomore.com | true | 2 | 0 | No |

**8 users total.** All active. **Zero OAuth accounts** — no user has completed OAuth login (Google/Microsoft). The `accounts` and `sessions` tables are empty.

### 1.8 Skill Utilization (Database)

| Module | Total Skills | Used | Executions |
|--------|-------------|------|------------|
| relay | 45 | 14 | 96 |
| daftar | 39 | 6 | 51 |
| yantri | 27 | 14 | 282 |
| pms | 22 | 5 | 21 |
| hoccr | 12 | 0 | 0 |
| khabri | 9 | 1 | 146 |
| gi | 1 | 0 | 0 |
| **TOTAL** | **155** | **40** | **596** |

**40 of 155 skills (26%) have ever been executed.** Yantri and Khabri are the most active. HOCCR and GI skills have zero executions.

### 1.9 Other Data

| Metric | Value |
|--------|-------|
| GI Conversations | 3 (3 unique users, last: March 18) |
| Platform Connections | 0 (none configured) |
| Content Performances | 6 records |
| Post Analytics | 0 records |
| Invoices | 1 |
| Expenses | 56 |
| Tasks | 9 (6 CREATED, 1 ASSIGNED, 2 IN_PROGRESS) |

---

## 2. API Routes

### 2.1 Summary

| Metric | Count | Percentage |
|--------|-------|-----------|
| **Total Routes** | **224** | 100% |
| Routes with auth | 213 | **95.1%** |
| Routes without auth | 11 | 4.9% |
| Routes with try/catch | 98 | **43.8%** |
| Routes without try/catch | 126 | **56.2%** |
| Routes exposing raw errors | ~45 | **~20%** |

### 2.2 Routes Without Auth (11)

These routes lack explicit auth checks (some are legitimately public):
- `/api/inngest/route.ts` — Inngest webhook (uses Inngest's own HMAC verification)
- `/api/auth/[...nextauth]/route.ts` — NextAuth handler (special case)
- ~9 additional routes (OAuth callbacks, public handlers)

### 2.3 Routes Without Error Handling (126)

**56% of API routes lack try/catch.** This means unhandled exceptions will result in generic 500 errors. Notable categories:
- Multiple admin config routes
- Several finance routes
- Communication routes
- Some gamification routes
- Several HOCCR routes

### 2.4 Routes Exposing Raw Errors (~45)

Routes returning `err.message` or similar to clients:
- `/api/ads/google/campaigns/[id]/insights/route.ts`
- `/api/ads/meta/campaigns/[id]/route.ts`
- `/api/relay/oauth/[platform]/callback/route.ts`
- `/api/yantri/generate/route.ts`
- `/api/yantri/fact-engine/route.ts`
- `/api/gi/chat/route.ts`
- `/api/cron/learning-loop/route.ts`
- And ~38 more

### 2.5 Build Route Summary

- **230 total routes** compiled (pages + API)
- **2 static** routes: `/` (redirect), `/login`
- **228 dynamic** routes: server-rendered on demand
- All routes use Proxy (Middleware) for auth

---

## 3. Frontend

### 3.1 Summary

| Metric | Count |
|--------|-------|
| Pages | 82 |
| Error boundaries | 24 |
| Loading states | 20 |
| Client components | 170 |
| Server components | 9 |
| Hardcoded brand names | 5 occurrences |
| Console.log statements | 15 |
| TODO/FIXME comments | 1 |

### 3.2 Error Boundaries (24)

Error boundaries cover all major route groups:
- Shell root, Dashboard, Intelligence, Content Studio
- PMS, Relay, HOCCR, Finance, Communication
- Admin, Brands, Calendar, Settings
- Internal modules (Khabri, Vritti, Yantri)
- Auth (login), Client portal

**Good coverage.** All top-level routes have error boundaries.

### 3.3 Loading States (20)

Loading skeletons for all major views. Missing for some nested routes (admin sub-pages, specific board pages).

### 3.4 Hardcoded Brand Names

| File | Line | Content |
|------|------|---------|
| `src/app/(client)/portal/[token]/page.tsx` | 30 | `brandName: "Breaking Tube"` |
| `src/app/(client)/portal/[token]/page.tsx` | 55 | `title: "The Squirrels — Episode 12..."` |
| `src/app/(client)/portal/[token]/page.tsx` | 57 | `brandName: "The Squirrels"` |
| `src/app/(shell)/admin/clients/page.tsx` | 183 | `placeholder="e.g. Bhupendra Chaubey"` |
| `src/app/(shell)/admin/clients/page.tsx` | 247 | `placeholder="e.g. Breaking Tube"` |

### 3.5 Console.log Statements (15)

Located in 4 files:
- `src/app/api/khabri/scan/route.ts` — 3 logs
- `src/app/api/yantri/deliverables/[id]/route.ts` — 1 log
- `src/app/api/yantri/quick-generate/route.ts` — 2 logs
- `src/app/api/yantri/recommend/route.ts` — 9 logs

All are debug-style logs with prefixes (e.g., `[recommend] Step 1 PASS`). Should be replaced with structured logging.

### 3.6 TODO/FIXME Comments

Only **1** found:
- `src/lib/yantri/performance-scorer.ts:421` — `// TODO: Replace with real platform API calls when Relay is wired`

Excellent codebase hygiene.

---

## 4. LLM Integration

### 4.1 Model Routing

| Task Type | Model | Provider |
|-----------|-------|----------|
| strategy | gemini-2.0-flash | Google |
| research | gemini-2.0-flash (+ web search) | Google |
| drafting | gemini-2.0-flash | Google |
| packaging | gemini-2.0-flash | Google |
| analysis | gemini-2.0-flash | Google |
| visual | gemini-2.0-flash-preview-image-generation | Google |
| GI copilot chat | claude-sonnet-4-20250514 | Anthropic |

**Routing is correct.** Clear separation: Gemini for all content generation, Claude exclusively for GI conversational intelligence.

### 4.2 Claude Usage (3 files)

- `src/lib/yantri/anthropic.ts` — Core wrapper (callClaude)
- `src/app/api/gi/chat/route.ts` — GI chat with streaming + 14 tools
- `src/lib/gi/tools.ts` — 14 Anthropic tool definitions

Config: max_tokens 1500 (chat) / 8192-64000 (general), temperature 0.3, 30s timeout, 3 retries with exponential backoff.

### 4.3 Gemini Usage (18 files)

Used across: content generation, research, strategy, editorial briefs, image generation, pipeline orchestration, PPC recommendations.

Config: max 65536 output tokens, temperature 0.3, JSON response mode, 3 retries.

### 4.4 Rate Limit Handling

- **Claude:** Detects 429 → waits 60s → retries (up to 3x)
- **Gemini:** Exponential backoff (1s, 2s, 4s)
- **Inngest:** Built-in retry with concurrency limits (3 concurrent for deliverable generation)

### 4.5 Token/Cost Tracking

**Not implemented.** `SkillExecution` has `durationMs` but no `tokensUsed`. No cost calculation, no usage dashboard, no budget alerts. High-volume LLM usage (content generation, GI chat, 596 skill executions) is completely unmetered.

---

## 5. Skill System

### 5.1 Summary

| Metric | Count |
|--------|-------|
| Skills on disk | 154 |
| Skills in DB | 155 |
| Skills ever executed | 40 (26%) |
| Total executions | 596 |
| Never executed | 115 (74%) |

### 5.2 Skills by Domain

| Domain | Count |
|--------|-------|
| platforms | 33 |
| narrative | 28 |
| production | 18 |
| analytics | 15 |
| brand | 14 |
| signals | 8 |
| gi | 8 |
| system | 7 |
| distribution | 6 |
| workflows | 6 |
| pms | 1 |

### 5.3 Skill Orchestrator

- **691 lines** in `src/lib/skill-orchestrator.ts`
- Loads skills from filesystem with 60s TTL cache, database fallback for serverless
- Routes domains to modules via `DOMAIN_MODULE_MAP`
- Executes skills via Gemini (model-router)
- Records execution metrics (duration, score) to DB
- Supports skill chaining (sequential execution with context piping)

### 5.4 Content Pipeline Integration

- 5 core skills loaded for ALL content types (topic-selection, angle-detection, hook-engineering, audience-calibration, fact-dossier-building)
- 2 voice skills added universally (human-voice, emotional-mapping)
- 13 content types mapped to 1-8 platform-specific skills each
- Skills injected into LLM system prompt (trimmed to 300 lines each)

### 5.5 Largest/Smallest Skills

**Largest:** hook-engineering.md (25KB), title-engineering.md (22KB), narrative-arc.md (21KB)
**Smallest:** brand templates (~1.1KB), revenue-tracking.md (1.5KB), raw-clip-shorts.md (1.6KB)

---

## 6. Background Jobs

### 6.1 Inngest Functions (16 total)

**Main Instance ("daftar") — 7 functions:**
| Function | Event | Purpose |
|----------|-------|---------|
| process-signal | khabri/signal.process | Enrich signals via skill orchestrator |
| generate-deliverable | yantri/deliverable.generate | v1 legacy pipeline |
| generate-deliverable-v2 | yantri/deliverable.generate | Full pipeline (route → draft → fact-check → finalize) |
| publish-post | relay/post.publish | Publish to social platforms |
| khabri-hourly-scan | khabri/scan.trigger | RSS scraping + signal ingestion |
| auto-escalate-signal | khabri/signal.escalate | Auto-trigger narrative from BREAKING signals |
| vritti-article-ingest | vritti/article.published | RAG: chunk + embed articles for knowledge base |

**Yantri Instance ("yantri") — 9 functions:**
| Function | Event | Purpose |
|----------|-------|---------|
| fact-dossier-sync | yantri/dossier.build | Synthesize fact dossier |
| gap-analysis-on-ingest | yantri/tree.updated + created | Analyze narrative gaps |
| content-piece-pipeline | yantri/pipeline.run | PLANNED → RESEARCHING → DRAFTED |
| viral-micro-pipeline | yantri/deliverable.viral-micro | Tweets, posts |
| carousel-pipeline | yantri/deliverable.carousel | Carousel posts |
| cinematic-pipeline | yantri/deliverable.cinematic | Video scripts |
| reel-pipeline | yantri/deliverable.reel | Reel/short video |
| performance-tracking-start | yantri/deliverable.finalized | Start performance tracking |
| performance-measure | yantri/performance.measure | Measure & update metrics |

**All 16 functions properly registered** in `/api/inngest` route. No orphaned events.

### 6.2 Vercel Crons (4)

| Cron | Schedule | Endpoint |
|------|----------|----------|
| Relay executor | Every 5 min | `/api/cron/relay-executor` |
| Performance sync | Every 6 hours | `/api/cron/performance-sync` |
| Learning loop | Daily 3 AM | `/api/cron/learning-loop` |
| Overdue check | Every 4 hours | `/api/cron/overdue-check` |

All cron endpoints protected by `CRON_SECRET` bearer token.

---

## 7. Security

### 7.1 Summary

| Check | Status |
|-------|--------|
| Auth coverage | 95.1% of routes |
| Debug endpoints | All protected (ADMIN-only) |
| Env var exposure | None in client code |
| Raw SQL | 5 instances, all parameterized (SAFE) |
| SQL injection | None detected |
| CORS | Default same-origin (secure) |
| Sensitive data leaks | None found |
| CSRF protection | OAuth state + PKCE |
| Rate limiting | **NOT IMPLEMENTED** |
| File upload | No direct upload endpoints |

### 7.2 Raw SQL Usage

5 instances in 3 files, all using Prisma's parameterized template literals:
- `src/lib/inngest/vritti-workflows.ts` — DELETE + INSERT for knowledge base chunks with pgvector
- `src/lib/khabri/vector-store.ts` — INSERT signals with embeddings + similarity search
- `src/lib/inngest/khabri-workflows.ts` — Hourly volume aggregation

**All safe** — no string concatenation, all `${}` variables automatically escaped by Prisma.

### 7.3 Missing Rate Limiting

No rate limiting on any endpoint. Critical for:
- `/api/gi/chat` — Each request triggers Claude API call ($$$)
- `/api/yantri/quick-generate` — Full content generation pipeline
- `/api/khabri/signals/search` — Vector similarity search (expensive)
- `/api/yantri/recommend` — Multi-step LLM recommendation

---

## 8. Build

### 8.1 Result

| Metric | Value |
|--------|-------|
| **Status** | **PASS** |
| Build time | 51s (Turbopack) |
| TypeScript | 0 errors |
| Static pages generated | 230 |
| Build warnings | 1 (middleware deprecation) |
| Static routes | 3 (/, /_not-found, /login) |
| Dynamic routes | 227 |

### 8.2 Warning

```
The "middleware" file convention is deprecated. Please use "proxy" instead.
```

Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. Non-breaking for now.

### 8.3 Route Compilation

All 82 pages + 148 API routes compiled successfully. No type errors, no missing imports, no unresolved dependencies.

---

## 9. Dependencies

### 9.1 Package Count

| Type | Count |
|------|-------|
| dependencies | 38 |
| devDependencies | 11 |
| **Total** | **49** |

### 9.2 Outdated Packages (23)

| Package | Current | Latest | Breaking? |
|---------|---------|--------|-----------|
| @anthropic-ai/sdk | 0.78.0 | 0.79.0 | Minor |
| @aws-sdk/client-s3 | 3.1005.0 | 3.1011.0 | Patch |
| @aws-sdk/s3-request-presigner | 3.1005.0 | 3.1011.0 | Patch |
| @base-ui/react | 1.2.0 | 1.3.0 | Minor |
| @google/genai | 1.44.0 | 1.46.0 | Minor |
| @prisma/client | 6.19.2 | **7.5.0** | **MAJOR** |
| @remotion/cli | 4.0.435 | 4.0.436 | Patch |
| @remotion/renderer | 4.0.435 | 4.0.436 | Patch |
| @sentry/nextjs | 10.43.0 | 10.44.0 | Minor |
| @types/node | 20.19.37 | 25.5.0 | Major |
| eslint | 9.39.4 | 10.0.3 | Major |
| eslint-config-next | 16.1.6 | 16.1.7 | Patch |
| inngest | 3.52.6 | **4.0.0** | **MAJOR** |
| next | 16.1.6 | 16.1.7 | Patch |
| next-auth | 5.0.0-beta.30 | 4.24.13 | N/A (beta) |
| nodemailer | 7.0.13 | 8.0.3 | Major |
| prisma | 6.19.2 | **7.5.0** | **MAJOR** |
| react | 19.2.3 | 19.2.4 | Patch |
| react-dom | 19.2.3 | 19.2.4 | Patch |
| remotion | 4.0.435 | 4.0.436 | Patch |
| shadcn | 4.0.2 | 4.0.8 | Patch |
| zustand | 5.0.11 | 5.0.12 | Patch |

**3 major version upgrades available:** Prisma 7, Inngest 4, ESLint 10.

### 9.3 Security Vulnerabilities

**29 vulnerabilities total** (7 low, 1 moderate, 21 high)

All in `undici` (Node.js HTTP client, transitive dependency):
- HTTP Request/Response Smuggling
- Unbounded Memory Consumption in WebSocket
- CRLF Injection via `upgrade` option
- Unhandled Exception in WebSocket Client
- Unbounded Memory Consumption in DeduplicationHandler

Fix available via `npm audit fix`.

---

## 10. TOP 10 ISSUES (Prioritized)

### 1. [CRITICAL] 52% of Asset URLs Are Broken
**40 of 77 assets** have URLs that are neither HTTP, base64, nor null. These are likely unresolved local paths or placeholder strings. Thumbnails (17 broken) and social cards (13 broken) are worst affected. Deliverables depending on these assets will display broken images.

### 2. [CRITICAL] 56% of API Routes Lack Error Handling
**126 of 224 routes** have no try/catch. Any unhandled exception results in a raw 500 error, potentially exposing stack traces in development and providing no useful error info in production.

### 3. [CRITICAL] Zero OAuth Accounts — No One Can Log In
The `accounts` and `sessions` tables are empty. All 8 users exist but have 0 OAuth provider connections. NextAuth requires at least one linked provider account (Google/Microsoft) for login. This means either: (a) no one has logged into the live app, or (b) OAuth is misconfigured.

### 4. [CRITICAL] All Signals Are 8+ Days Stale
Only 6 signals exist, all from March 10. The `khabri/scan.trigger` cron runs every 5 minutes via Vercel, but no new signals are being generated. Either RSS sources are empty or the scan cron is failing silently.

### 5. [CRITICAL] 29 npm Vulnerabilities (21 High)
All in `undici`. While these are transitive and unlikely to be exploited in server-side Next.js, the high count is a red flag for security audits.

### 6. [HIGH] 20% of API Routes Expose Raw Error Messages
~45 routes return `err.message` directly to clients, potentially revealing database schema, file paths, or API key issues.

### 7. [HIGH] No Rate Limiting on LLM-Heavy Endpoints
`/api/gi/chat`, `/api/yantri/quick-generate`, `/api/yantri/recommend` all trigger expensive LLM calls with no rate limiting. A single user or bot could run up significant API costs.

### 8. [HIGH] Zero Platform Connections — Relay Can't Publish
The `platform_connections` table is empty. No OAuth tokens for Twitter, YouTube, LinkedIn, Instagram, or Facebook. The Relay publisher and relay-executor cron have nothing to publish to.

### 9. [HIGH] No LLM Token/Cost Tracking
596 skill executions and multiple direct LLM calls have no token counting or cost tracking. No way to know monthly LLM spend, per-brand costs, or approaching rate limits.

### 10. [HIGH] Duplicate Narrative Trees
5 groups of duplicate trees (13 total duplicates). These are LLM-generated summaries stored without deduplication checks, wasting storage and potentially confusing the content pipeline.

---

## 11. MEDIUM ISSUES

1. **Middleware deprecation warning** — Next.js 16 deprecates `middleware.ts` → `proxy.ts`. Non-breaking now but will break in future versions.
2. **15 console.log statements** in production API routes. Should use structured logging (pino, winston).
3. **5 hardcoded brand names** in client portal and admin pages. Should be dynamic.
4. **74% of skills never executed** — 115 skills have zero executions. Consider whether they're needed or if the orchestrator routing is incomplete.
5. **3 major dependency upgrades pending** — Prisma 7, Inngest 4, ESLint 10. Plan migration.
6. **Dual Inngest instances** — "daftar" and "yantri" share one `/api/inngest` route. Monitor for event registration conflicts.

---

## 12. WHAT WORKS WELL

1. **Clean build** — 0 TypeScript errors, 0 build errors, compiles in 51s with Turbopack.
2. **Strong auth architecture** — 95% route coverage, 7-role RBAC, invitation-only, middleware protection.
3. **Dual LLM strategy** — Clear Gemini/Claude separation with proper model routing.
4. **Robust retry/backoff** — Both LLM wrappers handle rate limits, timeouts, and JSON parse failures gracefully.
5. **No SQL injection** — All 5 raw SQL queries use parameterized templates.
6. **No orphaned data** — All foreign key relationships are clean.
7. **24 error boundaries** — Every major route group has error handling UI.
8. **20 loading states** — Good skeleton coverage across the app.
9. **Only 1 TODO** in the entire codebase — Excellent code hygiene.
10. **154 skill files** — Comprehensive skill system with filesystem + DB fallback, caching, and execution tracking.
11. **16 Inngest functions + 4 Vercel crons** — Well-orchestrated background job system with no orphaned events.
12. **Zero sensitive data leaks** — No passwords, tokens, or secrets in API responses.
13. **CRON_SECRET protection** — All cron endpoints properly guarded.
14. **OAuth state + PKCE** — Proper CSRF protection on OAuth flows.
15. **No client-side env exposure** — All `process.env` access restricted to server code.

---

## 13. RECOMMENDATIONS (Next Sprint)

### Immediate (This Week)
1. Fix broken asset URLs (40 assets) — either regenerate or clean up
2. Add try/catch to the 126 unprotected API routes
3. Run `npm audit fix` to resolve Undici vulnerabilities
4. Verify OAuth configuration (Google + Microsoft) and test login flow
5. Check Khabri scan cron logs on Vercel for failures

### Short-Term (This Month)
6. Implement rate limiting on LLM endpoints (Upstash Ratelimit or similar)
7. Sanitize all error responses — never return `err.message` to clients
8. Add LLM token/cost tracking table and dashboard
9. Deduplicate narrative trees and add dedup check to pipeline
10. Rename `middleware.ts` to `proxy.ts` per Next.js 16 convention

### Medium-Term (Next Quarter)
11. Plan Prisma 7 + Inngest 4 migration
12. Replace console.log with structured logging
13. Review and potentially sunset 115 unused skills
14. Add loading states to nested admin pages
15. Remove hardcoded brand names from client portal

---

*Report generated automatically by Claude Code. No files were modified during this audit.*
