# Yantri — AI Content Engine Context

## What This Is
Yantri is the content generation engine. In the UI it appears as "Content Studio" — NEVER show "Yantri" to users.

## User-Facing Routes
- /content-studio — Unified page (Studio pipeline, Calendar, Library tabs)
- /m/yantri/review/[id] — Individual content review page
- Old routes (/m/yantri/*) still exist but are NOT in the sidebar

## Pipeline Flow
Signal input → NarrativeTree creation → FactDossier (Gemini research) → StrategyDecision → Content Generation → Deliverable (pending_review) → Human Review → Approve/Revise/Reject

## Key Files
- gemini.ts: Gemini 1.5 Pro wrapper. callGemini() for standard, callGeminiResearch() for web grounding.
- strategist.ts: Loads brand config + FactDossier + skill files → outputs StrategyDecision (brand, platform, angle, hook, content type).
- model-router.ts: Routes to Gemini (strategy/research) or Claude (creative writing).
- ingest-helper.ts: Signal ingestion and vectorization via pgvector.
- gap-analysis.ts: Semantic search against existing NarrativeTrees. >0.9 similarity = merge, else new tree.
- /engines/: Specialized generators for different content types.

## API Routes
- POST /api/yantri/quick-generate — Topic + brand + type → generates content
- GET /api/yantri/deliverables — List all deliverables (pipeline view)
- PATCH /api/yantri/deliverables/[id] — Approve/revise/reject actions
- GET /api/yantri/pipeline/status — Pipeline stats for dashboard
- POST /api/pipeline/trigger — Signal → pipeline entry point

## Inngest Events
- Signal submitted → dossier generation job
- Dossier ready → strategy decision job
- Strategy decided → content generation job
- Deliverable created → notification + review queue update
- Deliverable approved → PMS task creation

## Content Types (13 total)
YouTube Explainer, YouTube Shorts, X/Twitter Thread, X/Twitter Single Post, Instagram Carousel, Instagram Reel, LinkedIn Post, LinkedIn Article, Blog Post, Newsletter, Podcast Script, Quick Take, Community Post.

## Cross-Module Links
- Intelligence → Content Studio: ?topic= query param pre-fills generate form
- Content Studio → Review: /m/yantri/review/[deliverableId]
- Approved content → PMS task auto-creation

## Skill Files
SkillOrchestrator loads .md files from /skills/ directory. Skills are injected into LLM prompts as context.
Brand identity skills: /skills/brand/identity/[brand-name]/
Platform skills: /skills/platforms/[platform]/
Narrative skills: /skills/narrative/

## Rules
- ALWAYS use the Prisma client from /src/lib/prisma.ts
- NEVER handle auth in Yantri files — auth is handled by middleware
- NEVER create separate Brand/User models — use Daftar's models
- All API routes live under /src/app/api/yantri/
- Prompts and Platform Rules are now in Settings, not Content Studio
