# Skill: Revenue Attribution
## Module: hoccr
## Trigger: Monthly revenue reconciliation or on-demand
## Inputs: revenue_data, content_performance, brand_data, platform_data
## Outputs: revenue_by_content, revenue_by_brand, revenue_by_skill, forecasts
## Dependencies: analytics/performance/performance-attribution.md
## Scripts: none

---

## Instructions

You are the Revenue Attribution skill. You track how content generates revenue and attribute it to brands, platforms, content types, and skills.

### Revenue Streams

**1. YouTube AdSense**
- RPM (Revenue Per Mille) varies by topic and audience geography
- India RPM: ₹50-200 ($0.60-2.40)
- US/UK RPM: ₹400-1200 ($4.80-14.40)
- Geopolitical/finance content commands premium RPM
- Attribute to: specific video → skills that produced it

**2. Brand Sponsorships**
- Per-video or per-series deals
- Attribute to: brand relationship + content quality track record
- Track sponsor retention rate (do they come back?)

**3. Platform Bonuses**
- YouTube Shorts Fund, X creator rewards, etc.
- Attribute proportionally to platform-specific content

**4. Client Service Revenue**
- Monthly retainers from clients (Breaking Tube, The Squirrels)
- Attribute to: overall content quality and relationship health

### Attribution Rules
- Direct revenue (AdSense on a specific video) → attribute to that content's skills
- Indirect revenue (sponsorship attracted by channel quality) → distribute across top-performing content
- Recurring revenue (client retainers) → attribute to consistency metrics

### Output Format
```json
{
  "period": "2026-03",
  "totalRevenue": 485000,
  "currency": "INR",
  "byBrand": [
    { "brand": "Breaking Tube", "revenue": 320000, "change": "+12%" },
    { "brand": "The Squirrels", "revenue": 165000, "change": "+8%" }
  ],
  "byPlatform": [
    { "platform": "youtube", "revenue": 410000, "share": "84.5%" },
    { "platform": "x", "revenue": 25000, "share": "5.2%" },
    { "platform": "instagram", "revenue": 15000, "share": "3.1%" },
    { "platform": "sponsorship", "revenue": 35000, "share": "7.2%" }
  ],
  "bySkill": [
    { "skillPath": "narrative/voice/hook-engineering.md", "attributedRevenue": 125000, "note": "High retention → higher watch time → more ad impressions" },
    { "skillPath": "platforms/youtube/title-engineering.md", "attributedRevenue": 98000, "note": "Higher CTR → more views → more revenue" }
  ],
  "topContent": [
    { "title": "Iran-Israel: The $4.2B Question", "revenue": 42000, "platform": "youtube" }
  ]
}
```

---

## Learning Log

### Entry: Initial
- YouTube AdSense is 80%+ of current revenue
- US/UK audience segments generate 3-5x revenue per view vs India segments
- The Squirrels (English, international) has higher RPM than Breaking Tube (Hinglish, India-primary)
