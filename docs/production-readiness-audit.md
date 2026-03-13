# DAFTAR — Production Readiness Audit

**Date:** 2026-03-13
**Auditor:** Automated (Claude)
**Codebase:** https://github.com/ShowNoMoreOfficial/DAFTAR.git
**Live URL:** https://daftar-one.vercel.app

---

## Overall Readiness Score

| Check | Status | Score |
|---|---|---|
| API Route Safety | ⚠️ Needs Work | 4/10 |
| Environment Variables | ⚠️ Needs Work | 5/10 |
| Prisma Schema Health | ✅ Mostly Good | 7/10 |
| TypeScript Strictness | ✅ Pass | 10/10 |
| Bundle Size | ⏭️ Not Tested (see note) | — |
| Security | ⚠️ Needs Work | 6/10 |

**Verdict: NOT production-ready.** The codebase compiles cleanly and auth coverage is solid (91%), but 62% of API routes lack error handling, 68% lack input validation, and there are critical security gaps (exposed SMTP endpoint, unvalidated client tokens).

---

## CHECK 1: API Route Audit

**209 total route.ts files found** in `src/app/api/`.

### Error Handling (try/catch)

- **With try/catch:** 79 / 209 (38%)
- **Missing try/catch:** 130 / 209 (62%) — HIGH RISK

Any unhandled exception in these routes will produce a raw 500 error with no logging and no useful client response.

**Routes missing error handling (notable examples):**

| Route | Risk Level |
|---|---|
| `/api/finance/invoices/[id]/pdf` | HIGH — PDF generation can fail many ways |
| `/api/finance/expenses/[id]` | HIGH — financial data mutation |
| `/api/finance/overview` | MEDIUM — aggregation query |
| `/api/communication/announcements/[id]` | MEDIUM — CRUD operations |
| `/api/communication/feedback/entries/[id]` | MEDIUM — CRUD operations |
| `/api/config/brands/[id]` | MEDIUM — admin configuration |
| `/api/config/departments/[id]` | MEDIUM — admin configuration |
| `/api/config/platforms/[id]` | MEDIUM — admin configuration |
| `/api/config/workflows/[id]` | MEDIUM — admin configuration |
| `/api/gamification/*` (all 4 routes) | LOW — gamification features |
| `/api/gi/*` (actions, config, learning, tiers) | MEDIUM — AI assistant |
| `/api/analytics/*` (all routes) | MEDIUM — read-heavy but still can crash |
| `/api/departments/*` | LOW — CRUD |
| `/api/feedback/*` | LOW — CRUD |

Full list includes 130 routes. See the codebase `src/app/api/` for comprehensive coverage.

### Authentication Checks

- **With auth:** 190 / 209 (91%) — GOOD
- **Missing auth:** 19 / 209 (9%)

**Routes missing authentication:**

| Route | Justified? |
|---|---|
| `/api/auth/[...nextauth]` | ✅ Yes — NextAuth handler |
| `/api/inngest` | ✅ Yes — Inngest webhook (has signing key) |
| `/api/relay/oauth/[platform]/callback` | ✅ Yes — OAuth callback |
| `/api/client/action` | ⚠️ Partial — uses token but no verification |
| `/api/cron/overdue-check` | ⚠️ Partial — has bearer token check |
| `/api/cron/learning-loop` | ❌ No auth at all |
| `/api/cron/performance-sync` | ❌ No auth at all |
| `/api/cron/relay-executor` | ❌ No auth at all |
| `/api/test-smtp` | ❌ CRITICAL — exposes email credentials |
| `/api/debug-session` | ❌ Exposes full session object |
| `/api/yantri/content-pieces/[id]` | ❌ No auth |
| `/api/yantri/content-pieces` | ❌ No auth |
| `/api/yantri/deliverables/[id]/assets` | ❌ No auth |
| `/api/yantri/deliverables` | ❌ No auth |
| `/api/yantri/fact-engine/[treeId]` | ❌ No auth |
| `/api/yantri/ingest` | ❌ No auth |
| `/api/yantri/narrative-trees/*` (4 routes) | ❌ No auth |

**Action Required:** All `/api/yantri/*` routes and cron endpoints need auth guards immediately.

### Input Validation

- **With validation:** 66 / 209 (32%)
- **Missing validation:** 143 / 209 (68%) — HIGH RISK

Most POST/PATCH/PUT routes accept request bodies without verifying required fields, types, or bounds.

---

## CHECK 2: Environment Variables

### Critical Issue — Name Mismatches

The `.env.template` lists variable names that **don't match what the code actually uses**:

| Template Says | Code Expects | Impact |
|---|---|---|
| `GOOGLE_CLIENT_ID` | `AUTH_GOOGLE_ID` | Auth breaks silently |
| `GOOGLE_CLIENT_SECRET` | `AUTH_GOOGLE_SECRET` | Auth breaks silently |
| `MICROSOFT_CLIENT_ID` | `AUTH_MICROSOFT_ENTRA_ID_ID` | Auth breaks silently |
| `MICROSOFT_CLIENT_SECRET` | `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Auth breaks silently |

Anyone following the template to set up the app will get broken authentication with no clear error.

### Required Variables (app crashes without these)

| Variable | Used In |
|---|---|
| `DATABASE_URL` | Prisma connection |
| `NEXTAUTH_SECRET` (or `AUTH_SECRET`) | Session encryption |
| `NEXTAUTH_URL` | Auth callback URLs |
| `GEMINI_API_KEY` | Research/strategy AI |
| `ANTHROPIC_API_KEY` | Creative content AI |
| `KHABRI_API_KEY` | Intelligence signals |

### Undocumented Variables (missing from .env.template but used in code)

| Variable | Purpose |
|---|---|
| `CRON_SECRET` | Bearer token for cron endpoint security |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | Twitter OAuth publishing |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth publishing |
| `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` | YouTube OAuth publishing |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` | S3 file storage |
| `GOOGLE_AI_API_KEY` | Alternative Gemini key |
| `TOGETHER_API_KEY` | Together AI fallback |
| `META_IG_REDIRECT_URI` / `META_FB_REDIRECT_URI` | Meta platform OAuth |

### Dead Variables (in template but never referenced in code)

| Variable | Status |
|---|---|
| `INNGEST_EVENT_KEY` | Not referenced anywhere |
| `INNGEST_SIGNING_KEY` | Not referenced anywhere |

---

## CHECK 3: Prisma Schema Health

### Schema Validity
The schema file is syntactically valid. **93 models** defined across the unified schema.

(Note: `npx prisma validate` could not run in this environment due to Prisma binary download restrictions. Validation was performed via manual review.)

### Unused Models (defined but never queried in code)

| Model | Status |
|---|---|
| `VariableReward` | Zero references in src/ |
| `StrategyTest` | Zero references in src/ |
| `ChallengeEntry` | Zero references in src/ |
| `MicroChallenge` | Zero references in src/ |
| `WorkflowTemplate` | Zero references in src/ |
| `RoleConfig` | Zero references in src/ |
| `PlatformConfig` | Zero references in src/ |
| `Achievement` | Zero references in src/ |
| `UserAchievement` | Zero references in src/ |
| `UserStreak` | Zero references in src/ |

**10 models (11%)** appear unused. These add migration overhead and schema complexity with no benefit.

### Missing Indexes

| Model | Field(s) | Why It Matters |
|---|---|---|
| `TrendBatch` | `importedAt`, `source` | Queried by date and source in analytics — full table scans |
| `ContentPerformance` | `platform` + `date` (composite) | Analytics filter on both fields together |
| `ClientDeliverable` | `createdAt` | Temporal queries without index |
| `ClientReport` | `generatedAt` | Temporal queries without index |
| `SkillExecution` | `deliverableId` | Foreign key queried but not indexed |

### N+1 Query Risks
Most routes use proper Prisma `include`/`select` patterns. One route to review: `/api/cron/relay-executor` may iterate over scheduled posts and fetch related data per-item.

---

## CHECK 4: TypeScript Strictness

```
$ npx tsc --noEmit
Exit code: 0
Errors: 0
```

**PASS — Zero type errors.** The codebase compiles cleanly with no type safety issues.

---

## CHECK 5: Bundle Size

**Not tested.** The sandbox environment could not download the Next.js SWC compiler (`@next/swc-linux-x64-gnu`). This check should be run in CI or locally.

**Recommended command:**
```bash
npm run build
```

Check the output for:
- Total pages built
- Any pages over 500KB first-load JS
- Any build warnings

This check should be part of CI/CD pipeline validation on every deploy.

---

## CHECK 6: Security Audit

### CRITICAL

| Finding | File | Impact |
|---|---|---|
| **Unauthenticated SMTP endpoint** | `/api/test-smtp/route.ts` | Exposes email server host, port, and username in API response. Allows arbitrary email sending without auth. Can be used for spam/phishing. |

**Fix:** Delete this route or gate behind `NODE_ENV === 'development'` and admin auth.

### HIGH

| Finding | File | Impact |
|---|---|---|
| **Unvalidated client tokens** | `/api/client/action/route.ts` | Accepts any token without database/JWT verification. Attackers can approve/reject deliverables by guessing tokens. |
| **Unprotected Yantri routes** | `/api/yantri/*` (10 routes) | Content creation, narrative trees, and fact engine endpoints accessible without authentication. |
| **Unprotected cron endpoints** | `/api/cron/learning-loop`, `performance-sync`, `relay-executor` | Can be triggered by anyone, potentially causing data corruption or resource exhaustion. |

### MEDIUM

| Finding | File | Impact |
|---|---|---|
| **Debug endpoint in production** | `/api/debug-session/route.ts` | Returns full session object with user email, role, and internal IDs. Information disclosure risk. |

### LOW

| Finding | File | Impact |
|---|---|---|
| **`$queryRawUnsafe` usage** | 1 occurrence found | SQL is hardcoded (no user input concatenation), so no injection risk currently, but the pattern is fragile. |

### Positive Security Controls

- **Zero hardcoded API keys** in source code
- **Zero XSS vectors** — no `dangerouslySetInnerHTML` found anywhere
- **All 9 raw SQL queries** properly parameterized (no string concatenation)
- **NextAuth v5** with proper session handling on 91% of routes
- **No CORS misconfigurations** — uses Next.js defaults (same-origin)
- **Error responses** don't leak stack traces

### Missing Controls

| Control | Status |
|---|---|
| Rate limiting | ❌ None on any endpoint |
| Request size limits | ❌ No explicit limits on POST bodies |
| CSRF protection | ✅ Handled by NextAuth |
| Content Security Policy | ❌ No CSP headers configured |

---

## Priority Action Items

### P0 — Fix Before Production (blocks launch)

1. **Delete or protect `/api/test-smtp`** — exposes email credentials
2. **Add auth to all `/api/yantri/*` routes** — 10 unprotected content endpoints
3. **Add CRON_SECRET validation** to `learning-loop`, `performance-sync`, `relay-executor`
4. **Fix .env.template variable names** — auth will silently break for new deployments
5. **Add try/catch to financial routes** — `/api/finance/*` handles money

### P1 — Fix Soon (first sprint post-launch)

6. **Add try/catch error handling** to remaining 125 routes (create a shared wrapper)
7. **Add input validation** to all POST/PATCH/PUT routes (use zod or similar)
8. **Delete or gate `/api/debug-session`** behind development mode
9. **Validate client action tokens** against database
10. **Add rate limiting** to public-facing endpoints

### P2 — Improve (backlog)

11. **Add missing Prisma indexes** on TrendBatch, ContentPerformance, ClientDeliverable
12. **Remove 10 unused Prisma models** to reduce schema complexity
13. **Add Content Security Policy headers** in `next.config.ts`
14. **Add request body size limits** to file upload endpoints
15. **Document all 14 undocumented env vars** in `.env.template`
16. **Remove 2 dead env vars** (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`) from template

---

## Appendix: Test Commands

```bash
# Run these locally or in CI to verify fixes

# TypeScript check (currently passing)
npx tsc --noEmit

# Prisma validation
npx prisma validate

# Build check (verify no pages over 500KB)
npm run build

# Grep for remaining unprotected routes
grep -rL "auth()\|getAuthSession\|getServerSession" src/app/api/**/route.ts

# Grep for missing try/catch
grep -rL "try {" src/app/api/**/route.ts
```
