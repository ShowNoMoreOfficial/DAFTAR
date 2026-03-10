# Skill: Archive Management
## Module: pms
## Trigger: Post-production, assets need organization for future reuse
## Inputs: project_assets, metadata, performance_data
## Outputs: archive_plan, tagging_scheme, reuse_candidates
## Dependencies:
## Scripts:

---

## Instructions

Organize and tag all production assets for efficient future retrieval and reuse.

### Tagging Scheme
Every asset should be tagged with:
- **Topic tags**: geopolitics, economics, india, oil, semiconductor, etc.
- **Type**: anchor_footage, broll, graphic, music, thumbnail, script
- **Brand**: the-squirrels, breaking-tube, generic
- **Quality**: excellent, good, usable, archive-only
- **Date**: Production date
- **License**: owned, stock_licensed, cc, fair_use, expired

### Reuse Identification
After every production, flag assets likely to be reused:
- Generic B-roll (city skylines, office footage, stock charts)
- Motion graphic templates (chart templates, map templates)
- Music beds that worked well
- Anchor footage on evergreen topics (can be re-cut for compilations)

### Archive Structure
```
/archive
├── /footage
│   ├── /anchor (organized by date)
│   ├── /broll (organized by topic)
│   └── /raw (unedited source)
├── /graphics
│   ├── /templates (reusable)
│   └── /custom (one-off)
├── /audio
│   ├── /music (licensed library)
│   └── /voiceover
├── /thumbnails
└── /scripts
```

---

## Learning Log

### Entry: Initial
- Reusing archived B-roll saves ~1 hour per production
- Properly tagged archive becomes a competitive advantage over time
- Graphics templates are the highest-value archive items
