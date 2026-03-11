# Skill: Attention Grabbing
## Module: yantri
## Trigger: Content needs maximum initial engagement
## Inputs: narrative_arc, platform, audience_profile, content_type
## Outputs: attention_strategies, scroll_stoppers, retention_techniques
## Dependencies: narrative/voice/hook-engineering.md
## Scripts:

---

## Instructions

Beyond the hook — this skill covers attention retention throughout the entire piece.

### Scroll Stoppers (First 1-3 Seconds)
- **Visual disruption**: Bold text, unexpected image, movement
- **Audio disruption**: Voice change, sound effect, silence then speech
- **Information disruption**: A surprising stat or claim on screen before speaking
- For reels/shorts: The first frame must have text overlay AND movement

### Retention Techniques by Timestamp

**0-30 seconds**: Promise of value
- Tell the audience exactly what they'll learn: "By the end of this, you'll understand why..."
- Don't tease — explicitly promise

**2-4 minutes**: The "Dip Zone"
- 40% of viewers leave here. Combat with:
  - New visual element (switch from talking head to graphic)
  - A mini-revelation: "But here's where it gets interesting..."
  - A question directed at the viewer: "Think about this..."

**5-8 minutes**: The "Commitment Zone"
- Viewers who stay past 5 minutes usually finish. Reward them:
  - Deliver the best insight here
  - Use the strongest data point
  - This is where your unique angle pays off

**Final 60 seconds**: The "Share Trigger"
- Give them something quotable — a one-line takeaway
- End card should appear with clear CTA
- Don't fade out — end with energy

### Platform-Specific Attention Rules

**YouTube**: Thumbnail + title + first 3 seconds are 80% of the battle. Retention curve is everything.

**X/Twitter**: First 7 words of tweet 1. If they don't stop scrolling, nothing else matters. Use image/video in first tweet.

**Instagram**: The cover image/first frame of reel. Must work as a standalone visual. Text must be readable at thumbnail size.

**LinkedIn**: First 2 lines before "see more" fold. Front-load the insight.

### Output Format
```json
{
  "scrollStopper": { "technique": "Bold stat text overlay + zoom", "platform": "youtube" },
  "retentionPoints": [
    { "timestamp": "3:00", "technique": "Visual switch to data graphic" },
    { "timestamp": "7:00", "technique": "Key revelation — strongest data point" }
  ],
  "shareTrigger": "One-line quotable takeaway for the ending"
}
```

---

## Learning Log

### Entry: Initial
- Text overlay on first frame increases scroll-stop rate by 30% on Instagram
- Videos that promise value in first 15 seconds have 25% higher overall retention
- The 3-minute visual switch is the single highest-impact retention technique
