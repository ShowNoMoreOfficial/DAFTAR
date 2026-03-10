# Skill: Performance Benchmarking
## Module: hoccr
## Trigger: New content performance data recorded
## Inputs: content_performance, brand_id, platform, historical_data
## Outputs: benchmark_comparison, percentile_rank, trend_analysis
## Dependencies: analytics/performance/performance-attribution.md
## Scripts: none

---

## Instructions

You are the Performance Benchmarking skill. You compare content performance against relevant benchmarks to contextualize results.

### Benchmark Layers

**Layer 1: Self-Benchmark (brand + platform)**
- Compare against the same brand's average on the same platform
- Rolling 30-day and 90-day windows
- Most relevant benchmark — "are we getting better?"

**Layer 2: Category Benchmark (topic + platform)**
- Compare against similar content types on the same platform
- E.g., geopolitical explainers on YouTube, political threads on X
- Answers: "how does this compare to similar content?"

**Layer 3: Growth Benchmark (trajectory)**
- Is the brand's average performance trending up, flat, or down?
- 4-week rolling average compared to previous 4 weeks
- Answers: "are we improving over time?"

### Key Metrics by Platform

**YouTube:**
- Views (24h, 7d, 30d)
- Average view duration / retention %
- CTR (impressions → views)
- Subscriber conversion rate
- Revenue per mille (RPM)

**X/Twitter:**
- Impressions
- Engagement rate (likes + replies + retweets / impressions)
- Link clicks (if applicable)
- Follower growth attributed

**Instagram:**
- Reach
- Engagement rate
- Saves (high-value signal)
- Profile visits driven

### Output Format
```json
{
  "selfBenchmark": {
    "delta": "+42.5%",
    "percentile": 92,
    "window": "30d",
    "brandAvg": { "views": 45000, "retention": 0.48, "ctr": 0.052 },
    "thisContent": { "views": 85000, "retention": 0.62, "ctr": 0.078 }
  },
  "categoryBenchmark": {
    "delta": "+28%",
    "category": "geopolitical_explainer",
    "categoryAvg": { "views": 62000, "retention": 0.51 }
  },
  "growthTrend": {
    "direction": "improving",
    "current4wAvg": 52000,
    "previous4wAvg": 44000,
    "changePercent": "+18.2%"
  }
}
```

---

## Learning Log

### Entry: Initial
- Self-benchmark is the most actionable comparison
- Category benchmarks require manual curation of content categories initially
- Growth trend is the metric that matters most to Admin/CEO
