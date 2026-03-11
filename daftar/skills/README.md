# Daftar Skills Ecosystem

This folder contains the intelligence layer for all Daftar modules. Each `.md` file is a **skill** — a set of instructions that the LLM reads at runtime to perform its work.

## Domains

| Domain | Module | Description |
|--------|--------|-------------|
| `/signals` | Khabri | Signal detection, tracking, analysis |
| `/narrative` | Yantri | Editorial, voice, research, audience intelligence |
| `/production` | PMS + Yantri | Long-form, short-form, support assets, automation |
| `/platforms` | Relay + Yantri | Platform-specific optimization (YouTube, X, Meta, LinkedIn, SEO, PPC) |
| `/distribution` | Relay | Cross-platform scheduling and cadence |
| `/analytics` | HOCCR + GI | Performance, revenue, feedback loops |
| `/brand` | Daftar Core | Brand identity, business, finance |
| `/gi` | GI | Cross-domain intelligence, behavioral principles |
| `/workflows` | Daftar | Multi-skill orchestration chains |
| `/system` | Daftar | Infrastructure: tech stack, auth, model router |

## Skill File Format

Every skill `.md` file follows this structure:

```markdown
# Skill: [Name]
## Module: [owning module]
## Trigger: [what activates this skill]
## Inputs: [comma-separated data requirements]
## Outputs: [comma-separated output types]
## Dependencies: [other skill paths this skill needs]
## Scripts: [automation scripts this skill invokes]

---

## Instructions
[The actual intelligence — rules, logic, examples]

---

## Learning Log
[Auto-updated: what's worked, what hasn't]
```

## How Skills Execute

1. Module receives a trigger (signal, user action, scheduled event, GI instruction)
2. Module's orchestrator identifies which skills are needed
3. Orchestrator loads the relevant `.md` files (and ONLY those files)
4. Files are fed to the LLM as context + instructions
5. LLM produces output (decision, content, analysis)
6. Output is stored in the database and surfaced in Daftar UI
7. Analytics records the action for the learning loop
