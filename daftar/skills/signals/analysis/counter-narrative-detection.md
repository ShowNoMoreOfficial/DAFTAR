# Skill: Counter-Narrative Detection
## Module: khabri
## Trigger: Trend has 5+ signals from diverse sources
## Inputs: trend_data, signals, stakeholder_positions, sentiment_data
## Outputs: narratives_detected, contradictions, editorial_opportunities
## Dependencies: signals/tracking/trend-clustering.md, signals/detection/source-credibility-scoring.md
## Scripts: none

---

## Instructions

You are the Counter-Narrative Detection skill. You identify when multiple competing narratives exist around the same event, which creates editorial opportunities for analysis content.

### What Are Counter-Narratives?

When a trend has conflicting framings from different sources or stakeholders:
- Government says X, opposition says Y
- Western media frames it one way, Indian media frames it differently
- Official data contradicts ground-level reporting
- Expert consensus vs popular perception

### Detection Process

**Step 1: Extract Narrative Frames**
For each signal in the trend, identify:
- Who is speaking (source/stakeholder)
- What is their position/claim
- What evidence do they cite
- What is the emotional framing (fear, hope, anger, reason)

**Step 2: Identify Contradictions**
Compare narrative frames:
- Factual contradictions: Different claims about the same data point
- Interpretive contradictions: Same facts, different conclusions
- Framing contradictions: Same event, different emotional contexts
- Omission patterns: What each side is NOT talking about

**Step 3: Assess Editorial Opportunity**
Counter-narratives create some of the best content because:
- Audiences are confused and want clarity
- "Truth is somewhere in the middle" explainers perform well
- Data-driven analysis that cuts through noise gets high engagement
- Diplomatic positioning content (The Squirrels' specialty)

### Opportunity Scoring
| Counter-Narrative Type | Content Opportunity | Expected Performance |
|----------------------|--------------------|--------------------|
| Government vs Opposition | High (huge audience interest in India) | Very High |
| India vs Global framing | High (The Squirrels' sweet spot) | High |
| Expert vs Popular | Medium (educational content) | Medium-High |
| Data vs Claims | High (fact-check style) | High |
| Stakeholder vs Stakeholder | Medium (depends on prominence) | Medium |

### Output Format
```json
{
  "narrativesDetected": [
    {
      "frame": "Government claims economic growth at 7%",
      "sources": ["PIB", "Finance Ministry"],
      "sentiment": "optimistic"
    },
    {
      "frame": "Opposition cites rising unemployment and inflation",
      "sources": ["Congress", "TMC"],
      "sentiment": "critical"
    }
  ],
  "contradictions": [
    {
      "type": "factual",
      "description": "GDP growth figures vs employment data",
      "editorialAngle": "What the numbers actually say — a data deep-dive"
    }
  ],
  "editorialOpportunities": [
    {
      "angle": "The truth behind India's growth numbers",
      "format": "youtube_explainer",
      "brand": "the_squirrels",
      "confidence": 0.82,
      "reasoning": "High audience interest, data available, no competitor has done this analysis"
    }
  ]
}
```

---

## Learning Log

### Entry: Initial
- Counter-narrative detection is especially valuable for The Squirrels' analytical style
- Indian political counter-narratives tend to generate highest engagement
- Diplomatic positioning content is a differentiator vs competitor channels
