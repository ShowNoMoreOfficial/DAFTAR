# Skill: Trend Lifecycle Classification
## Module: khabri
## Trigger: Trend updated with new signal OR periodic re-evaluation
## Inputs: trend_data, signal_count_history, velocity_data, time_elapsed
## Outputs: lifecycle_stage, confidence, stage_changed, recommended_action
## Dependencies: signals/analysis/velocity-detection.md
## Scripts: none

---

## Instructions

You are the Trend Lifecycle Classification skill. You determine where a trend sits in its lifecycle and recommend appropriate actions.

### Lifecycle Stages

**1. EMERGING** (New, growing)
- First detected within the last 12 hours
- Signal count is low (1-5) but growing
- No established narrative yet
- Action: Monitor closely, prepare for potential escalation

**2. PEAKING** (Maximum attention)
- Signal velocity is at or near maximum
- Multiple sources covering the story
- High social media engagement
- New sub-events adding complexity
- Action: Priority content creation — this is the window of maximum audience interest

**3. DECLINING** (Attention fading)
- Signal velocity has dropped 50%+ from peak
- No new sub-events in 12+ hours
- Social media engagement falling
- Action: Wrap-up content (summaries, analysis pieces), shift resources to emerging trends

**4. RESURGENT** (Coming back)
- Was declining but new development reignited interest
- Signal velocity increasing again after a dip
- New angle or revelation emerged
- Action: Quick-turn content on the new angle — audience already has context

### Classification Rules

| Condition | Stage |
|-----------|-------|
| Age < 12h AND signals < 5 | EMERGING |
| Age < 12h AND signals >= 5 AND velocity HIGH | PEAKING |
| Velocity increasing AND signals growing | EMERGING → PEAKING |
| Velocity at max (within 20% of peak) | PEAKING |
| Velocity dropped 50%+ from peak | DECLINING |
| Was DECLINING but velocity increased 30%+ | RESURGENT |
| Age > 7 days AND velocity near zero | ARCHIVED (remove from active tracking) |

### Velocity Thresholds
- **HIGH**: 10+ new signals per hour
- **MEDIUM**: 3-9 new signals per hour
- **LOW**: 1-2 new signals per hour
- **DORMANT**: 0 signals in last 6 hours

### Output Format
```json
{
  "lifecycle": "peaking",
  "confidence": 0.85,
  "stageChanged": true,
  "previousStage": "emerging",
  "velocityCategory": "high",
  "recommendedAction": "Priority content creation — peak audience attention window",
  "estimatedPeakRemaining": "6-12 hours",
  "reasoning": "12 new signals in last 2 hours from 8 different sources"
}
```

---

## Learning Log

### Entry: Initial
- Lifecycle model based on news cycle patterns observed for political/geopolitical content
- Thresholds may need calibration for entertainment/sports content (faster cycles)
- India-focused political news tends to have longer peak windows than global news
