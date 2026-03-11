# Skill: Quality Tier Classification
## Module: pms
## Trigger: New deliverable entering production pipeline
## Inputs: content_type, urgency, brand_identity, available_resources
## Outputs: quality_tier, production_time, resource_allocation, quality_checklist
## Dependencies: narrative/editorial/timeliness-optimizer.md
## Scripts:

---

## Instructions

Classify every deliverable into a quality tier to set appropriate expectations and resource allocation.

### Quality Tiers

**Tier S — Flagship (100% quality bar)**
- Use for: Major documentaries, brand-defining content, strategic pieces
- Production time: 5-7 days
- Resources: Full team (script, record, edit, graphics, review)
- Examples: Year-end specials, investigative pieces, viral potential content
- Frequency: 1-2 per month

**Tier A — Premium (95% quality bar)**
- Use for: Standard explainers, analysis pieces
- Production time: 3-4 days
- Resources: Script + edit + graphics, 1 review cycle
- Examples: Weekly explainers, policy analysis, market deep dives
- Frequency: 2-3 per week

**Tier B — Standard (90% quality bar)**
- Use for: Quick takes, timely analysis, trend coverage
- Production time: 1-2 days
- Resources: Script + edit, minimal custom graphics
- Examples: Breaking news takes, event reactions, quick analysis
- Frequency: 3-5 per week

**Tier C — Rapid (80% quality bar)**
- Use for: Breaking news, time-critical commentary
- Production time: 2-6 hours
- Resources: Script + record + basic edit
- Examples: Immediate reactions, live event commentary
- Frequency: As needed

### Classification Matrix

| Factor | Weight | Tier S | Tier A | Tier B | Tier C |
|--------|--------|--------|--------|--------|--------|
| Topic importance | 30% | Defining moment | Major story | Notable story | Breaking |
| Uniqueness of angle | 25% | Only we can tell this | Strong differentiation | Solid angle | Speed is the angle |
| Production complexity | 20% | Multi-location, interviews | Studio + graphics | Studio basic | Camera + script |
| Expected reach | 15% | Viral potential | Strong audience interest | Good interest | Time-dependent |
| Team availability | 10% | Full team free | Most team free | Partial team | Solo possible |

### Output Format
```json
{
  "tier": "A",
  "qualityBar": 0.95,
  "productionDays": 3,
  "resources": ["scriptwriter", "editor", "graphics_designer", "reviewer"],
  "checklist": ["Script approved", "3+ data visualizations", "Thumbnail A/B tested", "Fact-check passed"]
}
```

---

## Learning Log

### Entry: Initial
- Tier A is the optimal balance of quality and frequency for sustainable growth
- Tier C content builds authority on breaking stories but shouldn't exceed 30% of output
- Tier S content drives subscriber spikes — worth the investment 1-2x per month
