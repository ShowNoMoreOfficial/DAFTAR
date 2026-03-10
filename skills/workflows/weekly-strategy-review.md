# Skill: Weekly Strategy Review Workflow
## Module: daftar
## Trigger: End of week, weekly review meeting
## Inputs: week_start_date, brand_slugs[], performance_data, team_metrics
## Outputs: weekly_report, strategy_adjustments[], next_week_priorities
## Dependencies: analytics/performance/performance-attribution.md, analytics/feedback/skill-performance-scoring.md, distribution/release-cadence-management.md
## Scripts:

---

## Instructions

Conduct the weekly strategy review — analyze what worked, what didn't, and adjust strategy for the coming week.

### Weekly Review Agenda

#### 1. Performance Summary (15 min)
- Top 3 performing content pieces (by views, engagement, retention)
- Bottom 3 performing content pieces (with diagnosis)
- Platform-by-platform metrics vs targets
- Revenue summary (if applicable)

#### 2. Skill Effectiveness (10 min)
- Which skills were most used this week?
- Skill performance scores — any underperformers?
- Learning Log entries generated this week
- Any skills that need revision?

#### 3. Content Cadence Health (5 min)
- Did we hit cadence targets per platform?
- Any gaps or over-posting?
- Cadence health score per brand

#### 4. Team & Operations (10 min)
- Team velocity this week vs last week
- Bottleneck analysis — where did things slow down?
- Revision cycle count — any concerning patterns?
- Team capacity for next week

#### 5. Strategy Adjustments (10 min)
- What should we do more of? (based on top performers)
- What should we do less of? (based on underperformers)
- Any new signals/trends to act on?
- Priority topics for next week

#### 6. Action Items (5 min)
- Specific tasks for next week
- Strategy experiments to run
- Skill files to update based on learnings

### Weekly Report Format

```
## Weekly Review — [Brand] — Week of [Date]

### Performance Highlights
- Best: [Title] — [Views] views, [Retention]% retention, [Engagement] engagement
- Growth: Subscribers +[n], Followers +[n]

### Performance Concerns
- Weakest: [Title] — [Views] views — Diagnosis: [reason]
- Cadence: [Met/Missed] target on [platforms]

### Skills Report
- Most effective: [skill] — [score]
- Needs revision: [skill] — [issue]
- Learning: [key insight from this week]

### Team Health
- Velocity: [trend] vs last week
- Bottleneck: [stage] — average [n] hours in [stage]

### Next Week Priorities
1. [Priority topic/action]
2. [Priority topic/action]
3. [Priority topic/action]

### Strategy Experiments
- Test: [hypothesis] — Measure: [metric] — Duration: [timeline]
```

### GI Integration
- GI auto-generates performance summary section
- GI suggests strategy adjustments based on cross-domain patterns
- GI flags anomalies that warrant discussion
- Tier 4: GI drafts the full weekly report for DEPT_HEAD review

### Review Cadence
- **When**: Friday afternoon or Monday morning
- **Duration**: 45-60 minutes
- **Attendees**: DEPT_HEAD + senior team members
- **Output**: Shared document + action items in PMS

---

## Learning Log

### Entry: Initial
- Weekly reviews that lead to specific action items improve next-week performance by 15%
- Skill performance scoring in weekly reviews catches underperforming skills 2 weeks faster
- Teams that consistently do weekly reviews maintain 20% higher content quality scores
- GI-drafted reports save 30 minutes of manual data compilation
