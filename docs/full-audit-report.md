# DAFTAR Full Codebase Audit

## Date: 2026-03-12

---

## 1. API Route Map

**Total Routes: ~195** | **Working: ~185** | **Stubs: ~10**

| Method | Path | What It Does | Working? |
|--------|------|-------------|----------|
| GET, POST | `/api/activity` | Task activity logs (role-scoped) | Yes |
| GET, POST | `/api/analytics/competitors` | Competitive benchmarking with skill orchestration | Yes |
| POST | `/api/analytics/learning-report` | Trigger learning cycle and generate report | Yes |
| GET, POST | `/api/analytics/performance` | List/record content performance metrics | Yes |
| GET | `/api/analytics/performance/:brandId` | Brand-specific performance aggregation | Yes |
| GET | `/api/analytics/skills` | Skill performance dashboard | Yes |
| GET, PATCH | `/api/analytics/tests/:id` | Get/update strategy test results | Yes |
| GET, POST | `/api/analytics/tests` | List/create strategy tests | Yes |
| GET, POST | `/api/auth/[...nextauth]` | NextAuth authentication handler | Yes |
| GET, POST | `/api/brands` | List/create brands (role-filtered) | Yes |
| POST | `/api/brands/:id/platforms` | Add/update platform for brand | Yes |
| POST | `/api/client/action` | Token-based deliverable approval (public) | Stub |
| GET, POST | `/api/client/brands/:brandId/deliverables` | Client deliverables management | Yes |
| GET | `/api/client/brands/:brandId/performance` | Brand performance for clients | Yes |
| GET | `/api/client/brands/:brandId/reports` | Client reports retrieval | Yes |
| POST | `/api/client/deliverables/:id/review` | Client approval/revision | Yes |
| GET, POST | `/api/clients` | List/create clients (ADMIN/FINANCE) | Yes |
| GET, POST | `/api/communication/announcements` | List/create announcements | Yes |
| GET, PATCH | `/api/communication/announcements/:id` | Get/update announcement | Yes |
| POST | `/api/communication/announcements/:id/read` | Mark announcement read | Yes |
| GET, POST | `/api/communication/feedback/channels` | List/create feedback channels | Yes |
| GET, POST | `/api/communication/feedback/entries` | List/submit feedback | Yes |
| POST, PATCH | `/api/communication/feedback/entries/:id` | Upvote/update feedback | Yes |
| GET, PATCH | `/api/config/brands/:id` | Get/update brand config | Yes |
| GET, PATCH | `/api/config/departments/:id` | Get/update department config | Yes |
| GET, POST | `/api/config/platforms` | List/create platform configs | Yes |
| GET, PATCH | `/api/config/platforms/:id` | Get/update platform config | Yes |
| GET, POST | `/api/config/roles` | List/manage role configs | Yes |
| GET, POST | `/api/config/workflows` | List/create workflow templates | Yes |
| GET, PATCH | `/api/config/workflows/:id` | Get/update workflow template | Yes |
| POST | `/api/credibility/recalculate` | Recalculate credibility scores (ADMIN) | Yes |
| GET | `/api/credibility` | Get user credibility score | Yes |
| GET | `/api/cron/learning-loop` | Cron: trigger learning cycle | Yes |
| GET | `/api/cron/overdue-check` | Cron: check overdue tasks | Yes |
| GET | `/api/cron/relay-executor` | Cron: publish scheduled posts | Yes |
| GET, POST | `/api/departments` | List/create departments | Yes |
| GET, PATCH | `/api/departments/:id` | Get/update department | Yes |
| GET, POST | `/api/finance/expenses` | List/create expenses | Yes |
| GET, PATCH | `/api/finance/expenses/:id` | Get/update expense | Yes |
| GET | `/api/finance/expenses/export` | Export expenses to CSV | Yes |
| GET, POST | `/api/finance/invoices` | List/create invoices | Yes |
| GET, PATCH | `/api/finance/invoices/:id` | Get/update invoice | Yes |
| GET | `/api/finance/invoices/:id/pdf` | Generate printable invoice | Yes |
| GET | `/api/finance/invoices/export` | Export invoices to CSV | Yes |
| GET | `/api/finance/overview` | Finance dashboard (6-month trend) | Yes |
| GET | `/api/finance/summary` | Finance summary (30-day) | Yes |
| GET | `/api/gamification/achievements` | List achievements | Yes |
| GET, POST | `/api/gamification/challenges` | List/create challenges | Yes |
| GET, POST | `/api/gamification/challenges/:id` | Challenge detail / submit entry | Yes |
| GET | `/api/gamification/leaderboard` | Leaderboard (org/dept) | Yes |
| GET | `/api/gamification/me` | Current user gamification stats | Yes |
| PATCH | `/api/gamification/rewards` | Claim rewards | Yes |
| GET | `/api/gamification/rewards` | List user rewards | Yes |
| POST | `/api/gamification/seed` | Seed achievements (ADMIN) | Yes |
| GET | `/api/gi/actions` | List GI autonomous actions | Yes |
| PATCH | `/api/gi/actions/:id` | Approve/reject GI action | Yes |
| POST | `/api/gi/chat` | GI copilot chat | Yes |
| GET | `/api/gi/config` | GI configuration (ADMIN) | Yes |
| GET | `/api/gi/insights` | Generate GI insights | Yes |
| GET | `/api/gi/learning` | GI learning logs (ADMIN) | Yes |
| GET | `/api/gi/predictions` | GI predictions | Yes |
| GET | `/api/gi/suggestions` | Skill-aware GI suggestions | Yes |
| GET, PATCH | `/api/gi/tiers` | GI tier assignments (ADMIN) | Yes |
| GET, PATCH | `/api/hoccr/announcements/:id` | Get/update announcement | Yes |
| GET, POST | `/api/hoccr/announcements` | List announcements | Yes |
| GET, POST | `/api/hoccr/candidates` | List/create hiring candidates | Yes |
| GET | `/api/hoccr/culture/engagement` | Engagement metrics | Yes |
| GET | `/api/hoccr/culture/metrics` | Culture metrics (30/60-day) | Yes |
| GET | `/api/hoccr/culture/recognition` | Recognition entries | Yes |
| GET | `/api/hoccr/culture/sentiment` | Sentiment analysis per dept | Yes |
| GET | `/api/hoccr/dependencies` | Cross-dept dependencies | Yes |
| GET | `/api/hoccr/intelligence` | Cross-dept interaction map | Yes |
| GET | `/api/hoccr/intelligence/charts` | Intelligence charts data | Yes |
| GET | `/api/hoccr/operations` | Operations overview | Yes |
| GET, POST | `/api/hoccr/operations/bottlenecks` | List/detect bottlenecks | Yes |
| GET | `/api/hoccr/operations/capacity` | User capacity | Yes |
| GET | `/api/hoccr/operations/dependencies` | Cross-dept dependencies | Yes |
| GET, POST | `/api/hoccr/positions` | List/create hiring positions | Yes |
| GET, PATCH | `/api/hoccr/positions/:id` | Get/update position | Yes |
| GET, POST | `/api/hoccr/reports` | List/create reports | Yes |
| GET, POST, PUT | `/api/inngest` | Inngest webhook | Yes |
| GET, POST | `/api/invites` | User invitations (ADMIN/HEAD_HR) | Yes |
| GET | `/api/khabri/trends` | Trends (local DB + API fallback) | Yes |
| GET | `/api/khabri/trends/top` | Top trends | Yes |
| GET | `/api/khabri/signals` | Signals (local + fallback) | Yes |
| GET | `/api/khabri/signals/search` | Search signals | Yes |
| GET | `/api/khabri/anomalies` | Detect anomalies | Yes |
| GET | `/api/khabri/anomalies/trending` | Trending anomalies | Yes |
| GET | `/api/khabri/narratives` | List narratives | Yes |
| GET | `/api/khabri/narratives/:id` | Narrative tree detail | Yes |
| GET | `/api/khabri/narratives/:id/stakeholders` | Narrative stakeholders | Yes |
| GET | `/api/khabri/narratives/:id/timeline` | Narrative timeline | Yes |
| GET | `/api/khabri/geo/hotspots` | Geographic hotspots (API only) | Yes |
| GET | `/api/khabri/geo/:countryCode` | Country intelligence (API only) | Yes |
| GET | `/api/khabri/analytics/volume` | Signal volume (API only) | Yes |
| GET | `/api/khabri/analytics/sentiment` | Sentiment analysis (API only) | Yes |
| GET | `/api/khabri/analytics/categories` | Categories distribution (API only) | Yes |
| GET | `/api/kpi` | KPI dashboard (30-day) | Yes |
| GET | `/api/leaderboard` | User leaderboard | Yes |
| GET | `/api/m/khabri/signals` | Mobile Khabri signals (mock) | Stub |
| GET | `/api/m/khabri/trends` | Mobile Khabri trends (mock) | Stub |
| GET | `/api/m/yantri/narrative-trees` | Narrative trees (mobile) | Yes |
| GET, POST | `/api/notifications` | List/fetch notifications | Yes |
| PATCH, DELETE | `/api/notifications/:id` | Mark/delete notification | Yes |
| GET, PUT | `/api/notifications/preferences` | Notification preferences | Yes |
| GET | `/api/notifications/stream` | SSE real-time notifications | Yes |
| GET | `/api/pipeline/performance` | Pipeline KPI dashboard | Yes |
| GET | `/api/pipeline/runs` | Pipeline runs | Yes |
| POST | `/api/pipeline/trigger` | Trigger Khabri→Yantri pipeline | Yes |
| GET, POST | `/api/relay/posts` | List/create content posts | Yes |
| GET, PATCH | `/api/relay/posts/:id` | Get/update post | Yes |
| POST | `/api/relay/posts/:id/publish` | Publish/schedule post | Yes |
| GET | `/api/relay/analytics` | Post analytics | Yes |
| GET, POST | `/api/relay/calendar` | Calendar entries | Yes |
| PATCH, DELETE | `/api/relay/calendar/:id` | Update/delete calendar entry | Yes |
| GET, POST | `/api/relay/connections` | Platform connections | Yes |
| GET | `/api/search` | Global search | Yes |
| POST | `/api/signals/ingest` | Ingest signal with enrichment | Yes |
| POST | `/api/signals/promote` | Promote trend to Yantri | Yes |
| GET | `/api/signals/trends/:id/related` | Related trend graph | Yes |
| GET | `/api/signals/trends/:id` | Trend detail | Yes |
| GET | `/api/signals/trends/:id/signals` | Signals for trend | Yes |
| GET, POST | `/api/signals/trends` | List/create trends | Yes |
| GET | `/api/signals/velocity` | Velocity score analysis | Yes |
| GET, POST, PATCH | `/api/skills` | List/execute/manage skills | Yes |
| GET, PATCH | `/api/skills/:path` | Skill detail + history | Yes |
| POST | `/api/skills/execute` | Execute skill (testing) | Yes |
| GET | `/api/skills/performance` | Skill performance leaderboard | Yes |
| POST | `/api/skills/sync` | Sync skills from /skills/ directory | Yes |
| GET, POST | `/api/tasks` | List/create tasks | Yes |
| GET, PATCH | `/api/tasks/:id` | Get/update task | Yes |
| GET | `/api/tasks/board` | Kanban board | Yes |
| POST | `/api/tasks/comments` | Post task comment | Yes |
| GET | `/api/tasks/:id/comments` | Get task comments | Yes |
| GET | `/api/tasks/export` | Export tasks CSV | Yes |
| PATCH | `/api/tasks/:id/status` | Update task status | Yes |
| GET | `/api/tasks/workload` | Workload distribution | Yes |
| POST | `/api/upload/presigned` | S3 presigned upload URL | Yes |
| GET, POST | `/api/users` | List/invite users (ADMIN) | Yes |
| GET, PATCH | `/api/users/:id` | Get/update user (ADMIN) | Yes |
| GET, PATCH | `/api/users/me` | Current user profile | Yes |
| GET, POST | `/api/vritti/articles` | List/create articles | Yes |
| GET, PATCH | `/api/vritti/articles/:id` | Get/update article | Yes |
| GET, POST | `/api/vritti/articles/:id/comments` | Article comments | Yes |
| GET, POST | `/api/vritti/categories` | Article categories | Yes |
| GET, PATCH | `/api/vritti/categories/:id` | Get/update category | Yes |
| GET, POST | `/api/vritti/media` | Article media | Yes |
| GET, POST | `/api/workflows/active` | Active workflows | Yes |
| POST | `/api/workflows/execute` | Execute workflow | Yes |
| GET | `/api/workflows/history` | Workflow history | Yes |
| POST | `/api/workflows/process` | Process workflow step | Yes |
| GET, POST | `/api/yantri/content-pieces` | List/create content pieces | Yes |
| GET, PATCH | `/api/yantri/content-pieces/:id` | Get/update content piece | Yes |
| GET, POST | `/api/yantri/deliverables` | List/create deliverables | Yes |
| GET, PATCH | `/api/yantri/deliverables/:id` | Get/update deliverable | Yes |
| GET, POST | `/api/yantri/deliverables/:id/assets` | Deliverable assets | Yes |
| GET, POST | `/api/yantri/editorial-narratives` | Editorial narratives | Yes |
| GET, PATCH | `/api/yantri/editorial-narratives/:id` | Get/update narrative | Yes |
| GET | `/api/yantri/editorial-narratives/cluster` | Cluster narratives | Yes |
| POST | `/api/yantri/fact-engine` | Run fact-checking engine | Yes |
| GET | `/api/yantri/fact-engine/:treeId` | Fact-check results | Yes |
| POST | `/api/yantri/generate` | Generate content via Gemini (legacy) | Yes |
| POST | `/api/yantri/generate-image` | Generate image via AI | Yes |
| GET | `/api/yantri/history` | Yantri operation history | Yes |
| POST | `/api/yantri/ingest` | Ingest signals to NarrativeTrees | Yes |
| GET, POST | `/api/yantri/narrative-trees` | List/create narrative trees | Yes |
| GET, PATCH | `/api/yantri/narrative-trees/:treeId` | Get/update narrative tree | Yes |
| POST | `/api/yantri/narrative-trees/:treeId/hypothesis` | Generate hypothesis | Yes |
| POST | `/api/yantri/narrative-trees/merge` | Merge trees | Yes |
| GET, POST | `/api/yantri/narratives` | List/create narratives | Yes |
| GET, PATCH | `/api/yantri/narratives/:id` | Get/update narrative | Yes |
| GET | `/api/yantri/narratives/:id/deliverables` | Narrative deliverables | Yes |
| POST | `/api/yantri/package` | Package deliverables for client | Yes |
| GET, POST | `/api/yantri/performance` | Performance records | Yes |
| GET | `/api/yantri/performance/:id` | Performance detail | Yes |
| GET | `/api/yantri/performance/summary` | Performance summary | Yes |
| POST | `/api/yantri/pipeline/run` | Trigger pipeline run | Yes |
| GET | `/api/yantri/pipeline/status` | Pipeline status | Yes |
| GET, POST | `/api/yantri/platform-rules` | Platform posting rules | Yes |
| GET, PATCH | `/api/yantri/platform-rules/:id` | Get/update rule | Yes |
| GET, POST | `/api/yantri/prompt-templates` | Prompt templates | Yes |
| GET, PATCH | `/api/yantri/prompt-templates/:id` | Get/update template | Yes |
| POST | `/api/yantri/prompt-templates/test` | Test prompt template | Yes |
| POST | `/api/yantri/quick-generate` | Quick content generation | Yes |
| POST | `/api/yantri/relay/publish` | Publish to Relay from Yantri | Yes |
| POST | `/api/yantri/research` | Run research on tree | Yes |
| POST | `/api/yantri/rewrite-segment` | Rewrite content segment | Yes |
| POST | `/api/yantri/route-prompt` | Route to appropriate engine | Yes |
| POST | `/api/yantri/scan` | Scan for new trends | Yes |
| GET | `/api/yantri/stats` | Yantri stats | Yes |
| POST | `/api/yantri/strategist` | Run Strategist Agent | Yes |
| GET, POST | `/api/yantri/trends/batches` | Trend batches | Yes |
| GET, PATCH | `/api/yantri/trends/batches/:id` | Get/update batch | Yes |
| POST | `/api/yantri/trends/fetch` | Fetch trends from source | Yes |
| POST | `/api/yantri/trends/import` | Import trends in bulk | Yes |
| GET | `/api/saas/organizations` | Organizations (ADMIN, mock) | Stub |
| GET | `/api/saas/products` | SaaS products (hardcoded) | Stub |

---

## 2. Pipeline Trace

### Two Parallel Pipelines Exist (Never Fully Integrated)

**Pipeline A: Ingest Pipeline** (Signal → NarrativeTree → ContentPiece)
**Pipeline B: Deliverable Pipeline** (Deliverable → Assets → REVIEW)

### Signal Submission

Three entry points:

1. **POST `/api/yantri/ingest`** — Batch signal ingest
   - Calls `processSignalsToTrees()` in `src/lib/yantri/ingest-helper.ts`
   - Creates NarrativeTree + NarrativeNode per signal
   - Emits `yantri/tree.created` event to Inngest

2. **POST `/api/yantri/quick-generate`** — Synchronous generation
   - Takes `{topic, brandId, contentType}`
   - Calls Gemini for research + content generation
   - Creates Deliverable (status: REVIEW) + Assets directly
   - **This is the only fully synchronous end-to-end path**

3. **POST `/api/yantri/deliverables`** — Direct deliverable creation
   - Takes `{brandId, platform, copyMarkdown?, treeId?, autoTrigger?}`
   - Creates Deliverable (status: PLANNED)
   - If `autoTrigger=true`: sends Inngest event to start pipeline

### Dossier Generation
- **Where:** `factDossierSync` Inngest function in `src/lib/yantri/inngest/functions.ts`
- **Trigger:** `yantri/dossier.build` event
- **How:** Calls Gemini to synthesize facts, stats, quotes, timeline from NarrativeTree nodes
- **Output:** FactDossier record (structuredData JSON + sources array)

### Strategy Generation
- **Where:** `runStrategist()` in `src/lib/yantri/strategist.ts` (354 lines)
- **Called from:** `gapAnalysisOnIngest` Inngest function
- **How:** Routes to Gemini via `routeToModel("strategy", ...)`, builds brand context
- **Output:** Strategy decisions per brand with angles and content types
- **Then:** Creates ContentPiece records (status: PLANNED)

### Content Generation (Deliverable Pipeline)
- **Where:** `src/lib/yantri/inngest/deliverable-pipelines.ts`
- **4 engine pipelines:**
  - `viralMicroPipeline` → X/LinkedIn content via `runViralMicroEngine()`
  - `carouselPipeline` → Instagram carousels via `runCarouselEngine()`
  - `cinematicPipeline` → YouTube scripts via `runCinematicEngine()` + ElevenLabs voiceover
  - `reelPipeline` → Instagram reels via `routeToModel("drafting", ...)`
- **Status transitions:** PLANNED → RESEARCHING → SCRIPTING → GENERATING_ASSETS → [STORYBOARDING] → REVIEW

### Deliverable Creation
- **Point A:** `POST /api/yantri/deliverables` (manual, status: PLANNED)
- **Point B:** `POST /api/yantri/quick-generate` (synchronous, status: REVIEW)
- **MISSING:** No automatic conversion from ContentPiece → Deliverable

### Asset Creation
- Created during pipeline execution in `deliverable-pipelines.ts`
- Types: IMAGE, THUMBNAIL, CAROUSEL_SLIDE, BROLL, AUDIO
- All have `url: ""` (placeholder — no actual file generation)

### PIPELINE BREAKS AT: ContentPiece → Deliverable conversion

**WHY:** The ingest pipeline creates ContentPiece records (status: PLANNED → DRAFTED) but never converts them to Deliverable records. The deliverable pipeline starts from existing Deliverable records. These two pipelines are disconnected.

```
INGEST PIPELINE:
  Signal → NarrativeTree → FactDossier → Strategy → ContentPiece (DRAFTED)
  [DEAD END — no event triggers deliverable creation]

DELIVERABLE PIPELINE:
  Deliverable (PLANNED) → Research → Script → Assets → REVIEW
  [Requires manual Deliverable creation via API or UI]
```

The **only working end-to-end path** is `POST /api/yantri/quick-generate`, which bypasses both pipeline systems and does everything synchronously.

---

## 3. Content Storage Mismatch

### Generated content written to:
| Pipeline | copyMarkdown | scriptData | carouselData | postingPlan |
|----------|-------------|-----------|-------------|-------------|
| Viral Micro | primaryPost text | — | — | timing, hashtags |
| Carousel | caption text | — | slides array, arc, hashtags | timing |
| Cinematic | fullScript text | sections, runtime, actStructure | — | titles, thumbnail, tags |
| Reel | script text | textOverlays, duration, musicMood | — | timing |
| Quick Generate | — | full JSON (script or carousel) | — | — |

### UI tries to read from:
- **Workspace** (`/m/yantri/workspace`): Reads `copyMarkdown` only (for card preview) — **MATCHES**
- **Review** (`/m/yantri/review/[id]`): Reads `copyMarkdown`, `scriptData`, `carouselData`, `postingPlan` — **MATCHES**
- **Plan/Batch** (`/m/yantri/plan/[batchId]`): Reads from `Narrative.packageData` — **DIFFERENT MODEL**

### Match: PARTIAL

The Workspace and Review pages correctly read Deliverable fields. However, the Plan/Batch page and its preview components (`YouTubePreview`, `TwitterPreview`, `BlogPreview`) expect a `{content, postingPlan}` structure from `Narrative.packageData`, not from Deliverable fields. This means the plan page works with a different data model than the deliverable pipeline.

**What happens in practice:** If a user views content through the workspace/review path, fields match. If they view through the plan/batch path, the preview components read from Narrative records, not Deliverables.

---

## 4. UI State Per Page

| Page | Loads? | Has Generate Button? | What It Calls | Works? |
|------|--------|---------------------|---------------|--------|
| /dashboard | Yes (server components) | No | Internal components fetch own data | Yes |
| /m/yantri/workspace | Yes (client fetch) | Yes (+ button) | `/api/yantri/deliverables` | Partial — kanban loads, generation requires existing deliverable |
| /m/yantri/review/[id] | Yes (client fetch) | Yes (Approve/Reject) | `PATCH /api/yantri/deliverables/[id]` | Yes |
| /m/yantri/plan/[batchId] | Yes (client fetch) | No | NarrativeTree API | Partial — different data model |
| /m/khabri | Yes (client fetch) | No | `/api/khabri/trends/top`, `/api/khabri/anomalies/trending`, `/api/khabri/analytics/categories` | Yes |
| /pms | Redirect to /pms/board | Yes (Create Task) | `POST /api/tasks/` | Yes |
| /relay | Redirect to /relay/calendar | No (on redirect page) | N/A | Yes |
| /hoccr | Redirect to /hoccr/operations | No | N/A | Yes |
| /finance | Yes (client fetch) | Yes (Create Invoice/Expense) | `/api/finance/invoices`, `/api/finance/expenses` | Yes |
| /m/vritti | Redirect to /m/vritti/pipeline | No | N/A | Yes |

---

## 5. Navigation Crash Risk

### Pages missing error.tsx: NONE
All 17 first-level module directories and all 3 sub-modules (`m/khabri`, `m/vritti`, `m/yantri`) have error boundary files.

### Pages with unhandled fetch (missing .catch()): 13 files

1. `src/app/(shell)/brands/page.tsx` — fetch().then().then().finally() with no .catch()
2. `src/app/(shell)/brands/[brandId]/page.tsx` — Promise.all() with no .catch()
3. `src/app/(shell)/brands/[brandId]/reports/page.tsx`
4. `src/app/(shell)/hoccr/hiring/page.tsx`
5. `src/app/(shell)/hoccr/reports/page.tsx`
6. `src/app/(shell)/pms/workload/page.tsx`
7. `src/app/(shell)/pms/gamification/page.tsx`
8. `src/app/(shell)/credibility/page.tsx`
9. `src/app/(shell)/admin/gi/page.tsx`
10. `src/app/(shell)/admin/gi/predictions/page.tsx`
11. `src/app/(shell)/admin/gi/learning/page.tsx`
12. `src/app/(shell)/admin/gi/config/page.tsx`
13. `src/app/(shell)/admin/gi/actions/page.tsx`

### External API calls without try/catch: 0 in components
All external Khabri API calls are properly isolated to `src/lib/khabri.ts` (server-side). Components call `/api/khabri/*` proxy routes.

### KHABRI CRASH CAUSE:
Khabri pages themselves don't crash the app — they have error boundaries. However:
- **Narratives page** (`/m/khabri/narratives`): Uses bare `catch { // ignore }` blocks — silently swallows errors, shows infinite loading spinner
- **Geo page** (`/m/khabri/geo`): Same pattern — silent error swallowing
- **Analytics page** (`/m/khabri/analytics`): Has ZERO error state — if all 3 API calls fail, page shows empty charts with no error message
- **JSON parse errors**: Multiple pages call `.json()` without inner protection — malformed API responses cause unhandled exceptions
- Dashboard and Signals pages have **good** error handling as reference patterns

---

## 6. Dead Buttons Count: 4

All 4 dead buttons are in `src/app/(shell)/settings/page.tsx` (Theme Customization section):

| # | Line | Label | Issue |
|---|------|-------|-------|
| 1 | 260 | "Expanded" (Sidebar toggle) | No onClick handler |
| 2 | 263 | "Collapsed" (Sidebar toggle) | No onClick handler |
| 3 | 276 | "Comfortable" (Density toggle) | No onClick handler |
| 4 | 279 | "Compact" (Density toggle) | No onClick handler |

All have hover styling that suggests interactivity, but no click handlers are wired.

**Dead button rate:** 4 out of ~728 total button elements (0.55%) — very clean.

---

## 7. Brand Duplication

### Brand management surfaces found in:
- **`/admin/clients` (ONLY creation point)** — Full brand creation dialog with name, slug, platform selection
- `/brands` — Display only (lists assigned brands, no creation)
- `/brands/[brandId]` — Detail view only (performance, deliverables)
- `/m/yantri/brands` — Yantri context view, links to `/admin/clients` for management

### Consolidation: OPTIMAL
Brand creation is NOT duplicated. Single admin interface at `/admin/clients` handles all brand CRUD. Other pages are read-only views.

---

## 8. Environment

| Variable | Status |
|----------|--------|
| DATABASE_URL | Present (NeonDB us-east-1) |
| GEMINI_API_KEY | Present |
| ANTHROPIC_API_KEY | Present |
| AUTH_SECRET | Present |
| AUTH_GOOGLE_ID | Present |
| AUTH_GOOGLE_SECRET | Present |
| ELEVENLABS_API_KEY | Present |
| INNGEST_EVENT_KEY | Present |
| INNGEST_SIGNING_KEY | Present |
| KHABRI_API_KEY | Present |

- **Inngest:** Production mode (`signkey-prod-*` pattern)
- **Model router:** Defaults to **Gemini** for unmatched tasks. Claude for drafting/packaging/visual. Gemini for research/strategy/analysis.
- **ignoreBuildErrors:** Not set (clean `next.config.ts` with empty config)
- **next.config.ts:** Minimal — `const nextConfig: NextConfig = {};`

---

## 9. Build: PASS (0 errors)

```
Next.js 16.1.6 (Turbopack)
Compiled successfully in 14.4s
TypeScript: 0 errors
Static pages: 209/209 generated
Warning: "middleware" file convention deprecated (should use "proxy")
```

Build is clean. No TypeScript errors. All 209 pages generate successfully.

---

## 10. Khabri Deep Dive

### External API
- **Base URL:** `https://khabri.stallone.co.in/api/v1`
- **Auth:** Bearer token via `KHABRI_API_KEY`
- **Client:** `src/lib/khabri.ts` (203 lines, 23+ functions)
- **Error class:** `KhabriApiError` with code, message, status

### Fallback Architecture
| Route | Local DB Fallback | API Only |
|-------|-------------------|----------|
| Trends | Yes | — |
| Signals | Yes | — |
| Anomalies | Yes (spike detection) | — |
| Narratives | Yes | — |
| Geo hotspots | — | Yes |
| Geo country intel | — | Yes |
| Analytics volume | — | Yes |
| Analytics categories | — | Yes |
| Analytics sentiment | — | Yes |

### Error Handling Quality by Page

| Page | Try/Catch | Protects .json() | Sets Error State | Quality |
|------|-----------|------------------|-----------------|---------|
| Dashboard (`/m/khabri`) | Yes | Yes | Yes | GOOD |
| Signals (`/m/khabri/signals`) | Yes | Yes | Yes | GOOD |
| Narratives (`/m/khabri/narratives`) | Partial | No | No — `catch { // ignore }` | VERY POOR |
| Geo (`/m/khabri/geo`) | Partial | No | No — `catch { // ignore }` | VERY POOR |
| Analytics (`/m/khabri/analytics`) | Incomplete | No | No — empty catch block | VERY POOR |

### What Happens When API Is Down
- **Dashboard:** Shows error "All Khabri API calls failed" + retry button (proper)
- **Signals:** Shows error message + clears data (proper)
- **Narratives:** Silently fails — user sees loading spinner indefinitely
- **Geo:** Silently fails — user sees loading spinner indefinitely
- **Analytics:** Shows empty charts with no error indication

---

## 11. SCHEMA ISSUES FOUND

### ContentPipelineStatus Enum
```
PLANNED, RESEARCHING, SCRIPTING, GENERATING_ASSETS, STORYBOARDING,
DRAFTED, REVIEW, APPROVED, RELAYED, PUBLISHED, KILLED
```

All status values used in code are present in the enum. No mismatches.

### Breadcrumb Navigation Bug
`src/components/shell/content-pipeline-breadcrumb.tsx` line 21 uses `?status=pending_review` (lowercase) instead of `?status=REVIEW` (enum value). This link will return zero results.

### AssetType Enum
```
IMAGE, VIDEO_CLIP, BROLL, CAROUSEL_SLIDE, THUMBNAIL, SOCIAL_CARD, AUDIO
```

All AssetType values used in code match the enum. No mismatches.

### Type Safety Gap
UI components define Asset type as `{ id: string; type: string }` instead of importing the `AssetType` enum. No runtime impact, but loses compile-time validation.

---

## 12. ROOT CAUSE ANALYSIS

### The #1 reason content generation doesn't work end-to-end:

**Ingest pipeline and Deliverable pipeline are disconnected.**

The ingest pipeline (`POST /api/yantri/ingest` → Inngest → `gapAnalysisOnIngest` → `runStrategist` → ContentPiece) creates `ContentPiece` records but never converts them to `Deliverable` records. The deliverable pipeline (`deliverable-pipelines.ts`) starts from existing Deliverable records. No code bridges the two.

- `src/lib/yantri/inngest/functions.ts` line 232: Creates ContentPiece (PLANNED)
- `src/lib/yantri/inngest/functions.ts` line 446: Updates ContentPiece to DRAFTED
- `src/lib/yantri/inngest/deliverable-pipelines.ts` line 100: Starts from Deliverable (expects record to exist)
- **Missing:** No code to create a Deliverable from a DRAFTED ContentPiece

### The #2 reason:

**No automatic pipeline trigger from strategist output.**

After `gapAnalysisOnIngest` creates ContentPiece records, it does NOT send a `yantri/pipeline.run` event. The ContentPiece pipeline (`contentPiecePipeline`) exists but is never triggered automatically from the ingest flow. Missing code at `src/lib/yantri/inngest/functions.ts` lines 218-251.

### The #3 reason:

**Quick-generate is the only working path, but it bypasses all pipeline intelligence.**

`POST /api/yantri/quick-generate` works end-to-end (topic → Gemini research → content → Deliverable + Assets) but skips:
- Signal clustering and deduplication
- Gap analysis
- Strategic brand-level decision making
- Fact-checking with retries
- Skill orchestrator routing
- The entire Inngest async pipeline

It's a shortcut that produces deliverables but doesn't use any of the sophisticated pipeline infrastructure.

### The Khabri navigation issue is caused by:

**Silent error swallowing in 3 of 5 sub-pages.** The narratives, geo, and analytics pages use bare `catch { // ignore }` blocks that suppress all errors. When the Khabri API is slow or returns unexpected data, `.json()` parse failures are silently swallowed, leaving users with infinite loading spinners and no error messages. The dashboard and signals pages demonstrate correct error handling that should be replicated.

---

## 13. SUMMARY SCORECARD

| Area | Score | Notes |
|------|-------|-------|
| Build health | A | 0 errors, clean TypeScript |
| API coverage | A | 195 routes, vast majority functional |
| Auth & RBAC | A | Consistent role checks across all routes |
| Error boundaries | A | 100% module coverage |
| Fetch error handling | C | 13 pages missing .catch() handlers |
| Pipeline architecture | D | Two disconnected pipelines, only quick-generate works E2E |
| Content storage | B | Fields match between write and read for workspace/review |
| Dead buttons | A | Only 4 out of 728 (0.55%) |
| Brand management | A | No duplication, single admin surface |
| Khabri resilience | C | 2/5 pages handle errors well, 3/5 silently fail |
| Environment | A | All keys present, production Inngest, clean config |
| Schema integrity | A- | Enums match code; one breadcrumb uses wrong case (`pending_review`) |
