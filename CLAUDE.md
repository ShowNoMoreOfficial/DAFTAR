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

## Modules & Status
| Module | Status | Key Files |
|--------|--------|-----------|
| PMS | Working | /src/app/(shell)/pms/, /src/app/api/tasks/ |
| Gamification | Working | XP, achievements, streaks, leaderboard |
| Yantri | Pipeline wired, needs live testing | /src/lib/yantri/, /src/app/(shell)/yantri/ |
| GI | Actions execute, needs polish | /src/lib/gi/, /src/app/api/gi/ |
| Khabri | Local DB wired | /src/app/(shell)/khabri/ |
| Finance | CRUD working | /src/app/(shell)/finance/ |
| HOCCR | Capacity + bidirectional sentiment | /src/app/(shell)/hoccr/ |
| Communication | Basic announcements + feedback | /src/app/(shell)/communication/ |
| Vritti | Kanban pipeline | /src/app/(shell)/vritti/ |
| Relay | SIMULATED — do not fix | /src/app/(shell)/relay/ |

## Pipeline Flow (Yantri)
Khabri signal → NarrativeTree → FactDossier (Gemini) → StrategyDecision → Content Engine → Deliverable (pending_review) → Approve/Revise/Reject → PMS Task

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

## Key Files
- /prisma/schema.prisma — 91 tables, unified schema
- /prisma/seed.ts — 18 users, 2 brands, 7 depts, 89 tasks
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
