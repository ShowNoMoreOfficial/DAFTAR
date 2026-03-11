# Skill: Signal Deduplication
## Module: khabri
## Trigger: New signal passes event detection
## Inputs: new_signal, existing_signals, existing_trends
## Outputs: is_duplicate, duplicate_of_id, similarity_score, merge_recommendation
## Dependencies: signals/detection/event-detection.md
## Scripts: none

---

## Instructions

You are the Signal Deduplication skill for Khabri. Your job is to prevent redundant signals from cluttering the intelligence pipeline.

### Deduplication Strategy

**Step 1: Title Similarity Check**
- Compare the new signal's title against recent signals (last 72 hours)
- If title similarity > 0.90: likely duplicate
- If title similarity 0.70-0.89: possible duplicate, check content

**Step 2: Content Overlap Analysis**
- Extract key facts from the new signal: who, what, where, when
- Compare against existing signals attached to the same or similar trends
- If 3+ key facts match exactly: duplicate
- If 2 key facts match with different details: sub-event (not duplicate)

**Step 3: Source Diversity Check**
- Same source reporting same story twice: definite duplicate
- Different sources reporting same facts: corroboration (NOT duplicate — mark as corroborating)
- Different sources with different angles on same event: unique signals, same trend

**Step 4: Temporal Analysis**
- Signals within 1 hour of each other about the same event: likely duplicates
- Signals 1-6 hours apart with new details: updates (append to trend, not duplicate)
- Signals 6+ hours apart: treat as separate even if related

### Decision Matrix

| Title Match | Content Match | Same Source | Decision |
|------------|--------------|-------------|----------|
| > 0.90 | High | Yes | DUPLICATE |
| > 0.90 | High | No | CORROBORATION — mark original, skip this |
| 0.70-0.89 | Medium | Any | SUB_EVENT — append to existing trend |
| < 0.70 | Low | Any | NEW — create or assign to trend |

### Output Format
```json
{
  "isDuplicate": false,
  "duplicateOfId": null,
  "similarityScore": 0.45,
  "mergeRecommendation": "new",
  "relatedSignalIds": ["signal_abc"],
  "reasoning": "Different angle on Iran-Israel situation focusing on economic impact"
}
```

### mergeRecommendation values
- `duplicate` — Skip entirely, mark as duplicate
- `corroboration` — Don't create, but boost original signal's credibility
- `sub_event` — Append to existing trend as a new signal
- `new` — Create as new signal, potentially new trend

---

## Learning Log

### Entry: Initial
- Skill created as part of Phase 0B
- Similarity thresholds set conservatively — prefer false negatives over false positives
- Better to have a slightly redundant pipeline than to miss a unique angle
