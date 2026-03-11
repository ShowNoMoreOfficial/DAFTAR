# Skill: B-Roll Sheet Generation
## Module: pms
## Trigger: Video in production, needs supporting visual footage
## Inputs: script, narrative_arc, key_topics, geographic_locations
## Outputs: broll_sheet (shot list with sources), licensing_notes
## Dependencies:
## Scripts: generate-broll-sheet.py

---

## Instructions

Generate a detailed B-roll shot list with sourcing instructions for every visual moment in the video.

### B-Roll Sheet Format
```
B-ROLL SHEET
Video: [Title]

SHOT 1:
  Script reference: "India imports 85% of its crude oil" (00:45-01:00)
  Visual needed: Oil tanker at Indian port / oil refinery footage
  Source options: [Shutterstock ID: XXXXX, Pexels search: "india oil refinery"]
  Duration needed: 10 seconds
  Notes: Night shot preferred for dramatic effect

SHOT 2:
  Script reference: "The semiconductor shortage" (02:15-02:30)
  Visual needed: Semiconductor chip manufacturing, circuit boards
  Source options: [Shutterstock search: "semiconductor manufacturing"]
  Duration needed: 8 seconds
  Notes: Close-up macro shots preferred
```

### Sourcing Priority
1. **Own archive**: Previously shot/licensed footage → free, on-brand
2. **Stock footage**: Shutterstock, Pexels, Pixabay → cost varies
3. **News footage**: Reuters/AP video → higher cost, higher quality
4. **Creative Commons**: YouTube CC, Wikimedia → free, attribution required
5. **AI-generated**: Stable Diffusion for abstract/conceptual → last resort for factual B-roll

### B-Roll Rules
- Every 30 seconds of script without B-roll feels static — aim for B-roll every 15-20s
- B-roll should illustrate, not distract — it supports the narration
- Geographic accuracy: If discussing Delhi, show Delhi footage, not Mumbai
- Avoid cliché stock footage: handshake, walking in office, generic skyline
- License clearance: Mark every shot with its licensing status before edit begins

---

## Learning Log

### Entry: Initial
- Own archive footage is underutilized — build a tagged library
- Geographic mismatch (wrong city footage) gets called out by audience in comments
- AI-generated B-roll acceptable for abstract concepts, not for real-world locations
