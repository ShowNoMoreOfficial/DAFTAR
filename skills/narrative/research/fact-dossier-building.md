# Skill: Fact Dossier Building
## Module: yantri
## Trigger: Narrative approved for production, research phase
## Inputs: signal_data, topic, angle, sources_list
## Outputs: fact_dossier (structured JSON of verified facts)
## Dependencies: narrative/research/web-research.md
## Scripts: build-dossier.py

---

## Instructions

Build a locked, structured source of truth that all downstream content creation reads from. The fact dossier prevents hallucinations — every claim in every deliverable must trace back to a fact in this dossier.

### Dossier Structure

```json
{
  "topic": "Iran-Israel Escalation: Economic Impact on India",
  "compiled": "2026-03-10T14:00:00Z",
  "locked": true,
  "sections": {
    "timeline": [
      { "date": "2026-03-08", "event": "Description", "source": "Reuters", "url": "..." }
    ],
    "key_facts": [
      { "fact": "India imports 85% of its crude oil", "source": "PIB", "verified": true }
    ],
    "statistics": [
      { "stat": "Oil price increase: $78 → $92/barrel", "period": "March 1-10", "source": "Bloomberg" }
    ],
    "stakeholders": [
      { "name": "India (Government)", "position": "Called for restraint", "source": "MEA statement" }
    ],
    "quotes": [
      { "speaker": "Finance Minister", "quote": "Exact quote...", "context": "Press conference", "date": "2026-03-09" }
    ],
    "context": [
      { "point": "Historical context or background fact", "source": "Academic/institutional source" }
    ]
  }
}
```

### Research Standards
1. **Minimum 3 sources per key claim** — no single-source facts in the dossier
2. **Primary sources preferred**: Government statements, official data, court filings > news reports
3. **Recency matters**: For developing stories, every fact must be verified within the last 12 hours
4. **Attribution is mandatory**: Every fact, stat, and quote must have a named source
5. **Mark uncertainty**: If a fact is reported but unverified, mark it `"verified": false` — it can be used with attribution ("According to...") but not as a standalone claim

### Source Credibility Tiers
- **Tier 1 (Gold)**: Government data (RBI, PIB, MOSPI), academic papers, court records, company filings
- **Tier 2 (Silver)**: Reuters, AP, Bloomberg, established broadsheets
- **Tier 3 (Bronze)**: News websites, regional media — use with attribution
- **Tier 4 (Unverified)**: Social media, anonymous sources — cite only as "reports suggest"

### Dossier Lock
Once compiled and reviewed, the dossier is LOCKED. Content creation reads from it but cannot modify it. If new information emerges, a new version of the dossier is created (append, don't overwrite).

---

## Learning Log

### Entry: Initial
- Dossiers with 10+ key facts produce higher-quality content than those with fewer
- Timeline sections are critical for explainer videos — they provide the backbone of the narrative
- Stakeholder mapping is most valuable for geopolitical content
