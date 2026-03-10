# Skill: Production Capacity Matching
## Module: pms
## Trigger: New deliverable needs team assignment
## Inputs: deliverable_requirements, team_availability, skill_requirements, deadlines
## Outputs: assignment_recommendation, workload_impact, deadline_feasibility
## Dependencies: production/long-form/quality-tier-classification.md
## Scripts: match-capacity.py

---

## Instructions

Match deliverables to team members based on availability, skills, and current workload.

### Matching Process

1. **Requirements analysis**: What skills does this deliverable need?
   - Script writing, video editing, graphics, voiceover, review
2. **Availability check**: Query PMS for team workload
   - Who has capacity in the required timeframe?
   - Who is already overloaded?
3. **Skill match**: Who has the relevant skills?
   - Some editors are better at long-form, others at shorts
   - Some scriptwriters are better at political content, others at economic
4. **History check**: Who has worked on similar content?
   - Previous brand experience reduces ramp-up time
   - Reviewer who knows the topic catches more errors

### Workload Thresholds
- **Green (< 70%)**: Can take on new work comfortably
- **Yellow (70-90%)**: Can take on work but may need deadline flexibility
- **Red (> 90%)**: Should not receive new assignments unless urgent

### Assignment Rules
- Never assign to someone > 90% unless no alternative exists AND deadline is critical
- Prefer assigning to people who've worked on the brand before
- Balance workload across the team — don't let top performers burn out
- For Tier S/A content: assign the strongest available team member
- For Tier C content: can be assigned to anyone with basic skills

### Output Format
```json
{
  "deliverable": "Explainer: India's Semiconductor Crisis",
  "assignments": {
    "scriptwriter": { "userId": "...", "name": "...", "currentLoad": 0.65, "match": "brand_experience" },
    "editor": { "userId": "...", "name": "...", "currentLoad": 0.55, "match": "skill_specialization" },
    "reviewer": { "userId": "...", "name": "...", "currentLoad": 0.40, "match": "domain_expertise" }
  },
  "deadlineFeasible": true,
  "workloadImpact": "All assigned team members remain below 80% load"
}
```

---

## Learning Log

### Entry: Initial
- Assigning based on brand experience reduces revision cycles by ~30%
- Team members above 85% load produce measurably lower quality work
- GI should proactively suggest rebalancing when workload disparity exceeds 25%
