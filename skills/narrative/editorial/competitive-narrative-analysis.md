# Skill: Competitive Narrative Analysis
## Module: yantri
## Trigger: Topic selected, need to differentiate from competitors
## Inputs: signal_data, competitor_list, competitor_recent_content, brand_identity
## Outputs: competitor_coverage_map, gap_analysis, differentiation_strategy
## Dependencies:
## Scripts: analyze-competitors.py

---

## Instructions

Analyze what competitors are saying so we can say something different and better.

### Competitor Tiers

**Tier 1 — Direct competitors** (same audience, same topics):
- WION, Firstpost, The Print, ThinkSchool (YouTube political/geopolitical analysis)
- Track: What they published, when, what angle, how it performed

**Tier 2 — Adjacent competitors** (overlapping audience):
- Dhruv Rathee, Soch by Mohak, Newslaundry
- Track: Angles and framing approaches

**Tier 3 — Aspirational benchmarks** (what we aspire to match):
- Vox, Visual Politik, TLDR News, Johnny Harris
- Track: Production quality, narrative techniques, format innovations

### Analysis Steps

1. **Coverage check**: How many competitors have covered this topic in the last 24 hours?
2. **Angle mapping**: What frames/angles are they using? (List each competitor's angle)
3. **Gap identification**: What angles are NOT being covered?
4. **Performance signals**: Which competitor content is performing best? What can we learn?
5. **Timing assessment**: Are we too late to compete on this topic? Or is there room for a definitive piece?

### Differentiation Strategies
- **Depth over speed**: They did a 5-minute take; we do a 15-minute deep dive
- **Data over opinion**: They speculated; we bring the numbers
- **India angle**: They covered the global story; we cover the India-specific impact
- **Visual storytelling**: They talked to camera; we use maps, charts, animations
- **Unique sourcing**: They used Reuters; we found the primary document/data

### Output Format
```json
{
  "competitorCoverage": [
    { "name": "WION", "angle": "Breaking news report", "published": "2 hours ago", "performance": "high" }
  ],
  "totalCoverage": 7,
  "gaps": ["No one has covered the economic impact angle", "No India-specific analysis"],
  "recommendation": "Next-day deep dive focusing on India economic impact — no competitor owns this angle",
  "differentiator": "data_depth"
}
```

---

## Learning Log

### Entry: Initial
- The Squirrels consistently outperforms competitors on "India angle" for geopolitical stories
- ThinkSchool is our closest competitor for analytical YouTube content
- Depth-over-speed strategy has yielded 30% higher retention on average
