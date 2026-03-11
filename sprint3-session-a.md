SPRINT 3 — You are building the brain that turns research into content.

The Yantri pipeline currently stops after FactDossier creation. Your job is to build everything that happens AFTER a dossier exists: the strategy decision, the content generation engines, and the Inngest workflow that chains them together.

Read CLAUDE.md and /src/lib/yantri/CLAUDE.md for full project context.

### WHAT EXISTS RIGHT NOW
- FactDossier records exist in the database (Gemini research completed)
- strategist.ts exists but may not be wired to actually run after dossier creation
- /engines/ directory exists but engines may be empty or placeholder
- model-router.ts exists (routes to Gemini or Claude)
- Inngest pipeline.ts exists but the steps after dossier may not be implemented
- skill-orchestrator.ts exists but may not be loading skill files into prompts

### STEP 1: Audit What Exists

Before writing ANY code, run these checks:

```bash
# Check if strategist has real logic or is placeholder
cat src/lib/yantri/strategist.ts | head -50

# Check what engines exist
ls -la src/lib/yantri/engines/
cat src/lib/yantri/engines/*.ts | head -100

# Check Inngest pipeline steps
cat src/inngest/pipeline.ts

# Check what happens after dossier.ready event
grep -r "dossier" src/inngest/ --include="*.ts"

# Check if skill orchestrator loads files
cat src/lib/skill-orchestrator.ts | head -50

# Check what skill files exist
find skills/ -name "*.md" -type f 2>/dev/null

# Check deliverable-related API routes
ls src/app/api/yantri/deliverables/ 2>/dev/null
ls src/app/api/yantri/pipeline/ 2>/dev/null
ls src/app/api/yantri/strategy/ 2>/dev/null
```

Report what you find before proceeding. Then build what's missing.

### STEP 2: Wire the Strategy Decision Step

After a FactDossier is created, the Inngest pipeline must trigger a strategy step.

The strategy step does:
1. Load the FactDossier from the database
2. Load the Brand config (from Daftar's Brand + BrandPlatform models)
3. Load relevant skill files if they exist in /skills/ (brand identity, topic selection, angle detection). If no skill files exist yet, use sensible defaults.
4. Send everything to the LLM via model-router (use Gemini for strategy decisions)
5. The LLM decides:
   - **Content type**: What to create (YouTube Explainer, YouTube Short, X Thread, Instagram Carousel, etc.)
   - **Platform**: Which platform to target
   - **Angle**: The editorial angle (contrarian, explainer, breaking news reaction, deep dive, etc.)
   - **Hook approach**: How to open (rhetorical question, surprising stat, provocative statement, etc.)
   - **Tone**: Match to brand voice
   - **Priority**: How urgent is this content (breaking = immediate, trending = within 48hrs, evergreen = queue)
   - **Reasoning**: Why this decision was made (stored for learning loop later)
6. Save as a StrategyDecision record in the database linked to the FactDossier and Brand
7. Emit Inngest event: `strategy.decided`

**The strategy prompt should be structured like this:**

```
You are a content strategist for {brand_name}.

Brand Identity:
{brand_identity_from_skill_file_or_defaults}

Research Dossier:
{fact_dossier_content}

Available Platforms: {list_of_platforms_linked_to_this_brand}

Available Content Types:
- YouTube Explainer (10-30 min deep dive)
- YouTube Shorts (60 sec vertical)
- X/Twitter Thread (5-15 tweets)
- X/Twitter Single Post
- Instagram Carousel (5-10 slides)
- Instagram Reel (60-90 sec)
- LinkedIn Post
- LinkedIn Article
- Blog Post
- Newsletter
- Podcast Script
- Quick Take (2-5 min opinion)
- YouTube Community Post

Based on this research, decide:
1. What content type to create
2. For which platform
3. What editorial angle to take
4. How to hook the audience
5. What tone matches this brand
6. How urgent this is

Respond in JSON format:
{
  "contentType": "youtube_explainer",
  "platform": "youtube",
  "angle": "contrarian deep dive",
  "hook": "rhetorical question challenging the official narrative",
  "tone": "authoritative but conversational",
  "priority": "trending",
  "reasoning": "This topic is trending but coverage is shallow. An explainer that digs into the subsidy structure would differentiate from quick-take coverage.",
  "estimatedLength": "12-15 minutes",
  "keyPoints": ["point 1", "point 2", "point 3"]
}
```

### STEP 3: Build Content Generation Engines

After `strategy.decided`, the pipeline triggers content generation. Build or fix these engines:

**Engine Router**: Based on the contentType in the StrategyDecision, route to the appropriate engine.

**YouTube Explainer Engine** (PRIORITY — build this first):

Input: FactDossier + StrategyDecision + Brand config + skill files
Output:
```json
{
  "script": {
    "sections": [
      {
        "type": "hook",
        "duration": "0:00-0:30",
        "text": "The actual script text...",
        "visualNotes": "B-roll suggestion for this section"
      },
      {
        "type": "context",
        "duration": "0:30-2:00",
        "text": "...",
        "visualNotes": "..."
      },
      {
        "type": "thesis",
        "duration": "2:00-3:00",
        "text": "...",
        "visualNotes": "..."
      },
      {
        "type": "cta",
        "duration": "12:00-12:30",
        "text": "...",
        "visualNotes": "..."
      }
    ],
    "totalDuration": "12:30"
  },
  "titles": [
    {"text": "Title Option 1", "strategy": "curiosity gap"},
    {"text": "Title Option 2", "strategy": "data-driven"},
    {"text": "Title Option 3", "strategy": "provocative question"}
  ],
  "description": "Full YouTube description with SEO keywords...",
  "tags": ["tag1", "tag2", "tag3"],
  "thumbnailBriefs": [
    {
      "concept": "Description of visual concept",
      "textOverlay": "4 words max",
      "colorScheme": "dark background, yellow accent",
      "expression": "Surprised/concerned look",
      "composition": "Face left third, text right"
    }
  ]
}
```

The LLM prompt for content generation should be detailed. Use the model-router to send this to Claude (creative writing) rather than Gemini.

**X/Twitter Thread Engine** (Build second):

Output:
```json
{
  "tweets": [
    {"position": 1, "text": "Hook tweet (max 280 chars)", "media": "optional image description"},
    {"position": 2, "text": "First argument...", "media": null},
    {"position": "final", "text": "Conclusion + engagement CTA", "media": null}
  ],
  "hashtags": ["#tag1", "#tag2"],
  "threadTitle": "Internal reference title"
}
```

**Instagram Carousel Engine** (Build third):

Output:
```json
{
  "slides": [
    {"position": 1, "text": "Hook slide text", "visualDescription": "Background, colors, layout"},
    {"position": 2, "text": "Point 1...", "visualDescription": "..."},
    {"position": "final", "text": "CTA slide", "visualDescription": "..."}
  ],
  "caption": "Instagram caption with hashtags...",
  "coverSlideText": "The title for the carousel cover"
}
```

**For all other content types**, build a generic engine that produces reasonable output based on the content type.

### STEP 4: Wire Inngest Pipeline Steps

The complete Inngest pipeline flow:

```
Event: signal.submitted
  -> Step 1: Create NarrativeTree + NarrativeNode
  -> Step 2: Vectorize signal (embeddings)

Event: narrative.created
  -> Step 3: Generate FactDossier (callGeminiResearch)
  -> Save FactDossier to DB

Event: dossier.ready
  -> Step 4: Run Strategy Decision
  -> Save StrategyDecision to DB

Event: strategy.decided
  -> Step 5: Route to appropriate Content Engine
  -> Step 6: Generate content package
  -> Step 7: Create Deliverable record (status: pending_review)
  -> Step 8: Create Asset records for each piece (script, titles, description, thumbnails, tags)

Event: deliverable.created
  -> Notify via event bus (for UI update)
```

Make sure EVERY step:
- Has error handling (if Gemini/Claude API fails, retry 3 times with backoff, then mark as failed)
- Logs what it's doing (console.log at minimum)
- Saves intermediate state (so if step 5 fails, step 4's output isn't lost)

### STEP 5: Create API Routes for Strategy and Deliverables

**POST /api/yantri/strategy/generate**
- Input: { factDossierId, brandId }
- Manually trigger strategy decision for a dossier
- Returns: StrategyDecision

**GET /api/yantri/strategy/[id]**
- Returns a specific StrategyDecision with its FactDossier

**GET /api/yantri/deliverables**
- Query params: status (pending_review, approved, rejected, revision_requested), brandId, platform
- Returns list of deliverables with their assets

**GET /api/yantri/deliverables/[id]**
- Returns full deliverable with all assets, linked strategy, linked dossier

**POST /api/yantri/deliverables/[id]/approve**
- Changes status to approved
- Creates PMS Task with all assets attached
- Returns the created task

**POST /api/yantri/deliverables/[id]/reject**
- Changes status to rejected
- Input: { reason }

**POST /api/yantri/deliverables/[id]/revise**
- Changes status to revision_requested
- Input: { notes }
- Triggers re-generation with revision notes added to prompt context
- Creates new deliverable version

### STEP 6: Test the Full Chain

After building everything:

1. Find an existing FactDossier ID in the database
2. Call POST /api/yantri/strategy/generate with that dossier ID + a brand ID
3. Verify a StrategyDecision was created
4. Check Inngest — did content generation trigger?
5. Verify a Deliverable + Assets were created
6. Call GET /api/yantri/deliverables — does the new deliverable appear?
7. Call POST /api/yantri/deliverables/[id]/approve — does a PMS task get created?

**FILES YOU OWN:** /src/lib/yantri/strategist.ts, /src/lib/yantri/engines/*, /src/lib/yantri/model-router.ts, /src/inngest/pipeline.ts, /src/app/api/yantri/pipeline/*, /src/app/api/yantri/deliverables/*, /src/app/api/yantri/strategy/*, /src/lib/skill-orchestrator.ts

**DO NOT TOUCH:** UI pages, brand management, shell layout, auth, schema.prisma
