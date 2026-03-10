# Skill: API Gateway Reference
## Module: daftar
## Trigger: API design decisions, route creation, integration planning
## Inputs: resource_type, http_method, auth_requirements
## Outputs: route_pattern, middleware_config, response_format
## Dependencies: system/auth.md
## Scripts:

---

## Instructions

Reference for Daftar's API architecture. All APIs are Next.js App Router route handlers.

### API Route Structure
```
src/app/api/
├── auth/              # NextAuth routes (managed)
├── gi/                # GI Intelligence
│   ├── route.ts       # GET insights
│   ├── chat/          # POST chat queries
│   ├── actions/       # POST autonomous actions
│   ├── predictions/   # GET/POST predictions
│   └── learning/      # GET learning logs
├── skills/            # Skills Ecosystem
│   ├── route.ts       # GET list, filtered
│   ├── [path]/        # GET detail, PATCH learning
│   ├── sync/          # POST scan & sync
│   ├── execute/       # POST test execution
│   └── performance/   # GET leaderboard
├── tasks/             # PMS task CRUD
├── relay/             # Content posts, scheduling
├── khabri/            # Khabri API proxy
├── finance/           # Invoices, expenses
├── hoccr/             # Analytics, culture
├── vritti/            # CMS articles
├── clients/           # Client management
├── notifications/     # Notification system
├── gamification/      # Achievements, challenges
├── saas/              # Multi-tenant
└── users/             # User management
```

### Standard Response Format
```typescript
// Success
return NextResponse.json({ data, meta? }, { status: 200 });

// Error
return NextResponse.json({ error: "message" }, { status: 4xx });

// List with pagination
return NextResponse.json({
  data: items,
  meta: { total, page, limit, hasMore }
});
```

### Common Middleware Pattern
```typescript
export async function GET(request: Request) {
  // 1. Auth check
  const session = await getAuthSession();
  if (!session) return unauthorized();

  // 2. Role check (if needed)
  if (!requireRoles(session, ["ADMIN"])) return forbidden();

  // 3. Parse params
  const { searchParams } = new URL(request.url);

  // 4. Business logic
  const data = await prisma.model.findMany({ ... });

  // 5. Response
  return NextResponse.json(data);
}
```

### Error Codes
| Status | Meaning | Helper Function |
|---|---|---|
| 401 | Not authenticated | `unauthorized()` |
| 403 | Not authorized (wrong role) | `forbidden()` |
| 400 | Bad request (validation) | Manual |
| 404 | Resource not found | Manual |
| 500 | Internal error | Manual |

### Rate Limiting
- No rate limiting currently implemented (internal tool)
- Khabri API proxy has inherent rate limits from upstream API
- Future: Add rate limiting for SaaS multi-tenant mode

### CORS
- Same-origin only (Next.js handles this)
- API routes are server-side only — no CORS headers needed for internal use

---

## Learning Log

### Entry: Initial
- Next.js App Router route handlers with `getAuthSession()` pattern is clean and consistent
- All API routes should follow the auth → role → params → logic → response pattern
- Khabri proxy routes add Bearer token server-side — client never sees the API key
