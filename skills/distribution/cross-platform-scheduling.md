# Skill: Cross-Platform Scheduling
## Module: relay
## Trigger: Content scheduling across platforms, posting time optimization
## Inputs: deliverables[], brand_slug, platform_calendars[], audience_timezone_data
## Outputs: schedule[], optimal_times, conflict_alerts, posting_queue
## Dependencies: brand/identity/{brand_slug}/platforms.md, distribution/content-sequencing.md, distribution/release-cadence-management.md
## Scripts:

---

## Instructions

Schedule content across all platforms at optimal times, avoiding conflicts and maximizing audience reach.

### Optimal Posting Times by Platform

#### The Squirrels
| Platform | Best Times (IST) | Frequency |
|---|---|---|
| YouTube (long-form) | 7 PM | 3-4x/week |
| YouTube Shorts | 12 PM, 3 PM, 7 PM | 5-7x/week |
| X/Twitter | 8-10 AM, 12-2 PM, 7-10 PM | 5-8 posts/day |
| Instagram (Reels) | 12 PM, 6 PM | 1-2x/day |
| Instagram (Stories) | Throughout day | 4-6x/day |
| LinkedIn | 8-10 AM Tue-Thu | 3-5x/week |

#### Breaking Tube
| Platform | Best Times (IST) | Frequency |
|---|---|---|
| YouTube (long-form) | 7 PM | 4-5x/week |
| YouTube Shorts | 12 PM, 3 PM, 7 PM | 7-10x/week |
| X/Twitter | 8-10 AM, 12-2 PM, 7-10 PM | 8-12 posts/day |
| Instagram (Reels) | 12 PM, 6 PM | 1-2x/day |
| Instagram (Stories) | Throughout day, heavy during events | 5-8x/day |

### Scheduling Rules

#### Cross-Platform Coordination
1. **YouTube first**: YouTube long-form is always the primary release — all other platforms support it
2. **Stagger releases**: Don't publish on all platforms simultaneously — sequence for maximum impact
3. **No platform cannibalization**: Don't post the same content at the same time on competing platforms
4. **Buffer between posts**: Minimum 30 minutes between posts on the same platform

#### Breaking News Override
When breaking news hits, normal schedule is suspended:
1. **X/Twitter**: React immediately (within 10 minutes)
2. **Instagram Stories**: Quick reaction within 30 minutes
3. **YouTube**: Quick take ASAP (target under 4 hours from event)
4. **All other scheduled content**: Delay by 24 hours (don't compete with your own breaking content)

### Scheduling Conflicts

#### Conflict Types
- **Self-competition**: Two pieces of your content releasing within 2 hours on same platform
- **Platform event**: Major platform event (YouTube algorithm update, X outage)
- **External event**: National holiday, major news event (can boost or suppress your content)
- **Cross-brand**: Both brands publishing similar content at similar times

#### Resolution Priority
1. Higher quality tier content gets the preferred slot
2. More time-sensitive content gets priority
3. Primary platform (YouTube) gets priority over secondary platforms
4. If equal priority, the first-scheduled content keeps the slot

### Timezone Considerations
- **Primary audience**: IST (India Standard Time) — schedule around Indian peaks
- **Diaspora**: US/UK time zones — some content can be scheduled for their prime time
- **Weekend adjustments**: Weekend engagement patterns differ — test and adjust
- **Festival/holiday schedules**: Reduce posting during major Indian holidays (lower engagement)

### Scheduling Tools Integration
- Relay module manages the posting queue
- Each scheduled post shows: platform, time, content preview, brand, status
- Calendar view shows all brands × all platforms in one view
- Alerts for: scheduling conflicts, missed posting windows, capacity issues

---

## Learning Log

### Entry: Initial
- YouTube 7 PM IST consistently delivers highest Day 1 views for both brands
- Staggered posting (YouTube → X 2h later → Instagram next morning) increases total reach by 25%
- Breaking news override that delays scheduled content prevents self-competition
- Weekend engagement drops 20% on LinkedIn but increases 10% on YouTube
