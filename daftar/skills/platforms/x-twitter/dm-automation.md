# Skill: X/Twitter DM Automation
## Module: relay
## Trigger: DM campaign setup, automated welcome messages, lead nurturing
## Inputs: brand_slug, campaign_type, trigger_events[], message_templates[]
## Outputs: dm_sequences[], automation_rules, compliance_check
## Dependencies: brand/identity/{brand_slug}/identity.md, platforms/x-twitter/algorithm-awareness.md
## Scripts:

---

## Instructions

Set up and manage automated DM sequences for audience nurturing, content distribution, and community building — while staying within X/Twitter's rules.

### DM Use Cases

#### 1. Welcome Message
- Auto-send when a new user follows
- Keep brief, warm, and useful — not salesy
- Squirrels: "Thanks for following! We break down India's biggest stories with data. Our most popular analysis: [link]"
- Breaking Tube: "Welcome! Sabse pehle khabar, sabse sahi analysis. Aaj ki latest video: [link]"

#### 2. Content Alert
- Notify opted-in followers about new high-priority content
- Only for Tier S/A content — don't spam DMs for every video
- Maximum 1-2 DM blasts per week
- Must have explicit opt-in (don't mass-DM followers)

#### 3. Poll/Survey Follow-up
- After someone participates in a poll, DM with deeper analysis
- "You voted [option] — here's the detailed breakdown: [link]"
- Creates 1:1 relationship from public engagement

#### 4. Collaboration Outreach
- Reach out to relevant accounts for cross-promotion
- Personalized messages only — no template blasts
- Reference their specific work before asking for anything

### Automation Rules

#### Volume Limits (Stay Safe from Bans)
- **Welcome DMs**: Maximum 50/day (X's rate limits)
- **Broadcast DMs**: Maximum 100/day, spread over 4+ hours
- **Response DMs**: No limit on replying to incoming DMs
- Cool-down: If any DM gets reported as spam, pause all automation for 48 hours

#### Compliance
- Never send unsolicited promotional DMs to non-followers
- Include opt-out option in every automated DM: "Reply STOP to unsubscribe"
- Don't automate DMs that pretend to be personal conversations
- Log all DM automation in an audit trail

### Message Crafting Rules
- Under 280 characters — respect the format
- One link maximum per DM
- Personalize where possible (use display name)
- No attachments in automated DMs (often get flagged)
- Match brand voice (formal for Squirrels, Hinglish for Breaking Tube)

### Metrics to Track
- Open rate (% of DMs read)
- Click rate (% clicking included links)
- Unsubscribe rate (% replying STOP)
- Report rate (% marking as spam — keep under 0.1%)

---

## Learning Log

### Entry: Initial
- Welcome DMs with a link to "best of" content get 35% click rate
- DM blasts more than 2x/week see unsubscribe rates spike 3x
- Personalized DMs (using display name) get 20% higher open rate
