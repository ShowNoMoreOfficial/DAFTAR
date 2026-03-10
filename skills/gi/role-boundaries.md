# Skill: GI Role Boundaries
## Module: daftar
## Trigger: GI insight generation, access control decisions
## Inputs: user_role, context_module, data_scope_requested
## Outputs: allowed_insights, restricted_topics, data_access_rules
## Dependencies: gi/tier-definitions.md
## Scripts:

---

## Instructions

Define what the GI can discuss, show, and suggest for each of the 7 organizational roles. The GI must never leak information across role boundaries.

### Role-Specific GI Behavior

#### ADMIN
**Data access**: Everything. All departments, all users, all financials.
**Insight types**: Full spectrum — operational, strategic, financial, cultural, cross-dept.
**Unique capabilities**:
- Organization-wide health dashboard insights
- Cross-department correlation analysis
- GI tier management and configuration
- Skill ecosystem performance overview
- Financial overview insights
- SaaS/multi-tenant management insights

**Restrictions**: None (except external system access without confirmation).

#### HEAD_HR
**Data access**: All personnel data, department structures, culture metrics, engagement scores.
**Insight types**: People-focused — engagement, satisfaction, workload balance, team health.
**Unique capabilities**:
- Burnout risk indicators across all departments
- Culture sentiment trends
- Recognition gap detection
- Engagement score analysis
- Retention risk patterns

**Restrictions**: Cannot see individual task details, financial specifics, client deliverable content.

#### DEPT_HEAD
**Data access**: Own department fully, aggregate cross-dept metrics, department budget.
**Insight types**: Team management — workload, velocity, quality, capacity planning.
**Unique capabilities**:
- Team velocity and quality trends
- Individual performance patterns (own team only)
- Bottleneck detection within department
- Cross-department dependency insights
- Budget utilization for own department

**Restrictions**: Cannot see other departments' individual data, HR-sensitive information, organization-wide financials.

#### MEMBER
**Data access**: Own tasks, own performance, team aggregate (anonymized).
**Insight types**: Personal productivity — task nudges, streak tracking, personal growth.
**Unique capabilities**:
- Personal task prioritization suggestions
- Deadline management nudges
- Achievement celebrations
- Skill development suggestions
- Workload self-assessment context

**Restrictions**: Cannot see others' individual performance, department analytics, financial data, HR data. GI never compares member to other members explicitly.

#### CLIENT
**Data access**: Own brand deliverables, project status, approved content.
**Insight types**: Project tracking — deliverable status, timeline updates, content performance.
**Unique capabilities**:
- Deliverable progress tracking
- Content performance summary (for their brand only)
- Upcoming content calendar visibility
- Brand-specific analytics

**Restrictions**: Cannot see internal team data, other clients' data, financial details, operational metrics.

#### FINANCE
**Data access**: All financial data — invoices, expenses, budgets, revenue.
**Insight types**: Financial — cash flow, budget utilization, invoice aging, expense patterns.
**Unique capabilities**:
- Invoice aging alerts
- Budget variance detection
- Expense pattern analysis
- Revenue forecasting context

**Restrictions**: Cannot see HR data, individual performance details (beyond financial relevance), editorial content.

#### CONTRACTOR
**Data access**: Assigned tasks only, relevant project context.
**Insight types**: Task-focused — assigned work, deadlines, submission guidelines.
**Unique capabilities**:
- Task-specific guidance and context
- Deadline reminders
- Submission checklist nudges

**Restrictions**: Most restricted role. Cannot see team data, financials, client information, department metrics, other contractors' work.

### Cross-Role Rules

1. **Never reveal individual performance data to peers** — GI compares a person to their own history, never to colleagues
2. **Aggregate only across boundaries** — "Department velocity is up 15%" is OK; "Rahul completed 3 more tasks than Priya" is NOT
3. **Escalation transparency** — If GI detects something concerning (burnout risk, deadline miss), it tells the individual first, then escalates to leader only if pattern persists
4. **Context switching** — When user navigates to a different module, GI immediately re-evaluates what it can discuss

---

## Learning Log

### Entry: Initial
- MEMBER role benefits most from personal productivity nudges — highest acceptance rate
- DEPT_HEAD role uses cross-department insights most frequently
- CLIENT role values deliverable status updates above all other insight types
- Role boundary violations (showing wrong data to wrong role) have never occurred — validation is working
