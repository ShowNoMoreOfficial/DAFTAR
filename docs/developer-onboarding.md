# DAFTAR Developer Onboarding Guide

> DAFTAR is an AI-powered agency operations platform. It manages content pipelines, signal intelligence, HR operations, project management, social publishing, and finance for a multi-brand media agency. This guide will get you from zero to productive.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Setup](#2-local-setup)
3. [Project Architecture](#3-project-architecture)
4. [Coding Conventions](#4-coding-conventions)
5. [How to Add a New Feature](#5-how-to-add-a-new-feature)
6. [How to Add a New Brand](#6-how-to-add-a-new-brand)
7. [How to Debug](#7-how-to-debug)
8. [Key Files to Know](#8-key-files-to-know)
9. [Module Reference](#9-module-reference)
10. [Known Gotchas](#10-known-gotchas)

---

## 1. Prerequisites

### System Requirements

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 20+ (LTS) | Required for Next.js 16. Use `nvm` or `fnm` to manage versions. |
| **PostgreSQL** | 15+ | Must have the `pgvector` extension installed. |
| **Git** | 2.x+ | Standard. |
| **npm** | 10+ | Ships with Node 20. We use npm, not yarn or pnpm. |

### pgvector Setup

pgvector is required for the embedding/vector search features (Yantri, Khabri). After installing PostgreSQL:

```sql
-- Connect to your database and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

If you are on macOS with Homebrew: `brew install pgvector`. On Ubuntu: `sudo apt install postgresql-15-pgvector`. On Windows, follow the pgvector build instructions from the pgvector GitHub repo, or use a Docker image that includes it (e.g., `ankane/pgvector`).

### Required Accounts and API Keys

You will need credentials for each of these services. Ask the team lead for existing dev keys or create your own:

| Service | What For | Env Vars |
|---------|----------|----------|
| **Google Cloud Console** | OAuth (login via Google) + Gemini LLM API | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `GEMINI_API_KEY` |
| **Microsoft Entra ID** | OAuth (login via Microsoft) | `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` |
| **Anthropic** | GI chat assistant (Claude) | `ANTHROPIC_API_KEY` |
| **ElevenLabs** | Voice generation in Yantri pipeline | `ELEVENLABS_API_KEY` |
| **Tavily** | Search API for signal enrichment (Khabri) | `TAVILY_API_KEY` |
| **Exa** | Alternative search API | `EXA_API_KEY` |
| **AWS** | S3 bucket for media/asset storage | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` |
| **Inngest** | Background job orchestration | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |

> **Tip**: Not all keys are required to start developing. At minimum, you need `DATABASE_URL`, `AUTH_SECRET`, and one OAuth provider (Google or Microsoft) to log in. Features that depend on missing keys will fail gracefully or show errors only when you use those specific modules.

---

## 2. Local Setup

### Step-by-Step

```bash
# 1. Clone the repository
git clone <repo-url>
cd daftar

# 2. Install dependencies
npm install
# This also runs `prisma generate` automatically via the postinstall script.

# 3. Set up environment variables
# There is no .env.example checked in. Create .env manually at the project root.
# See the "Environment Variables" section below for the full list.
touch .env

# 4. Generate Prisma client (if postinstall didn't run)
npx prisma generate

# 5. Push schema to database (creates all tables)
npx prisma db push
# Or, if you prefer migrations:
# npx prisma migrate dev

# 6. Seed the database with departments, admin user, sample clients/brands
npx tsx prisma/seed.ts

# 7. Seed test data (sample tasks, signals, etc.)
npx tsx tests/seed/seed-test-data.ts

# 8. Start the dev server
npm run dev
# App runs on http://localhost:3000

# 9. In a SEPARATE terminal, start the Inngest dev server
npx inngest-cli@latest dev
# Inngest dashboard at http://localhost:8288
# This is required for background jobs (Yantri pipelines, signal processing, etc.)
```

### Environment Variables

Create a `.env` file in the project root with these values:

```env
# ─── Database ───────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/daftar?schema=public"

# ─── NextAuth ───────────────────────────────────────────
AUTH_SECRET="generate-a-random-string-here"
# Generate with: openssl rand -base64 32

# ─── Google OAuth ───────────────────────────────────────
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# ─── Microsoft Entra ID OAuth ──────────────────────────
AUTH_MICROSOFT_ENTRA_ID_ID="your-ms-client-id"
AUTH_MICROSOFT_ENTRA_ID_SECRET="your-ms-client-secret"
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID="your-tenant-id-or-common"

# ─── LLM: Gemini (Yantri, Khabri, skill execution) ────
GEMINI_API_KEY="your-gemini-api-key"

# ─── LLM: Anthropic (GI chat assistant) ────────────────
ANTHROPIC_API_KEY="your-anthropic-api-key"

# ─── ElevenLabs (voice generation) ─────────────────────
ELEVENLABS_API_KEY="your-elevenlabs-api-key"

# ─── Search APIs (Khabri signal enrichment) ────────────
TAVILY_API_KEY="your-tavily-api-key"
EXA_API_KEY="your-exa-api-key"

# ─── AWS S3 (media storage) ────────────────────────────
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET="your-bucket-name"

# ─── Inngest (background jobs) ─────────────────────────
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"

# ─── App ────────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
```

### Invitation-Only Auth

DAFTAR uses invitation-only authentication. You cannot sign in with a Google/Microsoft account unless that email already exists in the `users` table. The seed script creates an admin user. To add yourself:

1. Run the seed script (it creates the default admin user).
2. Either update `prisma/seed.ts` to add your email, or manually insert your user:

```bash
npx prisma studio
# Opens a browser-based DB editor at http://localhost:5555
# Navigate to the User table and add your email with role ADMIN
```

3. Now sign in at `http://localhost:3000/login` using Google or Microsoft.

### Available npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `next dev` | Start dev server with hot reload |
| `npm run build` | `prisma generate && next build` | Production build |
| `npm run start` | `next start` | Run production build |
| `npm run lint` | `eslint` | Run ESLint |
| `npm run db:generate` | `prisma generate` | Regenerate Prisma client |
| `npm run db:migrate` | `prisma migrate dev` | Create and apply migrations |
| `npm run db:push` | `prisma db push` | Push schema changes directly (no migration) |
| `npm run db:seed` | `npx tsx prisma/seed.ts` | Run the seed script |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio GUI |

---

## 3. Project Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.2.3 |
| Language | TypeScript (strict mode) | 5.x |
| ORM | Prisma | 6.x |
| Database | PostgreSQL + pgvector | 15+ |
| CSS | Tailwind CSS | 4.x |
| Components | shadcn/ui | Latest |
| State | Zustand | 5.x |
| Charts | Recharts | 3.x |
| Auth | NextAuth v5 (beta) | 5.0.0-beta.30 |
| Background Jobs | Inngest | 3.x |
| LLMs | Google Gemini, Anthropic Claude | Latest |
| Voice | ElevenLabs | Latest |
| Storage | AWS S3 | v3 SDK |

### Directory Structure

```
daftar/
├── prisma/
│   ├── schema.prisma          # ~91 models, ~1900 lines — THE source of truth for data
│   └── seed.ts                # Base seed: departments, admin user, sample brands
│
├── tests/
│   └── seed/
│       └── seed-test-data.ts  # Extended seed: sample tasks, signals, etc.
│
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login page (unauthenticated)
│   │   │   └── login/
│   │   │
│   │   ├── (shell)/           # ALL authenticated pages
│   │   │   ├── layout.tsx     # Server component: checks session, wraps in ShellLayout
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── pms/           # Project management (Kanban board, list, workload)
│   │   │   ├── finance/       # Invoices, expenses
│   │   │   ├── communication/ # Announcements, feedback
│   │   │   ├── relay/         # Social media publishing
│   │   │   ├── hoccr/         # HR operations, culture, hiring
│   │   │   ├── leaderboard/   # Gamification leaderboard
│   │   │   ├── credibility/   # Credibility scores
│   │   │   ├── admin/         # Admin pages: users, departments, GI, skills, SaaS
│   │   │   └── m/             # Module pages with sub-navigation
│   │   │       ├── khabri/    # Signal intelligence
│   │   │       ├── yantri/    # AI content generation
│   │   │       └── vritti/    # Editorial CMS
│   │   │
│   │   └── api/               # ~193 API route files
│   │       ├── auth/          # NextAuth catch-all route
│   │       ├── tasks/         # PMS endpoints
│   │       ├── finance/       # Invoice/expense endpoints
│   │       ├── gi/            # GI copilot (chat, actions, predictions)
│   │       ├── gamification/  # XP, achievements, challenges
│   │       ├── hoccr/         # HR operations endpoints
│   │       ├── khabri/        # Signal intelligence endpoints
│   │       ├── relay/         # Social publishing endpoints
│   │       ├── vritti/        # Editorial CMS endpoints
│   │       ├── inngest/       # Inngest webhook serve route
│   │       └── ...            # users, brands, departments, notifications, etc.
│   │
│   ├── components/
│   │   ├── shell/             # App shell: ShellLayout, Sidebar, TopBar, RightPanel
│   │   ├── ui/               # shadcn/ui primitives (button, dialog, card, etc.)
│   │   ├── gi/               # GI assistant floating panel
│   │   ├── pms/              # Task board, task detail panel
│   │   ├── finance/          # Invoice/expense dialogs
│   │   ├── khabri/           # Signal cards, trend charts
│   │   ├── yantri/           # Narrative trees, workspace
│   │   └── ...               # Module-specific component folders
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma singleton (hot-reload safe)
│   │   ├── auth.ts            # NextAuth config (providers, callbacks, JWT enrichment)
│   │   ├── permissions.ts     # Role-based access control with wildcard matching
│   │   ├── api-utils.ts       # Helper: getAuthSession(), unauthorized(), forbidden()
│   │   ├── sidebar-config.ts  # Sidebar items per role
│   │   ├── event-bus.ts       # In-process event emitter (Phase 0)
│   │   ├── gi-engine.ts       # GI copilot insight generation
│   │   ├── skill-orchestrator.ts  # Skill file parsing and LLM execution
│   │   ├── gamification.ts    # XP calculation, leveling, achievements
│   │   ├── inngest/           # Background job definitions
│   │   │   ├── client.ts      # Inngest client with typed event schemas
│   │   │   ├── functions.ts   # Khabri signal processing workflows
│   │   │   ├── yantri-workflows.ts  # Yantri deliverable generation pipeline
│   │   │   ├── vritti-workflows.ts  # Vritti article publishing pipeline
│   │   │   └── khabri-workflows.ts  # Khabri scan workflows
│   │   ├── yantri/            # Yantri sub-modules
│   │   │   ├── gemini.ts      # Gemini LLM wrapper
│   │   │   ├── elevenlabs.ts  # Voice generation
│   │   │   ├── embeddings.ts  # pgvector embedding helpers
│   │   │   ├── engine-router.ts   # Route content types to skill chains
│   │   │   ├── model-router.ts    # Route tasks to appropriate LLM model
│   │   │   ├── fact-checker.ts    # Fact-checking against signal sources
│   │   │   ├── strategist.ts      # Content strategy
│   │   │   └── prompts.ts        # Prompt templates
│   │   ├── hoccr/             # HR operations engines
│   │   │   ├── capacity-engine.ts   # Team capacity calculations
│   │   │   ├── velocity-engine.ts   # Delivery velocity tracking
│   │   │   └── culture-monitor.ts   # Culture/sentiment monitoring
│   │   └── relay/             # Social publishing helpers
│   │       └── oauth-helpers.ts     # OAuth token management for social APIs
│   │
│   ├── store/
│   │   └── sidebar-store.ts   # Zustand store: sidebar collapse, mobile, right panel
│   │
│   └── types/
│       ├── index.ts           # Shared types: DaftarSession, SidebarItem, GIContext
│       ├── khabri.ts          # Khabri-specific types
│       └── next-auth.d.ts     # NextAuth session type augmentation
│
├── next.config.ts             # Next.js config (minimal)
├── tsconfig.json              # TypeScript config (strict: true, paths: @/* -> ./src/*)
├── package.json               # Dependencies and scripts
└── tailwind.config.ts         # Tailwind CSS config
```

### How Authentication Works

1. User visits `/login` and clicks "Sign in with Google" or "Sign in with Microsoft".
2. NextAuth handles the OAuth flow.
3. In the `signIn` callback (`src/lib/auth.ts`), we check if the email exists in the `users` table. If not, sign-in is rejected (invitation-only).
4. On first login, the user record is activated (`isActive: true`) and their name/avatar from OAuth is saved.
5. The `jwt` callback enriches the JWT token with `userId`, `role`, `primaryDepartmentId`, `accessibleBrandIds`, and `permissions` from the database.
6. The `session` callback copies these fields onto the session object.
7. Every API route and server component can access this enriched session.

### How the App Shell Works

The `(shell)` route group wraps all authenticated pages:

1. `src/app/(shell)/layout.tsx` is a **server component** that calls `auth()` to check the session. If no session, it redirects to `/login`.
2. It wraps children in `<GIContextProvider>` (for the AI assistant) and `<ShellLayout>` (the app frame).
3. `ShellLayout` (`src/components/shell/shell-layout.tsx`) renders:
   - `<Sidebar>` -- left navigation, role-filtered (uses `getSidebarItemsForRole()`)
   - `<TopBar>` -- top header with search, notifications, user menu
   - `<main>` -- page content
   - `<RightPanel>` -- slide-in detail panel (used by PMS task details, etc.)
   - `<GIAssistant>` -- floating AI chat panel (bottom-right)

### How Permissions Work

Permissions follow a dot-notation pattern: `module.action.scope`

Examples: `pms.read.own`, `yantri.write.department`, `admin.*`

Each role has default permissions defined in `src/lib/permissions.ts`:

| Role | Default Access |
|------|---------------|
| `ADMIN` | Everything (`admin.*`) |
| `HEAD_HR` | Read/write daftar, HOCCR, PMS read, Yantri read, user management |
| `DEPT_HEAD` | Read/write daftar, department-scoped access to PMS, Yantri, Khabri, HOCCR, Relay, Vritti |
| `MEMBER` | Own tasks, own Yantri/Relay/Vritti, full Khabri read |
| `CLIENT` | Brand-scoped read for daftar, Yantri, Relay, Vritti |
| `FINANCE` | Own daftar, full finance read/write |
| `CONTRACTOR` | Own daftar, own PMS tasks |

Users can also have per-user `permissionOverrides` stored in the database. The `hasPermission()` function merges role defaults + overrides and supports wildcard matching (`*`).

---

## 4. Coding Conventions

### TypeScript

- **Strict mode is enabled** (`"strict": true` in tsconfig.json).
- Path alias: `@/*` maps to `./src/*`. Always import as `import { prisma } from "@/lib/prisma"`.
- Prefer named exports over default exports (except for page components which use `export default`).

### API Routes

Every API route follows this pattern:

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, badRequest } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  // 1. Auth check
  const session = await getAuthSession();
  if (!session) return unauthorized();

  // 2. Permission check (if needed)
  const { role, permissions } = session.user;
  if (!hasPermission(role, permissions, "module.read.own")) {
    return forbidden();
  }

  // 3. Parse query params
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");

  // 4. Database query
  const data = await prisma.someModel.findMany({
    where: { ... },
    include: { relation: true },
    orderBy: { createdAt: "desc" },
  });

  // 5. Return response
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const body = await req.json();
  // validate body...

  const created = await prisma.someModel.create({
    data: { ... },
  });

  return NextResponse.json(created, { status: 201 });
}
```

Key helpers from `src/lib/api-utils.ts`:
- `getAuthSession()` -- returns the enriched session or `null`
- `unauthorized()` -- returns a 401 JSON response
- `forbidden()` -- returns a 403 JSON response
- `notFound()` -- returns a 404 JSON response
- `badRequest()` -- returns a 400 JSON response

### Dynamic Route Parameters

In Next.js 16, dynamic route params are accessed as a `Promise` in the second argument:

```typescript
// src/app/api/tasks/[id]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

### Page Components

Pages in `(shell)` are either server components (for data fetching) or client components (for interactivity). The pattern:

```typescript
// Server page — fetches data and passes to client component
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MyClientComponent } from "@/components/my-module/my-client-component";

export default async function MyPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const data = await prisma.someModel.findMany({ ... });

  return <MyClientComponent data={data} />;
}
```

```typescript
// Client component
"use client";

import { useState, useEffect } from "react";
// ... shadcn components, fetch calls, etc.
```

### Components and Styling

- **shadcn/ui** is the component library. Components live in `src/components/ui/`.
- **Tailwind CSS 4** for all styling. No CSS modules or styled-components.
- Use the `cn()` utility from `src/lib/utils` for conditional class merging:

```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class")} />
```

- Brand color: `#2E86AB` (teal blue). Used for active states, primary buttons.
- Background: `#F8F9FA` (light gray). Text: `#1A1A1A` (near black).
- Icons: `lucide-react` exclusively.

### State Management

- **Zustand** for global client state. Currently used for:
  - `sidebar-store.ts` -- sidebar collapse state, mobile open, right panel
- **React Context** for auth session (provided by NextAuth's `SessionProvider`).
- **Server components** for data fetching -- avoid `useEffect` + `fetch` when you can fetch on the server.

### Prisma Usage

- Always use the singleton from `@/lib/prisma` -- never instantiate `new PrismaClient()` in app code (except in seed scripts).
- Use `include` for loading relations, `select` for optimizing specific fields.
- Use `upsert` for idempotent seed/setup operations.
- Schema changes: edit `prisma/schema.prisma`, then run `npx prisma db push` (dev) or `npx prisma migrate dev` (migration track).

---

## 5. How to Add a New Feature

Here is the complete step-by-step process for adding a new feature, using "adding a Notes module" as an example.

### Step 1: Schema

Edit `prisma/schema.prisma`:

```prisma
model Note {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  authorId  String
  author    User     @relation("NoteAuthor", fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("notes")
}
```

Remember to add the reverse relation on the `User` model. Then:

```bash
npx prisma db push   # Apply changes
npx prisma generate  # Regenerate client
```

### Step 2: API Route

Create `src/app/api/notes/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const notes = await prisma.note.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { title, content } = await req.json();

  const note = await prisma.note.create({
    data: { title, content, authorId: session.user.id },
  });

  return NextResponse.json(note, { status: 201 });
}
```

### Step 3: UI Page

Create `src/app/(shell)/notes/page.tsx`:

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotesPage } from "@/components/notes/notes-page";

export default async function Notes() {
  const session = await auth();
  if (!session) redirect("/login");
  return <NotesPage />;
}
```

Create the client component in `src/components/notes/notes-page.tsx`.

### Step 4: Sidebar Entry

Add to `src/lib/sidebar-config.ts`:

```typescript
{
  id: "notes",
  label: "Notes",
  icon: "StickyNote",      // Must match a key in ICON_MAP in sidebar.tsx
  href: "/notes",
  roles: ["ADMIN", "MEMBER", "DEPT_HEAD"],
},
```

Then add the icon to `ICON_MAP` in `src/components/shell/sidebar.tsx`:

```typescript
import { StickyNote } from "lucide-react";

const ICON_MAP = {
  // ... existing icons
  StickyNote,
};
```

### Step 5: Permissions (if needed)

Add permission entries to `src/lib/permissions.ts` in the appropriate role arrays:

```typescript
MEMBER: [
  // ... existing
  "notes.read.own",
  "notes.write.own",
],
```

### Step 6: Test

```bash
# Test the API
curl -s http://localhost:3000/api/notes | jq .

# Or sign in and test through the UI
```

---

## 6. How to Add a New Brand

Brands belong to Clients. A brand represents a media property (e.g., a YouTube channel, a news outlet). Here is what needs to happen:

### Step 1: Create the Client (if new)

Via Prisma Studio or the Admin UI (`/admin/clients`):

```typescript
await prisma.client.create({
  data: {
    name: "Client Name",
    company: "Company Name",
  },
});
```

### Step 2: Create the Brand

```typescript
await prisma.brand.create({
  data: {
    name: "Brand Display Name",
    slug: "brand-slug",           // URL-safe, unique
    description: "What this brand is about",
    clientId: "client-id-here",
    // Optional:
    logoUrl: "https://...",
    websiteUrl: "https://...",
  },
});
```

### Step 3: Link Platforms

Brands publish to platforms. Create `BrandPlatform` records for each active platform:

```typescript
await prisma.brandPlatform.create({
  data: {
    brandId: "brand-id",
    platform: "YOUTUBE",          // ContentPlatform enum
    platformHandle: "@channelname",
    platformUrl: "https://youtube.com/@channelname",
    isActive: true,
  },
});
```

Available platforms: `YOUTUBE`, `X_THREAD`, `X_SINGLE`, `BLOG`, `LINKEDIN`, `META_REEL`, `META_CAROUSEL`, `META_POST`.

### Step 4: Grant User Access

Users need `UserBrandAccess` records to see brand content:

```typescript
await prisma.userBrandAccess.create({
  data: {
    userId: "user-id",
    brandId: "brand-id",
  },
});
```

### Step 5: Yantri Skill Files (Optional)

If this brand uses the Yantri content pipeline, you may need brand-specific skill `.md` files. These are referenced by the `SkillOrchestrator` and contain instructions for content generation tailored to the brand voice. Ask the team lead about the skill file format and placement.

---

## 7. How to Debug

### Common Startup Errors

| Error | Solution |
|-------|----------|
| `PrismaClientInitializationError: Can't reach database` | Check `DATABASE_URL` in `.env`. Is PostgreSQL running? |
| `Error: Extension "vector" is not available` | Install pgvector: `CREATE EXTENSION vector;` in your database |
| `Module not found: @prisma/client` | Run `npx prisma generate` |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` missing | Add `AUTH_SECRET` to `.env` |
| Sign-in rejected (redirects back to login) | Your email is not in the `users` table. Add it via Prisma Studio. |
| `TypeError: params.then is not a function` | Dynamic route params in Next.js 16 are a Promise. Use `const { id } = await params;` |

### Prisma Debugging

Enable query logging by modifying `src/lib/prisma.ts` temporarily:

```typescript
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
```

Or use Prisma Studio for visual data inspection:

```bash
npm run db:studio
# Opens at http://localhost:5555
```

### API Route Debugging

Since there is no test framework yet, test API routes with curl:

```bash
# Get a session cookie first by logging in through the browser.
# Then copy the cookie from browser DevTools (Application > Cookies > next-auth.session-token)

# Test with cookie:
curl -s http://localhost:3000/api/tasks/board \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" | jq .

# Or just test unauthenticated to confirm the 401 is working:
curl -s http://localhost:3000/api/tasks/board | jq .
# Should return: {"error":"Unauthorized"}
```

### Inngest Dashboard

When running `npx inngest-cli dev`, open `http://localhost:8288` to:

- See all registered functions (signal processing, Yantri pipeline, etc.)
- View event history and payloads
- See step-by-step execution logs for each function run
- Manually trigger events for testing
- See retry attempts and error details

### Checking Logs

- **Next.js server logs**: Visible in the terminal where `npm run dev` is running.
- **Inngest logs**: Visible in the Inngest dashboard and the terminal running `inngest-cli dev`.
- **Browser console**: Check for client-side errors, especially for fetch failures to API routes.

### Common Runtime Errors

| Symptom | Likely Cause |
|---------|-------------|
| 401 on every API call | Session expired or cookie not being sent. Check CORS, cookie domain. |
| 403 Forbidden | User role does not have the required permission. Check `permissions.ts`. |
| Empty sidebar | `getSidebarItemsForRole()` filters by role. Check your user's role in the DB. |
| GI assistant not responding | Missing `ANTHROPIC_API_KEY` in `.env`. |
| Yantri pipeline stuck | Check Inngest dashboard for failed steps. Usually a missing `GEMINI_API_KEY`. |
| Khabri signals not loading | Khabri UI currently reads from external API (`khabri.stallone.co.in`), not local DB. |

---

## 8. Key Files to Know

These are the 10 most important files. Read these first and you will understand 80% of the codebase.

### 1. `prisma/schema.prisma`
**All data models.** 91 models, ~1900 lines. This is the single source of truth for every entity in the system -- users, tasks, brands, signals, narratives, deliverables, invoices, achievements, and more. Start here to understand what data exists.

### 2. `src/lib/auth.ts`
**NextAuth configuration.** Defines Google and Microsoft OAuth providers, the invitation-only `signIn` callback, and the JWT enrichment callbacks that load user role, department, brand access, and permissions into the session token.

### 3. `src/lib/permissions.ts`
**Role-based access control.** Defines the default permission set for each of the 7 roles and the `hasPermission()` function with wildcard matching. Every API route and some UI components check permissions through this.

### 4. `src/lib/prisma.ts`
**Prisma singleton.** 9 lines, but critical. Prevents creating multiple Prisma clients during hot reload in development. Every file that touches the database imports from here.

### 5. `src/components/shell/shell-layout.tsx`
**App shell wrapper.** The layout that wraps every authenticated page. Renders the Sidebar, TopBar, RightPanel, and GI Assistant. Understanding this file tells you how every page is framed.

### 6. `src/components/shell/sidebar.tsx` + `src/lib/sidebar-config.ts`
**Navigation.** `sidebar-config.ts` defines all sidebar items with their roles, icons, and URLs. `sidebar.tsx` renders them filtered by the current user's role. This is how you understand what pages exist and who can see them.

### 7. `src/lib/gi-engine.ts`
**GI copilot brain.** Generates contextual insights (nudges, alerts, celebrations, suggestions) based on the user's current module/view. Has an in-memory cache with 60-second TTL. This is the "intelligence" layer of the platform.

### 8. `src/lib/skill-orchestrator.ts`
**Skill execution engine.** Parses `.md` skill files (which contain instructions for LLM tasks), assembles prompts with context, executes them via Gemini, and returns structured output. Powers the Yantri content pipeline.

### 9. `src/lib/gamification.ts`
**XP and leveling system.** Implements the power-curve XP formula (`100 * N^1.5` per level), tracks achievements, and calculates level progress. Used by PMS task completion, content publishing, and other actions.

### 10. `src/lib/inngest/` (directory)
**Background job definitions.** Five files that define all durable workflows:
- `client.ts` -- Typed event schemas (what events exist and their payloads)
- `functions.ts` -- Khabri signal enrichment pipeline (credibility, geo-relevance)
- `yantri-workflows.ts` -- Content generation pipeline (draft, fact-check, save)
- `vritti-workflows.ts` -- Article publishing pipeline (RAG ingestion)
- `khabri-workflows.ts` -- Khabri scan workflows

---

## 9. Module Reference

Quick reference for each major module. Where the code lives, what it does, and how to find your way around.

### PMS (Project Management)
- **Pages**: `src/app/(shell)/pms/` (board, list, workload, gamification views)
- **API**: `src/app/api/tasks/` (CRUD, board, comments, status, export, workload)
- **Components**: `src/components/pms/` (task board, task detail panel)
- **Key concept**: Tasks have a Kanban flow: `CREATED -> ASSIGNED -> IN_PROGRESS -> REVIEW -> APPROVED -> DONE`
- **Credibility scoring**: Task completion feeds into the credibility score system

### Yantri (AI Content Generation)
- **Pages**: `src/app/(shell)/m/yantri/` (dashboard, narrative trees, workspace, brands, trends, prompts, performance, history)
- **API**: `src/app/api/m/yantri/` + `src/app/api/yantri/`
- **Core lib**: `src/lib/yantri/` (gemini, embeddings, engine-router, model-router, fact-checker, strategist, prompts, elevenlabs)
- **Orchestration**: `src/lib/skill-orchestrator.ts` (skill file execution)
- **Background**: `src/lib/inngest/yantri-workflows.ts` (multi-step pipeline)
- **Key concept**: Narrative Trees are the planning unit. A narrative is broken into deliverables per platform, each generated through skill chains.

### Khabri (Signal Intelligence)
- **Pages**: `src/app/(shell)/m/khabri/` (dashboard, trends, signals, narratives, geo, analytics)
- **API**: `src/app/api/khabri/` + `src/app/api/m/khabri/`
- **Background**: `src/lib/inngest/functions.ts` + `khabri-workflows.ts`
- **Key concept**: Signals are raw news/data points. They are enriched (credibility scored, geo-mapped), grouped into Trends, and analyzed for anomalies.

### GI (General Intelligence Copilot)
- **Components**: `src/components/gi/` (floating assistant, context provider)
- **API**: `src/app/api/gi/` (chat, actions, predictions, config, learning, suggestions, tiers)
- **Core lib**: `src/lib/gi-engine.ts` (insight generation)
- **Key concept**: GI is a context-aware AI assistant. It knows which page you are on and generates relevant insights. It uses Anthropic Claude for chat and rule-based engines for insights.

### HOCCR (HR Operations)
- **Pages**: `src/app/(shell)/hoccr/` (operations, culture, hiring, reports, intelligence)
- **API**: `src/app/api/hoccr/` (operations, culture, hiring, positions, announcements, reports, intelligence, dependencies)
- **Core lib**: `src/lib/hoccr/` (capacity-engine, velocity-engine, culture-monitor)
- **Key concept**: Monitors team capacity, delivery velocity, and culture metrics. Tracks bottlenecks and dependencies.

### Relay (Social Media Publishing)
- **Pages**: `src/app/(shell)/relay/` (queue, calendar, analytics, posts, connections)
- **API**: `src/app/api/relay/` (posts, calendar, analytics, publish)
- **Core lib**: `src/lib/relay/` (oauth-helpers)
- **Key concept**: Takes approved deliverables from Yantri/Vritti and publishes them to social platforms. Twitter and LinkedIn are currently working.

### Vritti (Editorial CMS)
- **Pages**: `src/app/(shell)/m/vritti/` (pipeline, articles, media, categories)
- **API**: `src/app/api/vritti/` (articles, categories, media, comments)
- **Background**: `src/lib/inngest/vritti-workflows.ts`
- **Key concept**: An editorial interface for Yantri-generated content. Articles go through an editorial workflow with comments and version tracking.

### Finance
- **Pages**: `src/app/(shell)/finance/`
- **API**: `src/app/api/finance/` (invoices, expenses, summary, export, overview)
- **Components**: `src/components/finance/` (create-invoice-dialog)
- **Key concept**: Invoice and expense tracking with export capabilities.

### Gamification
- **Pages**: `src/app/(shell)/leaderboard/`, `src/app/(shell)/pms/gamification/`
- **API**: `src/app/api/gamification/` (me, achievements, challenges, rewards, leaderboard, seed)
- **Core lib**: `src/lib/gamification.ts`
- **Key concept**: XP-based leveling system (`100 * N^1.5` per level), achievements, streaks. Task completion, content publishing, and other actions award XP.

### Communication
- **Pages**: `src/app/(shell)/communication/`
- **API**: `src/app/api/communication/` (announcements, feedback channels, feedback entries)
- **Key concept**: Org-wide announcements and feedback channels.

---

## 10. Known Gotchas

Things that will confuse you if nobody tells you about them:

1. **~~`ignoreBuildErrors: true`~~ FIXED.** Build compiles clean with 0 TypeScript errors. If you see build errors, they are real and must be fixed.

2. **~~Khabri UI reads from external API~~ FIXED.** Khabri now reads from local DB first, with external API (`khabri.stallone.co.in`) as fallback only when local data is sparse.

3. **Relay uses simulated post IDs (STILL BROKEN).** Publishing generates fake `sim_{id}_{timestamp}` IDs instead of calling real platform APIs. The publisher classes (Twitter, LinkedIn) are implemented but not wired into the publish flow. Deferred to future integration.

4. **~~GI actions record intent only~~ FIXED.** GI autonomous actions now execute on approval — task reassignment, deadline extension, and workload rebalancing all work. Status transitions: PENDING → EXECUTED.

5. **~~HOCCR sentiment only decrements~~ FIXED.** Sentiment is now bidirectional — increments on task completion (+0.2 on-time, +0.3 early), streaks, and recognition. Decrements on overload/overdue.

6. **~~Yantri skill files not loaded~~ FIXED.** SkillOrchestrator is wired and loading `.md` skill files. Skill content is being authored by the content team — some skill paths may still have placeholder files.

7. **Invitation-only auth means you cannot just sign up.** You must have a user record in the database before you can log in. New team members need to be added via seed script, Prisma Studio, or the admin UI.

8. **Next.js 16 dynamic params are Promises.** Unlike Next.js 14/15, route params are `Promise<{ id: string }>` and must be awaited. Many files have already been updated, but you may encounter inconsistencies.

9. **The event bus (`src/lib/event-bus.ts`) is in-process only.** Events emitted via `daftarEvents.emitEvent()` only reach listeners in the same process. For durable, cross-process workflows, use Inngest events.

10. **Prisma Studio and `db push` can be used freely in development.** But in production, migrations (`prisma migrate deploy`) should be used. Currently the project uses `db push` for rapid iteration.

---

## Quick Reference Card

```
Start dev server:        npm run dev
Start Inngest:           npx inngest-cli dev
Open DB GUI:             npm run db:studio
Apply schema changes:    npx prisma db push && npx prisma generate
Seed database:           npx tsx prisma/seed.ts
Run linter:              npm run lint
Build for production:    npm run build

App:                     http://localhost:3000
Inngest dashboard:       http://localhost:8288
Prisma Studio:           http://localhost:5555
```

---

*Last updated: March 2026*
