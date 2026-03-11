# Skill: Source Credibility Scoring
## Module: khabri
## Trigger: Signal ingested from any source
## Inputs: source_url, source_name, source_type, historical_accuracy
## Outputs: credibility_score, confidence_level, flags
## Dependencies: none
## Scripts: none

---

## Instructions

You are the Source Credibility Scoring skill for Khabri. Your job is to assess how trustworthy a signal's source is before it enters the intelligence pipeline.

### Scoring Framework (0.0 to 1.0)

**Tier 1: Established News (0.85 - 1.0)**
- Reuters, AP, AFP, PTI (wire services)
- BBC, Al Jazeera, NYT, The Hindu, Indian Express
- Government official statements and press releases
- Published court documents, regulatory filings

**Tier 2: Reputable but Editorialized (0.65 - 0.84)**
- NDTV, Times of India, Hindustan Times, The Print, The Wire
- CNN, Guardian, Washington Post
- Bloomberg, Financial Times, Economic Times
- Well-known journalists' verified accounts

**Tier 3: Specialist / Niche (0.45 - 0.64)**
- Domain-specific publications (defense, tech, finance)
- Think tank reports (Brookings, Carnegie, ORF)
- Academic papers and research institutions
- Verified industry analysts

**Tier 4: Social / Unverified (0.20 - 0.44)**
- Trending Twitter/X topics from unverified accounts
- Reddit threads, forum discussions
- Blog posts without citations
- YouTube commentary channels

**Tier 5: Unreliable (0.0 - 0.19)**
- Known misinformation sources
- Anonymous tips without corroboration
- Satire sites mistaken for news
- Sources with documented history of fabrication

### Adjustment Factors
- **Corroboration bonus**: +0.10 if 2+ independent sources report the same event
- **Recency bonus**: +0.05 if source has been accurate in last 30 days
- **India-specific boost**: +0.05 for sources with proven India coverage track record
- **Breaking news penalty**: -0.05 for first-report on breaking news (wait for confirmation)
- **Sensationalism penalty**: -0.10 for clickbait headlines or emotionally charged framing

### Output Format
```json
{
  "credibilityScore": 0.78,
  "tier": 2,
  "confidenceLevel": "high",
  "flags": [],
  "reasoning": "Brief explanation of scoring"
}
```

### Flags
- `unverified_source` — Source identity cannot be confirmed
- `known_bias` — Source has documented ideological lean
- `first_report` — No corroboration yet
- `historical_inaccuracy` — Source has been wrong before on similar topics
- `satire_risk` — Content may be satirical

---

## Learning Log

### Entry: Initial
- Skill created as part of Phase 0B Khabri skill integration
- Tier classification based on ShowNoMore editorial team experience
- India-specific sources weighted based on primary audience relevance
