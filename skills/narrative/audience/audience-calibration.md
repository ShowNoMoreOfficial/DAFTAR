# Skill: Audience Calibration
## Module: yantri
## Trigger: Content planning, when selecting angle and tone
## Inputs: brand_identity, audience_data, topic, platform
## Outputs: audience_expectations, complexity_level, engagement_triggers
## Dependencies: brand/identity/{brand}/audience.md
## Scripts:

---

## Instructions

Calibrate content complexity and approach to match the specific audience segment.

### Audience Complexity Tiers

**Tier 1 — Expert/Niche** (10-15% of audience): Deep domain knowledge, wants nuance
- Skip basic explanations, go straight to implications
- Use technical terminology — they expect it
- These are your comment-section thought leaders

**Tier 2 — Informed General** (50-60% of audience): Reads news, follows topics casually
- Brief context needed, but don't over-explain
- Data should be presented with comparisons for meaning
- This is your primary target — optimize for them

**Tier 3 — Curious Newcomer** (25-30% of audience): Clicked because the hook was good
- Needs basic context: "Here's why this matters..."
- Analogies and simple explanations critical
- Win them and they become Tier 2 over time

### Calibration Rules
- **The Squirrels**: Optimize for Tier 2 with enough depth to satisfy Tier 1. Include brief context for Tier 3 but don't dwell.
- **Breaking Tube**: Optimize for Tier 3 with hooks that attract Tier 2. Keep it accessible.
- **YouTube long-form**: Can layer complexity — Tier 3 context up front, Tier 1 depth later
- **X/Twitter**: Tier 2 language only — threads must be self-contained
- **Instagram**: Tier 3 — visual, simple, one key takeaway per slide

### Output Format
```json
{
  "targetTier": 2,
  "complexityLevel": "informed_general",
  "contextNeeded": ["Brief explanation of what the WTO is", "Why India's trade deficit matters"],
  "technicalTermsToExplain": ["fiscal deficit", "current account"],
  "engagementTriggers": ["India-specific impact", "Household-level economics"]
}
```

---

## Learning Log

### Entry: Initial
- Over-explaining alienates Tier 1 (they comment "we already know this")
- Under-explaining loses Tier 3 (they stop watching at the 2-minute mark)
- The sweet spot: 30 seconds of context, then straight to the unique angle
