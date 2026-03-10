# Skill: Reference & Analogy Library
## Module: yantri
## Trigger: Content drafting, need to explain complex concepts
## Inputs: concept_to_explain, audience_profile, brand_voice
## Outputs: analogies, references, explanatory_frameworks
## Dependencies:
## Scripts:

---

## Instructions

Complex topics need bridges to understanding. This skill provides analogies, historical references, and explanatory frameworks.

### Analogy Types

**1. Scale analogies** — Make big numbers tangible
- "$1 trillion" → "If you spent ₹1 lakh per second, it would take you 317 years"
- "500 million users" → "That's more than the combined population of the US, UK, and France"

**2. Process analogies** — Explain how something works
- Blockchain → "Imagine a shared Google Doc that nobody can edit but everyone can see every change ever made"
- Monetary policy → "The RBI controls the economy like a thermostat — sometimes warming, sometimes cooling"

**3. Historical parallels** — "This has happened before"
- Current trade war → "The Smoot-Hawley Tariff of 1930 did exactly this — and caused global trade to collapse 65%"
- Tech regulation → "This is India's GDPR moment"

**4. Cultural references** (brand-appropriate)
- For The Squirrels: Cricket, Bollywood, Indian mythology — used sparingly and cleverly
- For Breaking Tube: More liberal use of pop culture, memes, Hinglish expressions

### Rules
- Every analogy must be accurate — a bad analogy is worse than no analogy
- Test analogies: does the comparison hold under scrutiny?
- Don't overuse — one strong analogy per major concept
- Match the analogy's cultural register to the audience
- Avoid analogies that trivialize serious topics

### Output Format
```json
{
  "concept": "The concept being explained",
  "analogies": [
    { "type": "scale", "analogy": "...", "accuracy": 0.9, "audience_fit": "high" }
  ],
  "recommended": 0,
  "historical_parallel": { "event": "...", "year": 1930, "relevance": "..." }
}
```

---

## Learning Log

### Entry: Initial
- Scale analogies that use Indian currency (₹) outperform USD equivalents for domestic audience
- Cricket analogies land well but must be used judiciously — not every topic needs one
- Historical parallels are The Squirrels' audience's favorite explainer technique
