# Intelligence Audit 1: Current Content Generation Flow

**Date:** 2026-03-12
**Scope:** Trace how content is actually generated today — what's wired, what's bypassed, what data exists but isn't used.

---

## 1. Quick-Generate Endpoint (`/api/yantri/quick-generate`)

**File:** `src/app/api/yantri/quick-generate/route.ts` (478 lines)

### Inputs
```
POST { topic: string, brandId: string, contentType: "youtube_explainer" | "x_thread" | "carousel" | "quick_take" }
```

### What It Does

| Question | Answer | Details |
|----------|--------|---------|
| Calls strategist? | **NO** | Completely bypasses `src/lib/yantri/strategist.ts`. No strategy decision is made. |
| Loads ANY skill files? | **NO** | Zero references to `SkillOrchestrator`, `loadSkill`, or anything in `/skills/`. |
| Checks performance history? | **NO** | No query to `contentPerformances`, `performanceData`, `strategyTests`, or any analytics table. |
| Uses brand voice from DB? | **PARTIALLY** | Loads `brand.tone`, `brand.language`, `brand.voiceRules`, `brand.editorialCovers` from DB. Passes them as text in prompts. Does NOT use `identityMarkdown` (empty in DB anyway). Does NOT use the `brand-voice.ts` helper (the hardcoded brand-specific voice blocks). |
| Considers platform rules? | **NO** | No query to `platformRules` (0 records exist) or `platformConfigs` (5 exist but unused). |
| Considers platform algorithms? | **NO** | Platform-specific structure is hardcoded in the prompt templates per content type. No dynamic algorithm awareness. |

### LLM Calls

**Step 1 — Research:** Calls `callGeminiResearch()` (Gemini 2.0 Flash with web grounding).

Research prompt sent:
```
System: "You are a thorough research analyst. Provide factual, well-sourced research."

User: "You are a senior political and economic research analyst.
Research this topic thoroughly: "{topic}"

Provide a comprehensive research dossier including:
- Key facts and verified data points
- Timeline of events (with dates)
- Key stakeholders and their positions
- Statistics and numbers (with sources)
- Different perspectives and viewpoints
- Geopolitical implications (especially for India)
- Context and background needed to understand the story

Be thorough, factual, and cite sources where possible.
Return your findings as a well-structured report."
```

**Step 2 — Content Generation:** Calls `callGemini()` (Gemini 2.0 Flash, JSON mode, temp 0.7).

System prompt: `"You are a world-class content strategist and writer for {brandName}. Return ONLY valid JSON."`

User prompt varies by content type. Example for `youtube_explainer`:
```
Based on the following research, create a 10-15 minute YouTube Explainer video script for {brand.name}.

BRAND VOICE:
- Tone: {brand.tone}
- Language: {brand.language}
- Voice rules: {brand.voiceRules.join("; ")}

TOPIC: {topic}

RESEARCH:
{research}

Create a complete content package with this EXACT JSON structure:
{...7-section script, 3 titles, description, tags, 3 thumbnail briefs...}

IMPORTANT:
- Each script section "text" field should contain the ACTUAL script text the host reads aloud
- The hook must be a provocative opening — NOT "today we're going to discuss..."
- Use The Squirrels signature phrases naturally
- Every claim must be backed by data from the research
- Visual notes should be specific B-roll/graphic suggestions
- Titles must be optimized for YouTube CTR
- Return ONLY the JSON
```

**Note:** The YouTube explainer prompt hardcodes "Use The Squirrels signature phrases naturally" regardless of which brand is selected.

### What It Returns
```json
{ "deliverableId": "...", "treeId": "...", "contentType": "...", "platform": "...", "status": "REVIEW" }
```

Also creates: Deliverable, Assets (thumbnails, carousel slides), NarrativeTree, and FactDossier records.

---

## 2. Recommend Endpoint

**Does not exist.** No files matching `*recommend*/route.ts` found anywhere in `src/app/api/`.

---

## 3. Strategist (`src/lib/yantri/strategist.ts`)

**File:** 354 lines, two main functions.

### `generateStrategies(treeId, brandIds?)`
- Fetches a NarrativeTree by ID
- Fetches brands (all or specific)
- Builds brand context from DB fields: name, tagline, language, tone, editorialCovers, editorialNever, editorialPriorities, activePlatforms, voiceRules
- Calls LLM via `routeToModel("strategy", ...)` → routes to **Gemini** (temp 0.4)
- Returns `BrandStrategy[]` with: shouldCover, reason, angles (each with contentType recommendations), priority, urgency

### `runStrategist(input)` (flat output variant)
- Same logic but accepts pre-fetched brands + dossier
- Enriches tree summary with dossier research (first 2000 chars)
- Returns flat `StrategyDecision[]` (one per brand-platform-angle combo)

| Question | Answer | Details |
|----------|--------|---------|
| Called from quick-generate? | **NO** | Not imported, not referenced. |
| Called from any API route? | **Unclear** | Only imported by Inngest workflow functions. |
| Loads skill files? | **NO** | No reference to SkillOrchestrator. |
| Uses performance data? | **NO** | No query to any performance/analytics table. |
| Considers brand voice? | **YES** | Uses brand editorial scope, tone, language, voiceRules, platform list. |
| Considers platform algorithms? | **NO** | No reference to platformRules or platformConfigs. |
| Produces ranked recommendations? | **YES** | Returns multiple angles per brand with priority scores (1-10) and urgency levels. |

---

## 4. Skill Orchestrator (`src/lib/skill-orchestrator.ts`)

**File:** 651 lines. A fully built, functional orchestrator.

### How It Works
1. Loads `.md` skill files from `/skills/` directory
2. Parses metadata: name, module, trigger, inputs, outputs, dependencies
3. Extracts instructions and learning log sections
4. `executeSkill()` — loads skill → builds prompt from instructions + context → calls LLM via model-router → records execution in DB
5. `executeChain()` — sequential skill execution, piping output forward
6. `syncSkillsToDb()` — scans all skill files and upserts to `skills` table
7. `getSkillPerformance()` — queries execution stats per skill

### Where It's Imported (NOT from quick-generate)

| File | Usage |
|------|-------|
| `src/lib/inngest/yantri-workflows.ts` | Loads brand identity skill, executes content drafting skills |
| `src/lib/inngest/khabri-workflows.ts` | Enriches ingested articles via skill execution |
| `src/lib/inngest/functions.ts` | Multiple skill executions (credibility, geo-relevance, gap analysis, content pipeline) |
| `src/lib/yantri/inngest/functions.ts` | Content piece pipeline — drafts via skill if skill file exists |
| `src/lib/gi-skill-engine.ts` | GI copilot skill loading and execution |
| `src/lib/yantri/fact-checker.ts` | Fact-checking via skill execution |
| `src/lib/learning-loop.ts` | Sentiment analysis, revenue analysis, skill execution |
| `src/app/api/analytics/competitors/route.ts` | Competitor analysis skill |
| `src/app/api/analytics/skills/route.ts` | Skill performance stats |
| `src/app/api/skills/[path]/route.ts` | Load individual skill |
| `src/app/api/skills/sync/route.ts` | Sync skills to DB |
| `src/app/api/skills/performance/route.ts` | Skill perf endpoint |
| `src/app/api/skills/execute/route.ts` | Execute skill/chain via API |
| `src/app/api/signals/promote/route.ts` | Geo-relevance + escalation skills |
| `src/app/api/signals/ingest/route.ts` | Event detection + credibility skills |
| `src/app/api/workflows/execute/route.ts` | Execute skill chains |

### Critical Finding

**The SkillOrchestrator is called from 16 files — but NONE of them are in the quick-generate flow.** The only working E2E content generation path (quick-generate) completely ignores the skill system. Skills are only wired into:
1. Inngest background workflows (which require event triggers, not used by quick-generate)
2. Signal ingestion pipeline
3. GI copilot
4. Standalone API endpoints (`/api/skills/execute`)

**Skills available:** 155 `.md` files on disk
**Skills executed to date:** 159 (from `skillExecutions` table — so skills HAVE been run, just not from quick-generate)

---

## 5. Content Engines (`src/lib/yantri/engines/`)

Six files: `index.ts`, `cinematic.ts`, `viralMicro.ts`, `carousel.ts`, `nanoBanana.ts`, `hrOps.ts`

### Generic Engine (`index.ts`)
- `runContentEngine()` — calls `buildContentGenerationPrompt()` from `prompts.ts`
- `prompts.ts` DOES try to load `PromptTemplate` from DB first (falls back to hardcoded)
- Routes through model-router: drafting → Claude, research → Gemini
- `runPackagingEngine()` — titles, thumbnails, tags, posting time

### Specialized Engines

| Engine | File | Uses Brand Voice Helper? | Uses Skills? | Uses Performance Data? | Platform-Aware? |
|--------|------|------------------------|-------------|----------------------|-----------------|
| Cinematic | `cinematic.ts` | **YES** (`getBrandVoiceBlock`) | **NO** | **NO** | YouTube-specific (6-act structure, storyboard, B-roll) |
| ViralMicro | `viralMicro.ts` | **YES** (`getBrandVoiceBlock`) | **NO** | **NO** | X/LinkedIn-specific (280 char limit, thread format) |
| Carousel | `carousel.ts` | **YES** (`getBrandVoiceBlock`) | **NO** | **NO** | Instagram-specific (4:5 portrait, swipe architecture) |
| NanoBanana | `nanoBanana.ts` | **YES** (`getBrandColorPalette`) | **NO** | **NO** | Multi-platform visual specs (ratios, style per platform) |
| HROps | `hrOps.ts` | **NO** (hardcoded ShowNoMore voice) | **NO** | **NO** | LinkedIn-only |
| Generic | `index.ts` | **NO** (uses `prompts.ts` context) | **NO** | **NO** | Platform-routed via `normalizePlatform()` |

### Critical Finding

**None of the content engines load skill files.** The specialized engines (`cinematic`, `viralMicro`, `carousel`, `nanoBanana`) use the `brand-voice.ts` helper for hardcoded brand voice blocks, but they do NOT:
- Load any of the 155 skill files
- Query performance data
- Check what's worked before
- Use platform rules from the database

**The generic engine (`index.ts` via `prompts.ts`) DOES check for `PromptTemplate` records in the database**, but no templates exist (0 records). So it always falls back to hardcoded prompts.

**However:** The quick-generate endpoint does NOT use any of these engines either. It has its own hardcoded prompts inline in the route file.

---

## 6. Available But Unused Data

### Data That Exists

| Data Source | Count | Used in Quick-Generate? | Used Anywhere? |
|-------------|-------|------------------------|---------------|
| Brand voice rules | 2 brands with rich voice rules (16 rules for Squirrels, 7 for Breaking Tube) | **PARTIALLY** — passes `voiceRules` as text, doesn't use `brand-voice.ts` helper | YES — engines use `getBrandVoiceBlock()` |
| Brand identity markdown | 0 (empty for both brands) | NO | NO |
| Brand editorial covers/never | Both brands have editorial scope defined | NO | YES — strategist uses them |
| Platform rules | 0 records | NO | NO |
| Platform configs | 5 records | NO | Unknown |
| Strategy tests | 6 records | NO | Unknown |
| Content performances | 6 records | NO | Unknown |
| Performance data | 0 records | NO | NO |
| Deliverables (previous) | 5 total (1 APPROVED YouTube, 1 APPROVED X, 1 KILLED X, 1 REVIEW X, 1 REVIEW Carousel) | NO | NO |
| Trends | 18 records | NO | YES — Inngest editorial scan |
| Signals | 36 records | NO | YES — Khabri pipeline |
| Skill executions | 159 records | NO | YES — logged by SkillOrchestrator |
| Skill files | 155 `.md` files | NO | YES — via Inngest, GI, signal ingest |
| GI learning logs | 24 records | NO | YES — GI copilot |
| Prompt templates | 0 records | NO | Would be used by `prompts.ts` if they existed |

### Brand Voice Data Available in DB

**The Squirrels:**
- Tone: `analytical-provocative`
- Language: `English`
- Voice rules: 16 detailed rules (provocative hooks, historical parallels, data-driven, anti-clickbait, India-first framing, signature phrases)
- Editorial covers: geopolitics, foreign-policy, macro-economics, defense-security, tech-policy, global-trade
- Editorial never: celebrity, sports, religion-standalone, hyperlocal-news, crime, lifestyle, partisan-horse-race
- Active platforms: YouTube (primary), X Thread (secondary), X Single (secondary)

**Breaking Tube:**
- Tone: `energetic-accessible-opinion-forward`
- Language: `Hinglish`
- Voice rules: 7 rules (Hinglish code-switching, chai-friend register, opinion-forward, speed-first, energetic)
- Editorial covers: politics, indian-domestic, policy, economy
- Editorial never: celebrity-gossip, lifestyle
- Active platforms: YouTube (primary)

---

## Summary

### Quick-Generate Flow (the only working E2E path)

| Component | Status |
|-----------|--------|
| Calls strategist | **NO** |
| Loads skills | **NO** |
| Checks performance history | **NO** |
| Uses brand voice from DB | **PARTIALLY** — raw `voiceRules` array, `tone`, `language` passed as text. No `getBrandVoiceBlock()`. |
| Considers platform rules | **NO** |
| LLM used | Gemini 2.0 Flash for research (with web grounding), Gemini 2.0 Flash for content generation (JSON mode) |
| Prompt | Hardcoded per content type. YouTube prompt hardcodes "The Squirrels signature phrases" regardless of brand. |

### Strategist

| Component | Status |
|-----------|--------|
| Called from generation flow | **NO** — only from Inngest workflows |
| Loads skills | **NO** |
| Uses performance data | **NO** |
| Produces ranked recommendations | **YES** — multi-brand, multi-angle, with priority and urgency |
| Considers brand editorial scope | **YES** |

### Skill Orchestrator

| Component | Status |
|-----------|--------|
| Called from generation flow | **NO** — not from quick-generate or any content engine |
| Called from anywhere | **YES** — 16 files (Inngest workflows, GI, signal pipeline, standalone APIs) |
| Number of skills available | 155 |
| Number of skills loaded during quick-generate | **0** |

### Content Engines

| Component | Status |
|-----------|--------|
| Use skills | **NO** |
| Use brand voice helper | **YES** (cinematic, viralMicro, carousel, nanoBanana) — but not used by quick-generate |
| Use platform rules | **NO** |
| Used by quick-generate | **NO** — quick-generate has its own inline prompts |

### Three Disconnected Systems

The audit reveals **three separate content generation systems** that don't talk to each other:

1. **Quick-Generate** (`/api/yantri/quick-generate`) — Self-contained, inline prompts, calls Gemini directly. The only path a user can trigger today. Bypasses everything.

2. **Content Engines** (`src/lib/yantri/engines/`) — Well-built, brand-voice-aware, platform-specific. Called from Inngest workflows (event-triggered). Uses `brand-voice.ts` but not skills or performance data.

3. **Skill Orchestrator** (`src/lib/skill-orchestrator.ts`) — Fully functional, 155 skill files, execution logging. Called from Inngest workflows and signal pipeline. Never called from engines or quick-generate.

### The Gap

The quick-generate endpoint — the only user-facing content generation path — is the **least intelligent** of the three systems. It:
- Has the simplest prompts (no brand voice enforcement blocks, no platform algorithm awareness)
- Uses Gemini for everything (even creative writing, where Claude is configured as the better option in model-router)
- Creates zero learning (no skill execution logs, no performance tracking)
- Cannot improve over time (no feedback loop, no A/B testing, no performance correlation)
- Hardcodes brand-specific text ("The Squirrels signature phrases") that breaks for other brands
