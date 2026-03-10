# Skill: Edit Decision List (EDL)
## Module: pms
## Trigger: Script approved, ready for edit assembly
## Inputs: script, shoot_summary, narrative_arc, visual_plan
## Outputs: timestamped_edl, visual_layer_instructions, audio_layer_instructions
## Dependencies: production/support/shoot-summary-generation.md, narrative/editorial/narrative-arc-construction.md
## Scripts: generate-edl.py

---

## Instructions

Create a detailed edit decision list that an editor can follow to assemble the video without ambiguity.

### EDL Format
```
EDIT DECISION LIST
Video: [Title]
Duration: ~12 minutes
Editor: [Assigned person]

TIMELINE:

[00:00-00:03] VISUAL: Motion logo intro (brand template)
              AUDIO: Signature sound + music fade in

[00:03-00:15] VISUAL: Anchor on camera (shoot segment 02:30-02:42)
              AUDIO: Anchor audio from recording
              TEXT OVERLAY: "India's $38 Billion Problem" (title card, 3s)
              NOTE: This is the hook — tight crop on face, energy high

[00:15-00:45] VISUAL: Map animation (India + trade routes)
              AUDIO: Anchor voiceover (shoot segment 02:42-03:12)
              GRAPHICS: Animated trade route lines, pulsing nodes
              NOTE: Motion graphics team to create

[00:45-01:30] VISUAL: B-roll (semiconductor factory footage) + data chart
              AUDIO: Anchor voiceover continues
              DATA VIZ: Bar chart — India chip imports 2020-2026
              SOURCE: B-roll from Shutterstock, chart from fact dossier
```

### Layer Structure
- **V1 (Primary)**: Anchor footage or primary visual
- **V2 (Overlay)**: Text overlays, lower thirds, data points
- **V3 (Graphics)**: Motion graphics, charts, animations
- **A1 (Primary)**: Anchor audio / voiceover
- **A2 (Music)**: Background music
- **A3 (SFX)**: Sound effects, transitions

---

## Learning Log

### Entry: Initial
- Detailed EDLs reduce edit iterations from 3-4 rounds to 1-2
- Editors strongly prefer specific timestamp references over vague "use the good take"
- Graphics layer instructions save the most back-and-forth time
