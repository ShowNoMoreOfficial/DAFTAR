# Skill: Meta Ads (Instagram + Facebook)
## Module: relay
## Trigger: Meta advertising campaign setup, paid social promotion
## Inputs: brand_slug, campaign_objective, budget, target_audience, creative_assets[]
## Outputs: campaign_config, ad_sets[], audience_definitions, creative_specs
## Dependencies: brand/identity/{brand_slug}/audience.md, platforms/meta/meta-ad-skills.md
## Scripts:

---

## Instructions

Manage Meta Ads (Facebook + Instagram) for content promotion, audience growth, and brand awareness. This skill covers the technical ad setup — see `meta-ad-skills.md` for creative and strategic guidelines.

### Campaign Structure

#### Account Structure
```
Campaign (Objective)
├── Ad Set 1 (Audience A + Budget + Schedule)
│   ├── Ad 1 (Creative variant A)
│   └── Ad 2 (Creative variant B)
├── Ad Set 2 (Audience B + Budget + Schedule)
│   ├── Ad 1 (Creative variant A)
│   └── Ad 2 (Creative variant B)
└── Ad Set 3 (Lookalike Audience + Budget + Schedule)
    ├── Ad 1 (Creative variant A)
    └── Ad 2 (Creative variant B)
```

### Campaign Objectives

| Business Goal | Meta Objective | Optimization Event |
|---|---|---|
| Video views | Engagement → Video Views | ThruPlay (15s+) |
| YouTube subscribers | Traffic | Link Clicks (to YouTube) |
| Instagram followers | Engagement | Profile Visits |
| Facebook Page likes | Engagement | Page Likes |
| Website traffic | Traffic | Landing Page Views |
| Brand awareness | Awareness | Reach |

### Audience Setup

#### Custom Audiences (Retargeting)
- **Video viewers**: People who watched 50%+ of your videos (highest intent)
- **Page engagers**: People who interacted with your posts (last 90 days)
- **Website visitors**: Via Meta Pixel on your website
- **Email list**: Upload subscriber list for matching

#### Lookalike Audiences
- Base: Video viewers (50%+ watch) → 1% Lookalike (best quality)
- Base: Page engagers → 2% Lookalike (broader reach)
- Base: YouTube subscriber email list → 1% Lookalike
- Always exclude existing followers/subscribers from Lookalike targeting

#### Interest-Based Audiences
- Layer interests + demographics + geography
- The Squirrels: Economics + Data + International Relations + 25-45 + metros
- Breaking Tube: Indian Politics + Hindi News + Current Affairs + 22-40 + Hindi belt

### Ad Creative Specifications

#### Image Ads
- Size: 1080x1080 (square) or 1080x1350 (portrait for Stories/Reels)
- Text: Under 20% of image area (old rule relaxed but still impacts delivery)
- Include brand logo and clear visual hook

#### Video Ads
- Duration: 15-30 seconds (feed), 6-15 seconds (Stories/Reels)
- Aspect ratio: 1:1 (feed), 9:16 (Stories/Reels)
- Captions: Required (most users watch without sound)
- First 3 seconds: Must hook — same principles as organic content

#### Carousel Ads
- 3-5 cards minimum
- Each card should work standalone AND tell a story in sequence
- Repurpose organic carousel content as ads

### Budget & Bidding
- **Learning phase**: ₹500-1,500/day per ad set (need 50 optimization events/week to exit learning)
- **Minimum viable test**: ₹3,000/week per ad set for 7 days
- **Scaling**: Increase budget 20% per adjustment (avoid large budget jumps)
- **Bidding**: Start with lowest cost, switch to cost cap once you know target CPA

### Optimization Rules
- **Don't touch ads in learning phase** (first 3-5 days / 50 events)
- **Kill underperformers** after learning phase: CPC > ₹15, CTR < 0.5%
- **Scale winners**: If CPA meets target, increase budget gradually
- **Creative fatigue**: Refresh creative every 2-3 weeks (frequency > 3 = fatigue)
- **A/B test**: Always run 2-3 creative variants per ad set

---

## Learning Log

### Entry: Initial
- Lookalike audiences based on video viewers (50%+ watch time) are the highest-performing audience type
- Creative refresh every 2 weeks prevents frequency-driven cost increases
- Hindi-targeted ads on Meta cost 40-60% less per result than English for Indian political content
- Instagram Reels ad placement delivers highest engagement per rupee spent
