# Skill: Copyright Clearance
## Module: pms
## Trigger: Any content using third-party assets (footage, images, music, quotes)
## Inputs: asset_list, source_information, usage_type
## Outputs: clearance_report, risk_flags, licensing_requirements
## Dependencies:
## Scripts: check-copyright.py

---

## Instructions

Verify copyright clearance for every third-party asset before publication.

### Asset Categories & Rules

**Stock Footage/Images**: Licensed via Shutterstock, Pexels, etc.
- Verify license type (editorial vs commercial)
- Editorial licenses: Can only be used in news/educational context
- Save license documentation for every purchase

**News Clips**: Reuters, AP, other news agencies
- Fair use applies for commentary/criticism (limited duration)
- Safe: 5-10 seconds of news footage with commentary overlay
- Risky: 30+ seconds without substantial transformation

**Music**: Background music, sound effects
- Must be licensed (YouTube Audio Library, Epidemic Sound, Artlist)
- Never use copyrighted music — even 10 seconds triggers Content ID
- AI-generated music is a grey area — use licensed alternatives

**Government/Official Sources**: Press releases, official data, government footage
- Generally free to use for news reporting
- Attribute the source
- Indian government content: PIB releases are free for media use

**Social Media Content**: Tweets, posts, screenshots
- Screenshots of public posts: Generally acceptable with attribution
- Embedding is preferred over screenshots (for X/Twitter)
- Never use someone's personal photos without permission

### Clearance Report Format
```json
{
  "totalAssets": 15,
  "cleared": 13,
  "flagged": 2,
  "flags": [
    { "asset": "Factory footage clip", "issue": "Editorial license only — verify context", "risk": "medium" }
  ],
  "verdict": "proceed_with_caution"
}
```

---

## Learning Log

### Entry: Initial
- YouTube Content ID strikes are the biggest risk — music is the #1 cause
- Fair use for news commentary is strong in India but test boundaries carefully
- Keep a license documentation folder per video — protection against future claims
