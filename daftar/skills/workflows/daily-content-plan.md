# Skill: Daily Content Plan Workflow
## Module: daftar
## Trigger: Start of business day, morning planning session
## Inputs: date, brand_slugs[], active_signals[], content_backlog, team_availability
## Outputs: daily_plan, priority_assignments[], scheduling_decisions
## Dependencies: signals/detection/event-detection.md, narrative/editorial/topic-selection.md, distribution/cross-platform-scheduling.md, distribution/release-cadence-management.md
## Scripts:

---

## Instructions

Generate the daily content plan each morning — what to produce, who produces it, and when to publish.

### Daily Planning Process

#### Step 1: Signal Scan (8:00 AM)
- Check Khabri for overnight signals
- Assess: Any breaking developments requiring immediate coverage?
- Identify: Top 3 signals by relevance × velocity
- Load: `signals/detection/event-detection.md` for classification

#### Step 2: Backlog Review (8:15 AM)
- Review content in progress (carryover from yesterday)
- Check: Any deliverables stuck in review/revision?
- Assess: Any scheduled content that needs updating due to overnight developments?

#### Step 3: Topic Selection (8:30 AM)
- Run topic selection scoring for top signals
- Cross-reference with evergreen content backlog
- Decide: What new content to start today?
- Load: `narrative/editorial/topic-selection.md`

#### Step 4: Assignment (8:45 AM)
- Match topics to available team members
- Consider: Skills, current workload, quality tier requirements
- Load: `production/automation/production-capacity-matching.md`

#### Step 5: Schedule (9:00 AM)
- Set publish targets for today's content
- Coordinate cross-platform sequencing
- Load: `distribution/cross-platform-scheduling.md`

### Daily Plan Output Format

```
## Daily Content Plan — [Date]

### Breaking/Urgent
1. [Topic] — [Brand] — [Format] — [Assigned to] — Publish by [time]

### Planned Production
2. [Topic] — [Brand] — [Format] — [Assigned to] — Publish at [time]
3. [Topic] — [Brand] — [Format] — [Assigned to] — Publish at [time]

### Carryover (In Progress)
4. [Topic] — Status: [stage] — ETA: [time]

### Evergreen (If Bandwidth Available)
5. [Topic] — [Brand] — [Format] — Low priority

### Platform Activities
- YouTube: [n] videos scheduled
- Shorts: [n] scheduled
- X/Twitter: [n] tweets planned
- Instagram: [n] posts/stories planned
- LinkedIn: [n] posts planned

### Team Capacity
- [Person]: [assigned tasks, % utilized]
- [Person]: [assigned tasks, % utilized]
```

### Decision Rules
- **Breaking news overrides everything** — reschedule planned content
- **Don't over-plan** — leave 20% buffer for unexpected events
- **Balance brands** — ensure both Squirrels and Breaking Tube get attention daily
- **Cadence check** — verify daily plan meets cadence targets per platform

### GI Integration
- GI can pre-populate the daily plan based on signals and patterns
- GI suggests assignments based on team member strengths and availability
- Tier 3+: GI predicts which topics will perform best today

---

## Learning Log

### Entry: Initial
- Morning planning session (15-20 minutes) saves 2+ hours of reactive scrambling throughout the day
- Leaving 20% buffer is critical — breaking news occurs 3-4 days per week
- Pre-populated plans from GI accepted with minor modifications 70% of the time
