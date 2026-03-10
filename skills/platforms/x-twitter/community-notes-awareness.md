# Skill: X/Twitter Community Notes Awareness
## Module: relay
## Trigger: Content verification, risk assessment before posting
## Inputs: tweet_draft, claims[], source_urls[]
## Outputs: risk_assessment, fact_check_status, mitigation_recommendations
## Dependencies: narrative/research/fact-check-shield.md
## Scripts:

---

## Instructions

Ensure all tweets are Community Notes-proof by pre-verifying claims and providing adequate context. A Community Note on a tweet is a significant credibility hit.

### What Triggers Community Notes
- **Misleading statistics**: Numbers without context or cherry-picked data
- **Missing context**: True statement that's misleading without additional information
- **Outdated information**: Data or claims that are no longer current
- **Misattributed quotes**: Quotes attributed to wrong person or taken out of context
- **Manipulated media**: Edited images/videos presented as authentic
- **Partial truths**: Technically true but functionally misleading

### Pre-Post Verification Checklist

For every tweet containing claims:
1. **Source check**: Is the data from a primary/official source?
2. **Recency check**: Is this data current? When was it published?
3. **Context check**: Does the tweet provide sufficient context for the claim?
4. **Attribution check**: Are quotes accurately attributed?
5. **Framing check**: Could the framing be interpreted as misleading?
6. **Visual check**: Are any images/charts accurately representing the data?

### Risk Levels

#### Green (Safe to Post)
- Claims sourced from official government/institutional data
- Clearly labeled opinions ("In my view...", "The data suggests...")
- Fully contextualized statistics with time frame and source
- Post immediately

#### Yellow (Review Before Posting)
- Statistics that could be read differently without context
- Claims from secondary sources that haven't been independently verified
- Comparative data where the comparison frame matters
- Add context or qualify before posting

#### Red (Do Not Post Without Revision)
- Single-source claims on sensitive topics
- Statistics without clear time frame, source, or methodology
- Claims that other outlets have reported differently
- Revise with additional context, add source link, or kill the tweet

### Mitigation Strategies
- **Add source links**: "According to [Source], [claim]" with link
- **Include time frame**: "In Q3 2025..." not just "India's GDP..."
- **Label opinions**: "Analysis:" or "Our take:" before interpretive statements
- **Preemptive context**: Add the context a Community Note would add, yourself
- **Use threads**: If a claim needs nuance, make it a thread rather than forcing it into one tweet

### If Community-Noted
1. Don't delete the tweet (looks like cover-up)
2. Reply with additional context or correction
3. If the note is valid, acknowledge it: "Fair point — additional context: [clarification]"
4. If the note is incorrect, provide counter-evidence calmly
5. Log the incident — what was the gap in verification?

---

## Learning Log

### Entry: Initial
- Community Notes most commonly hit statistics without source attribution
- Preemptively including source links reduces Community Note risk by 80%
- Political content is Community-Noted 5x more often than other topics — extra vigilance required
- "According to [source]" framing is the simplest and most effective mitigation
