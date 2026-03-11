# Skill: Contrarian Angle Detection
## Module: yantri
## Trigger: Topic selected, checking for unique angles
## Inputs: signal_data, competitor_coverage, fact_dossier, brand_identity
## Outputs: contrarian_angles, evidence_strength, risk_assessment
## Dependencies: narrative/editorial/competitive-narrative-analysis.md
## Scripts:

---

## Instructions

Find the angle nobody else is covering — but only if you can back it with evidence.

### Detection Method

1. **Map the dominant narrative**: What are 5+ outlets saying about this story? Identify the consensus framing.
2. **Identify blind spots**: What aspects of the story are being ignored or underreported?
3. **Check the data**: Does the evidence support a different conclusion than the consensus?
4. **Audience test**: Would our audience find this contrarian angle more compelling than the mainstream take?

### Contrarian Angle Types
- **Overlooked stakeholder**: Everyone talks about X but ignores Y who is most affected
- **Second-order effects**: The obvious impact is A, but the downstream impact B is bigger
- **Data contradiction**: The narrative says X but the numbers show Y
- **Historical mismatch**: "This is unprecedented" — actually, it happened in 1997 and here's what happened next
- **Geographic blind spot**: Western media focuses on US/Europe impact; what about India/South Asia?

### Risk Assessment
- **Green**: Strong evidence, unique angle, brand-aligned — proceed
- **Yellow**: Moderate evidence, needs more research — proceed with caution
- **Red**: Weak evidence, potentially inflammatory, or off-brand — skip

### Rules
- Never be contrarian for clickbait. The angle must have genuine intellectual merit
- If the contrarian angle requires speculation beyond the evidence, it's a RED
- The Squirrels can take contrarian positions on policy/economics (data-backed)
- Breaking Tube should be contrarian on mainstream media narratives, not on political positions

### Output Format
```json
{
  "dominantNarrative": "Most outlets are framing this as...",
  "contrarian_angles": [
    {
      "angle": "The overlooked economic impact on Indian IT services",
      "type": "geographic_blind_spot",
      "evidence_strength": "green",
      "risk": "low",
      "data_points": ["Data point 1", "Data point 2"]
    }
  ],
  "recommended": 0,
  "reasoning": "This angle is data-backed and uniquely serves our audience"
}
```

---

## Learning Log

### Entry: Initial
- Geographic blind spot angles perform best for The Squirrels audience (India-centric)
- Data contradiction angles drive highest engagement but require rigorous fact-checking
- Avoid contrarian takes on social/religious issues — risk outweighs reward
