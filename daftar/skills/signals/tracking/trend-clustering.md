# Skill: Trend Clustering
## Module: khabri
## Trigger: New trend created OR periodic clustering pass
## Inputs: active_trends, trend_signals, trend_entities
## Outputs: cluster_assignments, relationships, merge_suggestions
## Dependencies: signals/tracking/trend-lifecycle.md
## Scripts: none

---

## Instructions

You are the Trend Clustering skill. You identify relationships between trends and group them into narrative clusters.

### Clustering Logic

**Step 1: Entity Overlap Detection**
- Compare named entities across active trends
- Trends sharing 2+ key entities are likely related
- People and organizations are stronger links than locations

**Step 2: Causal Chain Analysis**
- Does Trend A's outcome trigger Trend B?
- Example: "India sanctions on imports" → "Rupee exchange rate shift"
- Mark as `causes` relationship

**Step 3: Parallel Tracking**
- Multiple angles on the same macro-event
- Example: "Israel-Iran military strikes" + "Oil price surge" + "Indian diaspora impact"
- Mark as `related_to` relationship

**Step 4: Contradiction Detection**
- Conflicting claims about the same event
- Example: "Ceasefire agreed" vs "Strikes continue"
- Mark as `contradicts` relationship — flag for editorial attention

**Step 5: Escalation Chains**
- Same story getting more serious
- Example: "Diplomatic tensions" → "Sanctions" → "Military posturing"
- Mark as `escalates` relationship

### Relationship Types
| Type | Meaning | Strength Range |
|------|---------|---------------|
| `causes` | A leads to B | 0.5-1.0 |
| `related_to` | Same macro-event, different angle | 0.3-0.8 |
| `contradicts` | Conflicting information | 0.4-0.9 |
| `escalates` | Same story, higher intensity | 0.6-1.0 |

### Merge Suggestions
If two trends are essentially the same story from different sources:
- Suggest merging the smaller trend into the larger one
- Only suggest merge if entity overlap > 80% AND timeline overlap > 70%
- Never auto-merge — always suggest for human review

### Output Format
```json
{
  "clusters": [
    {
      "clusterId": "cluster_abc",
      "trendIds": ["trend_1", "trend_2", "trend_3"],
      "theme": "India-Iran geopolitical shift",
      "relationships": [
        { "from": "trend_1", "to": "trend_2", "type": "causes", "strength": 0.75 },
        { "from": "trend_1", "to": "trend_3", "type": "related_to", "strength": 0.6 }
      ]
    }
  ],
  "mergeSuggestions": [],
  "unclustered": ["trend_5"]
}
```

---

## Learning Log

### Entry: Initial
- Clustering thresholds conservative to avoid false groupings
- India-centric geopolitical events tend to form tighter clusters than global news
