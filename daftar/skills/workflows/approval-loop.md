# Skill: Approval Loop Workflow
## Module: daftar
## Trigger: Deliverable ready for review, content requires sign-off
## Inputs: deliverable_id, brand_slug, approval_type, reviewers[]
## Outputs: approval_status, feedback_items[], revision_instructions
## Dependencies: gi/tier-definitions.md, gi/role-boundaries.md
## Scripts:

---

## Instructions

Manage the approval workflow for content deliverables, from first review to final sign-off.

### Approval Flow

```
Content Created
    ↓
[Self-Review] — Creator checks against brand voice + fact accuracy
    ↓
[Peer Review] — Team member reviews for quality + completeness
    ↓
[Editorial Review] — DEPT_HEAD or senior editor reviews for editorial standards
    ↓
[Client Review] — If client-facing, client approves (optional based on brand setup)
    ↓
[Final Sign-Off] — DEPT_HEAD or ADMIN approves for publishing
    ↓
Ready for Distribution
```

### Approval Types

| Type | Required Reviewers | SLA |
|---|---|---|
| Quick Take (Tier B/C) | Self + 1 peer | 2 hours |
| Explainer (Tier A) | Self + peer + editorial | 6 hours |
| Flagship (Tier S) | Self + peer + editorial + DEPT_HEAD | 24 hours |
| Client deliverable | Self + peer + editorial + client | 48 hours |
| Breaking news | Self-review only (speed priority) | 30 minutes |

### Review Checklist

#### Self-Review
- [ ] Fact accuracy — all claims sourced
- [ ] Brand voice — matches identity.md guidelines
- [ ] Platform optimization — format matches target platform
- [ ] Sensitivity check — no content that requires escalation
- [ ] Completeness — all deliverable components present

#### Peer Review
- [ ] Logical flow — argument makes sense
- [ ] Data accuracy — numbers verified
- [ ] Tone consistency — matches brand throughout
- [ ] Grammar/language — clean, professional
- [ ] Missing context — anything the audience needs to understand

#### Editorial Review
- [ ] Editorial standards — meets quality tier requirements
- [ ] Legal/ethical — no defamation, copyright, or sensitivity issues
- [ ] Competitive positioning — unique angle maintained
- [ ] Timeliness — still relevant by publish time
- [ ] Brand alignment — consistent with long-term brand strategy

### GI Integration
- GI tracks approval pipeline bottlenecks
- Alerts when approvals are pending beyond SLA
- Suggests reviewers based on availability and expertise
- Tier 3+: Predicts approval delays based on reviewer patterns

### Escalation Rules
- If SLA exceeded by 50%: Nudge reviewer
- If SLA exceeded by 100%: Notify DEPT_HEAD
- If breaking news SLA exceeded: Auto-escalate to any available senior reviewer
- If client review pending >48h: Notify account manager

### Feedback Format
Reviewers should provide structured feedback:
```
Status: APPROVED | REVISION_NEEDED | REJECTED
Priority items: [must-fix before publish]
Suggestions: [nice-to-have improvements]
Notes: [context for future reference]
```

---

## Learning Log

### Entry: Initial
- Peer review catches 80% of issues — most valuable single review stage
- Breaking news self-review-only workflow has never produced a factual error (team is well-calibrated)
- SLA nudges reduce average review time by 30%
- Editorial review is the most common bottleneck — consider training backup reviewers
