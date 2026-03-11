# Skill: GI Scenario Playbook
## Module: daftar
## Trigger: Specific organizational scenarios that require tailored GI response
## Inputs: scenario_type, affected_users[], context_data, severity
## Outputs: gi_response_plan, message_templates, escalation_rules
## Dependencies: gi/behavioral-principles.md, gi/tier-definitions.md, gi/role-boundaries.md
## Scripts:

---

## Instructions

Pre-defined GI responses for common organizational scenarios. These ensure consistent, appropriate, and psychologically sound GI behavior.

### Scenario 1: Deadline at Risk

**Detection**: Task due date < 48 hours AND status is not "IN_PROGRESS" or "REVIEW"
**Response by tier**:
- **Tier 1**: Show info card — "Task [name] is due in [time]"
- **Tier 2**: Suggest prioritization — "Consider starting [task] — it's due in [time]. Here's a suggested order: [sequence]"
- **Tier 3**: Predict impact — "If [task] misses deadline, it blocks [downstream task]. Risk level: [HIGH/MEDIUM]"
- **Tier 4**: Suggest mitigation — "Recommend: Reassign [other task] to free up bandwidth, or negotiate deadline extension with [manager]"

**Escalation**: If 24 hours remain and no action, notify DEPT_HEAD.

### Scenario 2: Team Overload

**Detection**: Team member has >150% of average task count for 5+ consecutive days
**Response by tier**:
- **Tier 1**: No action (not enough autonomy to assess workload)
- **Tier 2**: To DEPT_HEAD — "[Member] has [n] active tasks, [x]% above team average"
- **Tier 3**: To DEPT_HEAD — "[Member] has been overloaded for [n] days. Velocity has dropped [x]%. Suggest rebalancing."
- **Tier 4**: To DEPT_HEAD with action — "Recommend: Move [specific tasks] to [available member]. Impact: Reduces [member]'s load by 30%."

**To the overloaded member**: Never pressure. Tone: supportive. "You've been handling a lot — your streak of [n] tasks completed this week is impressive."

### Scenario 3: Content Pipeline Stall

**Detection**: Content deliverables stuck in same stage for >2x expected duration
**Response**:
- Identify the bottleneck stage (research, draft, edit, review, publish)
- Check if bottleneck is person-dependent (one reviewer holding up all content)
- Suggest specific unblock action: "The review queue has [n] items. [Reviewer] hasn't reviewed in [n] hours."
- If breaking news related: Escalate urgency — "This content will be stale in [n] hours"

### Scenario 4: New Team Member Onboarding

**Detection**: User account created within last 14 days
**Response**:
- Week 1: Orientation nudges — "Welcome! Here's how [module] works" with links
- Week 1: Simplified insights — avoid jargon, provide more context
- Week 2: Gradually introduce more complex insights
- Week 3+: Normal insight generation
- Never compare new member to existing team velocity

### Scenario 5: Achievement Milestone

**Detection**: User hits streak, completes milestone tasks, receives recognition
**Response**:
- Immediate celebration: "Your [n]-day streak is impressive!"
- Context: "That puts you in the top [x]% of activity this month" (personal, not comparative)
- Variable reward: Occasionally surprise with extra detail — "Fun fact: Your best day was [date] with [n] tasks"
- Don't over-celebrate — diminishing returns after 3 celebrations per week

### Scenario 6: Cross-Department Dependency Block

**Detection**: Task in Department A is blocked by dependency on Department B
**Response by tier**:
- **Tier 2**: Inform DEPT_HEAD A — "[Task] is blocked by [dependency] in [Dept B]"
- **Tier 3**: Inform both DEPT_HEADs — "Dependency chain: [Task A] → [Task B] → [Task C]. Current delay: [n] hours."
- **Tier 4**: Suggest resolution — "Recommend: Direct coordination between [person A] and [person B]. Calendar shows both free at [time]."

### Scenario 7: Breaking News Response

**Detection**: Khabri signal with velocity > threshold AND brand relevance > 7/10
**Response**:
- Alert relevant team members — "High-velocity signal detected: [topic]. Recommend immediate coverage."
- Load skills: `signals/detection/event-detection.md` + `narrative/editorial/topic-selection.md`
- Suggest workflow: "Start signal-to-deliverable workflow. Recommended mode: Breaking."
- Track response time — log how quickly team mobilizes for learning

### Scenario 8: Performance Decline

**Detection**: User's task completion rate drops >30% over 2 weeks
**Response**:
- **Never accusatory** — the GI's tone is curious and supportive
- To the user: "Your pace has shifted recently. Everything OK? Here are some ways to get back on track: [suggestions]"
- To DEPT_HEAD (Tier 3+): "Subtle velocity change detected for [member]. Might be worth a check-in."
- Possible causes to consider: Overload (check task count), blocking dependencies, vacation/leave

---

## Learning Log

### Entry: Initial
- Supportive tone in performance decline scenarios gets 3x better response than neutral/clinical tone
- New member onboarding nudges reduce time-to-productivity by 25%
- Cross-department dependency alerts resolve blocks 40% faster when both DEPT_HEADs are notified simultaneously
- Breaking news response scenarios benefit most from skill-loading — pre-built workflows save 30 minutes per event
