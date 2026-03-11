# Skill: Psychological Voice
## Module: yantri
## Trigger: Content drafting, audience persuasion strategy
## Inputs: narrative_arc, audience_profile, platform, sensitivity_level
## Outputs: persuasion_approach, cognitive_hooks, engagement_triggers
## Dependencies: narrative/editorial/narrative-framing.md
## Scripts:

---

## Instructions

Apply psychological principles to make content more engaging without manipulation.

### Cognitive Engagement Techniques

**1. Curiosity Gap** — Create a gap between what the audience knows and what they want to know
- "India signed a deal worth ₹50,000 crore. But nobody's talking about clause 7."
- Works best in hooks and section transitions
- Never create a gap you don't fill — that's clickbait

**2. Loss Aversion** — People fear losing more than they value gaining
- "What India stands to lose if..." is more compelling than "What India could gain if..."
- Use for policy analysis, economic stories
- Data: loss-framed headlines get 15-20% more clicks

**3. Social Proof** — What others are doing/thinking
- "78% of economists agree..." or "Countries around the world are already..."
- Validates the audience's decision to engage with this content
- Use early in the piece to establish credibility

**4. Anchoring** — Set a reference point that frames everything after
- Lead with a big number: "₹4.2 lakh crore" — everything after is compared to this
- Effective in economic/financial content
- Place the anchor in the first 30 seconds

**5. Pattern Interruption** — Break the expected flow to recapture attention
- Use at the 3-minute mark (typical attention dip) and the 7-minute mark
- "But here's where it gets interesting..." or a sudden visual change
- In threads: change format mid-thread (text → image → data → question)

**6. Zeigarnik Effect** — Unfinished thoughts are remembered better
- End sections with a preview: "But that's only half the story..."
- Creates momentum to keep watching/reading
- Never overuse — once or twice per piece maximum

### Rules
- These techniques enhance genuinely valuable content. NEVER use them on thin content
- The audience should feel informed and empowered, not manipulated
- If a technique feels dishonest for a given piece, skip it
- Sensitivity Level 3+ content: use only Curiosity Gap and Social Proof — nothing aggressive

### Output Format
```json
{
  "techniques": [
    { "name": "anchoring", "placement": "0:00-0:15", "implementation": "Lead with ₹4.2 lakh crore figure" },
    { "name": "pattern_interruption", "placement": "3:00", "implementation": "Cut to contrasting data visualization" }
  ],
  "overallApproach": "Data-anchored analytical persuasion",
  "engagement_predictions": { "hook_retention": 0.72, "midpoint_retention": 0.55 }
}
```

---

## Learning Log

### Entry: Initial
- Anchoring with specific numbers is the highest-performing technique for analytical content
- Loss aversion framing increases click-through but must be backed by real stakes
- Pattern interruption at 3-minute mark correlates with higher overall retention
