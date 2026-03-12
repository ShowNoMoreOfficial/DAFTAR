# Prisma — Database Context

## What This Is
91-table PostgreSQL schema on NeonDB (us-east-1). Shared between local dev and production.

## Key Commands
- `npx prisma generate` — Regenerate client (stop dev server first on Windows — DLL lock)
- `npx prisma db push` — Push schema changes to DB (use for development)
- `npx prisma migrate dev` — Create migration (use for production-ready changes)
- `npx prisma db seed` — Seed database with demo data

## Important Tables
- User, Account, Session — NextAuth v5 tables
- Department, DepartmentMember — Org structure
- Brand, Client — Brand/client management
- Task, TaskComment, TaskAttachment — PMS
- NarrativeTree, EditorialNarrative, Deliverable — Content pipeline
- Skill, SkillExecution, SkillLearningLog — Skills engine
- ContentPost, ContentSchedule — Relay publishing
- Invoice, Expense — Finance
- Achievement, Challenge, UserXP — Gamification
- Notification, NotificationPreference — Notifications
- Article, ArticleCategory — Vritti CMS

## Rules
- NEVER modify schema.prisma without explicit user approval
- ALWAYS use the Prisma client from /src/lib/prisma.ts (singleton)
- Stop the dev server before running `prisma generate` on Windows
- NeonDB connection string is in .env as DATABASE_URL
- pgvector extension is enabled for semantic search
