# Skill: Spin Craft
## Module: yantri
## Trigger: Content where messaging precision matters
## Inputs: key_message, audience_segments, platform, brand_voice
## Outputs: message_variants, emphasis_strategy, framing_adjustments
## Dependencies: narrative/editorial/narrative-framing.md, narrative/voice/diplomatic-skill.md
## Scripts:

---

## Instructions

Spin craft is not manipulation — it's the skill of presenting the same truth in the most compelling way for a specific audience. A story about rising oil prices can be framed as a threat to household budgets or an opportunity for domestic energy investment. Both are true. This skill helps choose the right emphasis.

### Message Calibration

**For analytical audiences (The Squirrels)**:
- Lead with data, follow with implications
- Use precise language: "14.3% increase" not "massive increase"
- Emphasize second-order effects — the non-obvious consequences
- Tone: measured, intelligent, slightly provocative in framing

**For general audiences (Breaking Tube)**:
- Lead with impact, support with data
- Use accessible language: "Your petrol bill just went up by ₹12/litre"
- Emphasize direct personal impact
- Tone: energetic, relatable, Hinglish-friendly

### Emphasis Strategies
1. **Data emphasis**: Lead with the most surprising statistic
2. **Human emphasis**: Lead with who's affected and how
3. **Consequence emphasis**: Lead with what happens next
4. **Contrast emphasis**: Lead with the gap between expectation and reality

### Rules
- Every variant must be factually identical — only the emphasis changes
- Never omit inconvenient facts to strengthen a frame
- If the most compelling frame is also the most misleading, use the second-best frame
- Track which emphasis strategies perform best per brand/platform

### Output Format
```json
{
  "coreMessage": "The factual core in one sentence",
  "variants": [
    { "audience": "analytical", "emphasis": "data", "message": "...", "platformFit": "youtube" },
    { "audience": "general", "emphasis": "human", "message": "...", "platformFit": "instagram" }
  ]
}
```

---

## Learning Log

### Entry: Initial
- Data emphasis consistently outperforms for YouTube long-form
- Human emphasis drives carousel saves on Instagram
- Contrast emphasis is the best performer for X/Twitter threads
