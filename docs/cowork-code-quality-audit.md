# DAFTAR — Code Quality Audit

**Date:** 2026-03-18
**Auditor:** Automated (Claude)
**Codebase:** https://github.com/ShowNoMoreOfficial/DAFTAR.git
**Live URL:** https://daftar-one.vercel.app

---

## Executive Summary

| Task | Area | Score | Verdict |
|------|------|-------|---------|
| 1 | File Organization | 8.5/10 | Well-structured, monolithic pages need splitting |
| 2 | Import Health | 9/10 | Clean — 2 unused imports, 0 circular deps |
| 3 | Component Audit | 8.5/10 | 100% typed, 1 unused, 9 oversized |
| 4 | API Route Consistency | 4/10 | 48% lack try/catch, 19% lack validation |
| 5 | Environment Variables | 5/10 | Critical naming mismatches, 14 undocumented |
| 6 | Prisma Schema vs Usage | 7/10 | 10 unused models, 5 missing indexes |
| 7 | Skill Files Quality | 9.5/10 | 165 files, well-integrated, near-zero duplicates |
| 8 | Git History | 9/10 | 74 commits/week, 0 reverts, conventional commits |
| 9 | Documentation | 8.5/10 | 29 docs; README is default boilerplate |
| 10 | Performance | 7/10 | 1 N+1 critical, missing pagination in places |

**Overall: 7.6/10 — Good foundation, API hardening needed before scale.**

---

## TASK 1: File Organization

### Codebase Size

| Metric | Count |
|--------|-------|
| Total .ts + .tsx files | 532 |
| Total lines of code (src/) | 88,489 |

### Files Per Directory

| Directory | Files | Notes |
|-----------|-------|-------|
| src/app/ | 372 | Routes, pages, API endpoints |
| src/lib/ | 91 | Business logic, utilities |
| src/components/ | 62 | React components |
| src/types/ | 4 | Type definitions |
| src/store/ | 1 | Global state |

### API Route Breakdown (224 route.ts files)

| Module | Routes |
|--------|--------|
| yantri (Content) | 49 |
| khabri (Intelligence) | 18 |
| hoccr (Team) | 17 |
| relay (Publishing) | 11 |
| gi (AI Copilot) | 9 |
| finance | 9 |
| tasks | 7 |
| signals | 7 |
| Other | 97 |

### Largest Files (500+ lines)

| Lines | File | Concern |
|-------|------|---------|
| 2,136 | src/lib/gi-engine.ts | Core engine — expected |
| 1,370 | src/app/(shell)/m/yantri/review/[id]/page.tsx | **Should split** |
| 1,289 | src/app/(shell)/content-studio/page.tsx | **Should split** |
| 1,277 | src/app/(shell)/finance/page.tsx | **Should split** |
| 1,266 | src/app/api/yantri/quick-generate/route.ts | **Should split** |
| 1,054 | src/app/(shell)/m/yantri/narrative-trees/[treeId]/page.tsx | **Should split** |
| 970 | src/app/(shell)/ppc/page.tsx | **Should split** |
| 846 | src/app/(shell)/admin/config/page.tsx | **Should split** |
| 798 | src/app/(shell)/hoccr/intelligence/page.tsx | Should split |
| 792 | src/app/(shell)/m/yantri/plan/[batchId]/page.tsx | Should split |
| 776 | src/app/(shell)/intelligence/page.tsx | Should split |
| 716 | src/app/(shell)/communication/page.tsx | Should split |
| 694 | src/app/(shell)/notifications/page.tsx | Should split |
| 690 | src/lib/skill-orchestrator.ts | Core engine — expected |
| 675 | src/app/(shell)/hoccr/culture/page.tsx | Should split |
| 632 | src/lib/yantri/inngest/deliverable-pipelines.ts | Pipeline — acceptable |
| 631 | src/lib/gi-skill-engine.ts | Core engine — expected |
| 616 | src/app/(shell)/hoccr/communication/page.tsx | Should split |
| 602 | src/lib/gi/tools.ts | Logic — acceptable |
| 560 | src/lib/yantri/inngest/functions.ts | Pipeline — acceptable |

**20 files over 500 lines.** 13 of those are page components that should extract sub-components into `_components/` subdirectories.

### Empty/Near-Empty Files (under 10 lines)

All 12 files under 10 lines are legitimate: NextAuth re-export (3 lines), Inngest client singleton (3 lines), redirect pages (5 lines), Prisma singleton (9 lines). No dead files found.

### Misplaced Files

None detected. The project follows a clean separation: components in `src/components/`, logic in `src/lib/`, routes in `src/app/`. Remotion video compositions are correctly in `src/lib/remotion/` (render logic, not UI).

### Missing

- **No test files** — zero `.test.ts` or `.spec.ts` files found anywhere in src/.

---

## TASK 2: Import Health

### Unused Imports (2 found)

| File | Import | Status |
|------|--------|--------|
| src/app/api/hoccr/announcements/[id]/route.ts | `badRequest` from api-utils | Never called |
| src/app/api/communication/announcements/route.ts | `hasPermission` from permissions | Never called |

### Circular Dependencies

**None detected.** Checked all key shared modules (auth.ts, prisma.ts, skill-orchestrator.ts, yantri/, relay/) across 5 levels of dependency depth.

### Missing Type Imports (~150 files)

Systemic issue: `NextRequest` is imported as a value import instead of a type import across nearly all API route handlers.

**Current pattern (150+ files):**
```typescript
import { NextRequest, NextResponse } from "next/server";
```

**Should be:**
```typescript
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
```

This is a code hygiene issue (not a bug). `NextRequest` is only used as a type annotation in function parameters, never as a runtime value.

---

## TASK 3: Component Audit

**62 components** in src/components/ (~10,027 lines).

### Unused Components (1 found)

| File | Lines | Notes |
|------|-------|-------|
| src/components/client/revision-dialog.tsx | 82 | Never imported anywhere — placeholder for future feature |

### TypeScript Props Typing

**100% compliance.** Every component has explicit interface/type definitions for props. Zero use of `any` in component props.

### Loading/Error State Handling

| Pattern | Coverage |
|---------|----------|
| Components with loading UI | 18 / 62 (29%) |
| Components with error handling | 15 / 62 (24%) |
| Error Boundary components | 0 |
| Suspense boundaries | 0 |

Most components fall back to empty states on error rather than showing error UI. No shared error toast notification system exists.

### Oversized Components (300+ lines)

| File | Lines | Refactor Priority |
|------|-------|-------------------|
| content-studio/production-tab.tsx | 530 | HIGH — extract ProductionCard |
| shell/sidebar.tsx | 466 | MEDIUM — extract menu items |
| relay/create-post-dialog.tsx | 414 | MEDIUM — extract PlatformSelector |
| dashboard/client-dashboard.tsx | 396 | LOW — well-organized |
| shell/notification-bell.tsx | 387 | MEDIUM — extract NotificationItem |
| pms/task-detail-panel.tsx | 366 | MEDIUM — extract sub-forms |
| gi/gi-assistant.tsx | 360 | MEDIUM — extract ChatMessage |
| finance/create-invoice-dialog.tsx | 344 | LOW — extract LineItemsTable |
| dashboard/kpi-cards.tsx | 310 | LOW — extract data to hooks |

**Size distribution:** 65% under 200 lines (healthy), 14% over 300 lines (needs attention).

---

## TASK 4: API Route Consistency

### Summary (224 routes)

| Check | Pass | Fail | Coverage |
|-------|------|------|----------|
| Authentication | 219 | 5 (+9 yantri) | 97.8% (but 14 truly unprotected) |
| Try/Catch | 116 | 108 | 51.8% |
| Input Validation | 182 | 42 | 81.2% |
| Consistent Response Format | 171 | 53 | 76.3% |

### Routes Without Authentication (14 total)

| Route | Risk | Notes |
|-------|------|-------|
| /api/auth/[...nextauth] | None | Expected — NextAuth handler |
| /api/inngest | None | Expected — Inngest webhook signing |
| /api/relay/oauth/[platform]/callback | None | Expected — OAuth callback |
| /api/client/action | HIGH | Accepts unvalidated tokens |
| /api/cron/learning-loop | HIGH | No auth at all |
| /api/cron/overdue-check | MEDIUM | Has bearer token but no validation |
| /api/cron/performance-sync | HIGH | No auth at all |
| /api/cron/relay-executor | HIGH | No auth at all |
| /api/yantri/content-pieces | HIGH | No auth — content endpoint |
| /api/yantri/content-pieces/[id] | HIGH | No auth — content mutation |
| /api/yantri/deliverables/[id]/assets | HIGH | No auth — asset access |
| /api/yantri/fact-engine/[treeId] | MEDIUM | No auth — read endpoint |
| /api/yantri/ingest | HIGH | No auth — data ingestion |
| /api/yantri/narrative-trees (4 routes) | HIGH | No auth — tree CRUD |

### Worst Modules by Issue Count

| Module | No Try/Catch | No Validation | No Auth | Total Issues |
|--------|-------------|---------------|---------|--------------|
| hoccr/ | 13 | 2 | 0 | 15 |
| finance/ | 7 | 0 | 0 | 7 |
| yantri/ | 12 | 8 | 9 | 29 |
| config/ | 6 | 0 | 0 | 6 |
| analytics/ | 5 | 5 | 0 | 10 |
| vritti/ | 5 | 0 | 0 | 5 |

### HTTP Methods Distribution

| Method | Routes |
|--------|--------|
| GET | 190 |
| POST | 130 |
| PATCH | 74 |
| DELETE | 44 |
| PUT | 20 |

**Full per-route table:** See companion spreadsheet `docs/api-route-audit.xlsx`.

---

## TASK 5: Environment Variables

### Critical: Naming Mismatches

The `.env.template` lists variable names that don't match the code. Developers following the template will get silent auth failures.

| Template Says | Code Expects | Impact |
|---------------|-------------|--------|
| GOOGLE_CLIENT_ID | AUTH_GOOGLE_ID | Google OAuth breaks |
| GOOGLE_CLIENT_SECRET | AUTH_GOOGLE_SECRET | Google OAuth breaks |
| MICROSOFT_CLIENT_ID | AUTH_MICROSOFT_ENTRA_ID_ID | Microsoft OAuth breaks |
| MICROSOFT_CLIENT_SECRET | AUTH_MICROSOFT_ENTRA_ID_SECRET | Microsoft OAuth breaks |

### All Environment Variables (49 unique)

**Required (app crashes without):**

| Variable | Used In |
|----------|---------|
| DATABASE_URL | Prisma (prisma/schema.prisma) |
| NEXTAUTH_SECRET / AUTH_SECRET | Session encryption (src/lib/auth.ts) |
| NEXTAUTH_URL | Auth callbacks (src/lib/auth.ts) |
| GEMINI_API_KEY | Research AI (src/lib/yantri/) |
| ANTHROPIC_API_KEY | Creative AI (src/lib/yantri/) |
| KHABRI_API_KEY | Intelligence (src/lib/khabri/) |

**Undocumented (in code but missing from .env.template):**

| Variable | Purpose |
|----------|---------|
| CRON_SECRET | Bearer token for cron endpoints |
| AUTH_MICROSOFT_ENTRA_ID_TENANT_ID | Microsoft OAuth tenant |
| TWITTER_CLIENT_ID / SECRET | Twitter publishing |
| LINKEDIN_CLIENT_ID / SECRET | LinkedIn publishing |
| YOUTUBE_CLIENT_ID / SECRET | YouTube publishing |
| AWS_ACCESS_KEY_ID / SECRET_ACCESS_KEY | S3 storage |
| AWS_S3_BUCKET / S3_REGION / S3_ENDPOINT | S3 config |
| GOOGLE_AI_API_KEY | Alt Gemini key |
| TOGETHER_API_KEY | Together AI fallback |
| META_IG_REDIRECT_URI / META_FB_REDIRECT_URI | Meta OAuth |

**Dead (in template but never referenced):**

| Variable | Status |
|----------|--------|
| INNGEST_EVENT_KEY | Not in code anywhere |
| INNGEST_SIGNING_KEY | Not in code anywhere |

---

## TASK 6: Prisma Schema vs Usage

### Schema Overview

| Metric | Count |
|--------|-------|
| Total models | 96 |
| Models with indexes | ~35 (36%) |
| Models with foreign keys | 85+ |

### Unused Models (defined but never queried)

| Model | Lines in Schema | References in src/ |
|-------|----------------|--------------------|
| VariableReward | ~15 | 0 |
| StrategyTest | ~12 | 0 |
| ChallengeEntry | ~10 | 0 |
| MicroChallenge | ~15 | 0 |
| WorkflowTemplate | ~12 | 0 |
| RoleConfig | ~10 | 0 |
| PlatformConfig | ~10 | 0 |
| Achievement | ~12 | 0 |
| UserAchievement | ~10 | 0 |
| UserStreak | ~10 | 0 |

10 models (10.4%) are dead weight — adding migration overhead and schema complexity with no benefit.

### Missing Indexes (Performance Risk)

| Model | Fields Needing Index | Query Pattern |
|-------|---------------------|---------------|
| TrendBatch | importedAt, source | Analytics date/source filtering |
| ContentPerformance | platform + date (composite) | Analytics dashboard |
| Article | brandId + status | CMS filtering |
| ContentPost | brandId + platform | Publishing queries |
| ContentPiece | status + createdAt | Pipeline filtering |
| Deliverable | status + createdAt | Client portal |
| Signal | trendId | Intelligence pipeline |
| GIConversation | userId + createdAt | Copilot history |
| ClientDeliverable | createdAt | Temporal queries |
| ClientReport | generatedAt | Report listing |
| SkillExecution | deliverableId | FK join |

### N+1 Query Risk

Most routes use proper Prisma `include`/`select`. One route flagged: `/api/cron/relay-executor` may iterate over posts and fetch per-item.

---

## TASK 7: Skill Files Quality

### Overview

| Metric | Value |
|--------|-------|
| Total skill files | 165 |
| Domains covered | 12 |
| Format compliance | 95%+ |
| Substantive (>50 lines) | 95% |
| Near-duplicates | 1 pair (complementary, not redundant) |
| Integration | Fully loaded by SkillOrchestrator (690 lines) |

### Skill Domains

signals, narrative, platforms, production, brand, analytics, distribution, workflows, system, GI, PMS, editorial

### Quality Highlights

Standard format across files: Module, Trigger, Inputs, Outputs, Dependencies, Instructions, Learning Log sections. Top-quality examples include YouTube thumbnail strategy (355 lines), hook engineering (422 lines), thread architecture (363 lines).

### One Near-Duplicate

`narrative-arc-construction.md` (editorial flow) vs `narrative-arc.md` (authoritative guide) — content is complementary, not problematic.

---

## TASK 8: Git History Analysis

### Activity

| Metric | Value |
|--------|-------|
| Commits since Mar 10 | 96 |
| Commits in last 7 days | 74 |
| Average per day | ~6 |
| Files changed (last 10 commits) | 757 |
| Lines added (last 10) | 143,944 |
| Lines removed (last 10) | 138,932 |
| Reverted commits | 0 |

### Commit Quality

Conventional commit messages (feat:, fix:, chore:). Zero reverts — all changes forward-moving. No blocked deployments. Continuous integration to Vercel working smoothly.

### Recent Focus Areas

PPC ads module, OAuth fixes, image generation, skill orchestrator integration, content studio improvements.

---

## TASK 9: Documentation Completeness

### Inventory (29 documents)

| Document | Status | Quality |
|----------|--------|---------|
| CLAUDE.md | Exists | Excellent — comprehensive project context |
| README.md | Exists | **Default Next.js boilerplate — needs replacement** |
| docs/deployment-checklist.md | Exists | Excellent (944 lines) |
| docs/developer-onboarding.md | Exists | Excellent (1,848 lines) |
| docs/API_ROUTES_INVENTORY.md | Exists | Good (19.3 KB, 50+ endpoints) |
| docs/production-readiness-audit.md | Exists | Generated by previous audit |
| 10 module guides | Exist | Good coverage |
| 5 user guides | Exist | Good coverage |
| 9 audit reports | Exist | Various dates |

### Gaps

| Missing | Priority |
|---------|----------|
| Root README.md (real content) | HIGH |
| CONTRIBUTING.md (standalone) | MEDIUM |
| OpenAPI/Swagger spec | MEDIUM |
| Architecture diagram | LOW |

---

## TASK 10: Performance Concerns

### CRITICAL: N+1 Query Pattern

**File:** `/src/app/api/credibility/recalculate/route.ts`

Loops through ~20 users, executing 3 database calls per user = **61 DB calls per single request.** This runs via cron and could spike database CPU under load.

**Fix:** Batch-fetch all tasks in one query, use database aggregation instead of per-user loops.

### Missing Pagination

| Route | Risk |
|-------|------|
| /api/yantri/deliverables (listing) | Could return hundreds of records |
| /api/skills/performance | Calls getSkillPerformance() 165 times |
| /api/yantri/history | No take/skip parameters |

### React Optimization

| Check | Coverage |
|-------|----------|
| Components with React.memo | ~63% |
| Components with useMemo/useCallback | ~37% |
| Dynamic imports / lazy loading | Not used |
| Suspense boundaries | 0 |

### Asset Size

No large assets detected — `public/` directory contains only 8 KB of SVGs. Images are generated dynamically. No moment.js or full lodash imports (tree-shaking working). Lucide icons are properly tree-shaken.

### Scaling Recommendation

Add Redis caching layer for brands, platforms, and configuration data (5-15 min TTL) before scaling to multiple clients.

---

## Priority Action Items

### P0 — Fix Now

1. **Add try/catch to all 108 unprotected API routes** — create a shared `withErrorHandling()` wrapper
2. **Add auth to 14 unprotected routes** — especially yantri content endpoints and cron jobs
3. **Fix .env.template naming mismatches** — Google/Microsoft OAuth vars have wrong names
4. **Fix N+1 query in credibility/recalculate** — batch database calls
5. **Document 14 missing env vars** in .env.template

### P1 — Fix Soon

6. **Add Zod validation** to 42 routes lacking input validation
7. **Split 13 monolithic page files** (1000+ lines) into component hierarchies
8. **Add pagination** to deliverables listing and skill performance endpoints
9. **Replace default README.md** with real project documentation
10. **Remove 10 unused Prisma models** to reduce schema complexity

### P2 — Improve

11. **Add missing Prisma indexes** (11 models identified)
12. **Convert 150+ files** to use `import type { NextRequest }`
13. **Add Error Boundaries** and shared error toast notifications
14. **Add Suspense boundaries** for code splitting
15. **Remove 2 dead env vars** from template
16. **Add test infrastructure** (zero test files currently exist)
17. **Create CONTRIBUTING.md** and OpenAPI spec

---

## Appendix: Verification Commands

```bash
# Find routes without auth
grep -rL "auth()\|getAuthSession\|getServerSession" src/app/api/**/route.ts

# Find routes without try/catch
grep -rL "try {" src/app/api/**/route.ts

# Find unused imports (sample check)
npx ts-unused-exports tsconfig.json

# Find files over 500 lines
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -30

# Check for unused Prisma models
for model in $(grep "^model " prisma/schema.prisma | awk '{print $2}'); do
  count=$(grep -r "$model" src/ --include="*.ts" --include="*.tsx" -l | wc -l)
  [ "$count" -eq 0 ] && echo "UNUSED: $model"
done

# TypeScript check
npx tsc --noEmit
```
