# Skill: Fact Dossier Building
## Module: yantri
## Trigger: Narrative approved for production — research phase begins. Also triggered by manual editorial request or FLASH urgency signal.
## Inputs: signal_data, topic, narrative_angle, brand_slug, urgency_class, existing_sources[]
## Outputs: fact_dossier (structured JSON), source_audit, confidence_scores, gaps_identified
## Dependencies: narrative/editorial/topic-selection.md, narrative/editorial/angle-detection.md, narrative/editorial/sensitivity-classification.md
## Scripts:

---

## Instructions

You are the Fact Dossier Building skill. The FactDossier is the single source of truth for all downstream content. Every claim in every script, title, tweet, thread, and carousel must trace back to a fact in this dossier. If it's not in the dossier, it doesn't go in the content. Period.

**Why this matters**: The Squirrels' #1 asset is credibility. Breaking Tube's #1 asset is accessible credibility. One unsourced claim that turns out to be wrong damages both brands irreparably. The FactDossier is the firewall between analysis and hallucination.

---

### 1. DOSSIER ARCHITECTURE

Every FactDossier has 7 mandatory sections. No section can be empty (even if it only has 1 entry).

```json
{
  "meta": {
    "topic": "India's Semiconductor Subsidy — Cost Overrun Risk Analysis",
    "dossier_id": "FD-2026-0312-SEMI",
    "compiled_by": "yantri_research",
    "compiled_at": "2026-03-12T14:00:00Z",
    "angle": "Historical precedent shows 3x cost overrun pattern",
    "brand": "the_squirrels",
    "urgency": "this_week",
    "locked": false,
    "version": 1,
    "last_updated": "2026-03-12T14:00:00Z"
  },

  "timeline": [],
  "key_facts": [],
  "statistics": [],
  "stakeholders": [],
  "quotes": [],
  "historical_context": [],
  "counter_arguments": []
}
```

---

### 2. SECTION SPECIFICATIONS

#### 2.1 Timeline

Chronological sequence of events that form the narrative backbone.

```json
{
  "date": "2026-03-08",
  "event": "India announces $10B semiconductor fab subsidy under Modified ISMC scheme",
  "source": "Press Information Bureau",
  "source_tier": 1,
  "url": "https://pib.gov.in/...",
  "verified": true,
  "significance": "Triggering event — the announcement that sparked the coverage"
}
```

**Rules**:
- Minimum 5 timeline entries for any dossier
- Each entry must have a specific date (not "recently" or "last month")
- Source must be named (not "according to reports")
- Significance field explains WHY this event matters to the narrative
- For developing stories: mark the most recent event and note that the situation is evolving

---

#### 2.2 Key Facts

Core factual claims that the content will rely on. These are the load-bearing facts — if one is wrong, the argument collapses.

```json
{
  "fact": "India imports 85% of its crude oil from foreign sources",
  "source_primary": "Petroleum Planning and Analysis Cell (PPAC), Ministry of Petroleum",
  "source_secondary": "IEA India Energy Outlook 2025",
  "source_tier": 1,
  "verified": true,
  "confidence": 0.95,
  "last_verified": "2026-03-10",
  "context": "This percentage has remained stable at 83-87% for the past decade",
  "usage_note": "Use with time qualifier — 'as of FY2025-26' — percentage fluctuates slightly by quarter"
}
```

**Rules**:
- **Minimum 2 independent sources per key fact** (Tier 1 or Tier 2 sources)
- **For politically sensitive facts: 3 sources minimum**
- Every fact must have a confidence score (0.0-1.0):
  - 0.9-1.0: Multiple Tier 1 sources agree, directly verifiable
  - 0.7-0.89: Tier 1-2 sources agree, may have minor variations in exact figures
  - 0.5-0.69: Single source or Tier 3 sources, plausible but needs caveats
  - Below 0.5: Do not include — insufficient evidence
- Include `usage_note` for facts that need careful handling (rounding, time qualifiers, scope limitations)

---

#### 2.3 Statistics

Quantitative data that supports the narrative. Statistics are facts with numbers — they deserve their own section because they require special formatting rules.

```json
{
  "stat": "India's semiconductor import bill: $62 billion annually",
  "period": "FY 2025-26 (estimated)",
  "source": "India Electronics and Semiconductor Association (IESA)",
  "source_tier": 2,
  "verified": true,
  "confidence": 0.85,
  "trend": "Growing at 23% CAGR since 2020",
  "comparison": "This exceeds India's entire defense budget ($58B in FY25-26)",
  "squirrels_framing": "$62 billion — more than India's entire defense budget — leaves the country every year for chips India can't make",
  "breaking_tube_framing": "₹5.2 lakh crore — har saal chips ke liye bahar jata hai. Defense budget se bhi zyada."
}
```

**Statistical formatting rules**:
- Always specify the TIME PERIOD (FY, calendar year, quarter, month)
- Always specify the SOURCE of the number
- Include TREND if available (is this going up, down, stable?)
- Include at least one COMPARISON that makes the number meaningful (larger than X, equivalent to Y per person)
- Pre-compute brand-specific framing:
  - The Squirrels: USD, global comparisons, strategic framing
  - Breaking Tube: INR (₹), personal impact framing, per-capita or per-household where possible
- Round for memorability: "$62 billion" not "$61.7 billion" UNLESS precision is the hook
- Never present a stat without context — a number alone is meaningless

**Statistical integrity rules**:
- Don't compare nominal and real figures without noting the difference
- Don't compare different time periods without adjustment
- Don't extrapolate beyond what the data supports — "if current trends continue" is acceptable; "this WILL happen" is not
- When using growth rates, specify the base: "23% growth" means nothing without knowing growth from what

---

#### 2.4 Stakeholders

All relevant actors, their positions, and their interests.

```json
{
  "stakeholder": "Government of India (MeitY)",
  "role": "Policy maker, subsidy provider",
  "position": "Strongly advocates semiconductor self-reliance as national security priority",
  "motivation": "Reduce China dependency, create manufacturing jobs, strategic autonomy",
  "source": "Minister's speech at India Semiconductor Mission launch, 2026-03-08",
  "source_tier": 1,
  "credibility_note": "Official position — note that public statements may overstate readiness/understate challenges"
}
```

**Stakeholder mapping rules**:
- Minimum 4 stakeholders per dossier
- Must include at least one stakeholder who OPPOSES or is SKEPTICAL of the dominant narrative
- For each stakeholder: What do they SAY? What do they WANT? Are these aligned?
- Include international stakeholders when relevant (how does the US/China/Taiwan view this?)
- The "overlooked stakeholder" (see angle-detection.md, Lens 2) should always be included

---

#### 2.5 Quotes

Direct quotes from relevant figures — usable in scripts, threads, and carousels.

```json
{
  "speaker": "N. Chandrasekaran",
  "title": "Chairman, Tata Group (Tata Electronics — shortlisted fab partner)",
  "quote": "We are committed to making India a semiconductor manufacturing hub. The talent is here, the demand is here.",
  "context": "Speaking at India Semiconductor Mission event, 2026-03-09",
  "source": "Economic Times interview",
  "source_tier": 2,
  "verified": true,
  "usage_note": "Pro-government position from a direct beneficiary of the subsidy — note potential bias when using"
}
```

**Quote rules**:
- Only EXACT quotes — paraphrasing goes in key_facts, not quotes
- Must have attribution (who said it, where, when)
- Include `usage_note` flagging potential bias, context, or spin
- Seek quotes from BOTH sides of the argument
- Government quotes are mandatory but should always be balanced with independent/critical voices
- Never fabricate or reconstruct quotes — if you don't have the exact words, paraphrase in key_facts with "according to" attribution

---

#### 2.6 Historical Context

Precedents, parallels, and background that enrich the analysis. This section directly feeds The Squirrels' signature "historical callback" approach.

```json
{
  "parallel": "Japan's VLSI Technology Research Association (1976-1980)",
  "relevance": "Government-funded semiconductor R&D consortium — structurally similar to India's approach",
  "outcome": "Japan became #1 in DRAM by 1986, but US retaliation (Section 301 tariffs, Plaza Accord) reversed gains by 1995",
  "budget_announced": "¥70 billion",
  "budget_actual": "¥300 billion (4.3x overrun)",
  "timeline_announced": "4 years",
  "timeline_actual": "10 years to market leadership, 20 years total cycle",
  "source": "Anchordoguy, 'Computers Inc.' (Cornell UP, 2000); METI historical data",
  "source_tier": 1,
  "analogy_strength": "Strong — similar scale, similar government-led model, similar late-starter position",
  "analogy_breaks_where": "India has a larger domestic market (demand side advantage), but weaker chemical supply chain than 1976 Japan"
}
```

**Historical context rules**:
- Must be SPECIFIC: year, country, policy, outcome, numbers
- Must include where the analogy BREAKS DOWN (intellectual honesty — this builds credibility)
- Minimum 2 historical parallels for The Squirrels dossiers
- Breaking Tube dossiers: 1 parallel minimum, framed accessibly
- Academic sources preferred for historical claims (books, papers, institutional reports)
- Do NOT use vague "history shows" framing — the point of this section is to enable SPECIFIC references

---

#### 2.7 Counter-Arguments

Arguments AGAINST the angle the content will take. Including these is not optional — it's what separates analysis from propaganda.

```json
{
  "counter_argument": "India's domestic market (1.4B people) creates demand that Japan/Korea/Taiwan didn't have — reducing dependency on exports and thus reducing geopolitical risk",
  "strength": "moderate",
  "source": "Dr. Ajay Sood, Principal Scientific Adviser, GOI statement 2026-02",
  "source_tier": 2,
  "rebuttal": "Domestic demand helps justify investment but doesn't change the physics/cost of fab construction. Market size doesn't reduce equipment costs or talent requirements.",
  "rebuttal_confidence": 0.8,
  "content_handling": "Acknowledge this point explicitly in the video. Don't strawman it. Present it fairly, then present the rebuttal with data."
}
```

**Counter-argument rules**:
- Minimum 2 counter-arguments per dossier — if you can't find counterarguments, your angle may be too uncontroversial to be interesting
- Rate each counter-argument's strength: "strong", "moderate", "weak"
- Include a rebuttal for each, with confidence score
- `content_handling` field tells the content engine HOW to address the counter-argument in the actual video/thread
- The strongest counter-arguments should be addressed in the video's middle section (builds credibility, shows intellectual honesty)
- NEVER ignore a strong counter-argument — if you can't rebut it, weaken your angle's claims

---

### 3. SOURCE CREDIBILITY TIERS

| Tier | Label | Sources | Trust level |
|------|-------|---------|-------------|
| **1** | Gold | Government data (RBI, PIB, MOSPI, MeitY), academic papers (peer-reviewed), court records, company filings (SEC/SEBI), international institutions (IMF, World Bank, IEA) | Direct use without caveats |
| **2** | Silver | Reuters, AP, Bloomberg, Financial Times, The Economist, established broadsheets (Hindu, Indian Express, Economic Times), institutional reports (McKinsey, BCG, IESA) | Direct use, cite source |
| **3** | Bronze | News websites, regional media, industry blogs, think-tank opinion pieces | Use with attribution ("According to...") |
| **4** | Unverified | Social media posts, anonymous sources, opinion columns, Reddit/Quora, unnamed "officials" | Cite only as "reports suggest" or "unverified reports indicate" — NEVER as standalone claims |

**Source escalation rules by claim type**:
| Claim type | Minimum tier | Minimum sources |
|---|---|---|
| Headline factual claim | Tier 1-2 | 2 |
| Statistical figure | Tier 1-2 | 2 (with matching methodology) |
| Quote attribution | Tier 1-2 | 1 (exact quote + named source) |
| Politically sensitive claim | Tier 1-2 | 3 |
| Historical fact | Tier 1-2 | 1 (academic/institutional) |
| Speculative/predictive claim | N/A | Frame as analysis, not fact |
| "According to" claim | Tier 3-4 | 1 (but must be clearly attributed) |

---

### 4. DOSSIER CONSTRUCTION PROTOCOL

#### Step 1: Rapid Scan (15 minutes)
- Collect 10-15 sources on the topic
- Identify the 5 most important facts
- Flag gaps — what CAN'T you verify yet?
- For FLASH urgency: this step IS the dossier. Ship a minimal version with 5 key_facts, 3 statistics, and 2 timeline events. Mark as v0.

#### Step 2: Deep Research (1-2 hours)
- Fill all 7 sections
- Cross-verify every statistic from 2+ sources
- Find historical parallels (2 minimum for The Squirrels)
- Map stakeholders and collect quotes
- Build counter-arguments section

#### Step 3: Confidence Audit
- Review every fact's confidence score
- Any fact below 0.7 must be either:
  - Upgraded (find additional sources)
  - Downgraded (add caveats: "estimates suggest", "according to")
  - Removed (if confidence < 0.5 and no additional sources available)
- Check for internal consistency — do your facts contradict each other?

#### Step 4: Brand Framing
- Pre-compute Squirrels framing for all statistics (USD, global comparisons, strategic lens)
- Pre-compute Breaking Tube framing (INR, personal impact, aam aadmi lens)
- This saves the content engine from having to reframe on the fly (reduces errors)

#### Step 5: Lock
- Set `locked: true`
- Content creation reads from the dossier but CANNOT modify it
- If new information emerges during production: create a new version (increment version number, note what changed)
- Never overwrite a locked dossier — append, don't replace

---

### 5. URGENCY-ADAPTED DOSSIER SIZES

| Urgency | Timeline entries | Key facts | Statistics | Stakeholders | Quotes | Historical | Counter-args | Build time |
|---------|-----------------|-----------|------------|--------------|--------|------------|--------------|------------|
| FLASH | 2-3 | 5 min | 3 min | 2 min | 1-2 | 0-1 | 1 | 15-30 min |
| IMMEDIATE | 3-5 | 8 min | 5 min | 3 min | 2-3 | 1 | 1-2 | 30-60 min |
| SAME-DAY | 5-8 | 10 min | 8 min | 4 min | 3-5 | 1-2 | 2 | 1-2 hours |
| THIS-WEEK | 8-12 | 15+ | 10+ | 5+ | 5+ | 2-3 | 3+ | 2-4 hours |
| SCHEDULED | 10-20 | 20+ | 15+ | 6+ | 8+ | 3+ | 4+ | 4-8 hours |

**The quality floor**: Even a FLASH dossier must have 5 verified key facts and 3 sourced statistics. Below that threshold, the content cannot be produced — the credibility risk is too high.

---

### 6. COMMON RESEARCH PITFALLS

| Pitfall | Example | Fix |
|---|---|---|
| **Single-source dependency** | Building the entire argument on one news report | Always cross-verify. If you can't find a second source, caveat the claim. |
| **Nominal vs real confusion** | Comparing 1986 yen to 2026 dollars without adjustment | Always note whether figures are inflation-adjusted. Convert to constant dollars for comparisons. |
| **Stale data** | Using 2022 statistics for a 2026 argument when updated data exists | Check source dates. Use the most recent available data. Note the date in the stat. |
| **Correlation as causation** | "Country X did Y, then Z happened, so Y caused Z" | Use causal language carefully. "Followed by" not "caused." Note confounding factors. |
| **Cherry-picked data** | Showing only the 3 data points that support the angle | Include contradictory data in counter_arguments. Intellectual honesty is non-negotiable. |
| **Missing the denominator** | "$10B subsidy" sounds huge. "$10B for a country with $3.5T GDP" sounds different. | Always provide denominator/context for large numbers. |
| **Outdated historical claims** | "Japan's semiconductor industry collapsed" (it actually transformed — different, not dead) | Verify historical outcomes with recent academic sources, not 20-year-old narratives. |

---

### 7. OUTPUT FORMAT

The complete dossier is a JSON document following the architecture in Section 1. The final output must include:

1. The full JSON dossier
2. A **source audit summary**: How many Tier 1/2/3/4 sources? Any single-source facts?
3. A **gaps report**: What couldn't you verify? What additional research would strengthen the dossier?
4. A **confidence summary**: Lowest-confidence fact and why

---

## Learning Log

### Entry: 2026-03-12 — Deep Build
- Dossiers with 10+ key facts produce higher-quality content than those with fewer
- Timeline sections are critical for explainer videos — they provide the narrative backbone
- Stakeholder mapping is most valuable for geopolitical content
- Pre-computed brand framings (Squirrels vs Breaking Tube) reduce content engine errors by eliminating on-the-fly reframing
- Counter-arguments section is the most underbuilt section — teams tend to skip it, but including it dramatically improves content credibility
- Historical context section directly enables The Squirrels' signature hook pattern
- FLASH dossiers (15-30 min) are viable but must meet the quality floor: 5 facts, 3 stats, all sourced
- The biggest research pitfall is single-source dependency — especially for statistics that "feel right" but only appear in one outlet
- Statistical framing (USD vs INR, per-capita, comparison-based) should be done at dossier stage, not content stage
- Locked dossier discipline prevents scope creep and fact drift during content production

[NEEDS INPUT]: Access to specific research databases, government data portals, and academic sources that ShowNoMore uses. Preferred fact-checking workflow. Examples of past dossiers (if any exist) to calibrate depth and format expectations.
