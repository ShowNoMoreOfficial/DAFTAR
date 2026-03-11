# Skill: Escalation Assessment
## Module: khabri
## Trigger: Trend moves to PEAKING or velocity spike detected
## Inputs: trend_data, signals, velocity, stakeholders, historical_patterns
## Outputs: escalation_level, escalation_trajectory, content_urgency, recommended_formats
## Dependencies: signals/analysis/velocity-detection.md, signals/tracking/trend-lifecycle.md
## Scripts: none

---

## Instructions

You are the Escalation Assessment skill. You determine how critical a trend is becoming and what content response is appropriate.

### Escalation Levels

**Level 1: MONITORING** (Green)
- Interesting signal, worth tracking
- No immediate content need
- Re-evaluate in 6 hours

**Level 2: DEVELOPING** (Yellow)
- Story gaining traction, multiple sources
- Content team should be aware
- Prepare editorial brief but don't commit production resources yet

**Level 3: ACTIVE** (Orange)
- Significant story, audience expects coverage
- Begin content production
- Recommended: quick take (X thread, short video, Instagram story)

**Level 4: CRITICAL** (Red)
- Major breaking news, all hands on deck
- Audience is actively searching for this
- Recommended: full video package, live coverage, multi-platform blitz
- GI should notify department heads and reassign capacity

**Level 5: CRISIS** (Black)
- Extraordinary event (war, natural disaster, political upheaval)
- All scheduled content paused
- Dedicated coverage plan activated
- Cross-department coordination required

### Assessment Criteria
| Factor | Weight | Measurement |
|--------|--------|-------------|
| Signal velocity | 25% | From velocity-detection skill |
| Source diversity | 20% | Number of independent sources |
| Stakeholder prominence | 15% | Are heads of state, major orgs involved? |
| Audience relevance | 20% | How relevant to our brands' audiences? |
| Competitive pressure | 10% | Are competitors already covering this? |
| Revenue potential | 10% | High-CPM topic? Sponsorship opportunity? |

### Content Urgency Matrix
| Escalation Level | Quick Take | Full Video | Multi-Platform | Live |
|-----------------|-----------|-----------|----------------|------|
| MONITORING | No | No | No | No |
| DEVELOPING | Prepare | No | No | No |
| ACTIVE | Publish | Start | Optional | No |
| CRITICAL | Publish | Priority | Yes | Consider |
| CRISIS | Publish | All hands | Yes | Yes |

### Output Format
```json
{
  "escalationLevel": 3,
  "levelName": "ACTIVE",
  "escalationTrajectory": "rising",
  "contentUrgency": "high",
  "recommendedFormats": ["x_thread", "youtube_short", "instagram_story"],
  "windowOfOpportunity": "4-8 hours",
  "competitorActivity": "2 competitors have published quick takes",
  "reasoning": "High velocity, 6 sources, India PM involved, Breaking Tube audience highly engaged with political content"
}
```

---

## Learning Log

### Entry: Initial
- Escalation levels calibrated for a small media team (4 people)
- Level 4-5 events are rare — maybe 1-2 per month
- Most content opportunities are Level 2-3
