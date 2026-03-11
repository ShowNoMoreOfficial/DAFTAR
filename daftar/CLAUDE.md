# DAFTAR — Project Context for Claude Code

## What This Is
Daftar is an AI-powered agency operations platform for ShowNoMore, a Delhi-based media-tech studio.
Tech stack: Next.js 16 + React 19 + Prisma 6 (PostgreSQL/pgvector) + Tailwind 4 + Inngest + Gemini + Anthropic SDK.
Auth: NextAuth v5 (Google + Microsoft Entra ID), invitation-only, 7 roles.

## Architecture
ONE app, ONE database, ONE auth system. All modules live inside Daftar:
- Yantri: AI content generation engine (/src/lib/yantri/, /src/app/(shell)/yantri/)
- Khabri: Signal intelligence (/src/app/(shell)/khabri/)
- GI: Organizational copilot (/src/lib/gi/, /src/app/(shell)/gi/)
- PMS: Project/task management (/src/app/(shell)/pms/)
- HOCCR: HR operations (/src/app/(shell)/hoccr/)
- Finance: Invoicing and expenses (/src/app/(shell)/finance/)
- Gamification: XP, achievements, streaks, leaderboard
- Communication: Announcements + feedback
- Vritti: Editorial CMS (/src/app/(shell)/vritti/)
- Relay: Social media publishing (/src/app/(shell)/relay/) — CURRENTLY SIMULATED

## Current State (March 2026)
- TypeScript: Compiles clean, 0 errors. NEVER re-add ignoreBuildErrors.
- Auth: Working. Google + Microsoft OAuth, invitation-only, 7 roles (ADMIN, HEAD_HR, DEPT_HEAD, MEMBER, CLIENT, FINANCE, CONTRACTOR).
- Database: PostgreSQL + pgvector. 91 tables in one Prisma schema.
- Yantri pipeline: Wired end-to-end (signal → FactDossier → Strategy → Content → Review → Approve → PMS Task). Needs live verification.
- GI: Chat works. Actions now execute (task reassignment, deadline extension, workload rebalancing). Tier system configurable.
- Khabri: Reads from local DB first, external API (khabri.stallone.co.in) as fallback.
- HOCCR: Capacity engine works. Sentiment now bidirectional (increments on positive events).
- Gamification: XP, achievements, streaks, leaderboard all implemented.
- Relay: STILL SIMULATED — generates fake post IDs. Do NOT build real publishers (developer handling separately).
- Skill files: SkillOrchestrator wired and loading .md files from /skills/ directory.

## Mandatory Rules
1. NEVER add ignoreBuildErrors: true to next.config.ts
2. NEVER modify prisma/schema.prisma without explicit approval
3. NEVER create files outside your assigned file ownership area
4. ALWAYS test against the running app (npm run dev), not just code review
5. ALWAYS run npm run build after changes to verify no TS errors introduced
6. Relay publishing is deliberately simulated — do not attempt to fix this

## Key Files
- /prisma/schema.prisma — Unified schema (91 tables)
- /prisma/seed.ts — Seed data (7 depts, admin, 2 brands, 8 users, tasks, etc.)
- /src/lib/auth.ts — NextAuth v5 configuration
- /src/lib/prisma.ts — Prisma client singleton
- /src/lib/permissions.ts — Role and permission checking
- /src/lib/skill-orchestrator.ts — Loads .md skill files into LLM prompts
- /src/lib/yantri/strategist.ts — Core AI decision engine
- /src/lib/yantri/gemini.ts — Gemini API wrapper with web grounding
- /src/lib/yantri/model-router.ts — Routes tasks to Gemini or Claude
- /src/lib/gi/gi-orchestrator.ts — GI copilot brain
- /src/lib/event-bus.ts — Internal event emitter
- /src/inngest/ — Background job definitions (pipeline, learning cycle)
- /src/middleware.ts — Route protection + role-based access
- /src/app/(shell)/layout.tsx — Shell layout (sidebar + GIContextProvider)

## Database
PostgreSQL with pgvector extension. Connection via DATABASE_URL env var.
Prisma client at /src/lib/prisma.ts. Always use this singleton, never create new PrismaClient().

## Background Jobs
Inngest handles async pipeline execution. Jobs defined in /src/inngest/.
Dev server: npx inngest-cli dev (or check if auto-started with npm run dev).

## Brands
- The Squirrels (TheSquirrelsTV): English, YouTube + X/Twitter, political commentary, international audience
- Breaking Tube: Hinglish, YouTube, political analysis, Indian domestic audience
- Client: Bhupendra Chaubey (linked to both brands)

## Permission Format
module.action.scope — Examples: yantri.read.*, pms.read.own, pms.read.department

## 7 Roles and Sidebar Access
- ADMIN: Everything
- HEAD_HR: HOCCR, PMS (read), Hiring, Team Directory, Reports
- DEPT_HEAD: Department dashboard, PMS (dept), Yantri (dept brands), Team, KPIs
- MEMBER: My Tasks, My Brands, Leaderboard, Calendar, Notifications
- CLIENT: My Brands (own only), Content Calendar, Approved Deliverables, Reports
- FINANCE: Financial dashboard, Invoices, Revenue, Client Billing, Reports
- CONTRACTOR: My Tasks, Active Projects, Notifications
