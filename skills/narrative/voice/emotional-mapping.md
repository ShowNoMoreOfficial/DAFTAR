# Skill: Emotional Mapping
## Module: yantri
## Trigger: Content structuring — planning emotional journey
## Inputs: narrative_arc, audience_profile, content_type, platform
## Outputs: emotional_beats, intensity_curve, engagement_predictions
## Dependencies: narrative/editorial/narrative-arc-construction.md
## Scripts:

---

## Instructions

Every piece of content takes the audience on an emotional journey. Map that journey intentionally.

### Emotional Beat Types
- **Curiosity**: "Wait, what?" — creates pull to continue
- **Surprise**: "I didn't expect that" — data reveals, counter-intuitive facts
- **Concern**: "This could affect me" — stakes for the audience
- **Understanding**: "Now I get it" — the insight moment
- **Empowerment**: "Now I know what to think about this" — resolution

### Intensity Curves by Format

**YouTube Explainer (10-15 min)**
```
High  |    *         *
      |   / \   *   / \
      |  /   \ / \ /   \  *
      | /     *    *     \/
Low   |________________________
      Hook  3min  7min  10min End
```
- Hook: High (surprise/curiosity)
- 3-min dip: re-engage with surprise data
- 7-min peak: the revelation/key insight
- 10-min: personal stakes (concern)
- End: empowerment (resolution)

**X Thread (10 tweets)**
- Tweet 1: Curiosity (hook)
- Tweets 2-3: Building concern
- Tweets 4-6: Surprise (the evidence)
- Tweets 7-8: Understanding (the analysis)
- Tweet 9-10: Empowerment (the takeaway)

**Instagram Carousel (8 slides)**
- Slide 1: Surprise (bold claim or stat)
- Slides 2-4: Concern/curiosity building
- Slides 5-6: Understanding (data reveals)
- Slide 7-8: Empowerment + CTA

### Rules
- Never sustain concern/anxiety without resolving it — audiences disengage
- Analytical content can have subtle emotional beats — not everything needs drama
- The Squirrels: intellectual satisfaction > emotional impact
- Breaking Tube: emotional engagement > analytical satisfaction
- Match intensity to sensitivity level — Orange/Red topics need lower emotional intensity

### Output Format
```json
{
  "emotionalBeats": [
    { "position": "0:00", "emotion": "curiosity", "intensity": 0.8, "technique": "data-first hook" },
    { "position": "3:00", "emotion": "surprise", "intensity": 0.7, "technique": "counter-intuitive data" }
  ],
  "peakMoment": { "position": "7:00", "emotion": "understanding", "description": "The key insight clicks" },
  "resolution": { "emotion": "empowerment", "description": "Clear takeaway the audience can use" }
}
```

---

## Learning Log

### Entry: Initial
- Curiosity hooks followed by early surprise data yield highest retention at 3-min mark
- Content that ends on empowerment gets 2x more shares than content ending on concern
- Emotional intensity should be inversely proportional to topic sensitivity
