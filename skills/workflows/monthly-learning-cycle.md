# Monthly Learning Cycle

## Module
Workflow

## Trigger
- Automated: First day of each month (covers previous month)
- Manual: Admin triggers via dashboard or API

## Inputs
- `periodStart`: Start of the learning period (ISO date)
- `periodEnd`: End of the learning period (ISO date)

## Instructions

You are the Monthly Learning Cycle Orchestrator. You coordinate the end-to-end process of analyzing content performance, scoring skills, updating learning logs, and generating the monthly learning report.

### Workflow Stages

#### Stage 1: Data Collection
- Pull all SkillExecution records for the period
- Pull all ContentPerformance records for the period
- Pull all StrategyTest records (active and completed)
- Pull audience metrics from platform APIs (when available)
- **Duration**: Automated, ~30 seconds

#### Stage 2: Performance Attribution
- Execute `analytics/performance/performance-attribution.md` for each content piece
- Map performance to individual skills used during creation
- Identify skill combinations that consistently outperform
- **Skill**: `analytics/performance/performance-attribution.md`

#### Stage 3: Skill Scoring
- Compute aggregate scores for each skill based on attributed performance
- Calculate trend (improving/stable/declining) by comparing first half vs second half
- Assign health category (star/solid/variable/struggling/untested)
- **Skill**: `analytics/feedback/skill-performance-scoring.md`

#### Stage 4: Sentiment Analysis
- Analyze top-performing content for audience sentiment patterns
- Identify themes in positive and negative feedback
- Map sentiment to specific skills
- **Skill**: `analytics/feedback/sentiment-feedback-loop.md`

#### Stage 5: Revenue Attribution
- Connect content performance to revenue generation
- Calculate revenue per skill, per brand, per platform
- Identify highest-ROI skills
- **Skill**: `analytics/revenue/revenue-attribution.md`

#### Stage 6: Learning Log Updates
- Write updated learning entries to each scored skill
- Update SkillLearningLog database records
- Flag struggling skills for human review
- Append performance data to skill markdown files

#### Stage 7: Strategy Test Management
- Close completed tests (end date <= period end)
- Evaluate closed tests for conclusive results
- Propose new tests based on skill performance patterns
- **Skill**: `analytics/performance/ab-test-framework.md`

#### Stage 8: Report Generation
- Compile all data into comprehensive monthly report
- Executive summary, skill health, content performance, tests, audience, revenue
- Surface to Admin dashboard
- **Skill**: `analytics/feedback/learning-cycle-report.md`

### Completion Criteria
- All skill learning logs updated
- Monthly report generated and stored
- Completed tests evaluated
- Struggling skills flagged for review
- Event emitted: `learning_cycle.completed`

### Error Handling
- If a stage fails, log the error and continue to next stage
- Partial results are better than no results
- Flag any failed stages in the report

## Learning Log
<!-- Auto-updated by the learning loop -->
