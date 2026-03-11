# Skill: YouTube Analytics Interpretation
## Module: relay
## Trigger: Performance review, strategy adjustment, content planning
## Inputs: channel_analytics, video_analytics[], time_period, brand_slug
## Outputs: performance_summary, actionable_insights[], strategy_recommendations
## Dependencies: brand/identity/{brand_slug}/platforms.md, analytics/performance/content-performance-tracking.md
## Scripts:

---

## Instructions

Interpret YouTube Analytics data to extract actionable insights for content strategy and production decisions.

### Key Metrics Framework

#### Tier 1 — North Star Metrics
- **Watch Time (hours)**: Total consumption — YouTube's primary ranking signal
- **Subscriber Growth (net)**: Channel health indicator
- **Revenue (if monetized)**: Business sustainability

#### Tier 2 — Content Quality Metrics
- **Average View Duration (AVD)**: How much of each video people watch
  - Target: >50% for quick takes, >40% for explainers
  - Below 30%: Content or title/thumbnail mismatch
- **Click-Through Rate (CTR)**: Impressions → clicks
  - Target: 5-10% for established channels
  - Below 3%: Title/thumbnail need work
  - Above 12%: Exceptional — study what worked
- **Engagement Rate**: (Likes + Comments + Shares) / Views
  - Target: >5% for political content

#### Tier 3 — Growth Metrics
- **Impressions**: How often YouTube shows your content
- **Traffic Sources**: Where viewers find you (search, suggested, browse, external)
- **New vs Returning Viewers**: Audience acquisition health
- **Shorts vs Long-form Performance**: Separate analysis required

### Analysis Cadence

| Review Type | Frequency | Focus |
|---|---|---|
| Video-level | Within 48 hours of publish | CTR, AVD, early engagement |
| Weekly | Every Monday | Top/bottom performers, trend patterns |
| Monthly | First week of month | Subscriber growth, watch time trends, revenue |
| Quarterly | Every 3 months | Strategy-level: what's working, what to change |

### Diagnostic Framework

#### Low CTR + High AVD
- Content is good but packaging (title/thumbnail) isn't attracting clicks
- Action: Rework titles and thumbnails, keep content approach

#### High CTR + Low AVD
- Packaging is attracting clicks but content isn't delivering
- Action: Check for title/thumbnail mismatch, improve pacing/hooks

#### Low CTR + Low AVD
- Both packaging and content need work — likely a topic/angle problem
- Action: Reconsider topic selection or completely restructure approach

#### High CTR + High AVD
- Winner. Study and replicate this pattern.
- Action: Create more content in this topic/format, update Learning Log

### Audience Retention Analysis
- **Intro spike** (first 30s): How many leave immediately — hook quality
- **Mid-video dips**: Where viewers skip — pacing issues
- **Re-watches**: Sections viewed multiple times — high-value content
- **End drop-off**: When viewers leave — optimize video length to this point

### Reporting Template
```
## Weekly Performance Report — [Brand] — Week of [Date]

### Top Performer
- Title: [video]
- Views: [n] | CTR: [n]% | AVD: [n] min ([n]%)
- Why it worked: [analysis]

### Underperformer
- Title: [video]
- Views: [n] | CTR: [n]% | AVD: [n] min ([n]%)
- Diagnosis: [issue] | Action: [fix]

### Key Trends
- [Trend 1]
- [Trend 2]

### Recommendations
- [Action 1]
- [Action 2]
```

---

## Learning Log

### Entry: Initial
- AVD is the most actionable metric — directly indicates content quality issues
- CTR benchmarks vary by topic: political breaking news 8-12%, deep analysis 4-7%
- Shorts and long-form must be analyzed separately — they have different success patterns
- Traffic source shifts (search → suggested) indicate algorithm momentum building
