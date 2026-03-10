# Skill: Deployment Reference
## Module: daftar
## Trigger: Deployment decisions, environment configuration, CI/CD
## Inputs: environment, deployment_target, configuration
## Outputs: deployment_config, environment_variables, health_checks
## Dependencies: system/tech-stack.md
## Scripts:

---

## Instructions

Reference for deploying and operating Daftar.

### Environments
| Environment | Purpose | Database | URL |
|---|---|---|---|
| Development | Local development | Local PostgreSQL | localhost:3000 |
| Staging | Pre-production testing | Staging PostgreSQL | staging.daftar.app |
| Production | Live system | Production PostgreSQL | daftar.app |

### Environment Variables
```
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://...
NEXTAUTH_SECRET=...

# External APIs
KHABRI_API_KEY=...

# LLM (for skill execution)
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_AI_API_KEY=...

# Storage
BLOB_READ_WRITE_TOKEN=...

# Email
RESEND_API_KEY=...
```

### Deployment Targets

#### Vercel (Recommended)
- Push to `main` branch → auto-deploy to production
- Push to feature branch → preview deployment
- Environment variables configured in Vercel dashboard
- Serverless functions for API routes
- Edge runtime optional for performance-critical routes

#### Docker (Self-Hosted)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Database Migrations
- Development: `npx prisma db push` (direct schema sync)
- Production: `npx prisma migrate deploy` (migration-based)
- Always backup before production migrations
- Test migrations on staging first

### Health Checks
- `/api/health` — basic health check endpoint
- Database connection test
- External API connectivity (Khabri)
- Disk/memory usage (if self-hosted)

### Performance Considerations
- Server Components reduce client JavaScript by 40-60%
- Prisma query optimization: Use `select` to limit fields, `include` only when needed
- Image optimization via Next.js Image component
- ISR for semi-static pages (articles, brand profiles)

### Monitoring
- Vercel Analytics for performance metrics
- Error tracking via Vercel or Sentry
- Database query performance via Prisma metrics
- API response times via middleware logging

---

## Learning Log

### Entry: Initial
- Vercel deployment is zero-config for Next.js — recommended for most cases
- `prisma generate` must run before `next build` in CI/CD pipeline
- Windows development requires stopping dev server before `prisma generate` (DLL lock)
