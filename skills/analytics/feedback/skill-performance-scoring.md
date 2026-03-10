# Skill: Skill Performance Scoring
## Module: hoccr
## Trigger: Content performance data attributed (after performance-attribution runs)
## Inputs: attribution_data, skill_execution_history, content_performance_records
## Outputs: skill_scores, trending_skills, underperforming_skills, revision_recommendations
## Dependencies: analytics/performance/performance-attribution.md
## Scripts: none

---

## Instructions

You are the Skill Performance Scoring skill. You evaluate how well each skill file in the ecosystem is performing based on the outcomes of content that used it.

### Scoring Methodology

For each skill that was used in producing content:

1. **Collect all content that used this skill** in the scoring period
2. **Get each content piece's performance score** from attribution data
3. **Calculate the skill's contribution score** — weighted by how central the skill was:
   - Primary skill (e.g., hook-engineering for hook quality): full weight
   - Supporting skill (e.g., topic-selection for overall piece): 50% weight
   - Contextual skill (e.g., brand identity loaded as context): 25% weight

4. **Compute aggregate metrics:**
   - Average performance score of content using this skill
   - Trend: improving, stable, or declining over last 4 weeks
   - Consistency: standard deviation of scores (low = reliable, high = variable)
   - Sample size: number of content pieces using this skill

### Skill Health Categories

| Category | Criteria | Action |
|----------|----------|--------|
| `star` | Avg score ≥ 8.0, consistent, improving | Protect — don't change what's working |
| `solid` | Avg score 6.0-7.9, consistent | Maintain, minor tweaks welcome |
| `variable` | Avg score 5.0-7.9, high variance | Investigate — why inconsistent? |
| `struggling` | Avg score < 5.0 OR declining trend | Priority revision needed |
| `untested` | < 3 executions in period | Need more data before scoring |

### Revision Recommendations

For `struggling` or `variable` skills, generate specific recommendations:
- What patterns correlate with high-performing uses of this skill?
- What patterns correlate with low-performing uses?
- Specific instruction changes to try
- A/B test suggestions

### Output Format
```json
{
  "scoringPeriod": { "start": "2026-03-01", "end": "2026-03-15" },
  "skillScores": [
    {
      "skillPath": "narrative/voice/hook-engineering.md",
      "avgScore": 8.4,
      "trend": "improving",
      "consistency": 0.85,
      "sampleSize": 12,
      "health": "star",
      "topPattern": "Data-specific hooks with currency/numbers",
      "bottomPattern": "Question-format hooks for geopolitical content",
      "revision": null
    },
    {
      "skillPath": "distribution/cross-platform-scheduling.md",
      "avgScore": 5.2,
      "trend": "declining",
      "consistency": 0.62,
      "sampleSize": 8,
      "health": "struggling",
      "topPattern": "Tuesday 6PM IST publishes",
      "bottomPattern": "Weekend morning publishes",
      "revision": "Update optimal time windows — current rules don't account for IST prime time shift"
    }
  ],
  "summary": {
    "totalSkillsScored": 15,
    "stars": 3,
    "solid": 7,
    "variable": 2,
    "struggling": 2,
    "untested": 1
  }
}
```

---

## Learning Log

### Entry: Initial
- Minimum 3 executions before scoring a skill — avoid overreacting to small samples
- Hook engineering skill has been the most consistent performer in early testing
- Distribution timing skills need the most revision — they were written with US audience assumptions
