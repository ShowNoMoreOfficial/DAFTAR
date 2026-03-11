# Skill: Authentication & Authorization Reference
## Module: daftar
## Trigger: Auth decisions, role-based access, session management
## Inputs: user_context, required_roles, resource_scope
## Outputs: auth_rules, session_config, role_permissions
## Dependencies:
## Scripts:

---

## Instructions

Reference for Daftar's authentication and authorization system.

### Authentication
- **Provider**: NextAuth v5
- **Methods**: Credentials (email/password), Google OAuth, GitHub OAuth
- **Session**: JWT-based, stored in HTTP-only cookies
- **Session duration**: 30 days (configurable)

### 7 Roles
| Role | Access Level | Primary Modules |
|---|---|---|
| ADMIN | Full system access | All modules, settings, user management |
| HEAD_HR | People and culture | HOCCR, culture metrics, engagement |
| DEPT_HEAD | Department management | PMS, department analytics, team management |
| MEMBER | Personal tasks | PMS (own tasks), gamification, profile |
| CLIENT | Brand/project view | Client dashboard, deliverables, analytics |
| FINANCE | Financial operations | Invoices, expenses, budgets, revenue |
| CONTRACTOR | Assigned tasks only | PMS (assigned tasks only) |

### API Authorization Pattern
```typescript
import { getAuthSession, requireRoles, unauthorized, forbidden } from "@/lib/api-utils";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const allowed = requireRoles(session, ["ADMIN", "DEPT_HEAD"]);
  if (!allowed) return forbidden();

  // ... handler logic
}
```

### Role Hierarchy
ADMIN > HEAD_HR = DEPT_HEAD = FINANCE > MEMBER > CLIENT = CONTRACTOR

### Module Access Matrix
| Module | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR |
|---|---|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PMS | ✅ | ✅ | ✅ | ✅ (own) | ❌ | ❌ | ✅ (assigned) |
| Relay | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Khabri | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| HOCCR | ✅ | ✅ | ✅ (dept) | ❌ | ❌ | ❌ | ❌ |
| Finance | ✅ | ❌ | ✅ (dept) | ❌ | ❌ | ✅ | ❌ |
| Vritti | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Skills Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Learning Log

### Entry: Initial
- JWT sessions with NextAuth v5 work well for the current architecture
- Role-based API middleware pattern prevents unauthorized access at the route level
