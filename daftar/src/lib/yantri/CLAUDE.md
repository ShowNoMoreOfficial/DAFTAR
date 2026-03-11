# Yantri — AI Content Engine Context

## Pipeline Flow
Signal input → NarrativeTree creation → FactDossier (Gemini research) → StrategyDecision → Content Generation → Deliverable (pending_review) → Human Review → Approve/Revise/Reject

## Key Files
- gemini.ts: Gemini 1.5 Pro wrapper. callGemini() for standard, callGeminiResearch() for web grounding.
- strategist.ts: Loads brand config + FactDossier + skill files → outputs StrategyDecision (brand, platform, angle, hook, content type).
- model-router.ts: Routes to Gemini (strategy/research) or Claude (creative writing).
- ingest-helper.ts: Signal ingestion and vectorization via pgvector.
- gap-analysis.ts: Semantic search against existing NarrativeTrees. >0.9 similarity = merge, else new tree.
- /engines/: Specialized generators for different content types.

## Inngest Events
- Signal submitted → dossier generation job
- Dossier ready → strategy decision job
- Strategy decided → content generation job
- Deliverable created → notification + review queue update
- Deliverable approved → PMS task creation

## Content Types (13 total)
YouTube Explainer, YouTube Shorts, X/Twitter Thread, X/Twitter Single Post, Instagram Carousel, Instagram Reel, LinkedIn Post, LinkedIn Article, Blog Post, Newsletter, Podcast Script, Quick Take, Community Post.

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
- All UI pages live under /src/app/(shell)/yantri/
