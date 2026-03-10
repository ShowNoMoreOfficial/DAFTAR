# Skill: Learning Cycle Report
## Module: hoccr
## Trigger: End of weekly/monthly learning cycle
## Inputs: all_skill_scores, all_performance_data, strategy_test_results, period
## Outputs: learning_report, skill_updates, recommendations
## Dependencies: analytics/feedback/skill-performance-scoring.md, analytics/performance/performance-attribution.md
## Scripts: none

---

## Instructions

You are the Learning Cycle Report skill. You synthesize all performance and learning data from a period into a single actionable report for the team and the GI.

### Report Sections

**1. Executive Summary**
- Overall content performance this period vs previous
- Number of pieces published across all brands/platforms
- Top performing content (title, platform, key metric)
- Biggest improvement area
- Biggest concern

**2. Skill Ecosystem Health**
- Total skills active in the ecosystem
- Skills by health category (star, solid, variable, struggling, untested)
- Skills that improved this period
- Skills that declined this period
- New skills added or retired

**3. Strategy Test Results**
- Completed A/B tests and their conclusions
- Active tests and interim results
- Recommended new tests based on performance patterns

**4. Pattern Discovery**
New patterns detected this period:
- What content types are performing better/worse than usual?
- What time slots are shifting in effectiveness?
- What audience segments are growing/shrinking?
- What topics have untapped potential?

**5. Skill Update Recommendations**
For each skill that needs revision:
- Current version summary
- What the data says
- Specific recommended changes
- Priority (urgent, normal, low)

**6. Next Period Focus**
- Top 3 priorities for the editorial team
- Suggested strategy tests to run
- Skills to watch closely

### Report Format
```json
{
  "period": { "start": "2026-03-01", "end": "2026-03-31", "type": "monthly" },
  "executive": {
    "contentPublished": 48,
    "avgPerformanceScore": 7.2,
    "previousPeriodAvg": 6.8,
    "change": "+5.9%",
    "topContent": { "title": "...", "platform": "youtube", "views": 125000 },
    "biggestImprovement": "Hook quality across all platforms",
    "biggestConcern": "Instagram engagement rate declining 12%"
  },
  "skillHealth": {
    "total": 25,
    "stars": 4,
    "solid": 12,
    "variable": 4,
    "struggling": 3,
    "untested": 2,
    "improved": ["narrative/voice/hook-engineering.md", "platforms/youtube/title-engineering.md"],
    "declined": ["distribution/cross-platform-scheduling.md"]
  },
  "strategyTests": {
    "completed": [
      { "name": "Hook A/B", "result": "Data-first hooks win by 23%", "action": "Updated hook-engineering.md" }
    ],
    "active": [],
    "recommended": [
      { "name": "Thumbnail style test", "hypothesis": "Face-forward thumbnails outperform text-heavy", "skill": "production/support/thumbnail-strategy.md" }
    ]
  },
  "patterns": [
    "Evening publishes (6-8 PM IST) consistently outperform morning publishes for political content",
    "Explainer format overtaking quick-takes in retention metrics"
  ],
  "skillUpdates": [
    {
      "skillPath": "distribution/cross-platform-scheduling.md",
      "priority": "urgent",
      "recommendation": "Update IST prime time windows based on last 30 days of data"
    }
  ],
  "nextPeriodFocus": [
    "Double down on data-first hooks across all platforms",
    "Run thumbnail style A/B test",
    "Investigate Instagram engagement decline — possible algorithm change"
  ]
}
```

---

## Learning Log

### Entry: Initial
- Monthly reports are most useful for Admin strategic view
- Weekly mini-reports (executive summary only) for department heads
- Pattern discovery section is highest-value for editorial team
