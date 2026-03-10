# Skill: Fact-Check Shield
## Module: yantri
## Trigger: Pre-publication review, content verification
## Inputs: draft_content, fact_dossier
## Outputs: verification_report, flagged_claims, corrections_needed
## Dependencies: narrative/research/fact-dossier-building.md
## Scripts:

---

## Instructions

Every claim in every deliverable must trace back to a verified fact in the dossier. This skill performs the final verification pass.

### Verification Process

1. **Extract all claims** from the draft (statistics, quotes, dates, attributions)
2. **Cross-reference** each claim against the fact dossier
3. **Flag** any claim that:
   - Doesn't appear in the dossier (unverified addition)
   - Has been paraphrased in a way that changes meaning
   - Uses stronger language than the evidence supports
   - Attributes to the wrong source
   - Uses outdated data when newer data exists

### Severity Levels
- **Critical**: Factual error that could damage credibility or have legal implications → MUST fix
- **Major**: Misleading framing or missing attribution → SHOULD fix
- **Minor**: Imprecise language or rounding errors → COULD fix

### Common Fact-Check Failures
- Stating correlation as causation: "X caused Y" when data only shows they correlate
- Using outdated statistics when newer data exists
- Quoting someone out of context
- Mixing up millions/billions/crores/lakhs
- Attributing positions to people who didn't explicitly state them
- Using "according to reports" without specifying which reports

### Output Format
```json
{
  "totalClaims": 24,
  "verified": 22,
  "flagged": 2,
  "flags": [
    {
      "claim": "The exact claim text",
      "location": "Section/timestamp",
      "issue": "What's wrong",
      "severity": "major",
      "correction": "What it should say",
      "dossierRef": "Which dossier entry to check"
    }
  ],
  "verdict": "pass_with_corrections"
}
```

---

## Learning Log

### Entry: Initial
- Most common failure: paraphrasing statistics in a way that changes magnitude
- Number format errors (lakhs vs millions) happen frequently — always verify
- A single factual error can trigger community notes on X — prevention is critical
