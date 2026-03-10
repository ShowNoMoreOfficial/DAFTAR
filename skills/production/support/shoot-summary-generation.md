# Skill: Shoot Summary Generation
## Module: pms
## Trigger: Raw footage received from shoot/recording session
## Inputs: transcript, footage_metadata, planned_narrative_arc
## Outputs: shoot_summary, usable_segments, quality_assessment
## Dependencies: production/support/transcript-processing.md
## Scripts:

---

## Instructions

Generate a structured summary of recorded footage, identifying usable segments and quality issues.

### Summary Structure
```json
{
  "totalDuration": "45:00",
  "usableSegments": [
    { "start": "02:30", "end": "05:45", "topic": "Oil price impact analysis", "quality": "excellent", "notes": "Best take — anchor energy high" },
    { "start": "12:00", "end": "14:30", "topic": "India's response", "quality": "good", "notes": "Minor audio buzz at 13:20" }
  ],
  "unusableSegments": [
    { "start": "00:00", "end": "02:30", "reason": "Camera setup, false starts" }
  ],
  "qualityIssues": ["Audio buzz at 13:20", "Lighting inconsistent in final 10 min"],
  "bestQuotes": ["Quote 1 at 03:15", "Quote 2 at 08:40"],
  "coverageGaps": ["Did not record the conclusion section — need pickup"]
}
```

### Assessment Criteria
- **Audio**: Clear, consistent levels, no background noise
- **Video**: Good lighting, in focus, proper framing
- **Performance**: Anchor energy, delivery quality, stumbles
- **Coverage**: Does the footage cover all sections of the narrative arc?

---

## Learning Log

### Entry: Initial
- Shoot summaries reduce editor review time by ~40%
- Identifying the "best take" upfront prevents editors from using inferior versions
- Coverage gap detection catches missing sections before the editor discovers them
