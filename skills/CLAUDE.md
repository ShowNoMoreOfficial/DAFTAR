# Skills — Intelligence Skill Files Context

## What This Is
160+ markdown skill files that get loaded by SkillOrchestrator and injected into LLM prompts as context. They encode domain knowledge, brand voice, platform rules, and workflow definitions.

## Directory Structure
```
/skills/
├── analytics/       — Performance, revenue, feedback analysis skills
├── brand/           — Brand identity + business skills per brand
│   └── identity/    — Voice, style, positioning per brand
├── distribution/    — Cross-platform scheduling + cadence
├── gi/              — GI behavioral rules, tier definitions
├── narrative/       — Editorial voice, research, audience skills
├── platforms/       — Platform-specific optimization (YouTube, X, etc.)
├── pms/             — Task review checklists
├── production/      — Long-form, short-form, automation skills
├── signals/         — Signal detection and processing
├── system/          — Tech stack, auth, deployment docs
└── workflows/       — Pipeline orchestration definitions
```

## How Skills Are Loaded
1. SkillOrchestrator (/src/lib/skill-orchestrator.ts, 651 lines) reads .md files
2. Files are parsed for frontmatter (name, type, domain, triggers)
3. Relevant skills are selected based on context (brand, platform, content type)
4. Skill content is injected into LLM prompts alongside user input

## Skill File Format
```markdown
---
name: skill-name
type: production|narrative|platform|brand|system|workflow
domain: specific-domain
triggers: [list, of, trigger, contexts]
---

# Skill content here
Instructions, rules, examples that the LLM should follow.
```

## Rules
- NEVER delete skill files without approval — they affect all content generation
- New skills must follow the frontmatter format above
- Brand identity skills live in /skills/brand/identity/[brand-slug]/
- Template for new brands: /skills/brand/identity/_template/
