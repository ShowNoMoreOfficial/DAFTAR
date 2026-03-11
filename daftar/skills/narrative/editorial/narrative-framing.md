# Skill: Narrative Framing
## Module: yantri
## Trigger: Angle selected, ready to frame the narrative
## Inputs: angle, fact_dossier, brand_voice, target_audience, competitor_frames
## Outputs: frame, positioning, key_arguments, counter_arguments
## Dependencies: narrative/editorial/topic-selection.md, narrative/voice/diplomatic-skill.md
## Scripts:

---

## Instructions

Narrative framing is how you position a story. The same facts can be framed as triumph or tragedy, opportunity or threat, progress or regression. Your job is to choose the frame that serves the brand's editorial identity while being intellectually honest.

### Framing Approaches

**1. Analytical Frame** — "Here's what the data tells us"
- Lead with numbers, patterns, trends
- Minimize emotional language
- Best for: The Squirrels, economic/policy topics
- Audience expectation: "Teach me something I didn't know"

**2. Stakes Frame** — "Here's what's at stake for you"
- Connect macro events to personal impact
- Use "what this means for your job/wallet/family"
- Best for: Breaking Tube, domestic policy, economic news
- Audience expectation: "How does this affect ME?"

**3. Power Dynamics Frame** — "Follow the power, follow the money"
- Identify who benefits, who loses, who's silent
- Map relationships between actors
- Best for: Political coverage, corporate news, geopolitics
- Audience expectation: "Show me the hidden dynamics"

**4. Historical Parallels Frame** — "We've seen this before"
- Connect current events to historical precedents
- Show patterns across time
- Best for: Geopolitical analysis, policy decisions, market movements
- Audience expectation: "Give me perspective"

**5. Contrarian Frame** — "Everyone says X, but actually Y"
- Challenge the dominant narrative with evidence
- Requires strong factual backing — never contrarian for shock value
- Best for: Stories where mainstream coverage has a blind spot
- Audience expectation: "Challenge my assumptions"

### Framing Rules
- The frame must be supported by the fact dossier — never frame beyond your evidence
- Acknowledge counter-arguments; audiences respect intellectual honesty
- The frame should feel like a natural extension of the brand voice
- Don't adopt frames that are divisive along political/religious lines unless the brand explicitly takes positions
- If multiple frames work, choose the one with the highest audience engagement potential

### Sensitivity Guardrails
- Religious topics: Always analytical frame, never stakes/power dynamics
- Caste/class issues: Use data-first approach, avoid anecdotal framing
- Military/defense: Factual frame, avoid speculation about capabilities
- Gender issues: Center data and lived experience, avoid prescriptive framing

### Output Format
```json
{
  "primaryFrame": "analytical",
  "positioning": "This is a data story about economic impact, not a political opinion",
  "keyArguments": ["Argument 1 with data", "Argument 2 with data"],
  "counterArguments": ["Likely counter 1", "Likely counter 2"],
  "acknowledgement": "How we acknowledge the counter without undermining our frame",
  "tonalGuidance": "Measured, data-driven, slightly provocative in the hook but balanced throughout"
}
```

---

## Learning Log

### Entry: Initial
- Analytical frame is default for The Squirrels — highest engagement correlation
- Breaking Tube leans stakes frame for domestic content, power dynamics for geopolitics
- Contrarian frame high-risk/high-reward — use sparingly but track performance
