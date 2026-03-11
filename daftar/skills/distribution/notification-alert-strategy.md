# Skill: Notification & Alert Strategy
## Module: relay
## Trigger: Content launch promotion, cross-platform teasing, audience notification
## Inputs: deliverable, brand_slug, platforms[], launch_time, promotion_window
## Outputs: notification_sequence[], teaser_content[], alert_schedule
## Dependencies: brand/identity/{brand_slug}/platforms.md, distribution/content-sequencing.md, distribution/cross-platform-scheduling.md
## Scripts:

---

## Instructions

Plan notification and teaser sequences that build anticipation and maximize Day 1 content performance.

### Notification Channels

#### Platform Notifications (Owned)
- **YouTube**: Subscriber bell notifications (automatic for subscribers)
- **YouTube Community**: Community tab post (manual — reaches non-bell subscribers)
- **Instagram**: Story with countdown sticker
- **X/Twitter**: Tweet + pinned tweet
- **Facebook**: Page post + Group post
- **LinkedIn**: Post + Newsletter notification

#### External Notifications
- **WhatsApp Status**: If brand has WhatsApp presence
- **Email/Newsletter**: For subscribers (LinkedIn Newsletter, Substack, etc.)
- **Telegram Channel**: If brand has Telegram group

### Pre-Launch Teaser Sequence

#### Tier S/A Content (Major Release)
```
T-48h: X/Twitter → Teaser tweet: "Big analysis coming Thursday"
T-24h: Instagram Story → Behind-the-scenes of research/production
T-12h: YouTube Community → "New video tomorrow at 7 PM" + preview stat
T-6h:  X/Twitter → Data teaser: Share one compelling stat from the video
T-4h:  Instagram Story → Countdown sticker set for launch time
T-2h:  X/Twitter → Thread teaser: "Tonight's analysis covers..."
T-30m: Instagram Story → "Going live in 30 minutes!"
T=0:   ALL PLATFORMS → "It's live!" with links
T+1h:  X/Twitter → Thread with key insights
```

#### Tier B/C Content (Standard Release)
```
T-4h:  YouTube Community → "New video at 7 PM"
T-2h:  X/Twitter → Teaser tweet with hook
T-1h:  Instagram Story → "Coming soon"
T=0:   YouTube publish + X/Twitter link tweet
T+2h:  Instagram Reel adaptation
```

#### Breaking News (No Teaser — Speed First)
```
T=0:   X/Twitter → Immediate reaction tweet
T+5m:  Instagram Story → Quick reaction
T+2-4h: YouTube → Quick take publish
T+0m:  X/Twitter → "Full analysis now live" with link
```

### Notification Copy by Brand

#### The Squirrels
- Professional, curiosity-driven
- "New analysis: India's semiconductor strategy has a $62B problem. Full breakdown now live."
- "Thread 🧵: The data behind tonight's video — three charts you need to see"
- Avoid: Exclamation marks, ALL CAPS, urgency language

#### Breaking Tube
- High-energy, direct, Hinglish
- "Aaj raat 7 baje — Modi ke naye faislay ka SEEDHA analysis! 🔥"
- "Video live ho gayi hai — abhi dekhiye, data se samjhiye"
- Embrace: Exclamation energy, emojis, urgency for breaking content

### Frequency Caps
- Don't send more than 1 push notification per platform per day (notification fatigue)
- Community posts: Maximum 2/day (YouTube), 1/day (Facebook)
- Stories: No cap, but space throughout the day
- X/Twitter: Maximum 3 promotional tweets per piece of content per day

### Post-Publish Notification
After publishing, the notification sequence continues:
- **T+24h**: Share a highlight or "in case you missed it" post
- **T+48h**: Quote-tweet with additional context or audience reaction
- **T+1 week**: Include in "This week's best" roundup (if applicable)

### Performance Tracking
- Track which notification channels drive the most Day 1 views
- A/B test teaser copy (data hook vs question hook vs urgency hook)
- Monitor unsubscribe/mute rates per channel — if rising, reduce frequency
- Attribute video views to notification source using UTM parameters

---

## Learning Log

### Entry: Initial
- YouTube Community posts 2-4 hours before publish increase Day 1 views by 15%
- X/Twitter teaser tweets with a data point outperform generic "new video" teasers by 3x
- Instagram countdown stickers generate 500+ profile visits per use for 100K+ accounts
- Over-notification (>3 promotional posts per content piece) causes follower fatigue — engagement drops 20%
