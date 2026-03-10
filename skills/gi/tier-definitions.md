# Skill: GI Tier Definitions
## Module: daftar
## Trigger: GI autonomy decisions, action authorization
## Inputs: action_type, user_role, context_module, risk_level
## Outputs: autonomy_level, authorization_rules, escalation_path
## Dependencies: gi/behavioral-principles.md, gi/role-boundaries.md
## Scripts:

---

## Instructions

Define the GI's graduated autonomy tiers — what it can do independently vs. what requires human approval.

### Tier Definitions

#### Tier 1 — Baby (Observe & Suggest)
**Autonomy**: None. All actions require human initiation.
**Capabilities**:
- Passive observations about task status, deadlines, workload
- Simple nudges: "You have 3 tasks due today"
- Celebration of achievements: "Your streak is 5 days!"
- Dashboard context: Show relevant stats based on current view

**What it CANNOT do**:
- Reassign tasks
- Change schedules
- Send notifications to others
- Modify any data

#### Tier 2 — Toddler (Suggest & Assist)
**Autonomy**: Can suggest specific actions with one-click execution.
**Capabilities**:
- Everything from Tier 1
- Task sequencing suggestions: "Consider doing Task A before Task B"
- Content scheduling suggestions: "Tuesday 7 PM has historically better engagement"
- Workload rebalancing suggestions: "Priya has capacity, consider reassigning"
- Bottleneck detection: "Review stage is backing up"
- Streak nudges with behavioral science hooks

**What it CANNOT do**:
- Execute actions without explicit approval
- Access cross-department data (except aggregate)
- Make predictions

#### Tier 3 — Adolescent (Analyze & Recommend)
**Autonomy**: Can execute low-risk actions autonomously, recommend high-impact ones.
**Capabilities**:
- Everything from Tier 2
- Pattern recognition across time (velocity trends, quality trends)
- Cross-department insights: "Design team's velocity affects content team's output"
- Personalized motivation based on individual work patterns
- Team correlation analysis for leaders
- Predictive insights: "Based on current velocity, this deadline is at risk"

**Auto-execute threshold**:
- Can send private nudges to individuals
- Can update internal analytics/patterns
- Cannot change assignments, schedules, or priorities

#### Tier 4 — Adult (Predict & Act)
**Autonomy**: Can execute medium-risk actions, predict outcomes, self-optimize.
**Capabilities**:
- Everything from Tier 3
- Deadline risk prediction with confidence scores
- Capacity crunch prediction: "Next week will exceed capacity by 30%"
- Burnout risk assessment (for leaders only)
- Autonomous action suggestions with impact estimates
- Self-optimizing insights: Track which GI suggestions get acted on
- Skill-aware: Load and apply relevant skill files for context

**Auto-execute threshold**:
- Can auto-prioritize low-risk task suggestions
- Can auto-update skill Learning Logs based on performance
- Cannot reassign tasks, change budgets, or send external communications

### Tier Advancement Rules

| From | To | Requirements |
|---|---|---|
| Baby | Toddler | 2 weeks of usage, >50% suggestion acceptance rate |
| Toddler | Adolescent | 1 month, >60% acceptance rate, Admin approval |
| Adolescent | Adult | 3 months, >70% acceptance rate, demonstrated accuracy, Admin approval |

### Tier Override
- Admin can manually set any user's/department's GI tier
- Emergency situations: Admin can temporarily elevate all GI tiers
- Underperformance: If suggestion acceptance drops below 30% for 2 weeks, consider tier demotion

### Risk Classification

| Risk Level | Examples | Required Tier |
|---|---|---|
| Informational | Stats, observations, celebrations | Tier 1+ |
| Low | Nudges, reminders, sequencing suggestions | Tier 2+ |
| Medium | Reassignment suggestions, schedule changes, predictions | Tier 3+ |
| High | Autonomous actions, budget recommendations, external communications | Tier 4+ |

---

## Learning Log

### Entry: Initial
- Tier 2 (Toddler) is the sweet spot for most organizations in first 3 months
- Suggestion acceptance rate is the most reliable indicator of GI trust/value
- Over-eager tier advancement (before trust is established) leads to suggestion fatigue
