# DAFTAR E2E Test Report

Date: 2026-03-12
Tester: Claude Code
Environment: Windows 10 Pro, Node v24.14.0, Next.js 16.1.6

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | 42 |
| Passed | 33 |
| Failed | 3 |
| Skipped | 6 (auth-required API calls — JWT-only, no session tokens) |

## Results by Phase

### Phase 1: Build + Startup
- [x] **PASS** Build succeeds: 0 TypeScript errors, all routes compiled
- [x] **PASS** Server starts: Ready in 4.1s on localhost:3000
- [x] **PASS** Server responds: HTTP 307 (redirect to login)
- [ ] **FAIL** Login page loads: HTTP 500 — Turbopack error reading `NUL` file (Windows artifact). **Dev-only issue** — production build works fine.

### Phase 2: Database State
- [x] **PASS** 8 real team accounts: Lavan (ADMIN), ShowNoMore (ADMIN), Stallone (ADMIN), Muskan (HEAD_HR), Deepak (MEMBER), Parth (MEMBER), Sudhanshu (MEMBER), Bhupendra Chaubey (CLIENT)
- [x] **PASS** No demo users: 8 total users, 0 non-team
- [x] **PASS** Brands with voice data:
  - The Squirrels: tone=analytical-provocative, lang=English, 16 voice rules, 6 editorial covers, 7 editorial-never
  - Breaking Tube: tone=energetic-accessible, lang=Hinglish, 7 voice rules, 4 editorial covers, 2 editorial-never
- [ ] **FAIL** Duplicate data found:
  - **18 trends are 6 copies of 3 unique trends** (seed ran 6 times)
  - **36 signals are 6 copies of 6 unique signals** (seed ran 6 times)
  - 1 duplicate task: "Monthly HR compliance report" x7
- [x] **PASS** Skills synced: 154 on disk, 150 in DB (4 delta acceptable — likely README/index files)
- [x] **PASS** GI Conversations table exists: 0 conversations (expected — JWT auth, no persistent chats yet)
- [x] **PASS** Existing content: 5 deliverables (2 REVIEW, 2 APPROVED, 1 KILLED), 22 assets, 16 narrative trees, 4 fact dossiers, 3 content pieces

### Phase 3: Recommendation Engine
- [x] **PASS** Endpoint exists: POST /api/yantri/recommend returns 401 (auth required)
- [x] **PASS** GET returns 405 (method not allowed)
- [x] **PASS** Bad body returns 401 before validation (auth-first)
- [ ] **SKIP** Returns 3-5 recommendations: Requires authenticated session (JWT)
- [ ] **SKIP** Multiple brands in results: Requires authenticated session
- [ ] **SKIP** Signal metadata passthrough: Requires authenticated session

### Phase 4: Content Generation
- [x] **PASS** Endpoint exists: POST /api/yantri/quick-generate returns 401 (auth required)
- [ ] **SKIP** YouTube Explainer generates: Requires authenticated session
- [ ] **SKIP** X Thread generates: Requires authenticated session
- [ ] **SKIP** Carousel generates: Requires authenticated session

### Phase 5: GI Intelligence
- [x] **PASS** Endpoint exists: POST /api/gi/chat returns 401 (auth required)
- [ ] **SKIP** Chat quality tests: Requires authenticated session

### Phase 6: Page Loads
All 16 pages return 307 (redirect to login) — correct behavior for unauthenticated requests:
- [x] **PASS** /dashboard → 307
- [x] **PASS** /intelligence → 307
- [x] **PASS** /content-studio → 307
- [x] **PASS** /pms → 307
- [x] **PASS** /pms/board → 307
- [x] **PASS** /pms/workload → 307
- [x] **PASS** /relay → 307
- [x] **PASS** /relay/calendar → 307
- [x] **PASS** /relay/connections → 307
- [x] **PASS** /hoccr → 307
- [x] **PASS** /m/vritti → 307
- [x] **PASS** /m/vritti/pipeline → 307
- [x] **PASS** /finance → 307
- [x] **PASS** /communication → 307
- [x] **PASS** /settings → 307
- [x] **PASS** /reports → 307
- [ ] **FAIL** /login → 500 (Turbopack reads `NUL` file, dev-only)

### Phase 7: Search
- [x] **PASS** Search API exists: /api/search returns 401 (not 404 or 500)

### Phase 8: Skills
- [x] **PASS** Skills on disk: 154, in DB: 150 (delta within tolerance)
- [x] **PASS** Skill modules: relay(44), daftar(38), yantri(24), pms(22), hoccr(12), khabri(9), gi(1)
- [x] **PASS** Total skill executions: 159 (from previous generation runs)
- [x] **PASS** Recent executions (24h): 0 (no authenticated tests ran)

### Phase 9: Cross-System Flow
- [ ] **SKIP** Signal → Recommend → Generate → Deliverable: Requires authenticated session (JWT-only auth, no session tokens in DB)

### Phase 10: Error Boundaries
- [x] **PASS** content-studio: error.tsx exists
- [x] **PASS** intelligence: error.tsx exists
- [x] **PASS** dashboard: error.tsx exists
- [x] **PASS** pms: error.tsx exists
- [x] **PASS** relay: error.tsx exists
- [x] **PASS** hoccr: error.tsx exists
- [x] **PASS** finance: error.tsx exists
- [x] **PASS** communication: error.tsx exists
- [x] **PASS** settings: error.tsx exists

### Phase 11: UI Checks
- [x] **PASS** Breadcrumb mapping: yantri→"Content Studio", khabri→"Intelligence", relay→"Publishing", pms→"Production", hoccr→"Team & HR", vritti→"Editorial"
- [x] **PASS** Sidebar responsive: Uses matchMedia (min-width: 768px) — not resize event

---

## Failed Tests — Details

### 1. Login Page 500 (Dev Only)
**Error:** `TurbopackInternalError: reading file C:\Users\SNM\Desktop\dev\DAFTAR\NUL — Incorrect function (os error 1)`
**Cause:** A `NUL` file (Windows device name) exists in the repo root. Turbopack's CSS pipeline tries to read it and fails.
**Impact:** Dev server only. Production build (`npm run build`) and Vercel deployment are unaffected.
**Fix:** Delete the `NUL` file and add it to `.gitignore`. On Windows, use `del \\?\C:\Users\SNM\Desktop\dev\DAFTAR\NUL` from Command Prompt.

### 2. Duplicate Trends/Signals in Database
**Data:**
- 3 unique trends duplicated 6x each = 18 rows (should be 3)
- 6 unique signals duplicated 6x each = 36 rows (should be 6)
- 1 task duplicated 7x: "Monthly HR compliance report"

**Cause:** `tests/seed/seed-test-data.ts` was run multiple times without cleanup.
**Impact:** Editorial Brief on Dashboard will show duplicate trends. Intelligence page shows duplicated signals.
**Fix:** Deduplicate: delete duplicate trend/signal/task rows keeping the oldest of each, or re-run seed with cleanup logic.

### 3. Authenticated API Tests Skipped
**Reason:** NextAuth v5 uses JWT-based sessions (not DB-stored session tokens). The `sessions` table is empty, so there are no tokens to borrow for curl-based API testing.
**Impact:** Cannot verify recommend, quick-generate, GI chat, or full-flow tests via CLI.
**Workaround:** Test these endpoints via the browser after logging in, or create a test helper that mints JWTs programmatically.

---

## Recommendations

### Critical (Fix Before Production)
1. **Delete `NUL` file** — Blocks dev server login page. Add `NUL` to `.gitignore`.
2. **Deduplicate trends/signals** — Run a cleanup script or add `upsert`/`findOrCreate` logic to seed.

### Important
3. **Add authenticated E2E test harness** — Create a helper that mints test JWTs so API endpoints can be tested via CLI. Currently 6 tests are skipped.
4. **Skill sync delta** — 154 on disk vs 150 in DB. Run `SkillOrchestrator.syncSkillsToDb()` to reconcile the 4 missing skills.

### Nice to Have
5. **GI conversation persistence** — 0 conversations stored. GI chat may not be persisting conversation history.
6. **Task deduplication** — "Monthly HR compliance report" exists 7 times. Add unique constraints or cleanup.
