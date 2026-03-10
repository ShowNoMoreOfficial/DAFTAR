# Skill: Diplomatic Voice
## Module: yantri
## Trigger: Content involving geopolitical, political, or sensitive topics
## Inputs: narrative_frame, sensitivity_level, stakeholders, brand_identity
## Outputs: tonal_guidelines, language_choices, position_calibration
## Dependencies: narrative/editorial/sensitivity-classification.md
## Scripts:

---

## Instructions

Navigate politically sensitive content with intelligence and nuance. Take positions, but do it with the sophistication of a diplomat — not the bluntness of a pundit.

### The Diplomatic Spectrum

**Level 1: Observer** — Report without positioning
- "Three countries have responded differently to this event..."
- Use when: facts are still emerging, or brand should not take sides
- Feels like: BBC at its most neutral

**Level 2: Analyst** — Explain implications without prescribing
- "If this policy continues, the economic models suggest..."
- Use when: The Squirrels covers policy/economics — analysis is the position
- Feels like: The Economist

**Level 3: Advocate** — Take a clear position backed by evidence
- "The data makes a compelling case that this approach is flawed because..."
- Use when: evidence overwhelmingly supports one interpretation
- Feels like: Well-argued opinion journalism

**Level 4: Challenger** — Directly challenge prevailing narratives
- "The mainstream narrative ignores three critical data points..."
- Use when: brand is confident and contrarian angle has strong evidence
- Feels like: Investigative journalism at its best

### Language Rules for Diplomatic Content

**DO**:
- "The evidence suggests..." (not "It's obvious that...")
- "Critics argue..." / "Supporters point to..." (present both)
- "This raises questions about..." (not "This proves...")
- Use specific data instead of adjectives ("₹12,000 crore" not "massive amount")
- Attribute positions: "According to [source]..." not "Everyone knows..."

**DON'T**:
- Use absolute language: "always", "never", "everyone agrees"
- Attack individuals — critique policies, positions, decisions
- Use loaded terms: "regime" (use "government"), "puppet" (use "ally")
- Speculate about motives: "They did this because..." (stick to observable actions)
- Take sides in India's domestic political divide unless explicitly brand-aligned

### Multi-stakeholder Framing
For geopolitical content, map all stakeholders and represent each:
- What is each stakeholder's stated position?
- What are their likely motivations? (attribute to analysts, not assertion)
- What are the consequences for each stakeholder?
- Where is the tension? That's where the story lives.

### Output Format
```json
{
  "diplomaticLevel": 2,
  "tonalGuidance": "Analytical observer with data-backed implications",
  "languageRules": ["Use 'evidence suggests' framing", "Present India and global stakeholder positions"],
  "avoidList": ["Don't characterize government motives", "Don't use 'regime' language"],
  "stakeholderBalance": { "India": "primary audience perspective", "US": "policy implications", "China": "factual positioning" }
}
```

---

## Learning Log

### Entry: Initial
- Level 2 (Analyst) is The Squirrels' sweet spot — audience expects analysis, not neutrality
- Breaking Tube can operate at Level 3 on domestic topics — their audience expects a position
- Level 4 content goes viral when correct but damages brand when wrong — use with extreme caution
