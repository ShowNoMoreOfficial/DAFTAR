# Skill: Retargeting Frameworks
## Module: relay
## Trigger: Retargeting campaign setup, audience re-engagement
## Inputs: brand_slug, audience_segments[], campaign_objective, creative_assets[]
## Outputs: retargeting_config, audience_funnels[], creative_strategy, frequency_caps
## Dependencies: platforms/ppc/google-ads.md, platforms/ppc/meta-ads.md, brand/identity/{brand_slug}/audience.md
## Scripts:

---

## Instructions

Build retargeting campaigns that re-engage existing audience members and move them through the engagement funnel.

### Retargeting Funnel

```
Awareness (Cold)
    ↓ [First touch: saw an ad or organic content]
Interest (Warm)
    ↓ [Engaged: watched 50%+ video, visited site, liked/commented]
Consideration (Hot)
    ↓ [Deep engagement: watched multiple videos, visited multiple pages]
Conversion (Subscriber/Follower)
    ↓ [Subscribed/Followed]
Loyalty (Super Fan)
    → [Repeat viewer, commenter, sharer — nurture with exclusive content]
```

### Retargeting Audiences

#### Tier 1: Video Viewers (Highest Intent)
- **Audience**: People who watched 50%+ of any video in last 30 days
- **Message**: "You watched our analysis on [topic]. Here's the follow-up."
- **Goal**: Drive subscription/follow
- **Frequency cap**: 3x per week

#### Tier 2: Engagers (Medium Intent)
- **Audience**: People who liked, commented, or shared content in last 60 days
- **Message**: "New analysis you'll want to see" — promote latest content
- **Goal**: Drive views, deepen engagement
- **Frequency cap**: 2x per week

#### Tier 3: Website Visitors (Considered Intent)
- **Audience**: People who visited website/blog in last 30 days
- **Message**: "The video behind the article" — cross-platform nudge
- **Goal**: Cross-platform conversion
- **Frequency cap**: 2x per week

#### Tier 4: Lapsed Audience (Re-engagement)
- **Audience**: Past subscribers/viewers who haven't engaged in 60+ days
- **Message**: "You've been missing out — here's what's new"
- **Goal**: Re-activation
- **Frequency cap**: 1x per week

### Exclusions (Critical)
- **Always exclude** existing active subscribers from subscriber-acquisition campaigns
- **Exclude** recent converters for 7 days (avoid annoying people who just subscribed)
- **Exclude** people who clicked "Not Interested" or hid your ad

### Creative Strategy by Funnel Stage

| Stage | Creative Approach | CTA |
|---|---|---|
| Warm (video viewers) | "Part 2" or follow-up to what they watched | Subscribe |
| Engaged | Best-performing content they haven't seen | Watch Now |
| Website visitors | Video content related to articles they read | Watch on YouTube |
| Lapsed | "Catch up" compilation or best-of highlight | Come Back |

### Frequency Management
- **Total brand frequency**: No more than 5 ad impressions per person per week across all campaigns
- **Per campaign**: Maximum 3 impressions per week
- **Fatigue indicator**: If CTR drops below 0.3%, reduce frequency or refresh creative
- **Burn pixel**: Add people who've seen your ad 10+ times to an exclusion list

### Cross-Platform Retargeting
- Meta Pixel on website → retarget website visitors on Instagram/Facebook
- Google Ads remarketing tag → retarget on YouTube and Display Network
- Sync audience lists across platforms (upload email lists to both)
- Sequential messaging: Show awareness ad on Meta → follow up with conversion ad on YouTube

### Budget Allocation for Retargeting
- Retargeting campaigns should be 20-30% of total ad budget
- Lower CPA than prospecting (audience already knows you)
- Higher ROAS than prospecting (warmer audience)
- Scale retargeting pools by investing in top-of-funnel content (grows the retargetable audience)

---

## Learning Log

### Entry: Initial
- Retargeting video viewers (50%+ watch time) converts at 3x the rate of interest-based targeting
- Frequency caps are critical — uncapped retargeting increases unsubscribe/unfollow rate by 40%
- Sequential cross-platform retargeting (Meta awareness → YouTube conversion) has lowest overall CPA
- Lapsed audience re-engagement campaigns recover 15-20% of inactive viewers at low cost
