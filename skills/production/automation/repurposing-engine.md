# Skill: Repurposing Engine
## Module: pms
## Trigger: Primary content approved or published — identify repurposing opportunities
## Inputs: source_content, performance_data, platform_list, brand_identity
## Outputs: repurpose_candidates, production_briefs, priority_ranking
## Dependencies: narrative/editorial/multi-narrative-branching.md
## Scripts: identify-repurpose-opportunities.py

---

## Instructions

Every piece of long-form content contains 3-5 additional content pieces waiting to be extracted.

### Repurposing Matrix

| Source | → YouTube Short | → X Thread | → Carousel | → LinkedIn | → Blog |
|--------|:-:|:-:|:-:|:-:|:-:|
| YouTube Explainer | 2-3 shorts | 1 thread | 1-2 carousels | 1 post | 1 article |
| Interview | 3-5 shorts | 1 thread | 1 carousel | 1 post | — |
| Documentary | 5+ shorts | 2 threads | 2-3 carousels | 1 article | 1 article |

### Identification Rules
1. **Best moment extraction**: Find the 30-60 second segment with the highest "standalone value"
2. **Data point isolation**: Every compelling statistic is a potential carousel slide or tweet
3. **Quote extraction**: Every strong quote is a potential visual post
4. **Narrative summary**: The full story condensed to a thread
5. **Behind-the-scenes**: Production process content for engagement

### Priority Ranking
- **P1**: High-performing source content → repurpose immediately (within 24 hours)
- **P2**: Good source content → repurpose within the week
- **P3**: Average source content → repurpose only if team has spare capacity
- **Skip**: Low-performing source → don't amplify underperformance

### Automation Potential
- Thread generation from script: 80% automatable (AI extracts and formats)
- Short identification from video: 70% automatable (AI identifies best segments)
- Carousel creation from data: 60% automatable (template + data fill)
- Blog from video script: 90% automatable (reformat + add links)

### Output Format
```json
{
  "sourceContent": "YouTube Explainer: India's Semiconductor Crisis",
  "repurposeOpportunities": [
    { "format": "youtube_short", "segment": "03:15-04:00", "hook": "India's $38 billion problem", "priority": "P1" },
    { "format": "x_thread", "approach": "10-tweet summary of key findings", "priority": "P1" },
    { "format": "carousel", "approach": "8 slides: key stats + implications", "priority": "P2" }
  ],
  "automationLevel": "high",
  "estimatedEffort": "2 hours for all repurposed content"
}
```

---

## Learning Log

### Entry: Initial
- Repurposed shorts from high-performing videos often outperform original shorts
- Thread repurposing within 2 hours of YouTube publish drives traffic to the video
- Carousel repurposing should focus on the data points, not the narrative
