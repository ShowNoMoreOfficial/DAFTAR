# Skill: Monthly Learning Cycle
## Module: daftar
## Trigger: First day of each month (scheduled) or manual trigger
## Inputs: all_content_performance, all_skill_executions, all_strategy_tests, period_range
## Outputs: learning_report, skill_updates, updated_learning_logs
## Dependencies: analytics/feedback/skill-performance-scoring.md, analytics/feedback/learning-cycle-report.md, analytics/performance/performance-attribution.md, analytics/revenue/revenue-attribution.md
## Scripts: none

---

## Instructions

This is the master workflow for the monthly learning cycle. It orchestrates the full self-improvement loop: gather data → score skills → generate insights → update skill files → produce report.

### Workflow Stages

#### Stage 1: Data Collection
1. Pull all ContentPerformance records for the period
2. Pull all SkillExecution records for the period
3. Pull all completed StrategyTest results
4. Pull PostAnalytics data for published content
5. **Output**: Complete dataset for analysis

#### Stage 2: Performance Attribution
**Skill**: `analytics/performance/performance-attribution.md`

For each content piece published this period:
1. Run performance attribution
2. Score each contributing factor
3. Identify top and bottom performers
4. **Output**: Attribution data for all content

#### Stage 3: Skill Scoring
**Skill**: `analytics/feedback/skill-performance-scoring.md`

1. Aggregate attribution data by skill
2. Score each skill's effectiveness
3. Categorize skill health (star → struggling)
4. Identify trends (improving, stable, declining)
5. **Output**: Skill scorecard

#### Stage 4: Sentiment Analysis
**Skill**: `analytics/feedback/sentiment-feedback-loop.md`

1. Analyze audience feedback for top 10 content pieces
2. Extract actionable insights from comments/engagement patterns
3. Identify content opportunities from audience requests
4. **Output**: Audience sentiment summary

#### Stage 5: Revenue Attribution
**Skill**: `analytics/revenue/revenue-attribution.md`

1. Map revenue to content, brands, platforms, and skills
2. Identify highest ROI content patterns
3. **Output**: Revenue attribution report

#### Stage 6: Learning Log Updates
For each scored skill:
1. Read the skill's current Learning Log
2. Append new entry with:
   - Period covered
   - Number of executions
   - Average performance score
   - Top performing pattern
   - Bottom performing pattern
   - Specific recommendation
3. Write updated Learning Log to skill file
4. Record in SkillLearningLog database table
5. **Output**: Updated skill files

#### Stage 7: Strategy Test Management
1. Close completed tests, record conclusions
2. For `struggling` skills, auto-propose A/B tests
3. Queue new tests for next period
4. **Output**: Test management report

#### Stage 8: Report Generation
**Skill**: `analytics/feedback/learning-cycle-report.md`

1. Compile all outputs from Stages 2-7
2. Generate executive summary
3. Generate skill health dashboard data
4. Generate next-period recommendations
5. **Output**: Complete Monthly Learning Report

### Execution Pattern
```
Month Start
    ↓
[Stage 1: Collect] — gather all data
    ↓
[Stage 2: Attribute] — why did each piece perform as it did?
    ↓
[Stage 3: Score Skills] — which skills are working?
    ↓
[Stage 4: Sentiment] — what does the audience think?
    ↓
[Stage 5: Revenue] — where is the money?
    ↓
[Stage 6: Update Logs] — write learnings back to skill files
    ↓
[Stage 7: Tests] — manage strategy experiments
    ↓
[Stage 8: Report] — synthesize everything for humans
    ↓
Output: Monthly Learning Report + Updated Skill Files
```

### GI Integration
- GI presents the report to Admin with key highlights
- GI uses updated skill scores to adjust its recommendations
- GI proposes next-period priorities based on data
- Department heads get skill health for their domain

---

## Learning Log

### Entry: Initial
- Monthly cadence is right for current content volume (40-60 pieces/month)
- Weekly mini-cycles (Stages 2-3 only) can run for faster feedback
- Stage 6 (Learning Log updates) is the most critical — it's what makes the system self-improving
