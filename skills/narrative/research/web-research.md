# Skill: Web Research
## Module: yantri
## Trigger: Fact dossier building requires additional data
## Inputs: topic, specific_questions, existing_facts
## Outputs: research_results, source_list, fact_candidates
## Dependencies:
## Scripts: search-web.py

---

## Instructions

Conduct targeted web research to fill gaps in the fact dossier. This is not a general search — it's precision research with specific questions to answer.

### Research Process

**Step 1: Identify gaps** — What does the dossier need that we don't have?
- Missing statistics?
- Need a timeline of events?
- Need stakeholder positions?
- Need historical context or precedents?

**Step 2: Formulate search queries**
- Be specific: "India crude oil import percentage 2025" not "India oil"
- Use site operators: `site:rbi.org.in`, `site:pib.gov.in`
- Search in multiple languages if relevant (Hindi for domestic policy)
- Check academic sources: Google Scholar for background research

**Step 3: Verify and cross-reference**
- Never accept a single source for a key claim
- Check the date — is this current?
- Check the source — is this a credible publication?
- Check for corrections or retractions

**Step 4: Structure findings**
Return results in dossier-compatible format:
```json
{
  "query": "What question were we answering",
  "findings": [
    {
      "fact": "The specific finding",
      "source": "Publication name",
      "url": "Direct URL",
      "date": "Publication date",
      "credibility_tier": 1,
      "verified_against": ["Second source name"]
    }
  ],
  "gaps_remaining": ["What we still couldn't find"]
}
```

### Search Priority
1. Official government/institutional sources
2. Wire services (Reuters, AP, AFP)
3. Established national media
4. International quality press
5. Domain-specific publications (economic journals, defense magazines)
6. Social media / user-generated — LAST resort, always attributed

---

## Learning Log

### Entry: Initial
- Indian government sources (PIB, ministries) often have data not covered by media
- RBI databases are underutilized — contain excellent economic data for fact dossiers
- Google Scholar is valuable for historical context in geopolitical stories
