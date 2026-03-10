# Skill: Release Cadence Management
## Module: relay
## Trigger: Posting frequency planning, cadence optimization, burnout prevention
## Inputs: brand_slug, platform_calendars[], team_capacity, content_backlog
## Outputs: cadence_config, weekly_targets, capacity_alerts, cadence_health_score
## Dependencies: brand/identity/{brand_slug}/platforms.md, production/automation/production-capacity-matching.md
## Scripts:

---

## Instructions

Manage posting cadence across all platforms to maintain consistency without overloading the audience or the team.

### Cadence Targets by Brand

#### The Squirrels
| Platform | Minimum | Optimal | Maximum |
|---|---|---|---|
| YouTube (long-form) | 2/week | 3-4/week | 5/week |
| YouTube Shorts | 3/week | 5-7/week | 10/week |
| X/Twitter (tweets) | 3/day | 5-8/day | 12/day |
| X/Twitter (threads) | 1/week | 2-3/week | 4/week |
| Instagram (Reels) | 3/week | 5-7/week | 10/week |
| Instagram (Stories) | 2/day | 4-6/day | 10/day |
| LinkedIn | 2/week | 3-5/week | 7/week |

#### Breaking Tube
| Platform | Minimum | Optimal | Maximum |
|---|---|---|---|
| YouTube (long-form) | 3/week | 4-5/week | 7/week |
| YouTube Shorts | 5/week | 7-10/week | 14/week |
| X/Twitter (tweets) | 5/day | 8-12/day | 15/day |
| X/Twitter (threads) | 1/week | 2-3/week | 5/week |
| Instagram (Reels) | 3/week | 5-7/week | 10/week |
| Instagram (Stories) | 3/day | 5-8/day | 15/day |

### Cadence Rules

#### Consistency Over Volume
- Regular posting at a sustainable pace beats bursts followed by silence
- The algorithm rewards consistency — missing days hurts more than posting extra
- Audience builds habits around predictable schedules

#### Platform-Specific Rules
- **YouTube**: Don't exceed 1 long-form video per day (videos compete with each other)
- **YouTube Shorts**: Can post 2-3/day without competition — different feed
- **X/Twitter**: Space tweets 30+ minutes apart — don't flood timelines
- **Instagram**: Don't post more than 2 feed posts/day (algorithm penalizes)
- **LinkedIn**: 1 post/day maximum — more gets penalized

#### Breaking News Exceptions
During major events:
- X/Twitter cadence can double (real-time updates expected)
- Instagram Stories can increase significantly
- YouTube: Push one extra video but not at the expense of tomorrow's scheduled content
- LinkedIn: Maintain normal cadence (professional audience doesn't expect real-time)

### Cadence Health Score

Calculate weekly:
```
Cadence Health = (Actual Posts / Target Posts) × 100

90-110%: Healthy — on target
70-89%:  Warning — below target, investigate capacity
>110%:   Over-posting — risk of audience fatigue
<70%:    Critical — content gap, audience may disengage
```

### Team Capacity Alignment
- Map cadence targets to production capacity
- If optimal cadence requires more content than team can produce:
  1. Increase repurposed content ratio
  2. Use more Tier B/C production (faster, less polish)
  3. Reduce cadence target to sustainable level
  4. NEVER sacrifice quality for cadence — better to post less than post bad content

### Seasonal Adjustments
- **Election periods**: Increase cadence by 30-50% (audience demand spikes)
- **Festival periods**: Decrease cadence by 20-30% (lower engagement)
- **Summer/vacation**: Maintain minimum cadence (don't go silent)
- **Year-end**: Evergreen content fills gaps when news slows down

---

## Learning Log

### Entry: Initial
- Missing 2+ consecutive days on YouTube drops the next video's Day 1 views by 25%
- Posting above maximum cadence doesn't increase total views — it dilutes per-video performance
- Consistency at minimum cadence outperforms inconsistency at optimal cadence
- Team burnout from over-cadence leads to quality drops that take 2-3 weeks to recover from
