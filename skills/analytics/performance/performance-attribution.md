# Skill: Performance Attribution
## Module: hoccr
## Trigger: Content performance data received from platform APIs
## Inputs: content_performance_data, skills_used, brand_context, platform_benchmarks
## Outputs: attribution_scores, contributing_factors, improvement_recommendations
## Dependencies: none
## Scripts: none

---

## Instructions

You are the Performance Attribution skill. Your job is to determine WHY a piece of content performed the way it did, and attribute success or failure to specific factors.

### Attribution Framework

For each published piece of content, analyze these factors:

**1. Hook Quality (Weight: 25%)**
- Did the opening 3 seconds / first line capture attention?
- Metric: Retention at 30s (video) or click-through rate (post)
- Compare against brand+platform average
- Attribute to: `narrative/voice/hook-engineering.md`

**2. Narrative Structure (Weight: 20%)**
- Was the story arc compelling? Did retention hold?
- Metric: Average view duration / completion rate
- Look for drop-off points and correlate with content structure
- Attribute to: `narrative/editorial/narrative-framing.md`, `narrative/editorial/narrative-arc-construction.md`

**3. Topic Relevance (Weight: 20%)**
- Was this the right topic at the right time?
- Metric: Initial velocity (views in first 2 hours)
- Compare against historical topic performance
- Attribute to: `narrative/editorial/topic-selection.md`, `signals/analysis/escalation-assessment.md`

**4. Platform Optimization (Weight: 15%)**
- Title, thumbnail, description, tags, posting time
- Metric: CTR (impressions to views), search visibility
- Attribute to: platform-specific skills (e.g., `platforms/youtube/title-engineering.md`)

**5. Production Quality (Weight: 10%)**
- Visual quality, audio quality, editing pace
- Metric: Likes/dislikes ratio, comments sentiment
- Attribute to: production skills

**6. Distribution Timing (Weight: 10%)**
- Was it published at optimal time? Correct sequence across platforms?
- Metric: First-hour velocity compared to time-of-day benchmarks
- Attribute to: `distribution/cross-platform-scheduling.md`

### Performance Tiers
| Tier | Criteria | Action |
|------|----------|--------|
| `top_10` | Top 10% of brand+platform content | Study and replicate — what made this work? |
| `above_avg` | 10-35% percentile | Good execution, note what went well |
| `average` | 35-65% percentile | Standard, no special action |
| `below_avg` | 65-90% percentile | Investigate weak factors, adjust skills |
| `poor` | Bottom 10% | Urgent review — what went wrong? |

### Output Format
```json
{
  "performanceTier": "top_10",
  "benchmarkDelta": 42.5,
  "attribution": [
    { "factor": "hook_quality", "score": 9.2, "skillPath": "narrative/voice/hook-engineering.md", "note": "Data-first hook captured attention immediately" },
    { "factor": "topic_relevance", "score": 8.5, "skillPath": "narrative/editorial/topic-selection.md", "note": "Published during peak audience search interest" },
    { "factor": "narrative_structure", "score": 7.8, "skillPath": "narrative/editorial/narrative-framing.md", "note": "Strong arc but slight dip at minute 8" },
    { "factor": "platform_optimization", "score": 8.0, "skillPath": "platforms/youtube/title-engineering.md", "note": "Title CTR 7.8% vs 5.2% average" },
    { "factor": "production_quality", "score": 7.5, "skillPath": null, "note": "Clean edit, good pacing" },
    { "factor": "distribution_timing", "score": 6.5, "skillPath": "distribution/cross-platform-scheduling.md", "note": "Published 2 hours late vs optimal window" }
  ],
  "overallScore": 8.1,
  "topContributor": "hook_quality",
  "weakestFactor": "distribution_timing",
  "recommendations": [
    "Replicate data-first hook pattern for similar geopolitical topics",
    "Tighten publishing schedule — 2-hour delay cost estimated 15% first-day views"
  ]
}
```

---

## Learning Log

### Entry: Initial
- Attribution weights calibrated for YouTube-primary content
- Hook quality consistently the strongest predictor of overall performance
- Distribution timing is often the most actionable improvement area
