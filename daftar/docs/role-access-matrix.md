# Daftar Role Access Matrix

> **Authoritative reference** for API route access by role.
> Derived from `src/lib/permissions.ts` and actual route-level guards in `src/app/api/`.
>
> Last updated: 2026-03-11

---

## Roles

| Role | Code | Description |
|------|------|-------------|
| Admin | `ADMIN` | Full platform access. Manages users, departments, brands, config, billing. |
| Head HR | `HEAD_HR` | HR operations lead. Manages hiring, culture, engagement, invites. |
| Dept Head | `DEPT_HEAD` | Department lead. Manages department tasks, team members, department-scoped data. |
| Member | `MEMBER` | Standard team member. Sees own tasks, assignments, and limited cross-module data. |
| Client | `CLIENT` | External client. Sees only their own brands, deliverables, and invoices. |
| Finance | `FINANCE` | Finance team. Full access to invoices, expenses, and financial summaries. |
| Contractor | `CONTRACTOR` | External contractor. Minimal access -- own tasks only. |

## Legend

| Symbol | Meaning |
|--------|---------|
| &#10003; | Full access (read and/or write as applicable) |
| &#10007; | No access (403 Forbidden) |
| &#128274; | Scoped access -- see notes column for restrictions |

---

## 1. Auth Routes (`/api/auth/*`)

NextAuth routes are handled by the framework and are not role-gated.

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/auth/[...nextauth]` | ALL | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | OAuth login/logout -- no role check |

---

## 2. User Routes (`/api/users/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/users` | GET | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | List all users |
| `/api/users` | POST | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Create/invite user |
| `/api/users/me` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Own profile |
| `/api/users/me` | PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Update own name |
| `/api/users/[id]` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | View any user profile (authenticated only) |
| `/api/users/[id]` | PATCH | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Update user role/dept/status |
| `/api/users/[id]` | DELETE | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Deactivate user |

---

## 3. Invite Routes (`/api/invites`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/invites` | GET | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | List all invites |
| `/api/invites` | POST | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Create invite |
| `/api/invites` | PATCH | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Revoke invite |

---

## 4. Department Routes (`/api/departments/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/departments` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | List departments (authenticated only) |
| `/api/departments` | POST | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Create department |
| `/api/departments/[id]` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | View department detail |
| `/api/departments/[id]` | PATCH | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Update department |

---

## 5. Brand Routes (`/api/brands/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/brands` | GET | &#10003; | &#128274; | &#128274; | &#128274; | &#128274; | &#128274; | &#128274; | ADMIN sees all; others see only brands they have `userAccess` for |
| `/api/brands` | POST | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Create brand |
| `/api/brands/[id]/platforms` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | List brand platforms |

---

## 6. Client Routes (`/api/clients`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/clients` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10003; | &#10007; | List all clients |
| `/api/clients` | POST | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Create client |

---

## 7. Client Portal Routes (`/api/client/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/client/brands/[brandId]/deliverables` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#128274; | &#10007; | &#10007; | CLIENT sees only own brand deliverables |
| `/api/client/brands/[brandId]/deliverables` | POST | &#10003; | &#10007; | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | Push deliverables to client portal |
| `/api/client/brands/[brandId]/performance` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#128274; | &#10007; | &#10007; | CLIENT sees own brand performance |
| `/api/client/brands/[brandId]/reports` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#128274; | &#10007; | &#10007; | CLIENT sees own brand reports |
| `/api/client/deliverables/[id]/review` | POST | &#10003; | &#10007; | &#10007; | &#10007; | &#128274; | &#10007; | &#10007; | CLIENT approves/requests revision on own deliverables |
| `/api/client/action` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Token-based action (no auth required, public endpoint) |

---

## 8. Task / PMS Routes (`/api/tasks/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/tasks/board` | GET | &#10003; | &#10003; | &#128274; | &#128274; | &#10007; | &#10007; | &#128274; | DEPT_HEAD: department tasks. MEMBER/CONTRACTOR: own tasks only. |
| `/api/tasks/[id]` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | View any task (authenticated only) |
| `/api/tasks/[id]` | PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Update task fields (authenticated only) |
| `/api/tasks/[id]` | DELETE | &#10003; | &#10007; | &#10007; | &#128274; | &#10007; | &#10007; | &#128274; | Only creator or ADMIN can delete |
| `/api/tasks/[id]/status` | PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10007; | &#10007; | &#10003; | Change task status |
| `/api/tasks/[id]/comments` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Read/add comments (authenticated only) |
| `/api/tasks/workload` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Team workload view (authenticated only) |
| `/api/tasks/export` | GET | &#10003; | &#10003; | &#128274; | &#128274; | &#10007; | &#10003; | &#128274; | DEPT_HEAD: dept tasks. MEMBER/CONTRACTOR: own only. CLIENT: forbidden. |

---

## 9. Yantri Routes (`/api/yantri/*`)

Most Yantri routes check only for authentication (not specific roles). Some are fully public (no auth check at all).

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/yantri/deliverables` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | No auth check -- open to all |
| `/api/yantri/deliverables` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | No auth check -- open to all |
| `/api/yantri/deliverables/[id]` | GET/PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/narrative-trees` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | No auth check -- open to all |
| `/api/yantri/narrative-trees/[treeId]` | GET/PATCH/DELETE | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | No auth check -- open to all |
| `/api/yantri/narrative-trees/merge` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | No auth check -- open to all |
| `/api/yantri/narratives` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/narratives/[id]` | GET/PATCH/DELETE | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/narratives/[id]/deliverables` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/generate` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/generate-image` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/pipeline/run` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/pipeline/status` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/content-pieces` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/editorial-narratives` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/prompt-templates` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/platform-rules` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/performance` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/stats` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/ingest` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/scan` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/research` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/strategist` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/rewrite-segment` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/package` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/relay/publish` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/trends/*` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/fact-engine` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/yantri/history` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |

> **Note:** Many Yantri routes lack role-based guards entirely. The permissions system defines `yantri.read.*` for HEAD_HR, `yantri.read.department` for DEPT_HEAD, `yantri.read.own` for MEMBER, and `yantri.read.brand` for CLIENT, but most Yantri API routes do not enforce these scopes in code. This is a known gap.

---

## 10. GI Routes (`/api/gi/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/gi/chat` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | All authenticated users. Context varies by role. |
| `/api/gi/suggestions` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Skill-aware insights for any user |
| `/api/gi/actions` | GET | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | DEPT_HEAD sees only own dept members' actions |
| `/api/gi/actions/[id]` | PATCH | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | Approve/reject/undo. DEPT_HEAD: own dept only |
| `/api/gi/predictions` | GET | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | DEPT_HEAD sees only own dept + own predictions |
| `/api/gi/predictions` | POST | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | Trigger prediction generation |
| `/api/gi/config` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | GI configuration |
| `/api/gi/tiers` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Autonomy tier assignments |
| `/api/gi/learning` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | GI learning logs |

---

## 11. Relay Routes (`/api/relay/*`)

Uses `hasPermission(role, permissions, "relay.read.own")`. Data is further scoped by role within handlers.

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/relay/posts` | GET | &#10003; | &#10007; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | ADMIN: all. DEPT_HEAD: dept brands. MEMBER: own posts. CLIENT: own brands. |
| `/api/relay/posts` | POST | &#10003; | &#10007; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | CLIENT can only create for own brands |
| `/api/relay/posts/[id]` | GET/PATCH/DELETE | &#10003; | &#10007; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | Same scoping as list |
| `/api/relay/posts/[id]/publish` | POST | &#10003; | &#10007; | &#128274; | &#128274; | &#10007; | &#10007; | &#10007; | Trigger publish (no CLIENT) |
| `/api/relay/analytics` | GET | &#10003; | &#10007; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | Same role scoping as posts |
| `/api/relay/calendar` | GET | &#10003; | &#10007; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | Same role scoping as posts |
| `/api/relay/calendar/[id]` | PATCH/DELETE | &#10003; | &#10007; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | Same role scoping as posts |

> **Scope details:** DEPT_HEAD sees posts for accessible brands. MEMBER sees own created posts. CLIENT sees posts for their brands. CONTRACTOR has no relay permissions.

---

## 12. Finance Routes (`/api/finance/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/finance/invoices` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#128274; | &#10003; | &#10007; | CLIENT sees only own invoices (`clientId = user.id`) |
| `/api/finance/invoices` | POST | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10003; | &#10007; | Create invoice |
| `/api/finance/invoices/[id]` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#128274; | &#10003; | &#10007; | CLIENT sees only own invoices |
| `/api/finance/invoices/[id]` | PATCH | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10003; | &#10007; | Update invoice status/fields |
| `/api/finance/invoices/[id]` | DELETE | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Only DRAFT invoices, ADMIN only |
| `/api/finance/invoices/[id]/pdf` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#128274; | &#10003; | &#10007; | Download invoice PDF |
| `/api/finance/invoices/export` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10003; | &#10007; | CSV export |
| `/api/finance/expenses` | GET | &#10003; | &#10007; | &#128274; | &#10007; | &#10007; | &#10003; | &#10007; | DEPT_HEAD sees own department expenses only |
| `/api/finance/expenses` | POST | &#10003; | &#10007; | &#128274; | &#10007; | &#10007; | &#10003; | &#10007; | DEPT_HEAD can create for own dept |
| `/api/finance/expenses/[id]` | GET/PATCH/DELETE | &#10003; | &#10007; | &#128274; | &#10007; | &#10007; | &#10003; | &#10007; | DEPT_HEAD: own dept only |
| `/api/finance/expenses/export` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10003; | &#10007; | CSV export |
| `/api/finance/summary` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10003; | &#10007; | Financial summary dashboard |
| `/api/finance/overview` | GET | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10003; | &#10007; | Full financial overview with monthly breakdown |

---

## 13. HOCCR Routes (`/api/hoccr/*`)

### Hiring & Positions

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/hoccr/positions` | GET | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | Uses `hoccr.read.own` permission. DEPT_HEAD has `hoccr.read.department`. |
| `/api/hoccr/positions` | POST | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Uses `hoccr.write.own` permission |
| `/api/hoccr/positions/[id]` | PATCH | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Update position |
| `/api/hoccr/candidates` | GET | &#10003; | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | List candidates |
| `/api/hoccr/candidates` | POST | &#10003; | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | Add candidate |
| `/api/hoccr/candidates` | PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Update candidate status (authenticated only) |

### Culture & Engagement

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/hoccr/culture/metrics` | GET | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Org-wide culture scores |
| `/api/hoccr/culture/sentiment` | GET | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | DEPT_HEAD: own department only |
| `/api/hoccr/culture/sentiment` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Submit pulse score (any authenticated user) |
| `/api/hoccr/culture/engagement` | GET | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | DEPT_HEAD: own department only |
| `/api/hoccr/culture/engagement` | POST | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Compute engagement metrics |
| `/api/hoccr/culture/recognition` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Public recognitions visible to all; private ones scoped to sender/receiver/HR |
| `/api/hoccr/culture/recognition` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Give recognition (any authenticated user, cannot self-recognize) |

### Operations

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/hoccr/operations` | GET | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | DEPT_HEAD: own department only |
| `/api/hoccr/operations/bottlenecks` | GET | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | View bottlenecks |
| `/api/hoccr/operations/bottlenecks` | POST | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Detect bottlenecks |
| `/api/hoccr/operations/capacity` | GET | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | DEPT_HEAD: own department only |
| `/api/hoccr/operations/dependencies` | GET | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | DEPT_HEAD: own department cross-dept deps |
| `/api/hoccr/operations/dependencies` | POST | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | Create cross-dept dependency |

### Intelligence & Reports

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/hoccr/intelligence` | GET | &#10003; | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | Cross-dept interaction map |
| `/api/hoccr/intelligence/charts` | GET | &#10003; | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | Velocity & capacity charts |
| `/api/hoccr/reports` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | List reports (authenticated only) |
| `/api/hoccr/reports` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Generate report (authenticated only) |
| `/api/hoccr/dependencies` | GET | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | DEPT_HEAD: own department only |
| `/api/hoccr/dependencies` | POST | &#10003; | &#10007; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | Create dependency |
| `/api/hoccr/dependencies` | PATCH | &#10003; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | &#10007; | Update dependency status |
| `/api/hoccr/announcements` | GET/POST | &#10003; | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | HOCCR-specific announcements |

---

## 14. Communication Routes (`/api/communication/*`)

### Announcements

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/communication/announcements` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | All authenticated; filtered to org-wide + own department |
| `/api/communication/announcements` | POST | &#10003; | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | Create announcement |
| `/api/communication/announcements/[id]` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | View single announcement |
| `/api/communication/announcements/[id]` | PATCH | &#10003; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | &#10007; | Author or ADMIN only |
| `/api/communication/announcements/[id]` | DELETE | &#10003; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | &#10007; | Author or ADMIN only |
| `/api/communication/announcements/[id]/read` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Mark as read |

### Feedback

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/communication/feedback/channels` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | List active channels |
| `/api/communication/feedback/channels` | POST | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Create channel |
| `/api/communication/feedback/entries` | GET | &#10003; | &#10003; | &#128274; | &#128274; | &#128274; | &#128274; | &#128274; | ADMIN/HEAD_HR see all; others see own entries only |
| `/api/communication/feedback/entries` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Submit feedback (any authenticated user) |
| `/api/communication/feedback/entries/[id]` | PATCH | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Update entry status |

---

## 15. Gamification Routes (`/api/gamification/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/gamification/me` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Own XP, streaks, achievements |
| `/api/gamification/achievements` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | All achievements with unlock status |
| `/api/gamification/leaderboard` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | XP leaderboard |
| `/api/gamification/challenges` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Active challenges |
| `/api/gamification/challenges` | POST | &#10003; | &#10003; | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | Create challenge |
| `/api/gamification/challenges/[id]` | PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Submit challenge entry |
| `/api/gamification/rewards` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Own rewards |
| `/api/gamification/rewards` | PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Claim reward |
| `/api/gamification/seed` | POST | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Seed achievements (ADMIN) |

---

## 16. Khabri Routes (`/api/khabri/*`)

All Khabri routes check only for authentication. No role-specific restrictions.

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/khabri/signals` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | List signals |
| `/api/khabri/signals/search` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Search signals |
| `/api/khabri/trends` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | List trends |
| `/api/khabri/trends/top` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Top trends |
| `/api/khabri/narratives` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | List narratives |
| `/api/khabri/narratives/[id]` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Narrative detail |
| `/api/khabri/narratives/[id]/timeline` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Narrative timeline |
| `/api/khabri/narratives/[id]/stakeholders` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Narrative stakeholders |
| `/api/khabri/anomalies` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Detect anomalies |
| `/api/khabri/anomalies/trending` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Trending anomalies |
| `/api/khabri/analytics/*` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Volume, sentiment, categories |
| `/api/khabri/geo/*` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Geographic data |

> **Note:** The permissions system defines `khabri.read.*` for MEMBER and `khabri.read.department` for DEPT_HEAD, but route handlers do not enforce these scopes. All authenticated users can access all Khabri data.

---

## 17. Vritti Routes (`/api/vritti/*`)

Uses `hasPermission(role, permissions, "vritti.read.own")` for categories and media. Articles have in-handler role checks.

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/vritti/categories` | GET | &#10003; | &#10003; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | Requires `vritti.read.own` permission |
| `/api/vritti/categories` | POST | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Create category |
| `/api/vritti/categories/[id]` | PATCH/DELETE | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Update/delete category |
| `/api/vritti/articles/[id]` | GET | &#10003; | &#10003; | &#10003; | &#128274; | &#128274; | &#10003; | &#128274; | MEMBER/CONTRACTOR: author/editor only. CLIENT: published + own brand only. |
| `/api/vritti/articles/[id]` | PATCH | &#10003; | &#10007; | &#10003; | &#128274; | &#10007; | &#10007; | &#10007; | Author, editor, ADMIN, or DEPT_HEAD |
| `/api/vritti/articles/[id]` | DELETE | &#10003; | &#10007; | &#10007; | &#128274; | &#10007; | &#10007; | &#10007; | ADMIN or author only; must be IDEA/ARCHIVED status |
| `/api/vritti/articles/[id]/comments` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Authenticated only |
| `/api/vritti/media` | GET | &#10003; | &#10003; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | Requires `vritti.read.own` permission |
| `/api/vritti/media` | POST | &#10003; | &#10003; | &#128274; | &#128274; | &#128274; | &#10007; | &#10007; | Requires `vritti.read.own` permission |

---

## 18. Analytics Routes (`/api/analytics/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/analytics/performance` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Content performance records (authenticated only) |
| `/api/analytics/performance` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Record performance (authenticated only) |
| `/api/analytics/performance/[brandId]` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Brand-specific performance |
| `/api/analytics/competitors` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Competitive benchmarking (authenticated only) |
| `/api/analytics/skills` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Skill performance dashboard (authenticated only) |
| `/api/analytics/learning-report` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Learning report (authenticated only) |
| `/api/analytics/tests` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | A/B test management (authenticated only) |
| `/api/analytics/tests/[id]` | GET/PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | A/B test detail (authenticated only) |

---

## 19. Config Routes (`/api/config/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/config/roles` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | List role configs (authenticated only) |
| `/api/config/roles` | POST/PUT | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Create/update role config |
| `/api/config/workflows` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | List workflow templates (authenticated only) |
| `/api/config/workflows` | POST | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Create workflow template |
| `/api/config/workflows/[id]` | PATCH/DELETE | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Update/delete workflow |
| `/api/config/platforms` | GET/POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Platform config |
| `/api/config/platforms/[id]` | PATCH/DELETE | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Update/delete platform |
| `/api/config/brands/[id]` | PATCH | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Update brand config |
| `/api/config/departments/[id]` | PATCH | &#10003; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | &#10007; | Update department config |

---

## 20. Other Shared Routes

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/notifications` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Own notifications only |
| `/api/notifications` | PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Mark own as read |
| `/api/notifications/[id]` | PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Mark single as read |
| `/api/notifications/preferences` | GET/PATCH | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Manage own notification preferences |
| `/api/credibility` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Own credibility score |
| `/api/credibility/recalculate` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Trigger recalculation |
| `/api/leaderboard` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Legacy leaderboard endpoint |
| `/api/activity` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Activity feed |
| `/api/kpi` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | KPI dashboard |
| `/api/workflows/process` | POST | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Process workflow step |
| `/api/saas/products` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | SaaS product catalog |

### Cron / Internal Routes

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/cron/overdue-check` | GET | -- | -- | -- | -- | -- | -- | -- | Vercel cron job, no user auth |
| `/api/cron/learning-loop` | GET | -- | -- | -- | -- | -- | -- | -- | Vercel cron job, no user auth |
| `/api/cron/relay-executor` | GET | -- | -- | -- | -- | -- | -- | -- | Vercel cron job, no user auth |
| `/api/inngest` | ALL | -- | -- | -- | -- | -- | -- | -- | Inngest event handler, framework-managed |

### Mobile API Routes (`/api/m/*`)

| Route | Method | ADMIN | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR | Notes |
|-------|--------|-------|---------|-----------|--------|--------|---------|------------|-------|
| `/api/m/khabri/signals` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Mobile-optimized signals |
| `/api/m/khabri/trends` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Mobile-optimized trends |
| `/api/m/yantri/narrative-trees` | GET | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | &#10003; | Mobile-optimized narrative trees |

---

## Permission System Reference

### Default Permissions by Role

Defined in `src/lib/permissions.ts`:

```
ADMIN:      admin.*
HEAD_HR:    daftar.read/write.*, hoccr.read/write.*, pms.read.*, yantri.read.*, users.read.*, users.write.hr
DEPT_HEAD:  daftar.read/write.*, pms.read/write.department, yantri.read.department, khabri.read.department,
            hoccr.read.department, relay.read.department, vritti.read.department
MEMBER:     daftar.read.own, pms.read/write.own, yantri.read.own, khabri.read.*, relay.read.own, vritti.read.own
CLIENT:     daftar.read.brand, yantri.read.brand, relay.read.brand, vritti.read.brand
FINANCE:    daftar.read.own, finance.read/write.*
CONTRACTOR: daftar.read.own, pms.read/write.own
```

### Wildcard Matching

The permission checker uses dot-separated wildcard matching:
- `admin.*` matches everything (ADMIN bypass)
- `hoccr.read.*` matches `hoccr.read.own`, `hoccr.read.department`, etc.
- `pms.read.own` matches only the exact permission

### Custom Permissions

Users may have additional custom permissions stored in their user record. These are merged with role defaults at check time.

---

## Special Cases & Notes

1. **CLIENT invoice scoping:** CLIENTs can only see invoices where `clientId` matches their own user ID. They cannot see other clients' invoices even if they belong to the same brand.

2. **DEPT_HEAD expense scoping:** DEPT_HEADs can view and create expenses but only for their own department (`primaryDepartmentId`).

3. **Task deletion:** Only the task creator or ADMIN can delete a task, regardless of other role-based permissions.

4. **Announcement edit/delete:** Only the announcement author or ADMIN can edit/delete an announcement, even if the user is HEAD_HR or DEPT_HEAD.

5. **Yantri missing guards:** Many Yantri routes (deliverables, narrative-trees) have no auth check at all. Others check only for authentication without role restrictions. The permissions system defines granular Yantri scopes, but they are not enforced in most route handlers.

6. **Khabri open access:** All Khabri routes are accessible to any authenticated user, despite the permissions system defining `khabri.read.department` for DEPT_HEAD and `khabri.read.*` for MEMBER. There is no route-level scope enforcement.

7. **GI chat context:** While all roles can use GI chat, the context data returned varies. ADMIN gets org-wide stats, DEPT_HEAD gets department stats, and other roles get only personal task data.

8. **Recognition visibility:** Public recognitions are visible to all authenticated users. Private recognitions are visible only to the sender, receiver, ADMIN, and HEAD_HR.

9. **Feedback entries:** ADMIN and HEAD_HR see all feedback entries across the org. All other roles see only their own submitted entries.

10. **CONTRACTOR limitations:** Contractors have the most restricted access. They can only access: own tasks (PMS board/export), own profile, gamification, notifications, announcements (read), feedback (submit + own), and shared public routes.

11. **CLIENT limitations:** Clients cannot access PMS board, HOCCR operations, GI actions/predictions/config, or finance expenses. They have read-only access to their own brands' content via Relay and Vritti (published articles only).

12. **FINANCE role:** Finance users have full read/write access to the finance module but no access to HOCCR, Relay, GI admin, or Yantri beyond basic authentication. They can view the client list (for invoice association) but cannot manage clients.

13. **Cron routes:** Cron endpoints (`/api/cron/*`) are intended for Vercel scheduled functions and do not perform user authentication. They should be protected by Vercel's cron secret header in production.

14. **Token-based client actions:** `/api/client/action` is a public endpoint that uses token-based authentication (not session auth). This enables email-based approve/revise flows for clients without requiring login.
