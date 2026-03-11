# Skill: Sensitivity Classification
## Module: yantri
## Trigger: Any narrative before production, especially political/social topics
## Inputs: topic, angle, narrative_frame, brand_identity
## Outputs: sensitivity_level, guardrails, review_requirements
## Dependencies:
## Scripts:

---

## Instructions

Classify the sensitivity of a narrative and apply appropriate guardrails before production.

### Sensitivity Levels

**Level 1 — Green (Low)**: Technology, science, economics (macro), sports, entertainment
- Standard editorial review
- No special guardrails
- GI can auto-approve at Tier 3+

**Level 2 — Yellow (Moderate)**: Domestic politics, foreign policy, corporate controversies, elections
- Must use analytical/data-driven framing
- Requires fact-check verification before publish
- Attribution required for all claims
- GI escalates to Tier 2 (suggest, require approval)

**Level 3 — Orange (High)**: Religious issues, caste/class, military/defense, communal tensions
- Requires senior editorial review (DEPT_HEAD or ADMIN)
- Must present multiple perspectives
- Avoid inflammatory language — even in hooks
- No speculation; only verified facts
- GI informs (Tier 1 only) — does not suggest or act

**Level 4 — Red (Critical)**: Active communal violence, ongoing legal cases, national security
- Requires ADMIN sign-off before production begins
- Legal compliance check recommended
- Consider whether coverage serves public interest vs. amplifies harm
- May decide NOT to cover — that's a valid editorial choice

### Guardrails by Topic

| Topic Area | Default Level | Guardrails |
|-----------|--------------|------------|
| India-Pakistan | Orange | No nationalist framing, data-only |
| Religious events | Orange | Respect all traditions, analytical distance |
| Caste dynamics | Orange | Use systemic framing, not individual blame |
| Electoral politics | Yellow | Present party positions factually, no endorsement |
| Corporate fraud | Yellow | Verified claims only, legal language |
| Military operations | Orange | No speculation on capabilities, official sources only |
| Gender/sexuality | Yellow | Center data and lived experience |
| Climate/environment | Green | Scientific consensus as baseline |

### Output Format
```json
{
  "sensitivityLevel": 2,
  "levelName": "yellow",
  "guardrails": [
    "Use analytical framing — no opinion",
    "Fact-check all claims against 2+ sources",
    "Attribute all data points"
  ],
  "reviewRequired": "standard",
  "reviewerRole": "DEPT_HEAD",
  "reasoning": "Domestic political topic — moderate sensitivity"
}
```

---

## Learning Log

### Entry: Initial
- Orange-level topics that receive proper editorial treatment actually build audience trust
- Skipping red-level stories is often the right call for brand safety
- Yellow-level content with data-first framing has never generated negative audience feedback
