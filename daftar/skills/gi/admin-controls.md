# Skill: GI Admin Controls
## Module: daftar
## Trigger: Admin configuration of GI behavior, tier management, feature toggles
## Inputs: admin_user_id, config_changes, target_scope
## Outputs: applied_config, audit_log, validation_result
## Dependencies: gi/tier-definitions.md, gi/role-boundaries.md
## Scripts:

---

## Instructions

Define Admin-configurable GI controls. The Admin has ultimate authority over GI behavior.

### Configurable Settings

#### 1. Global GI Tier
- **Setting**: Default tier for new users/departments
- **Options**: Tier 1 (Baby), Tier 2 (Toddler), Tier 3 (Adolescent), Tier 4 (Adult)
- **Default**: Tier 2 (Toddler)
- **Override**: Admin can set per-department or per-user tier

#### 2. Insight Categories
Toggle which insight categories are active:
- [ ] Task nudges (on by default)
- [ ] Overdue warnings (on by default)
- [ ] Celebrations/achievements (on by default)
- [ ] Workload analysis (on by default)
- [ ] Cross-department insights (off by default — requires Tier 3+)
- [ ] Predictive analytics (off by default — requires Tier 4)
- [ ] Autonomous actions (off by default — requires Tier 4 + explicit enable)

#### 3. Notification Aggressiveness
| Level | Description | Insight Frequency |
|---|---|---|
| Minimal | Only critical alerts | 1-3/day |
| Balanced | Mix of alerts and suggestions | 5-10/day |
| Active | Full insight generation | 10-20/day |
| Maximum | All insights including low-priority | 20+/day |

**Default**: Balanced

#### 4. Module-Specific Toggles
Enable/disable GI for specific modules:
- PMS (task management) — default: ON
- Relay (content scheduling) — default: ON
- Khabri (signals) — default: ON
- Finance — default: ON
- HOCCR (analytics) — default: ON
- Vritti (CMS) — default: ON

#### 5. Skill Loading Configuration
- **Auto-load skills**: GI loads relevant skill files for context (default: ON)
- **Skill domains allowed**: Which skill domains GI can read (default: all)
- **Learning Log updates**: Allow GI to auto-update skill Learning Logs (default: OFF — requires explicit enable)

#### 6. Privacy Controls
- **Individual performance visibility**: Who can see individual metrics (default: DEPT_HEAD + ADMIN only)
- **Cross-department data sharing**: Allow aggregate cross-dept metrics (default: ON for Tier 3+)
- **Burnout/sensitivity detection**: Enable personal wellbeing insights (default: ON, visible to user + HEAD_HR)

### Admin Actions

#### Tier Management
- View current tier assignments per user/department
- Manually promote or demote tiers
- View suggestion acceptance rates per tier
- Bulk-set tier for entire department

#### Emergency Controls
- **Pause GI**: Temporarily disable all GI insights globally
- **Reset GI**: Clear all cached insights and predictions
- **Audit mode**: Log all GI decisions with full context for review

#### Analytics for Admin
- Suggestion acceptance rate (global, per department, per user)
- Most-used insight types
- Most-ignored insight types
- GI-to-action conversion rate
- Skill loading frequency and performance

### Audit Trail
Every Admin configuration change is logged:
```json
{
  "timestamp": "ISO datetime",
  "admin_user_id": "string",
  "action": "tier_change | toggle | config_update",
  "target": "user_id | department_id | global",
  "before": {},
  "after": {},
  "reason": "string (optional)"
}
```

---

## Learning Log

### Entry: Initial
- "Balanced" notification aggressiveness is the optimal starting point — most organizations find it right
- Autonomous actions should remain OFF until Tier 4 trust is clearly established
- Admin audit trail is essential for compliance and debugging unexpected GI behavior
