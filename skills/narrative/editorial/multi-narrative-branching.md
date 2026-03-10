# Skill: Multi-Narrative Branching
## Module: yantri
## Trigger: Narrative framed, multiple formats required
## Inputs: narrative_arc, fact_dossier, formats_list, brand_identity, platform_configs
## Outputs: branched_narratives, platform_adaptations, asset_requirements
## Dependencies: narrative/editorial/narrative-arc-construction.md, platforms/youtube/title-engineering.md, platforms/x-twitter/thread-architecture.md, platforms/meta/carousel-design.md
## Scripts:

---

## Instructions

One fact dossier, one narrative — multiple platform-optimized deliverables. This skill branches a single story into formats tailored for each platform without losing the core message.

### Branching Rules

**Principle**: Every branch must feel native to its platform, not like a reformatted version. A YouTube viewer, X reader, and Instagram scroller should each feel the content was made specifically for them.

**YouTube Long-form → YouTube Short**
- Extract the single most compelling 60-second segment
- The short must stand alone — no "watch the full video" dependency
- Add text overlay for key data points
- Hook must land in first 1.5 seconds

**YouTube Long-form → X Thread**
- Distill the narrative into 8-12 tweets
- Tweet 1 must be independently viral-worthy
- Each tweet should have a data point or insight
- Link to YouTube in the final tweet, not mid-thread
- Add a visual (chart, map, infographic) to 2-3 tweets

**YouTube Long-form → Instagram Carousel**
- Maximum 10 slides
- Slide 1: Bold headline that works as a standalone image
- Each slide: One key point with a data visualization
- Design-first: the visual must carry the message even without reading text
- Final slide: CTA + brand handle

**YouTube Long-form → LinkedIn Post**
- Professional framing of the same story
- Lead with a business/economic insight
- 150-300 words, structured with line breaks
- Tag relevant industry figures or organizations

### Asset Planning Per Branch

For each branch, generate an asset requirement list:
```
YouTube Explainer:
  - Script (from narrative arc)
  - Thumbnail (3 concepts)
  - B-roll shot list
  - Motion graphics brief (data visualizations)
  - Music mood brief
  - End screen card design

X Thread:
  - Thread copy (8-12 tweets)
  - 2-3 visual assets (charts, maps)
  - Engagement prompts

Instagram Carousel:
  - Carousel copy (8-10 slides)
  - Slide designs (brand template)
  - Caption with hashtags

YouTube Short:
  - 60s script with text overlays
  - Vertical crop guidance from source video
```

### Output Format
```json
{
  "branches": [
    {
      "platform": "youtube",
      "format": "explainer",
      "narrative_adaptation": "Full narrative arc",
      "asset_requirements": ["script", "thumbnail", "broll", "motion_graphics", "music"]
    },
    {
      "platform": "x",
      "format": "thread",
      "narrative_adaptation": "Condensed to 10 key insights",
      "asset_requirements": ["thread_copy", "charts"]
    }
  ],
  "shared_assets": ["fact_dossier", "key_data_points", "brand_visuals"],
  "production_priority": "youtube_first"
}
```

---

## Learning Log

### Entry: Initial
- YouTube-first production is standard — other platforms branch from the primary
- Threads that include charts/visuals get 2-3x more engagement than text-only
- Carousels with data visualizations outperform text-only by 40% on Instagram
