# Skill: Narrative Arc Construction
## Module: yantri
## Trigger: Topic selected for coverage, angle decided
## Inputs: fact_dossier, angle, brand_voice, platform, audience_profile
## Outputs: narrative_structure, section_outline, key_beats
## Dependencies: narrative/editorial/topic-selection.md, narrative/research/fact-dossier-building.md
## Scripts:

---

## Instructions

You construct the narrative arc — the structural backbone of any content piece. Every great piece of content follows a rhythm: hook, tension, insight, resolution.

### Arc Templates by Content Type

**Explainer Arc (10-15 min)**
1. **Hook** (0:00-0:15) — Data-first or statement hook that creates curiosity
2. **Context** (0:15-2:00) — What happened? Quick factual grounding
3. **The Real Story** (2:00-5:00) — The angle: what most people are missing
4. **Evidence** (5:00-8:00) — Data, expert quotes, historical parallels
5. **Implications** (8:00-11:00) — What this means for the audience
6. **The Bigger Picture** (11:00-13:00) — Connect to larger trends
7. **Conclusion** (13:00-14:00) — Clear takeaway, not wishy-washy "only time will tell"

**Quick Take Arc (5-8 min)**
1. **Hook** (0:00-0:10) — Bold statement or surprising data
2. **What Happened** (0:10-1:30) — Facts, fast
3. **Why It Matters** (1:30-4:00) — The angle, the analysis
4. **What Happens Next** (4:00-5:30) — Predictions or implications
5. **Sign-off** (5:30-6:00) — Call to action or thought-provoking closer

**Thread Arc (X/Twitter)**
1. Tweet 1: Hook + summary (this is the most important tweet)
2. Tweets 2-3: Context — what happened
3. Tweets 4-6: The angle — your unique take
4. Tweets 7-8: Evidence and data
5. Tweet 9: Implications for the audience
6. Tweet 10: Conclusion + engagement prompt

**Carousel Arc (Instagram/LinkedIn)**
1. Slide 1: Hook headline + striking visual
2. Slide 2: "Here's what happened"
3. Slides 3-6: Key points, one per slide, with data visualization
4. Slide 7: "Why this matters for you"
5. Slide 8: Takeaway + CTA (save/share)

### Construction Rules
- Every arc must have tension — a question the audience needs answered
- Never front-load all the good stuff; distribute value throughout
- The midpoint should have a revelation or twist that re-engages attention
- End with a clear position, not ambiguity (unless the brand voice specifically calls for nuance)
- Each section should have a clear "reason to keep watching/reading"

### Output Format
```json
{
  "arcType": "explainer",
  "sections": [
    { "name": "Hook", "duration": "0:00-0:15", "content_brief": "...", "key_data_point": "..." },
    { "name": "Context", "duration": "0:15-2:00", "content_brief": "...", "sources": ["..."] }
  ],
  "tensionPoint": "The audience expects X but the data shows Y",
  "revelation": "The hidden connection between A and B",
  "takeaway": "One clear sentence the audience walks away with"
}
```

---

## Learning Log

### Entry: Initial
- Arc templates derived from high-performing content analysis
- Explainer format is The Squirrels' primary content type
- Quick take is Breaking Tube's primary content type
