# Skill: Timeliness Optimizer
## Module: yantri
## Trigger: Coverage decision made, determining production urgency
## Inputs: signal_velocity, competitor_timing, platform_analytics, production_capacity
## Outputs: publish_window, production_deadline, priority_level
## Dependencies: signals/analysis/narrative-velocity-detection.md
## Scripts:

---

## Instructions

Determine the optimal publish window — too early means incomplete, too late means irrelevant.

### Timeliness Categories

**Immediate (0-4 hours)**: Breaking news, fast-moving events
- Deliverable: Quick take video (5-8 min) + tweets
- Quality bar: 80% — speed matters more than polish
- Decision: Can we add value beyond what's already out there in 4 hours?

**Same-day (4-12 hours)**: Developing stories, reactions to events
- Deliverable: Quick take or short explainer + thread + carousel
- Quality bar: 90% — balance speed and quality
- Decision: Is our angle strong enough to compete with faster publishers?

**Next-day (12-36 hours)**: Analysis pieces, deep dives
- Deliverable: Full explainer video + multi-platform package
- Quality bar: 95% — depth is our advantage
- Decision: Will the audience still care tomorrow? (Almost always yes for analysis)

**Scheduled (2-7 days)**: Evergreen analysis, documentary-style
- Deliverable: Premium content package
- Quality bar: 100% — this is showcasing capability
- Decision: Is this topic still relevant in a week?

### Velocity-Based Decision Matrix

| Signal Velocity | Competitor Coverage | Our Action |
|----------------|-------------------|------------|
| Exploding (>10K/hr) | Heavy | Quick take in 2-4 hrs with unique angle |
| High (1-10K/hr) | Moderate | Same-day explainer, focus on depth |
| Medium (100-1K/hr) | Light | Next-day deep dive — we can own this |
| Low (<100/hr) | Minimal | Schedule for optimal publish time |

### Capacity Check
Before committing to a deadline:
- Check team availability via PMS
- If no editor available for immediate, shift to same-day
- Never promise immediate if quality will suffer below 80%

### Output Format
```json
{
  "timeliness": "same_day",
  "publishWindow": { "earliest": "2026-03-10T14:00:00", "latest": "2026-03-10T22:00:00" },
  "productionDeadline": "2026-03-10T18:00:00",
  "priorityLevel": "high",
  "qualityBar": 0.9,
  "reasoning": "High velocity but moderate competitor coverage — our depth will differentiate"
}
```

---

## Learning Log

### Entry: Initial
- Next-day explainers consistently outperform rushed same-day content for The Squirrels
- Breaking Tube benefits more from speed — their audience wants "first take" content
- Tuesday/Thursday 6PM IST are peak publish times for YouTube (to be validated)
