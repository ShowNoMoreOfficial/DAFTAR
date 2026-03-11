# Yantri -- AI Content Generation Pipeline

## What It Does

Yantri is DAFTAR's AI-powered content generation engine. It takes a signal (a news event, trending topic, or editorial idea ingested from Khabri or manually entered) and transforms it through a multi-stage pipeline into platform-ready deliverables for multiple brands and platforms simultaneously. The pipeline is: **Signal -> NarrativeTree -> FactDossier -> Strategy -> Deliverable**.

Key capabilities:

- **Narrative Trees:** Group related signals into narrative clusters. Each tree can branch into multiple brand-platform combinations (Narratives), allowing a single event to produce different content for YouTube, X (Twitter), LinkedIn, Instagram, and blogs.
- **Fact Engine:** Builds a structured FactDossier from research -- facts, statistics, quotes, timelines, and source URLs.
- **Engine Router:** Maps 13 content types (VIDEO_SCRIPT, TWEET_THREAD, INSTAGRAM_CAROUSEL, BLOG_ARTICLE, etc.) to ordered skill chains that define the generation pipeline.
- **Skill Orchestrator:** Executes skill `.md` files that contain system prompts, context templates, and output formats. Skills are chained (e.g., topic-selection -> research -> scripting -> fact-check).
- **Fact Checker:** Verifies generated content against the original signal source, flagging deviations. Failed checks trigger automatic re-drafting (up to 2 retries).
- **Multi-brand support:** Each narrative tree can target multiple brands, each with its own voice/identity loaded from brand skill files.
- **Prompt Templates:** Configurable per-platform prompt templates for fine-tuning generation style.
- **Platform Rules:** Legacy configuration mapping narrative types to primary/secondary platforms.
- **Performance Tracking:** ContentPerformance records link deliverables to engagement metrics for the analytics learning loop.
- **Editorial Narratives:** Vritti CMS integration for editorial workflows.
- **Trend Import:** Batch import of trends from external sources to seed narrative trees.

---

## Database Models

### NarrativeTree
Table: `narrative_trees`

| Field       | Type            | Notes                                                |
|-------------|-----------------|------------------------------------------------------|
| id          | String (cuid)   | Primary key                                          |
| title       | String          | Headline/topic of the narrative                      |
| summary     | String? (Text)  | Editorial summary                                    |
| embedding   | String? (Text)  | Serialized embedding vector (JSON float array) for pgvector similarity search |
| status      | NarrativeStatus | Enum: INCOMING, RESEARCHING, SCRIPTING, GENERATING_ASSETS, REVIEW, APPROVED, RELAYED, KILLED. Default INCOMING |
| signalData  | Json?           | Original signal payload from Khabri                  |
| signalId    | String?         | External Khabri signal ID                            |
| trendId     | String?         | Link to Trend if the tree was spawned from a trend   |
| urgency     | String          | breaking, high, normal, low. Default "normal"        |
| createdById | String (FK)     | -> User                                              |
| createdAt   | DateTime        | Auto                                                 |
| updatedAt   | DateTime        | Auto                                                 |

Indexes: `[status]`, `[createdAt]`

### Narrative
Table: `narratives`

| Field          | Type            | Notes                                           |
|----------------|-----------------|--------------------------------------------------|
| id             | String (cuid)   | Primary key                                      |
| treeId         | String (FK)     | -> NarrativeTree (cascade delete)                |
| brandId        | String (FK)     | -> Brand                                         |
| platform       | String          | youtube, x, instagram, linkedin, facebook        |
| angle          | String?         | Editorial angle for this brand+platform          |
| formatNotes    | String? (Text)  | Content format notes (long-form video, thread, etc.) |
| status         | NarrativeStatus | Default INCOMING                                 |
| taskId         | String?         | Link to PMS Task once created                    |
| contentPostId  | String?         | Link to ContentPost once created                 |
| deliverableId  | String?         | Link to ClientDeliverable once created           |
| editorialNotes | String? (Text)  | Editor's notes                                   |
| createdAt      | DateTime        | Auto                                             |
| updatedAt      | DateTime        | Auto                                             |

Unique constraint: `[treeId, brandId, platform]`

### NarrativeNode
Table: `narrative_nodes`

| Field        | Type          | Notes                                    |
|--------------|---------------|------------------------------------------|
| id           | String (cuid) | Primary key                              |
| treeId       | String (FK)   | -> NarrativeTree (cascade delete)        |
| nodeType     | NodeType      | Enum: SIGNAL, HYPOTHESIS. Default SIGNAL |
| signalData   | Json          | Raw Khabri payload                       |
| signalTitle  | String        | Quick-access headline                    |
| signalScore  | Int           | Default 0. Relevance score               |
| identifiedAt | DateTime      | Auto                                     |

### FactDossier
Table: `fact_dossiers`

| Field          | Type          | Notes                                             |
|----------------|---------------|---------------------------------------------------|
| id             | String (cuid) | Primary key                                       |
| treeId         | String (FK)   | -> NarrativeTree. One-to-one (unique)             |
| structuredData | Json          | `{ facts, stats, quotes, timeline }`              |
| sources        | String[]      | Array of source URLs                              |
| visualAssets   | String[]      | URLs to scraped images/charts                     |
| rawResearch    | String? (Text)| Full research text before synthesis               |
| lastUpdated    | DateTime      | Auto                                              |
| createdAt      | DateTime      | Auto                                              |

### ContentPiece
Table: `content_pieces`

| Field           | Type                  | Notes                                     |
|-----------------|-----------------------|-------------------------------------------|
| id              | String (cuid)         | Primary key                               |
| brandId         | String (FK)           | -> Brand                                  |
| treeId          | String? (FK)          | -> NarrativeTree                          |
| platform        | ContentPlatform       | Enum: YOUTUBE, X_THREAD, X_SINGLE, BLOG, LINKEDIN, META_REEL, META_CAROUSEL, META_POST |
| status          | ContentPipelineStatus | Enum: PLANNED, RESEARCHING, SCRIPTING, GENERATING_ASSETS, STORYBOARDING, DRAFTED, REVIEW, APPROVED, RELAYED, PUBLISHED, KILLED |
| bodyText        | String (Text)         | The generated content body                |
| researchPrompt  | String? (Text)        | Research prompt used                      |
| postingPlan     | Json?                 | Timing, hashtags, engagement strategy     |
| visualPrompts   | String? (Text)        | Structural prompts for visual assets      |
| performanceData | Json?                 | Fed back from Relay after publishing      |
| approvedAt      | DateTime?             | When approved                             |
| publishedAt     | DateTime?             | When published                            |
| createdAt       | DateTime              | Auto                                      |
| updatedAt       | DateTime              | Auto                                      |

### Deliverable
Table: `deliverables`

| Field          | Type                  | Notes                                          |
|----------------|-----------------------|------------------------------------------------|
| id             | String (cuid)         | Primary key                                    |
| brandId        | String (FK)           | -> Brand                                       |
| treeId         | String? (FK)          | -> NarrativeTree                               |
| platform       | ContentPlatform       | Target platform                                |
| pipelineType   | String                | standard, viral_micro, carousel, cinematic. Default "standard" |
| status         | ContentPipelineStatus | Default PLANNED                                |
| copyMarkdown   | String? (Text)        | Generated copy in markdown                     |
| storyboardUrl  | String?               | URL to visual storyboard                       |
| scriptData     | Json?                 | Full script structure (for YouTube)            |
| carouselData   | Json?                 | Slide-by-slide carousel data                   |
| postingPlan    | Json?                 | Timing, hashtags, engagement strategy          |
| researchPrompt | String? (Text)        | Research prompt used                           |
| factDossierId  | String?               | Link to fact dossier                           |
| createdAt      | DateTime              | Auto                                           |
| updatedAt      | DateTime              | Auto                                           |

Indexes: `[brandId]`, `[status]`, `[platform]`, `[pipelineType]`

### Asset
Table: `assets`

| Field         | Type          | Notes                                       |
|---------------|---------------|---------------------------------------------|
| id            | String (cuid) | Primary key                                 |
| deliverableId | String (FK)   | -> Deliverable (cascade delete)             |
| type          | AssetType     | Enum: IMAGE, VIDEO_CLIP, BROLL, CAROUSEL_SLIDE, THUMBNAIL, SOCIAL_CARD, AUDIO |
| url           | String        | S3 or external URL                          |
| promptUsed    | String? (Text)| Prompt that generated the asset             |
| slideIndex    | Int?          | Ordering for carousel slides                |
| metadata      | Json?         | Dimensions, duration, etc.                  |
| createdAt     | DateTime      | Auto                                        |

### Skill
Table: `skills`

| Field       | Type          | Notes                                                    |
|-------------|---------------|----------------------------------------------------------|
| id          | String (cuid) | Primary key                                              |
| path        | String        | Unique. e.g. "/narrative/editorial/topic-selection.md"   |
| domain      | String        | signals, narrative, production, platforms, distribution, analytics, brand, gi, workflows, system |
| module      | String        | khabri, yantri, pms, relay, hoccr, daftar, gi            |
| name        | String        | Human-readable skill name                                |
| description | String? (Text)| What the skill does                                      |
| version     | Int           | Default 1                                                |
| isActive    | Boolean       | Default true                                             |
| metadata    | Json?         | Extra config: trigger, inputs, outputs, dependencies, scripts |
| createdAt   | DateTime      | Auto                                                     |
| updatedAt   | DateTime      | Auto                                                     |

### SkillExecution
Table: `skill_executions`

| Field            | Type          | Notes                                        |
|------------------|---------------|----------------------------------------------|
| id               | String (cuid) | Primary key                                  |
| skillId          | String (FK)   | -> Skill (cascade delete)                    |
| deliverableId    | String?       | Which deliverable this execution produced    |
| brandId          | String?       | Brand context                                |
| platform         | String?       | Target platform                              |
| inputContext      | Json          | What context was provided to the skill       |
| outputSummary    | Json          | What the skill produced                      |
| modelUsed        | String        | Which LLM processed this skill               |
| tokensUsed       | Int?          | Token consumption                            |
| durationMs       | Int?          | Execution time                               |
| performanceScore | Float?        | Scored later by analytics (0-10)             |
| status           | String        | completed, failed, partial. Default "completed" |
| errorMessage     | String? (Text)| Error details if failed                      |
| executedById     | String?       | User who triggered, null if system           |
| executedAt       | DateTime      | Auto                                         |

---

## API Routes

All routes require authentication via NextAuth session.

### Core Pipeline Routes

| Method | Path                                           | Auth          | Description                                         |
|--------|-------------------------------------------------|---------------|-----------------------------------------------------|
| GET    | /api/yantri/narrative-trees                    | Authenticated | List all narrative trees with filtering/pagination   |
| POST   | /api/yantri/narrative-trees                    | Authenticated | Create a new narrative tree                          |
| GET    | /api/yantri/narrative-trees/[treeId]           | Authenticated | Get a single tree with nodes, narratives, dossier    |
| PATCH  | /api/yantri/narrative-trees/[treeId]           | Authenticated | Update tree fields                                   |
| POST   | /api/yantri/narrative-trees/merge              | Authenticated | Merge multiple trees into one                        |
| POST   | /api/yantri/narrative-trees/[treeId]/hypothesis| Authenticated | Add a hypothesis node to a tree                      |
| GET    | /api/yantri/narratives                         | Authenticated | List narratives (brand-platform combinations)        |
| GET    | /api/yantri/narratives/[id]                    | Authenticated | Get a single narrative with full details             |
| PATCH  | /api/yantri/narratives/[id]                    | Authenticated | Update narrative fields                              |
| GET    | /api/yantri/narratives/[id]/deliverables       | Authenticated | Get deliverables for a narrative                     |

### Content Generation Routes

| Method | Path                                           | Auth          | Description                                         |
|--------|-------------------------------------------------|---------------|-----------------------------------------------------|
| POST   | /api/yantri/generate                           | Authenticated | Trigger content generation for a narrative tree      |
| POST   | /api/yantri/pipeline/run                       | Authenticated | Run the full Inngest pipeline                        |
| GET    | /api/yantri/pipeline/status                    | Authenticated | Check pipeline execution status                      |
| POST   | /api/yantri/rewrite-segment                    | Authenticated | Rewrite a specific segment of generated content      |
| POST   | /api/yantri/route-prompt                       | Authenticated | Route a prompt through the engine router             |
| POST   | /api/yantri/research                           | Authenticated | Trigger research for a narrative tree                |
| POST   | /api/yantri/strategist                         | Authenticated | Run the strategist to plan content angles            |
| POST   | /api/yantri/generate-image                     | Authenticated | Generate an image asset                              |
| POST   | /api/yantri/scan                               | Authenticated | Scan for new signals to ingest                       |
| POST   | /api/yantri/ingest                             | Authenticated | Ingest external signals into narrative trees         |

### Deliverable Management Routes

| Method | Path                                           | Auth          | Description                                         |
|--------|-------------------------------------------------|---------------|-----------------------------------------------------|
| GET    | /api/yantri/deliverables                       | Authenticated | List deliverables with filtering                     |
| GET    | /api/yantri/deliverables/[id]                  | Authenticated | Get a single deliverable with assets                 |
| PATCH  | /api/yantri/deliverables/[id]                  | Authenticated | Update deliverable fields/status                     |
| GET    | /api/yantri/deliverables/[id]/assets           | Authenticated | Get assets for a deliverable                         |

### Content Pieces (Legacy) Routes

| Method | Path                                           | Auth          | Description                                         |
|--------|-------------------------------------------------|---------------|-----------------------------------------------------|
| GET    | /api/yantri/content-pieces                     | Authenticated | List content pieces                                  |
| GET    | /api/yantri/content-pieces/[id]                | Authenticated | Get a single content piece                           |
| PATCH  | /api/yantri/content-pieces/[id]                | Authenticated | Update a content piece                               |

### Configuration and Tooling Routes

| Method | Path                                           | Auth          | Description                                         |
|--------|-------------------------------------------------|---------------|-----------------------------------------------------|
| GET    | /api/yantri/prompt-templates                   | Authenticated | List prompt templates                                |
| POST   | /api/yantri/prompt-templates                   | Authenticated | Create a new prompt template                         |
| PATCH  | /api/yantri/prompt-templates/[id]              | Authenticated | Update a prompt template                             |
| POST   | /api/yantri/prompt-templates/test              | Authenticated | Test a prompt template with sample input             |
| GET    | /api/yantri/platform-rules                     | Authenticated | List platform rules                                  |
| PATCH  | /api/yantri/platform-rules/[id]               | Authenticated | Update a platform rule                               |
| GET    | /api/yantri/fact-engine/[treeId]               | Authenticated | Get fact dossier for a tree                          |
| POST   | /api/yantri/fact-engine                        | Authenticated | Build/rebuild fact dossier for a tree                |

### Editorial and Analytics Routes

| Method | Path                                           | Auth          | Description                                         |
|--------|-------------------------------------------------|---------------|-----------------------------------------------------|
| GET    | /api/yantri/editorial-narratives               | Authenticated | List editorial narratives (Vritti integration)       |
| GET    | /api/yantri/editorial-narratives/[id]          | Authenticated | Get a single editorial narrative                     |
| POST   | /api/yantri/editorial-narratives/cluster       | Authenticated | Cluster editorial narratives                         |
| GET    | /api/yantri/performance                        | Authenticated | List content performance records                     |
| GET    | /api/yantri/performance/[id]                   | Authenticated | Get performance detail for a deliverable             |
| GET    | /api/yantri/performance/summary                | Authenticated | Aggregated performance summary                       |
| GET    | /api/yantri/stats                              | Authenticated | Pipeline-wide statistics                             |
| GET    | /api/yantri/history                            | Authenticated | Generation history log                               |

### Trend and Publishing Routes

| Method | Path                                           | Auth          | Description                                         |
|--------|-------------------------------------------------|---------------|-----------------------------------------------------|
| GET    | /api/yantri/trends/batches                     | Authenticated | List trend batches                                   |
| GET    | /api/yantri/trends/batch/[id]                  | Authenticated | Get a specific trend batch                           |
| POST   | /api/yantri/trends/fetch                       | Authenticated | Fetch trending topics from external sources          |
| POST   | /api/yantri/trends/import                      | Authenticated | Import trends into narrative trees                   |
| POST   | /api/yantri/package                            | Authenticated | Package deliverables for distribution                |
| POST   | /api/yantri/relay/publish                      | Authenticated | Publish a deliverable via Relay                      |

---

## UI Pages

All Yantri UI is under `/m/yantri/` (the `m` route group is for module pages).

### /m/yantri (Dashboard)
Main Yantri dashboard showing pipeline stats, recent narrative trees, active deliverables, and quick actions.

### /m/yantri/narrative-trees
List of all narrative trees with status filters, search, and a tree visualizer component. Includes a clustering feature to merge related trees.

### /m/yantri/narrative-trees/[treeId]
Detailed view of a single narrative tree: signal nodes, fact dossier, brand-platform narratives, and generated deliverables. Controls to trigger research, generation, and fact-checking.

### /m/yantri/workspace
Content workspace for editing and reviewing deliverables, managing the pipeline stages.

### /m/yantri/performance
Performance analytics dashboard showing deliverable engagement metrics, skill execution stats, and content performance trends.

### /m/yantri/brands
Brand management within Yantri context -- listing brands and their content production status.

### /m/yantri/brands/[id]
Single brand detail with its narratives, deliverables, and voice configuration.

### /m/yantri/brands/new
Create a new brand.

### /m/yantri/prompt-library
Library of prompt templates with editing, testing, and per-platform filtering.

### /m/yantri/prompt-library/[id]
Single prompt template editor with a test execution panel.

### /m/yantri/platform-rules
Configuration page for platform routing rules.

### /m/yantri/trends
Trend dashboard showing fetched trends and their mapping to narrative trees.

### /m/yantri/trends/import
Batch import interface for trends.

### /m/yantri/history
Generation history log.

### /m/yantri/plan/[batchId]
Batch content plan review with platform-specific preview components:
- `BlogPreview` -- Blog article preview
- `TwitterPreview` -- X/Twitter post preview
- `LinkedInPreview` -- LinkedIn post preview
- `MetaPreview` -- Instagram/Facebook preview
- `YouTubePreview` -- YouTube script preview

---

## Background Jobs (Inngest)

### `generate-deliverable-v2` (Yantri Master Pipeline)
**Event:** `yantri/deliverable.generate`
**Concurrency:** 3 simultaneous executions
**Retries:** 2

This is the core durable workflow that orchestrates end-to-end deliverable generation:

**Step 1: `route-engines`**
Determines the skill chain for each requested platform using the EngineRouter. Maps platform strings (YOUTUBE, X_THREAD, META_CAROUSEL, etc.) to ContentType enums and resolves the ordered skill paths.

**Step 1.5: `load-brand-context`**
Loads the brand's name, slug, config, and voice/identity instructions from a brand skill file (`brand/identity/{slug}/identity.md`).

**Step 1.6: `load-signal-context`**
Searches for the Khabri signal linked to this narrative tree. Falls back to using the narrative markdown itself as the source of truth for fact-checking.

**Step 2: `draft-{platform}`** (per platform)
Executes the primary drafting skill via SkillOrchestrator. If the skill file is missing or execution fails, falls back to a direct LLM call via the ModelRouter.

**Step 3: `fact-check-{platform}-attempt-{n}`** (per platform, up to 3 attempts)
Verifies the generated draft against the signal source. If the fact-check fails and retries remain, a `redraft` step re-generates the content with deviation corrections.

**Step 4: `save-and-notify`**
Persists each deliverable as a ClientDeliverable record (status: "ready_for_review"), creates a ContentPerformance record for the learning loop, and logs a SkillExecution audit entry.

**Step 5: `alert-pms`**
Emits `YANTRI_DELIVERABLE_READY` and legacy `yantri.deliverables.ready` events for GI and PMS to consume.

### 13 Content Types Supported

| ContentType          | Platform           |
|----------------------|--------------------|
| VIDEO_SCRIPT         | YouTube            |
| VIDEO_SHORT          | YouTube Shorts     |
| TWEET_SINGLE         | X (single post)    |
| TWEET_THREAD         | X (thread)         |
| INSTAGRAM_REEL       | Instagram Reels    |
| INSTAGRAM_CAROUSEL   | Instagram Carousel |
| INSTAGRAM_STORY      | Instagram Story    |
| LINKEDIN_POST        | LinkedIn           |
| LINKEDIN_ARTICLE     | LinkedIn Article   |
| FACEBOOK_POST        | Facebook           |
| BLOG_ARTICLE         | Blog               |
| IMAGE_ASSET          | Any (visual)       |
| PODCAST_SCRIPT       | Podcast            |

---

## Known Issues and Gaps

1. **~~Skill `.md` files referenced but not loaded~~ FIXED.** The SkillOrchestrator is now wired and loading `.md` skill files. Skill content is actively being authored — some skill paths may still have placeholder files, but the loading mechanism works.
2. **Fact-checker uses mock LLM in some paths.** The `modelUsed` field records "mock-llm" for some skill executions, indicating the fact-checker's LLM integration is not fully connected in all code paths.
3. **No real-time pipeline progress.** The pipeline status endpoint exists but there is no WebSocket or SSE streaming for live progress updates in the UI.
4. **Embedding storage as text.** NarrativeTree embeddings are stored as serialized JSON text rather than using pgvector's native vector type, preventing efficient vector similarity queries.
5. **ContentPiece vs Deliverable duplication.** Two models (ContentPiece and Deliverable) serve similar purposes due to legacy migration. Some routes use ContentPiece while newer code uses Deliverable.
6. **No content versioning.** Regenerated content overwrites previous versions. There is no draft history or diff view.
7. **Platform rules are static.** PlatformRule records exist in the database but there is limited UI for managing them dynamically.

---

## Dependencies on Other Modules

| Module       | Direction        | Description                                                                |
|--------------|------------------|----------------------------------------------------------------------------|
| Khabri       | Khabri -> Yantri | Signals and trends from Khabri seed NarrativeTrees and NarrativeNodes      |
| PMS          | Yantri -> PMS    | YANTRI_DELIVERABLE_READY event can trigger PMS task creation for editorial review. Narratives can link to PMS tasks via `taskId` |
| Relay        | Yantri -> Relay  | `/api/yantri/relay/publish` pushes deliverables to Relay for social media publishing. Narratives link to ContentPosts via `contentPostId` |
| GI           | GI consumes events | GI receives YANTRI_DELIVERABLE_READY events for proactive notifications    |
| Vritti       | Yantri <-> Vritti | Editorial narratives bridge Yantri pipeline output to Vritti CMS workflow  |
| Brand        | Brand -> Yantri  | Brand identity, voice config, and platform preferences drive content generation |
