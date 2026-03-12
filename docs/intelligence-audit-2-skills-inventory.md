# Skills Intelligence Inventory — Audit 2

**Date**: 2026-03-12
**Total**: 154 skill files (excluding READMEs/CLAUDE.md) across 11 domains, ~14,114 lines of intelligence
**Orchestrator**: `src/lib/skill-orchestrator.ts` (651 lines) — fully wired, DB-tracked, LLM-routed

---

## Domain Breakdown

| Domain | Subdirectories | Skill Files | Purpose |
|--------|---------------|-------------|---------|
| `analytics/` | feedback (3), performance (6), revenue (3) | **12** | Performance tracking, A/B testing, revenue, feedback loops |
| `brand/` | business (5), finance (3), identity (4 brands × 3-4 files) | **18** | Brand voice, audience, visual identity, business ops |
| `distribution/` | (flat) | **6** | Cross-platform scheduling, cadence, sequencing |
| `gi/` | (flat) | **7** | GI behavioral principles, tier definitions, scenario playbook |
| `narrative/` | audience (3), editorial (9), research (6), voice (8) | **26** | Editorial decisions, research, voice/hook crafting |
| `platforms/` | linkedin (4), meta (6), ppc (4), seo (6), x-twitter (9), youtube (10) | **39** | Platform-specific optimization rules |
| `pms/` | (flat) | **1** | Task review checklists |
| `production/` | automation (3), long-form (5), short-form (5), support (9) | **22** | Production briefs, templates, asset generation |
| `signals/` | analysis (4), detection (3), tracking (3) | **10** | Signal detection, trend clustering, escalation |
| `system/` | (flat) | **7** | Tech stack, auth, deployment, model routing |
| `workflows/` | (flat) | **6** | Pipeline orchestrations (signal→deliverable, approval, learning) |

**Total: 154 skill files**

---

## Skill File Format (Standard)

Two formats coexist. The "deep" format (used by ~60% of files) and the "light" format (~40%):

### Deep Format (narrative/, platforms/, brand/identity/)
```markdown
# Skill: [Name]
## Module: [owning module]
## Trigger: [activation context]
## Inputs: [comma-separated data requirements]
## Outputs: [comma-separated output types]
## Dependencies: [other skill paths]
## Scripts: [automation scripts]

---

## Instructions
[Detailed intelligence — rules, decision trees, scoring rubrics, examples, anti-patterns]
[Typically 100-450 lines of dense domain knowledge]

---

## Learning Log
[Auto-updated: what's worked, what hasn't, calibration data]
[NEEDS INPUT]: [specific data requested for improvement]
```

### Light Format (analytics/, brand/business/, pms/, some production/)
```markdown
# [Skill Name]

## Module
[module name]

## Trigger
- [bullet list of triggers]

## Inputs
- [bullet list]

## Instructions
[Shorter, 30-80 lines, more template-oriented]

## Learning Log
<!-- Auto-updated by the learning loop -->
```

**Key difference**: Deep-format files contain genuine editorial intelligence (decision frameworks, scoring rubrics, brand-specific examples, anti-patterns, combination strategies). Light-format files are more like templates/checklists.

---

## Category 1: Strategy & Decision Skills (could inform recommendations)

These skills contain decision frameworks that could drive automated recommendations:

| Skill Path | Description | Depth |
|------------|-------------|-------|
| `narrative/editorial/topic-selection.md` | 4-gate editorial gatekeeper (relevance→so-what→differentiation→capacity), brand-specific scoring, urgency classification, kill criteria, cross-brand routing | **254 lines, DEEP** |
| `narrative/editorial/angle-detection.md` | 5-lens angle finder (data contradiction, overlooked stakeholder, historical parallel, second-order effect, so-what escalation), weighted scoring, risk assessment | **314 lines, DEEP** |
| `narrative/editorial/contrarian-angle-detection.md` | Finds non-consensus angles backed by evidence | Medium |
| `narrative/editorial/narrative-framing.md` | Determines framing approach (explanatory, investigative, opinion, breaking) | Medium |
| `narrative/editorial/sensitivity-classification.md` | 4-level sensitivity scoring (Green→Yellow→Orange→Red) with response rules | Medium |
| `narrative/editorial/timeliness-optimizer.md` | Calculates optimal publish windows vs staleness decay | Medium |
| `narrative/editorial/competitive-narrative-analysis.md` | Maps competitor coverage to find gaps | Medium |
| `narrative/editorial/multi-narrative-branching.md` | Forks single fact dossier into platform-specific deliverables | Medium |
| `narrative/editorial/narrative-arc-construction.md` | Structures narrative flow for different content types | Medium |
| `narrative/audience/audience-calibration.md` | Adjusts content for specific audience segments | Medium |
| `narrative/audience/content-diversification.md` | Ensures content mix variety | Light |
| `narrative/audience/demographic-targeting.md` | Demographic-specific content adjustments | Light |
| `distribution/evergreen-vs-timely.md` | Decides content shelf-life classification | Light |
| `distribution/platform-first-vs-repurpose.md` | Decides build-for-platform vs repurpose strategy | Light |
| `distribution/content-sequencing.md` | Orders multi-piece content releases | Light |
| `production/long-form/quality-tier-classification.md` | Classifies S/A/B/C quality tiers with resource allocation | Light |
| `production/automation/production-capacity-matching.md` | Matches deliverables to team capacity | Light |
| `system/model-router.md` | Routes skill executions to optimal LLM (Gemini/Sonnet/Opus) | Light |
| `workflows/signal-to-deliverable.md` | Master 6-stage pipeline orchestration with gates | **171 lines, DEEP** |
| `workflows/daily-content-plan.md` | Daily editorial planning workflow | Light |
| `workflows/weekly-strategy-review.md` | Weekly strategy review workflow | Light |

**Count: 21 skills**

---

## Category 2: Platform Intelligence Skills (could inform platform selection)

These skills encode platform-specific algorithm knowledge, optimization rules, and best practices:

| Skill Path | Description | Depth |
|------------|-------------|-------|
| `platforms/youtube/title-engineering.md` | 12 title formulas with CTR benchmarks, brand-specific rules, A/B testing protocol, character count rules, keyword integration | **464 lines, DEEP** |
| `platforms/youtube/thumbnail-strategy.md` | Thumbnail design rules, composition, A/B testing | Medium |
| `platforms/youtube/description-optimization.md` | YouTube description SEO and structure | Medium |
| `platforms/youtube/shorts-strategy.md` | Shorts-specific optimization (1.5s hook, vertical format) | Medium |
| `platforms/youtube/analytics-interpretation.md` | Reading YouTube Studio analytics for decisions | Medium |
| `platforms/youtube/tag-category-strategy.md` | Tag and category optimization | Light |
| `platforms/youtube/community-post-strategy.md` | Community tab strategy | Light |
| `platforms/youtube/end-screen-card-strategy.md` | End screen and card optimization | Light |
| `platforms/youtube/playlist-strategy.md` | Playlist organization for watch time | Light |
| `platforms/youtube/premiere-strategy.md` | YouTube Premiere optimization | Light |
| `platforms/x-twitter/algorithm-awareness.md` | X/Twitter algorithm rules for visibility | Medium |
| `platforms/x-twitter/thread-architecture.md` | Thread structure for engagement | Medium |
| `platforms/x-twitter/tweet-crafting.md` | Single tweet optimization | Medium |
| `platforms/x-twitter/visual-anchor-selection.md` | Image/video selection for tweets | Medium |
| `platforms/x-twitter/tag-strategy.md` | Hashtag and mention strategy | Light |
| `platforms/x-twitter/reply-strategy.md` | Strategic reply engagement | Light |
| `platforms/x-twitter/community-notes-awareness.md` | Avoiding Community Notes flags | Light |
| `platforms/x-twitter/spaces-strategy.md` | X Spaces optimization | Light |
| `platforms/x-twitter/dm-automation.md` | DM-based engagement | Light |
| `platforms/meta/carousel-design.md` | Instagram carousel optimization | Medium |
| `platforms/meta/reel-production.md` | Reels production rules | Medium |
| `platforms/meta/instagram-seo.md` | Instagram discoverability | Medium |
| `platforms/meta/story-strategy.md` | Stories strategy | Light |
| `platforms/meta/facebook-group-strategy.md` | Facebook Group management | Light |
| `platforms/meta/meta-ad-skills.md` | Meta advertising optimization | Light |
| `platforms/linkedin/professional-tone-calibration.md` | LinkedIn voice adaptation | Medium |
| `platforms/linkedin/b2b-angle-extraction.md` | B2B angle for LinkedIn | Medium |
| `platforms/linkedin/creator-mode-optimization.md` | LinkedIn creator mode features | Light |
| `platforms/linkedin/article-vs-post-decision.md` | When to use LinkedIn articles vs posts | Light |
| `platforms/seo/content-seo.md` | Content-level SEO optimization | Medium |
| `platforms/seo/video-seo.md` | Video SEO (YouTube + web) | Medium |
| `platforms/seo/keyword-research.md` | Keyword research methodology | Medium |
| `platforms/seo/on-page-seo.md` | On-page SEO rules | Light |
| `platforms/seo/technical-seo.md` | Technical SEO considerations | Light |
| `platforms/seo/local-seo.md` | Local SEO (less relevant for these brands) | Light |
| `platforms/ppc/google-ads.md` | Google Ads management | Light |
| `platforms/ppc/meta-ads.md` | Meta Ads management | Light |
| `platforms/ppc/campaign-analytics.md` | PPC campaign analysis | Light |
| `platforms/ppc/retargeting-frameworks.md` | Retargeting strategy | Light |
| `distribution/cross-platform-scheduling.md` | Optimal posting times by platform/brand, conflict resolution, breaking news override | Medium |
| `distribution/release-cadence-management.md` | Publishing cadence management | Light |
| `distribution/notification-alert-strategy.md` | Notification/push strategy | Light |

**Count: 42 skills**

---

## Category 3: Brand Voice Skills (could shape content generation)

These skills define how content should sound for each brand:

| Skill Path | Description | Depth |
|------------|-------------|-------|
| `brand/identity/the-squirrels/identity.md` | Master brand identity — voice traits, editorial scope, visual identity, guardrails, competitive positioning | **265 lines, DEEP** |
| `brand/identity/the-squirrels/audience.md` | Target audience profile and behavior patterns | Medium |
| `brand/identity/the-squirrels/platforms.md` | Platform-specific content strategy per brand | Medium |
| `brand/identity/the-squirrels/voice-examples.md` | Concrete examples of brand voice (good vs bad) | Medium |
| `brand/identity/breaking-tube/identity.md` | Master brand identity — Hinglish voice, speed, accessibility, guardrails | **290 lines, DEEP** |
| `brand/identity/breaking-tube/audience.md` | Breaking Tube audience profile | Medium |
| `brand/identity/breaking-tube/platforms.md` | Platform strategy for Breaking Tube | Medium |
| `brand/identity/breaking-tube/voice-examples.md` | Hinglish voice examples | Medium |
| `brand/identity/_template/identity.md` | Template for new brand identity files | Template |
| `brand/identity/_template/audience.md` | Template for new brand audience files | Template |
| `brand/identity/_template/platforms.md` | Template for new brand platform files | Template |
| `narrative/voice/hook-engineering.md` | 7 hook patterns with brand-specific examples, platform adaptations, selection algorithm, quality checklist | **423 lines, DEEP** |
| `narrative/voice/human-voice.md` | Rules for sounding human, not AI-generated | Medium |
| `narrative/voice/narrative-arc.md` | Voice consistency across narrative arc | Medium |
| `narrative/voice/attention-grabbing.md` | Attention mechanics for different platforms | Medium |
| `narrative/voice/emotional-mapping.md` | Emotional tone calibration per topic type | Medium |
| `narrative/voice/diplomatic-skill.md` | How to cover sensitive topics diplomatically | Medium |
| `narrative/voice/spin-craft.md` | Framing techniques (responsible advocacy) | Medium |
| `narrative/voice/psychological-skill.md` | Psychological persuasion principles | Medium |
| `narrative/research/cultural-intelligence.md` | India-specific cultural awareness rules | Medium |

**Count: 20 skills**

---

## Category 4: Performance & Learning Skills (could rank recommendations)

These skills encode feedback loops and performance measurement:

| Skill Path | Description | Depth |
|------------|-------------|-------|
| `analytics/performance/benchmarking.md` | 3-layer benchmarking (self, category, growth) with metrics by platform | Medium |
| `analytics/performance/content-benchmarking.md` | Content-level performance comparison | Light |
| `analytics/performance/performance-attribution.md` | Attributes performance to specific content decisions | Light |
| `analytics/performance/ab-test-framework.md` | A/B testing methodology for content | Light |
| `analytics/performance/audience-evolution-tracking.md` | Tracks audience demographic shifts | Light |
| `analytics/performance/competitor-performance-monitoring.md` | Monitors competitor performance metrics | Light |
| `analytics/feedback/skill-performance-scoring.md` | Scores skills by effectiveness, consistency, efficiency, adaptability | Medium |
| `analytics/feedback/learning-cycle-report.md` | Monthly learning cycle analysis | Light |
| `analytics/feedback/sentiment-feedback-loop.md` | Tracks audience sentiment from comments/engagement | Medium |
| `analytics/revenue/monetization-strategy.md` | Revenue diversification strategy | Medium |
| `analytics/revenue/revenue-attribution.md` | Revenue attribution to content/decisions | Light |
| `analytics/revenue/revenue-forecasting.md` | Revenue projection modeling | Light |
| `workflows/monthly-learning-cycle.md` | Monthly review workflow that updates skill learning logs | Light |

**Count: 13 skills**

---

## Category 5: Research & Fact-Building Skills

| Skill Path | Description | Depth |
|------------|-------------|-------|
| `narrative/research/fact-dossier-building.md` | How to build a FactDossier from multiple sources | Medium |
| `narrative/research/fact-check-shield.md` | Fact-verification and claim strength assessment | Medium |
| `narrative/research/web-research.md` | Web research methodology | Medium |
| `narrative/research/data-backed-argumentation.md` | Structuring Claim→Evidence→Implication chains | Medium |
| `narrative/research/reference-analogy-library.md` | Historical analogy and reference database | Light |

**Count: 5 skills**

---

## Category 6: Production Skills (could inform asset requirements)

| Skill Path | Description | Depth |
|------------|-------------|-------|
| `production/long-form/explainer-production.md` | Explainer video production brief template | Medium |
| `production/long-form/quick-take-production.md` | Quick take (5-8 min) production | Medium |
| `production/long-form/documentary-planning.md` | Tier S documentary planning | Medium |
| `production/long-form/interview-podcast-prep.md` | Interview/podcast preparation | Medium |
| `production/long-form/quality-tier-classification.md` | S/A/B/C quality tier system | Light |
| `production/short-form/explainer-shorts.md` | Shorts from explainer content | Medium |
| `production/short-form/vertical-video-adaptation.md` | Landscape→vertical adaptation | Medium |
| `production/short-form/ai-voiceover-shorts.md` | AI voiceover for shorts | Light |
| `production/short-form/raw-clip-shorts.md` | Raw clip shorts production | Light |
| `production/short-form/templated-update-shorts.md` | Templated news update shorts | Light |
| `production/automation/repurposing-engine.md` | Identifies 3-5 derivative pieces from each long-form | Medium |
| `production/automation/production-capacity-matching.md` | Team capacity matching | Light |
| `production/automation/templated-editing.md` | Templated video editing | Light |
| `production/support/thumbnail-strategy.md` | Thumbnail creation rules | Medium |
| `production/support/broll-sheet-generation.md` | B-roll requirements for video | Medium |
| `production/support/edit-decision-list.md` | Edit decision list generation | Light |
| `production/support/motion-graphics-brief.md` | Motion graphics specifications | Light |
| `production/support/transcript-processing.md` | Transcript formatting/processing | Light |
| `production/support/shoot-summary-generation.md` | Shoot day summary | Light |
| `production/support/copyright-clearance.md` | Copyright/licensing checks | Light |
| `production/support/localization-prep.md` | Multi-language preparation | Light |
| `production/support/archive-management.md` | Content archival rules | Light |

**Count: 22 skills**

---

## Category 7: Signal Intelligence Skills

| Skill Path | Description | Depth |
|------------|-------------|-------|
| `signals/detection/event-detection.md` | Signal classification, relevance scoring, urgency, entity extraction, dedup | Medium |
| `signals/detection/source-credibility-scoring.md` | Source reliability assessment | Medium |
| `signals/detection/deduplication.md` | Duplicate signal detection | Light |
| `signals/analysis/velocity-detection.md` | Trending velocity measurement | Light |
| `signals/analysis/escalation-assessment.md` | When to escalate a signal urgency | Light |
| `signals/analysis/geo-relevance-mapping.md` | Geographic relevance to audience | Light |
| `signals/analysis/counter-narrative-detection.md` | Detects counter-narratives and opposition framing | Light |
| `signals/tracking/trend-clustering.md` | Groups related signals into trends | Light |
| `signals/tracking/trend-lifecycle.md` | Tracks trend stage (emerging→peak→declining) | Light |

**Count: 9 skills (1 also in signals/detection)** → 10 files

---

## Category 8: GI (Copilot) Skills

| Skill Path | Description | Depth |
|------------|-------------|-------|
| `gi/behavioral-principles.md` | Core GI behavioral rules (SDT, flow state, variable rewards, psychological safety) | **85 lines, DEEP** |
| `gi/tier-definitions.md` | GI autonomy tiers (Inform→Suggest→Act & Notify→Act Silently) | Medium |
| `gi/role-boundaries.md` | What GI can say/do per user role | Medium |
| `gi/motivational-intelligence.md` | Motivational messaging per individual profile | Medium |
| `gi/organizational-learning.md` | Organizational pattern detection | Light |
| `gi/scenario-playbook.md` | Playbooks for common organizational scenarios | Medium |
| `gi/admin-controls.md` | Admin-level GI configuration | Light |

**Count: 7 skills**

---

## Category 9: Brand Business & Finance Skills

| Skill Path | Description | Depth |
|------------|-------------|-------|
| `brand/business/brand-health-monitoring.md` | Brand health metrics tracking | Light |
| `brand/business/competitive-positioning.md` | Competitive landscape analysis | Medium |
| `brand/business/client-reporting.md` | Client-facing reports | Light |
| `brand/business/partnership-outreach.md` | Brand partnership strategy | Light |
| `brand/business/legal-compliance.md` | Legal/compliance guardrails | Light |
| `brand/finance/budget-management.md` | Budget tracking | Light |
| `brand/finance/invoicing.md` | Invoice generation | Light |
| `brand/finance/revenue-tracking.md` | Revenue monitoring | Light |

**Count: 8 skills**

---

## Category 10: System & Workflow Skills

| Skill Path | Description | Depth |
|------------|-------------|-------|
| `system/tech-stack.md` | Technology stack documentation | Light |
| `system/auth.md` | Authentication system rules | Light |
| `system/database-schema.md` | Database schema documentation | Light |
| `system/deployment.md` | Deployment procedures | Light |
| `system/api-gateway.md` | API gateway documentation | Light |
| `system/fact-dossier-building.md` | Duplicate of narrative/research version | Light |
| `system/model-router.md` | LLM routing rules | Light |
| `workflows/signal-to-deliverable.md` | Master pipeline workflow | **DEEP** |
| `workflows/approval-loop.md` | Approval workflow | Light |
| `workflows/revision-cycle.md` | Revision workflow | Light |
| `workflows/daily-content-plan.md` | Daily planning workflow | Light |
| `workflows/weekly-strategy-review.md` | Weekly review workflow | Light |
| `workflows/monthly-learning-cycle.md` | Monthly learning cycle | Light |

**Count: 13 skills**

---

## Currently Used Skills (Hardcoded in Codebase)

### Skills actively executed via `skillOrchestrator.executeSkill()`:

| Location | Skill Path | Context |
|----------|-----------|---------|
| `src/app/api/signals/ingest/route.ts` | `signals/detection/event-detection.md` | Signal ingestion |
| `src/app/api/signals/ingest/route.ts` | `signals/detection/source-credibility-scoring.md` | Signal ingestion |
| `src/app/api/signals/promote/route.ts` | `signals/analysis/geo-relevance-mapping.md` | Signal promotion |
| `src/app/api/signals/promote/route.ts` | `signals/analysis/escalation-assessment.md` | Signal promotion |
| `src/lib/inngest/functions.ts` | `signals/detection/source-credibility-scoring.md` | Inngest signal enrichment |
| `src/lib/inngest/functions.ts` | `signals/analysis/geo-relevance-mapping.md` | Inngest signal enrichment |
| `src/lib/inngest/functions.ts` | `signals/detection/event-detection.md` | Inngest signal enrichment |
| `src/lib/inngest/functions.ts` | `signals/analysis/escalation-assessment.md` | Inngest gap analysis |
| `src/lib/inngest/khabri-workflows.ts` | `signals/detection/event-detection.md` | Khabri hourly scan |
| `src/lib/yantri/fact-checker.ts` | `narrative/research/fact-check-shield.md` | Fact checking |
| `src/lib/learning-loop.ts` | `analytics/performance/performance-attribution.md` | Learning loop |
| `src/lib/learning-loop.ts` | `analytics/feedback/sentiment-feedback-loop.md` | Learning loop |
| `src/lib/learning-loop.ts` | `analytics/revenue/revenue-attribution.md` | Learning loop |
| `src/app/api/analytics/competitors/route.ts` | `analytics/performance/benchmarking.md` | Competitor analysis |
| `src/lib/gi-skill-engine.ts` | `pms/task-reviewer.md` | GI task review |

### Skills loaded for context (via `loadSkill()`) but not directly executed:

| Location | Skill Path | Context |
|----------|-----------|---------|
| `src/lib/inngest/functions.ts` | `brand/identity/{brand}/identity.md` | Brand voice context for generation |
| `src/lib/inngest/yantri-workflows.ts` | `brand/identity/{brand}/identity.md` | Brand voice context |
| `src/lib/gi-skill-engine.ts` | `signals/detection/event-detection.md` | GI signal analysis context |
| `src/lib/gi-skill-engine.ts` | `signals/detection/source-credibility-scoring.md` | GI context |
| `src/lib/gi-skill-engine.ts` | `narrative/editorial/topic-selection.md` | GI editorial context |
| `src/lib/gi-skill-engine.ts` | `gi/scenario-playbook.md` | GI scenario handling |
| `src/lib/gi-skill-engine.ts` | `workflows/approval-loop.md` | GI approval context |

### Skills referenced in engine-router.ts (mapped but execution depends on content type):

The `engine-router.ts` maps **46 unique skill paths** to specific content types. These are loaded when the Yantri pipeline runs for a specific content type + platform combination. Key mappings:

- **Core pipeline** (all content types): `fact-dossier-building`, `topic-selection`, `hook-engineering`, `audience-calibration`, `fact-check-shield`
- **YouTube Long-form**: `narrative-arc-construction`, `documentary-planning`, `title-engineering`, `description-optimization`, `thumbnail-strategy`
- **YouTube Shorts**: `explainer-shorts`, `vertical-video-adaptation`, `shorts-strategy`
- **X Tweet**: `tweet-crafting`, `visual-anchor-selection`, `algorithm-awareness`
- **X Thread**: `narrative-arc-construction`, `thread-architecture`, `tag-strategy`
- **Instagram Reel**: `reel-production`, `vertical-video-adaptation`, `instagram-seo`
- **Instagram Carousel**: `narrative-arc-construction`, `carousel-design`, `instagram-seo`
- **Instagram Story**: `story-strategy`
- **LinkedIn Post**: `professional-tone-calibration`, `b2b-angle-extraction`, `creator-mode-optimization`
- **LinkedIn Article**: `narrative-arc-construction`, `article-vs-post-decision`, `professional-tone-calibration`
- **Facebook Post**: `facebook-group-strategy`
- **Blog/SEO**: `narrative-arc-construction`, `content-seo`, `on-page-seo`
- **Visual Assets**: `visual-anchor-selection`, `thumbnail-strategy`, `motion-graphics-brief`
- **Podcast/Interview**: `narrative-arc-construction`, `interview-podcast-prep`

---

## The Gap: Available vs Used

### Summary

| Category | Total Files | Currently Referenced in Code | **NOT Referenced** |
|----------|-------------|-----------------------------|--------------------|
| Signals | 10 | 5 | 5 |
| Narrative (editorial) | 9 | 3 | **6** |
| Narrative (voice) | 8 | 1 | **7** |
| Narrative (research) | 6 | 2 | **4** |
| Narrative (audience) | 3 | 1 | 2 |
| Platforms | 39 | 28 | **11** |
| Production | 22 | 10 | **12** |
| Distribution | 6 | 1 | **5** |
| Analytics | 12 | 4 | **8** |
| Brand | 18 | 2 (identity files) | **16** |
| GI | 7 | 2 | **5** |
| Workflows | 6 | 2 | **4** |
| System | 7 | 0 | 7 (documentation, not executable) |
| PMS | 1 | 1 | 0 |
| **TOTAL** | **154** | **~62 referenced** | **~85 unreferenced** |

### What's Being Left on the Table

**85 skill files (~55%) are never loaded by any code path.** Of these, the most valuable unused intelligence falls into these gaps:

#### GAP 1: Editorial Decision Intelligence (not used in recommendations)
- `angle-detection.md` (314 lines) — 5 analytical lenses, weighted scoring, risk assessment. **This is arguably the most valuable single skill file in the entire repository.** It's never loaded in any pipeline.
- `contrarian-angle-detection.md` — Non-consensus angles backed by evidence. Never loaded.
- `competitive-narrative-analysis.md` — Competitor coverage mapping. Never loaded.
- `narrative-framing.md` — Framing approach selection. Never loaded.
- `timeliness-optimizer.md` — Publish window optimization. Never loaded.
- `content-diversification.md` — Content mix variety enforcement. Never loaded.

**Impact**: The pipeline generates content but doesn't use the editorial brain that decides WHAT angle to take. Topic selection is referenced in GI context loading but not in the actual content generation pipeline.

#### GAP 2: Distribution Intelligence (almost entirely unused)
- `cross-platform-scheduling.md` — Optimal posting times, conflict resolution, breaking news override. Never loaded.
- `content-sequencing.md` — Release order optimization. Never loaded.
- `evergreen-vs-timely.md` — Shelf-life classification. Never loaded.
- `platform-first-vs-repurpose.md` — Build vs repurpose decisions. Never loaded.
- `release-cadence-management.md` — Cadence optimization. Never loaded.

**Impact**: Content gets created but scheduling/sequencing intelligence is completely unused. Relay (publishing) is simulated, so this is expected — but when Relay goes live, these skills are ready.

#### GAP 3: Brand Business Intelligence (completely unused)
- `competitive-positioning.md` — Competitive landscape analysis. Never loaded.
- `brand-health-monitoring.md` — Brand health metrics. Never loaded.
- `partnership-outreach.md` — Partnership strategy. Never loaded.
- `client-reporting.md` — Client-facing reports. Never loaded.
- `legal-compliance.md` — Legal guardrails. Never loaded.
- All `brand/finance/` skills — Never loaded (Finance module has its own code).

**Impact**: These are strategic skills for business operations, not content generation. They would inform GI's strategic recommendations but GI doesn't load them.

#### GAP 4: Performance Learning Loop (partially wired)
- `ab-test-framework.md` — A/B testing methodology. Never loaded.
- `audience-evolution-tracking.md` — Audience shift detection. Never loaded.
- `competitor-performance-monitoring.md` — Competitor tracking. Never loaded.
- `learning-cycle-report.md` — Monthly learning synthesis. Never loaded.
- `skill-performance-scoring.md` — Skill self-scoring. Never loaded.

**Impact**: The learning loop uses `performance-attribution` and `sentiment-feedback-loop`, but the broader performance intelligence (A/B testing, competitor monitoring, skill scoring) is unused.

#### GAP 5: Voice Intelligence (mostly unused)
- `human-voice.md` — Anti-AI-detection rules. Never loaded.
- `emotional-mapping.md` — Emotional tone calibration. Never loaded.
- `diplomatic-skill.md` — Sensitive topic handling. Never loaded.
- `psychological-skill.md` — Persuasion principles. Never loaded.
- `spin-craft.md` — Framing techniques. Never loaded.
- `narrative-arc.md` (voice version) — Voice consistency. Never loaded.
- `attention-grabbing.md` — Attention mechanics. Never loaded.

**Impact**: Content gets the hook (hook-engineering is loaded) but misses 7 other voice skills that could shape the entire script's tone, emotional arc, and persuasion structure.

#### GAP 6: Production Intelligence (partially unused)
- `repurposing-engine.md` — Identifies derivative content from each piece. Never loaded.
- `ai-voiceover-shorts.md` — AI voiceover for shorts. Never loaded.
- `broll-sheet-generation.md` — B-roll requirements. Never loaded.
- `edit-decision-list.md` — Edit decision lists. Never loaded.
- `copyright-clearance.md` — Copyright checks. Never loaded.
- `localization-prep.md` — Multi-language prep. Never loaded.
- `archive-management.md` — Archival rules. Never loaded.

**Impact**: The pipeline creates briefs but doesn't generate the full production support package (B-roll lists, edit decisions, repurposing plans) that these skills are designed for.

---

## Key Finding

**Available**: 154 skill files with **14,114 total lines** of domain intelligence.

**Currently used in generation**: ~62 skills referenced in code (~46 via engine-router, ~16 in other code paths). However, the engine-router skills only fire when a specific content type is being generated — day-to-day, only the signal processing skills (5) and learning loop skills (3) run regularly.

**The 5 deepest, most valuable skill files** (topic-selection: 254 lines, angle-detection: 314 lines, hook-engineering: 423 lines, title-engineering: 464 lines, and brand identities: 265+290 lines) represent **~2,010 lines of concentrated editorial intelligence**. Of these, only hook-engineering, title-engineering, and brand identity are in the active pipeline. **Angle detection and the rich editorial decision frameworks in topic-selection are NOT used in the content generation pipeline** — they're only loaded as context by GI.

**The single biggest gap**: The system can generate content for any platform, but it doesn't use the editorial decision intelligence (angle-detection, competitive-narrative-analysis, contrarian-angle, sensitivity-classification) that would make the WHAT and WHY of content intelligent — not just the HOW.

---

## Duplicate/Redundant Skills Found

| File | Duplicate Of | Note |
|------|-------------|------|
| `system/fact-dossier-building.md` | `narrative/research/fact-dossier-building.md` | System copy appears to be an older/shorter version |
| `production/support/thumbnail-strategy.md` | `platforms/youtube/thumbnail-strategy.md` | Overlapping concern — production vs platform framing |
