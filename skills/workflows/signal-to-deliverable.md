# Skill: Signal-to-Deliverable Workflow
## Module: daftar
## Trigger: New signal detected, editorial decision to cover
## Inputs: signal_data, brand_slug, target_platforms[], priority_level
## Outputs: deliverable_briefs[], production_assignments[], scheduling_recommendations
## Dependencies: signals/detection/event-detection.md, narrative/editorial/topic-selection.md, narrative/editorial/narrative-arc-construction.md, narrative/editorial/multi-narrative-branching.md, production/long-form/quality-tier-classification.md, brand/identity/{brand_slug}/identity.md
## Scripts:

---

## Instructions

This is the master workflow that chains skills from signal detection through narrative construction to deliverable production. It orchestrates the full pipeline from "something happened" to "publish-ready briefs assigned to team."

### Workflow Stages

#### Stage 1: Signal Assessment
**Skills chained**: `signals/detection/event-detection.md` → `narrative/editorial/topic-selection.md`

1. Receive signal data (from Khabri or manual input)
2. Classify signal: category, severity, velocity, geographic relevance
3. Run topic selection scoring:
   - Relevance to brand audience (0-10)
   - Timeliness decay rate (hours until stale)
   - Competitive landscape (who else is covering?)
   - Production feasibility (can we cover this well?)
4. **Gate**: If topic score < 5/10, log rejection reason and STOP
5. **Output**: Validated signal with coverage recommendation

#### Stage 2: Editorial Framing
**Skills chained**: `narrative/editorial/narrative-framing.md` → `narrative/editorial/contrarian-angle-detection.md` → `narrative/editorial/sensitivity-classification.md`

1. Determine framing approach (explanatory, investigative, opinion, breaking, human-interest)
2. Identify contrarian angles — what's the non-obvious take?
3. Run sensitivity classification:
   - Level 1 (Green): Standard coverage
   - Level 2 (Yellow): Review language carefully
   - Level 3 (Orange): Senior editorial review required
   - Level 4 (Red): Hold for explicit approval
4. **Gate**: If sensitivity Level 3+, flag for human review before proceeding
5. **Output**: Editorial frame, angle, sensitivity level

#### Stage 3: Research & Fact Assembly
**Skills chained**: `narrative/research/fact-dossier-building.md` → `narrative/research/web-research.md` → `narrative/research/data-backed-argumentation.md`

1. Build fact dossier from available data:
   - Primary sources (official statements, data releases)
   - Secondary sources (credible reporting)
   - Context sources (historical precedent, expert analysis)
2. Conduct targeted web research to fill gaps
3. Structure arguments: Claim → Evidence → Implication chains
4. **Gate**: If insufficient Tier 1-2 sources for core claims, flag research gaps
5. **Output**: Complete fact dossier with sourced claims

#### Stage 4: Multi-Platform Branching
**Skills chained**: `narrative/editorial/multi-narrative-branching.md` → `brand/identity/{brand_slug}/identity.md` → `brand/identity/{brand_slug}/platforms.md`

1. From single fact dossier, generate platform-specific deliverable briefs:
   - **YouTube Long-form**: Full explainer or quick take
   - **YouTube Shorts**: 2-3 short-form angles extracted
   - **X/Twitter**: Thread outline + standalone tweets
   - **Instagram**: Reel script + carousel data points
2. Apply brand voice to each deliverable:
   - Load brand identity for voice/tone rules
   - Load platform config for format specs
   - Calibrate each brief to platform + brand intersection
3. **Output**: Array of deliverable briefs, each with platform, format, brand voice applied

#### Stage 5: Production Planning
**Skills chained**: `production/long-form/quality-tier-classification.md` → `narrative/editorial/timeliness-optimizer.md` → `production/automation/production-capacity-matching.md`

1. Classify each deliverable by quality tier:
   - **Tier S**: Flagship, full production (rare)
   - **Tier A**: High quality, standard production
   - **Tier B**: Good quality, expedited production
   - **Tier C**: Minimum viable, speed-first
2. Calculate optimal publish windows per platform
3. Match deliverables to available production capacity:
   - Check team workload
   - Assign based on skill match and availability
   - Flag if capacity insufficient for timeliness requirement
4. **Output**: Production assignments with deadlines

#### Stage 6: Brief Generation
**Skills chained**: Platform-specific production skills based on deliverable type

For each deliverable, generate the appropriate production brief:
- Long-form → `production/long-form/quick-take-production.md` or `explainer-production.md`
- Short-form → `production/short-form/explainer-shorts.md` or relevant short-form skill
- Support assets → `production/support/thumbnail-strategy.md`, `broll-sheet-generation.md`

**Output per deliverable**:
```json
{
  "deliverable_id": "string",
  "brand": "the-squirrels | breaking-tube",
  "platform": "youtube | youtube-shorts | x-twitter | instagram",
  "format": "quick-take | explainer | short | thread | reel",
  "quality_tier": "S | A | B | C",
  "brief": {
    "title_options": ["..."],
    "hook": "...",
    "narrative_arc": "...",
    "key_data_points": ["..."],
    "voice_notes": "...",
    "visual_notes": "..."
  },
  "production": {
    "assigned_to": "string | null",
    "deadline": "ISO datetime",
    "estimated_duration_hours": "number",
    "dependencies": ["..."]
  },
  "scheduling": {
    "optimal_publish_time": "ISO datetime",
    "staleness_deadline": "ISO datetime",
    "platform_queue_position": "number"
  }
}
```

### Workflow Configuration

#### Speed Modes
| Mode | Description | Stages Executed | Typical Duration |
|------|-------------|-----------------|------------------|
| **Breaking** | Speed-first, minimal review | 1 → 4 → 5 (skip 2-3 deep work) | 30 min |
| **Standard** | Full pipeline | All 6 stages | 2-4 hours |
| **Deep** | Research-heavy, flagship | All 6 stages + extended Stage 3 | 1-2 days |

#### Multi-Brand Handling
When a signal is relevant to multiple brands:
1. Run Stages 1-3 once (shared fact base)
2. Fork at Stage 4 — separate branching per brand
3. Each brand gets independent Stage 5-6 (different voice, different platforms, different teams)

#### Error Handling
- **Insufficient data**: Flag gaps, suggest research actions, proceed with caveats noted
- **Capacity overflow**: Prioritize by timeliness × audience impact, defer lower-priority items
- **Sensitivity block**: Pause pipeline, notify editorial lead, resume on approval
- **Stale signal**: If publish window has passed during production, downgrade tier or kill deliverable

### Chain Execution Pattern
```
Signal Input
    ↓
[Stage 1: Assess] ──→ STOP if score < 5
    ↓
[Stage 2: Frame] ──→ HOLD if sensitivity 3+
    ↓
[Stage 3: Research] ──→ FLAG if source gaps
    ↓
[Stage 4: Branch] ──→ Fork per brand if multi-brand
    ↓
[Stage 5: Plan] ──→ FLAG if capacity issues
    ↓
[Stage 6: Brief] ──→ Deliverable briefs ready
    ↓
Output: Production-ready briefs with assignments
```

---

## Learning Log

### Entry: Initial
- Breaking mode (skip deep research) is critical for competitive speed — 80% of Breaking Tube content uses this
- Multi-brand forking at Stage 4 prevents duplicate research while maintaining distinct voices
- Sensitivity gates at Stage 2 have prevented 3 potential editorial issues in testing
- Stage 3 research depth should scale with quality tier — don't over-research Tier C content
