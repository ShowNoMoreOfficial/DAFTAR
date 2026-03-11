# Skill: GI Organizational Learning
## Module: daftar
## Trigger: Cross-domain pattern synthesis, skill performance review, monthly learning cycle
## Inputs: performance_data, skill_executions[], department_metrics, content_analytics
## Outputs: learning_insights[], skill_updates, organizational_patterns, recommendations
## Dependencies: gi/behavioral-principles.md, gi/tier-definitions.md, analytics/feedback/skill-performance-scoring.md
## Scripts:

---

## Instructions

Guide the GI's ability to synthesize learnings across all domains and update the skill ecosystem. The GI is the only entity that reads across ALL domains.

### Cross-Domain Mental Model

The GI maintains awareness of:
1. **Signals** (Khabri): What's happening in the world that's relevant
2. **Narratives** (Yantri): What stories are in production and their status
3. **Production** (PMS): Who's working on what, capacity, deadlines
4. **Platforms** (Relay): What's scheduled, what's performing, what's trending
5. **Analytics** (HOCCR): How content is performing, audience behavior, revenue
6. **Brand**: Brand health, voice consistency, competitive position
7. **People**: Team engagement, workload, skills, growth

### Learning Synthesis Process

#### Daily Synthesis
- Scan for anomalies: Unusual performance, unexpected blocks, missed deadlines
- Check signal-to-delivery pipeline health: Are signals being processed efficiently?
- Note patterns: Which skills are being loaded most? Which are performing well?

#### Weekly Synthesis
- Aggregate content performance across all brands and platforms
- Identify top and bottom performing content + correlated skill usage
- Check team velocity trends across departments
- Detect emerging patterns: Topics gaining traction, audience behavior shifts

#### Monthly Learning Cycle
Detailed in `workflows/monthly-learning-cycle.md`:
1. Pull all performance data
2. Score every skill that was used
3. Identify top/under-performing skills
4. Generate revision recommendations
5. Update Learning Logs across skill files
6. Generate Monthly Learning Report for Admin

### Pattern Detection

#### Content Patterns
- "Data-first hooks outperform question hooks by 23% for The Squirrels"
- "Breaking Tube's quick takes published within 4 hours get 3x views"
- "Tuesday 7 PM IST consistently delivers highest Day 1 views"

#### Operational Patterns
- "Review stage is the consistent bottleneck — average 6 hours vs 2-hour target"
- "Cross-department dependencies add 40% to delivery time"
- "Team velocity drops 20% during last week of month (fatigue pattern)"

#### Team Patterns
- "Team members with morning starts complete 15% more tasks"
- "Contractor onboarding takes 5 days on average — skill files could help"
- "Engagement drops when streak nudges are paused"

### Skill File Updates

When the GI identifies a pattern with sufficient confidence:
1. **Verify**: Pattern observed in 3+ instances over 2+ weeks
2. **Quantify**: Attach specific metrics to the pattern
3. **Draft**: Write a Learning Log entry
4. **Review threshold**:
   - Auto-update: Low-risk learning entries (performance data, timing patterns)
   - Manual review: High-risk entries (strategy changes, voice modifications, editorial rules)
5. **Update**: Add entry to relevant skill file's Learning Log section

### Learning Log Entry Format
```markdown
### Entry: [Date]
- [Pattern observed with specific metrics]
- [Number of observations and confidence level]
- [Recommendation for skill adjustment]
- Source: [auto | manual | monthly-review]
```

### Organizational Memory

The GI should build and maintain organizational memory:
- **What works**: Proven strategies, successful patterns, effective workflows
- **What doesn't**: Failed experiments, underperforming approaches, avoided mistakes
- **Who knows what**: Team expertise mapping for routing questions/tasks
- **Institutional knowledge**: Lessons that would otherwise be lost when team members leave

### Reporting

#### For ADMIN
- Monthly Learning Report: Top patterns, skill health scores, strategic recommendations
- Quarterly Strategy Review: Are we improving? Where are the biggest gaps?

#### For DEPT_HEAD
- Team performance trends: What's working in their department
- Skill usage in their domain: Which skills are most/least used
- Specific improvement recommendations

---

## Learning Log

### Entry: Initial
- Cross-domain pattern detection is the GI's highest-value capability — insights no single person can see
- Auto-updating Learning Logs works well for quantitative patterns but needs human review for qualitative ones
- Monthly Learning Cycle catches patterns that daily/weekly synthesis misses (longer-term trends)
- Organizational memory becomes increasingly valuable as team grows — prevents knowledge loss
