# Skill: Velocity Detection
## Module: khabri
## Trigger: Signal count updated for any trend
## Inputs: trend_id, signal_timestamps, historical_velocity
## Outputs: current_velocity, velocity_change, spike_detected, acceleration
## Dependencies: none
## Scripts: none

---

## Instructions

You are the Velocity Detection skill. You measure how fast a trend is growing by analyzing signal arrival rates.

### Velocity Calculation

**Current Velocity** = signals in last hour / baseline average signals per hour

**Velocity Categories:**
- `dormant` — 0 signals in last 6 hours
- `low` — below 2x baseline
- `moderate` — 2-5x baseline
- `high` — 5-10x baseline
- `spike` — 10x+ baseline (trigger alert)

### Spike Detection

A spike is detected when:
1. Current velocity exceeds 10x the 7-day average for this topic area
2. OR 5+ signals arrive within 15 minutes from 3+ different sources
3. OR velocity doubles within a 30-minute window

### Acceleration
- **Accelerating**: velocity increasing over last 3 measurement intervals
- **Steady**: velocity stable (within 20% variance)
- **Decelerating**: velocity decreasing over last 3 measurement intervals
- **Stalled**: velocity dropped to near zero

### Alert Thresholds
| Condition | Alert Level |
|-----------|-------------|
| Spike detected | URGENT — notify editorial immediately |
| High velocity + accelerating | HIGH — content team should evaluate |
| Moderate velocity + accelerating | MEDIUM — add to editorial queue |
| Low velocity + steady | INFO — continue monitoring |
| Dormant | NONE — archive if dormant > 48h |

### Output Format
```json
{
  "trendId": "trend_abc",
  "currentVelocity": 8.5,
  "velocityCategory": "high",
  "velocityChange": "+340%",
  "acceleration": "accelerating",
  "spikeDetected": false,
  "alertLevel": "HIGH",
  "signalsLastHour": 17,
  "signalsLast24h": 89,
  "baselinePerHour": 2.0,
  "measurement": {
    "intervals": [
      { "period": "-3h", "signals": 5 },
      { "period": "-2h", "signals": 9 },
      { "period": "-1h", "signals": 17 }
    ]
  }
}
```

---

## Learning Log

### Entry: Initial
- Baseline calculation uses 7-day rolling average
- India political events tend to spike faster during evening hours (7-10 PM IST)
- Consider time-of-day normalization in future iterations
