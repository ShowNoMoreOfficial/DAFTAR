# Skill: PPC Campaign Analytics
## Module: relay
## Trigger: Campaign performance review, budget optimization, reporting
## Inputs: campaign_data[], platform, date_range, brand_slug, kpis[]
## Outputs: performance_report, optimization_recommendations[], budget_reallocation
## Dependencies: platforms/ppc/google-ads.md, platforms/ppc/meta-ads.md
## Scripts:

---

## Instructions

Analyze paid advertising performance across platforms to optimize spend, identify winning strategies, and inform budget allocation.

### Metrics Framework

#### Primary KPIs (Business Metrics)
| Metric | Definition | Target Range |
|---|---|---|
| CPA (Cost per Acquisition) | Cost per subscriber/follower gained | ₹10-25 |
| ROAS (Return on Ad Spend) | Revenue generated / ad spend | 3x+ for monetized content |
| Subscriber LTV | Lifetime value of acquired subscriber | ₹50-200 (est. from ad revenue) |
| Brand lift | % increase in brand searches after campaign | 10%+ |

#### Secondary KPIs (Performance Metrics)
| Metric | Definition | Good | Bad |
|---|---|---|---|
| CPV (Cost per View) | Cost per video view | < ₹1.00 | > ₹2.00 |
| CPC (Cost per Click) | Cost per link click | < ₹10 | > ₹20 |
| CTR (Click-Through Rate) | Clicks / impressions | > 1.5% | < 0.5% |
| View Rate | Views / impressions (video) | > 25% | < 15% |
| Frequency | Avg times user saw ad | 1.5-3.0 | > 5.0 |

### Analysis Cadence

| Review | Frequency | Focus |
|---|---|---|
| Quick check | Daily (during active campaigns) | Spend pacing, major anomalies |
| Performance review | 3x/week | CPA trends, creative performance, audience analysis |
| Deep analysis | Weekly | Cross-platform comparison, budget reallocation |
| Strategic review | Monthly | ROI analysis, strategy adjustments, LTV analysis |

### Reporting Template

```
## PPC Performance Report — [Brand] — [Date Range]

### Budget Summary
- Total spend: ₹[amount]
- Platform breakdown: Google ₹[x], Meta ₹[y]
- Budget utilization: [%] of allocated budget

### Key Results
- New subscribers acquired: [n]
- Cost per subscriber: ₹[n]
- Video views generated: [n]
- Cost per view: ₹[n]

### Top Performing
- Best campaign: [name] — CPA ₹[n], [why it worked]
- Best creative: [description] — CTR [n]%, [key learning]
- Best audience: [segment] — CPA ₹[n], [insight]

### Underperforming
- Worst campaign: [name] — CPA ₹[n], [recommended action]
- Creative fatigue alert: [ad] at frequency [n], [recommend refresh]

### Recommendations
1. [Budget reallocation recommendation]
2. [Creative update recommendation]
3. [Audience adjustment recommendation]

### Budget Recommendation for Next Period
- Maintain: ₹[x] on [campaigns]
- Increase: ₹[x] on [campaigns] because [reason]
- Decrease/Pause: ₹[x] on [campaigns] because [reason]
```

### Cross-Platform Budget Allocation

#### Decision Framework
- Compare CPA across platforms (Google vs Meta)
- Shift budget toward lower-CPA platform
- But maintain minimum spend on secondary platform (don't go to zero)
- Consider attribution: Some platforms drive awareness that converts elsewhere

#### Typical Allocation for Media Brands
- **YouTube Ads (Google)**: 50-60% of budget (primary growth channel)
- **Meta (Instagram + Facebook)**: 30-40% of budget (discovery + retargeting)
- **Testing**: 10% of budget (new platforms, new strategies)

### Attribution Considerations
- Last-click attribution undervalues awareness campaigns
- A viewer might see a Meta ad, then later search on YouTube and subscribe
- Track brand search volume as a proxy for awareness campaign impact
- UTM parameters on all ad links for proper source tracking

---

## Learning Log

### Entry: Initial
- Cross-platform analysis reveals YouTube ads drive subscribers at 30% lower CPA than Meta for political content
- Creative fatigue (frequency > 3) increases CPA by 40% — refresh creatives every 2 weeks
- Hindi-targeted campaigns consistently deliver 40-60% lower CPA than English for Indian audience
- Monthly budget reallocation based on performance data improves overall ROAS by 25%
