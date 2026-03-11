# Skill: Tech Stack Reference
## Module: daftar
## Trigger: Development decisions, architecture questions, dependency management
## Inputs: component_name, decision_type
## Outputs: tech_stack_info, version_constraints, integration_notes
## Dependencies:
## Scripts:

---

## Instructions

Reference for Daftar's technology stack. Used by GI and developers to understand system capabilities and constraints.

### Core Stack
- **Framework**: Next.js 16+ (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode)
- **React**: React 19 (concurrent features, use hook)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth v5 (credentials + OAuth providers)
- **State**: Zustand (client state), React Server Components (server state)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Icons**: Lucide React

### Infrastructure
- **Deployment**: Vercel (primary), Docker (self-hosted option)
- **Database hosting**: Supabase / Neon / self-hosted PostgreSQL
- **File storage**: Vercel Blob / S3-compatible
- **Email**: Resend (transactional email)
- **Real-time**: Server-Sent Events (SSE) for notifications

### AI/LLM Integration
- **Model routing**: See `system/model-router.md`
- **Skill orchestrator**: `src/lib/skill-orchestrator.ts`
- **GI engine**: `src/lib/gi-engine.ts` + `src/lib/gi-skill-engine.ts`

### Key Libraries
- `prisma` — Database ORM
- `next-auth` — Authentication
- `zustand` — Client state management
- `zod` — Runtime validation
- `date-fns` — Date manipulation
- `recharts` — Charts and data visualization

### Architecture Patterns
- **Three-Ring Architecture**: Ring 1 (Daftar OS), Ring 2 (Intelligence), Ring 3 (Client Properties)
- **Event bus**: `src/lib/event-bus.ts` — in-process EventEmitter (Phase 2+: Redis Pub/Sub)
- **API pattern**: `src/lib/api-utils.ts` — `getAuthSession()`, `requireRoles()`, `unauthorized()`
- **Config-over-code**: Workflow templates, platform configs, role configs stored in DB
- **Skills ecosystem**: Markdown-based skill files in `/skills/` loaded at runtime

---

## Learning Log

### Entry: Initial
- Next.js App Router with Server Components is the right pattern — reduces client bundle size
- Prisma's type safety catches 80% of DB-related bugs at compile time
- Event bus is sufficient for current scale but will need Redis Pub/Sub for multi-instance deployment
