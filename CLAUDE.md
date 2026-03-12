# DAFTAR — Project Context

## What This Is
AI-powered agency operations platform for ShowNoMore.
Live at: https://daftar-one.vercel.app
Repo: https://github.com/ShowNoMoreOfficial/DAFTAR.git

## Tech Stack
- Next.js 16 + React 19 + TypeScript
- Prisma 6 + PostgreSQL (NeonDB, us-east-1) + pgvector
- Tailwind 4 + shadcn/ui + Radix UI
- NextAuth v5 (Google + Microsoft Entra ID)
- Inngest (background jobs, production keys configured)
- Gemini (research/strategy) + Anthropic SDK (creative content)
- ElevenLabs (voice generation)

## Architecture
ONE app, ONE database (91 tables), ONE auth system.
All modules live inside Daftar. No microservices.

## Unified Navigation (Redesigned)
The user sees a unified workflow, not internal module names:

| Sidebar Item | What It Is | Route | Key Files |
|---|---|---|---|
| Dashboard | Unified dashboard | /dashboard | /src/app/(shell)/dashboard/ |
| Intelligence | Signals + Trends + Research | /intelligence | /src/app/(shell)/intelligence/ |
| Content | Studio + Calendar + Library | /content-studio | /src/app/(shell)/content-studio/ |
| Production | Tasks + Workload | /pms/ | /src/app/(shell)/pms/ |
| Publishing | Schedule + Connections | /relay/ | /src/app/(shell)/relay/ |
| Team | HOCCR (ops, culture, hiring) | /hoccr/ | /src/app/(shell)/hoccr/ |
| Editorial | Vritti CMS | /m/vritti/ | /src/app/(shell)/m/vritti/ |
| Finance | Invoices + Expenses | /finance | /src/app/(shell)/finance/ |
| Communication | Announcements + Feedback | /communication | /src/app/(shell)/communication/ |
| Settings | Account + Admin config | /settings | /src/app/(shell)/settings/ |

### Internal module mapping (DO NOT expose these names in UI):
- "Khabri" = Intelligence signals/trends (API: /api/khabri/)
- "Yantri" = Content generation engine (API: /api/yantri/)
- "Relay" = Publishing (SIMULATED — do not build real publishers)
- "HOCCR" = Team/HR operations
- "Vritti" = Editorial CMS
- "GI" = AI Assistant copilot

## Pipeline Flow
Intelligence signal → NarrativeTree → FactDossier (Gemini) → StrategyDecision → Content Engine → Deliverable (pending_review) → Approve/Revise/Reject → PMS Task

## Content Engines
- 4 engines: ViralMicro, Carousel, Cinematic, NanoBanana
- 13 content types with platform mapping
- 160 skill files in /skills/ loaded by SkillOrchestrator (651 lines)

## Auth
- 7 roles: ADMIN, HEAD_HR, DEPT_HEAD, MEMBER, CLIENT, FINANCE, CONTRACTOR
- Invitation-only (admin creates users, OAuth activates)
- Permission format: module.action.scope

## Deployment Workflow
Edit code → git push origin main → Vercel auto-deploys → Test on live URL
Database: NeonDB (shared between local and production)
Env vars: Stored in Vercel, pulled locally via `vercel env pull .env`

## Rules for All Agents
1. NEVER add ignoreBuildErrors to next.config.ts
2. NEVER modify prisma/schema.prisma without explicit approval
3. ALWAYS run npm run build after changes
4. Relay is deliberately simulated — do NOT build real publishers
5. Test on live URL after pushing: https://daftar-one.vercel.app
6. Use unified names in UI (Intelligence, Content Studio, Production) — NEVER show Khabri/Yantri/Relay to users
7. Links from Intelligence → Content Studio use ?topic= query param
8. Links from Content Studio → review use /m/yantri/review/[id]

## Key Files
- /prisma/schema.prisma — 91 tables, unified schema
- /prisma/seed.ts — 18 users, 2 brands, 7 depts, 89 tasks
- /src/lib/sidebar-config.ts — unified sidebar navigation (12 items)
- /src/components/shell/sidebar.tsx — sidebar component with icon mapping
- /src/components/shell/shell-layout.tsx — shell container + GI context
- /src/lib/yantri/strategist.ts — 354 lines, strategy decisions
- /src/lib/skill-orchestrator.ts — 651 lines, loads 160 skill files
- /src/lib/yantri/engines/ — 4 content engines
- /src/inngest/ — 6 pipeline functions
- /src/middleware.ts — Route protection
- /skills/ — 160 .md intelligence files

## Brands
- The Squirrels: English, YouTube + X, political commentary, 43K subs
- Breaking Tube: Hinglish, YouTube, political analysis, 100K+ subs
- Client: Bhupendra Chaubey
