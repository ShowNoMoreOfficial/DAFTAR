# Skill: Content Diversification
## Module: yantri
## Trigger: Content calendar planning, avoiding topic fatigue
## Inputs: recent_content_history, audience_analytics, brand_identity
## Outputs: diversification_recommendations, topic_gaps, audience_segment_coverage
## Dependencies: analytics/performance/audience-evolution-tracking.md
## Scripts:

---

## Instructions

Prevent topic fatigue by ensuring content variety across categories, formats, and audience segments.

### Diversification Rules

**Topic Balance** (per month):
- 40% core topics (what the brand is known for — geopolitics, economics)
- 30% adjacent topics (technology, science, culture — with brand angle)
- 20% audience requests (trending topics, community questions)
- 10% experimental (new formats, new topics, creative pieces)

**Format Balance** (per week):
- 2-3 long-form YouTube videos
- 3-5 YouTube Shorts
- Daily X/Twitter posts
- 3-4 Instagram carousels/reels
- 1-2 LinkedIn posts

**Tone Balance**: Not every piece should be heavy/analytical
- Mix serious analysis with lighter "explainer" content
- Include occasional positive stories alongside critical analysis
- Breaking Tube can be more playful; The Squirrels stays measured but can vary intensity

### Topic Fatigue Signals
- Declining view counts on a topic you've covered 3+ times in 2 weeks
- Comments saying "not this again" or "when will you cover X?"
- Audience retention dropping on subsequent videos about the same topic
- If detected: rotate to different topic for at least 1 week, then return with a fresh angle

### Output Format
```json
{
  "topicDistribution": { "core": 45, "adjacent": 28, "audience": 18, "experimental": 9 },
  "gaps": ["Haven't covered technology in 2 weeks", "No positive story this month"],
  "recommendations": ["Cover India's space program — adjacent topic, high audience interest"],
  "fatigue_warnings": ["4th video on Iran-Israel this week — consider pausing"]
}
```

---

## Learning Log

### Entry: Initial
- 3 videos on the same topic in one week shows diminishing returns
- "Experimental" content occasionally breaks out and opens new audience segments
- Audience requests (polls, comments) are a reliable source of high-engagement topics
