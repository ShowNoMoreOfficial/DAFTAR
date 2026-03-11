# Skill: Demographic Targeting
## Module: yantri
## Trigger: Content optimization, choosing platform-specific approach
## Inputs: audience_analytics, brand_identity, content_type, platform
## Outputs: demographic_focus, messaging_adjustments, platform_priorities
## Dependencies: brand/identity/{brand}/audience.md
## Scripts:

---

## Instructions

Use audience demographic data to optimize content delivery and messaging.

### Known Audience Profiles

**The Squirrels (YouTube)**:
- 70% male, 30% female
- 25-45 age bracket dominant
- 60% India (metro cities), 25% US/UK/Canada (diaspora), 15% other
- Education: College-educated, many professionals
- Peak watch time: 6-10 PM IST, weekends higher
- Device: 65% mobile, 35% desktop

**Breaking Tube (YouTube)**:
- 80% male, 20% female
- 22-40 age bracket
- 85% India (Hindi belt + metros), 10% diaspora, 5% other
- Education: Mixed — college students to working professionals
- Peak watch time: 7-11 PM IST
- Device: 80% mobile

### Platform Demographic Adjustments
- **YouTube**: Optimize thumbnail text for mobile readability (large font, high contrast)
- **X/Twitter**: Younger, more politically active, more likely to engage/argue
- **Instagram**: Youngest audience, visual-first, shorter attention span
- **LinkedIn**: Professionals 28-50, B2B angles, industry implications

### Messaging Adjustments
- Metro audience: More sophisticated framing, global context, English comfortable
- Tier 2/3 cities: Hinglish helps, local impact angles, relatable analogies
- Diaspora: "What this means for NRIs" angle, nostalgia + relevance mix
- Female audience: Often underserved by political content — inclusive framing, not tokenizing

### Output Format
```json
{
  "primaryDemographic": { "age": "25-35", "location": "Indian metros", "education": "graduate" },
  "messagingAdjustments": ["Use India-specific economic data", "Mobile-optimized visuals"],
  "platformPriority": ["youtube", "x", "instagram"],
  "inclusionNotes": ["Include diaspora perspective", "Gender-inclusive language"]
}
```

---

## Learning Log

### Entry: Initial
- Diaspora audience (US/UK) has 3x higher engagement rate per viewer
- Mobile optimization is non-negotiable — 65-80% of views are mobile
- Female audience share increases on economic topics with household-impact framing
