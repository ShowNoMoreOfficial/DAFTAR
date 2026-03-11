# Skill: Revision Cycle Workflow
## Module: daftar
## Trigger: Content revision requested, approval feedback received
## Inputs: deliverable_id, feedback_items[], revision_type, deadline
## Outputs: revision_plan, updated_deliverable, revision_log
## Dependencies: workflows/approval-loop.md
## Scripts:

---

## Instructions

Manage the revision process when content requires changes after review.

### Revision Types

#### Minor Revision
- Scope: Typos, small factual corrections, phrasing adjustments
- Expected turnaround: 1-2 hours
- Re-review: Peer review only (skip editorial re-review)
- Approval: Auto-approve if changes match feedback exactly

#### Major Revision
- Scope: Structural changes, narrative reframing, significant data updates
- Expected turnaround: 4-8 hours
- Re-review: Full review cycle (peer + editorial)
- Approval: Requires editorial sign-off

#### Rework
- Scope: Fundamental approach change, complete rewrite
- Expected turnaround: 24-48 hours
- Re-review: Full review cycle from scratch
- Approval: DEPT_HEAD sign-off required

### Revision Process

```
Feedback Received
    ↓
[Categorize]: Minor / Major / Rework
    ↓
[Prioritize]: Must-fix items first, then suggestions
    ↓
[Implement]: Apply changes systematically
    ↓
[Self-check]: Verify all feedback items addressed
    ↓
[Re-submit]: Return to appropriate review stage
    ↓
[Log]: Record revision details for learning
```

### Revision Rules

1. **Address all must-fix items** — no partial revisions
2. **Document what changed** — reviewer should see a changelog
3. **Don't introduce new issues** — revisions should fix, not create problems
4. **Track revision count** — more than 2 revision cycles indicates a process problem
5. **Time-aware**: If revision will push past timeliness deadline, escalate to DEPT_HEAD

### Changelog Format
```
Revision #[n] — [date]
Changes made:
- [Feedback item 1]: [How it was addressed]
- [Feedback item 2]: [How it was addressed]
Suggestions addressed: [list or "deferred to next iteration"]
```

### GI Integration
- Track average revision count per creator (identify training needs)
- Track average revision count per reviewer (identify quality of initial feedback)
- Alert if revision cycle > 2: "This deliverable has been through 3 revision cycles — consider a sync meeting"
- Tier 3+: Pattern detection — "70% of revisions for [creator] are about [specific issue]"

### Preventing Revision Cycles
- Clear briefing upfront (use production skill files)
- Reference examples (voice-examples.md for brand voice)
- Checklist-driven self-review before first submission
- Regular calibration between creators and reviewers

---

## Learning Log

### Entry: Initial
- Average revision count: 1.2 per deliverable — healthy range
- Most common revision reasons: voice inconsistency (35%), missing context (25%), data errors (15%)
- Revision cycles > 2 correlate with unclear initial briefs — invest in briefing quality
- Providing voice examples at briefing stage reduces revision count by 40%
