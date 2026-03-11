# Skill: Google Ads Management
## Module: relay
## Trigger: Google Ads campaign setup, YouTube ad campaigns, search ads
## Inputs: brand_slug, campaign_objective, budget, target_audience, keywords[], creative_assets[]
## Outputs: campaign_config, ad_groups[], keyword_bids, creative_specs
## Dependencies: platforms/seo/keyword-research.md, brand/identity/{brand_slug}/audience.md
## Scripts:

---

## Instructions

Set up and optimize Google Ads campaigns for audience growth, content promotion, and brand awareness.

### Campaign Types for Media Brands

#### 1. YouTube Video Ads (Primary)
- **TrueView In-Stream**: Skippable ads before/during other videos — pay only if watched 30s+
- **TrueView Discovery**: Ads in YouTube search results and related videos
- **Bumper Ads**: 6-second non-skippable — brand awareness
- **Best for**: Driving views, subscribers, brand awareness

#### 2. Google Search Ads
- Target keywords people search for: "india economy analysis", "pakistan budget explained"
- Drive to YouTube videos or website articles
- **Best for**: Capturing active search demand

#### 3. Display Network
- Banner/image ads across Google's partner websites
- Lower intent but massive reach
- **Best for**: Retargeting (showing ads to people who've visited before)

#### 4. Performance Max
- AI-driven campaign across all Google surfaces
- Requires creative assets in multiple formats
- **Best for**: Maximizing conversions with broad targeting

### Campaign Setup

#### YouTube Video Ad Campaign
```
Campaign type: Video
Objective: Brand awareness and reach (OR) Product consideration
Budget: ₹1,000-5,000/day
Bidding: Target CPV (cost per view) — start at ₹0.50-1.00

Ad Group 1: Topic Interest Targeting
- Audience: In-market for News & Current Affairs
- Content: Politics, Economics, International Relations
- Creative: Best-performing video (first 30s must hook)

Ad Group 2: Competitor Targeting
- Placement: Specific competitor channels/videos
- Creative: "If you watch [competitor], you'll love this" angle

Ad Group 3: Keyword Targeting
- Keywords: Topic-specific search terms
- Creative: Matches keyword intent
```

### Audience Targeting

#### The Squirrels
- **Interest**: Geopolitics, Economics, Data Analysis, International Relations
- **Demographics**: 25-45, college-educated
- **Geography**: India (metros), US, UK, UAE, Singapore
- **Language**: English

#### Breaking Tube
- **Interest**: Indian Politics, Hindi News, Current Affairs
- **Demographics**: 22-40, mixed education
- **Geography**: India (Hindi belt + metros)
- **Language**: Hindi, English

### Budget Rules
- Start small: ₹1,000/day per campaign for first week (learning phase)
- Scale winners: Increase budget 20% every 3 days for well-performing ad groups
- Kill losers: If CPV > ₹2 or CTR < 1% after 5 days, pause the ad group
- Never exceed daily budget × 30 for monthly planning

### Metrics & Optimization
| Metric | Target | Action if Below |
|---|---|---|
| CPV (Cost per View) | Under ₹1.00 | Refine targeting, improve creative |
| View Rate | Above 25% | Improve first 5 seconds of creative |
| CTR (Discovery) | Above 2% | Improve thumbnail and title |
| Subscriber Cost | Under ₹20 | Adjust CTA, improve content hook |
| Earned Views | 10%+ of paid views | Content is resonating (people watch more after ad) |

### Negative Keywords
Maintain a negative keyword list to avoid irrelevant placements:
- Brand names of unrelated channels
- Irrelevant topics ("cricket", "bollywood" unless specifically relevant)
- Low-intent queries ("free download", "mod apk")

---

## Learning Log

### Entry: Initial
- YouTube TrueView Discovery ads have highest subscriber conversion rate of any Google ad format
- Competitor channel targeting (placement ads) drives highly relevant viewers at ₹0.60-0.80 CPV
- Hindi-targeted campaigns cost 50% less per view than English-targeted for Indian political content
- Earned views (organic views driven by paid viewers) often exceed paid views for quality content
