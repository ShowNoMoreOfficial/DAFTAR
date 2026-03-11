# DAFTAR Deployment Checklist

Complete deployment guide for DAFTAR. Follow each section in order to ensure a successful deployment.

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Database Setup](#2-database-setup)
3. [OAuth Setup](#3-oauth-setup)
4. [Platform API Credentials](#4-platform-api-credentials)
5. [AI API Keys](#5-ai-api-keys)
6. [Inngest Setup](#6-inngest-setup)
7. [Vercel Deployment](#7-vercel-deployment)
8. [Post-Deploy Smoke Test Checklist](#8-post-deploy-smoke-test-checklist)

---

## 1. Environment Variables

Set all of the following environment variables in your deployment environment. **Do not commit secrets to source control.**

### Core Application

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string with pgvector support | `postgresql://user:password@host:5432/daftar?schema=public` |
| `NEXTAUTH_URL` | Base URL of your DAFTAR deployment | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | Random 32+ character secret for NextAuth session encryption. Generate with `openssl rand -base64 32`. | (random string) |

### OAuth Providers

| Variable | Description | Where to Get It |
|----------|-------------|----------------|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | Google Cloud Console > APIs & Services > Credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret | Google Cloud Console > APIs & Services > Credentials |
| `AZURE_AD_CLIENT_ID` | Microsoft Entra ID (Azure AD) application client ID | Microsoft Entra admin center > App registrations |
| `AZURE_AD_CLIENT_SECRET` | Microsoft Entra ID application client secret | Microsoft Entra admin center > App registrations > Certificates & secrets |
| `AZURE_AD_TENANT_ID` | Microsoft Entra ID tenant ID (use `common` for multi-tenant) | Microsoft Entra admin center > Overview |

### AI Services

| Variable | Description | Where to Get It |
|----------|-------------|----------------|
| `GEMINI_API_KEY` | Google Gemini API key for content generation (Yantri) | Google AI Studio (aistudio.google.com) |
| `ANTHROPIC_API_KEY` | Anthropic API key for GI chat assistant | console.anthropic.com |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice generation | elevenlabs.io > Profile + API Key |
| `TAVILY_API_KEY` | Tavily search API key for GI research | tavily.com > Dashboard |
| `EXA_API_KEY` | Exa search API key for signal intelligence | exa.ai > Dashboard |

### AWS (S3 Storage)

| Variable | Description | Where to Get It |
|----------|-------------|----------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key ID | AWS IAM Console |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret access key | AWS IAM Console |
| `AWS_S3_BUCKET` | S3 bucket name for file storage (receipts, media, assets) | AWS S3 Console |
| `AWS_REGION` | AWS region where the S3 bucket is located | e.g., `ap-south-1` |

### Inngest (Event Orchestration)

| Variable | Description | Where to Get It |
|----------|-------------|----------------|
| `INNGEST_EVENT_KEY` | Inngest event key for sending events | Inngest dashboard > Manage > Event Keys |
| `INNGEST_SIGNING_KEY` | Inngest signing key for webhook verification | Inngest dashboard > Manage > Signing Key |

### Social Platform APIs (Relay Module)

| Variable | Description | Where to Get It |
|----------|-------------|----------------|
| `TWITTER_CLIENT_ID` | Twitter/X OAuth 2.0 client ID | Twitter Developer Portal |
| `TWITTER_CLIENT_SECRET` | Twitter/X OAuth 2.0 client secret | Twitter Developer Portal |
| `LINKEDIN_CLIENT_ID` | LinkedIn Marketing API client ID | LinkedIn Developer Portal |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn Marketing API client secret | LinkedIn Developer Portal |
| `YOUTUBE_CLIENT_ID` | YouTube Data API OAuth client ID | Google Cloud Console |
| `YOUTUBE_CLIENT_SECRET` | YouTube Data API OAuth client secret | Google Cloud Console |
| `META_APP_ID` | Meta (Facebook/Instagram) app ID | Meta for Developers |
| `META_APP_SECRET` | Meta (Facebook/Instagram) app secret | Meta for Developers |

---

## 2. Database Setup

### Requirements

- **PostgreSQL 15+** (required for compatibility with Prisma 6 and pgvector).
- **pgvector extension** must be installed and enabled (used for GI embeddings and semantic search).

### Installation Steps

#### 2.1 Provision PostgreSQL

Set up a PostgreSQL 15+ instance. Options include:

- **Vercel Postgres** (if deploying on Vercel).
- **Supabase** (managed PostgreSQL with pgvector pre-installed).
- **Neon** (serverless PostgreSQL with pgvector support).
- **AWS RDS** (install pgvector extension manually).
- **Self-hosted** (install PostgreSQL and pgvector).

#### 2.2 Enable pgvector

If pgvector is not pre-installed, enable it:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 2.3 Run Migrations

Apply all Prisma migrations to create the database schema:

```bash
npx prisma migrate deploy
```

This creates all ~50+ tables, enums, indexes, and relations defined in `prisma/schema.prisma`.

#### 2.4 Seed the Database

Populate initial data (departments, default admin user, sample data):

```bash
npx ts-node prisma/seed.ts
```

The seed script creates:
- Default departments (Media, Tech, Marketing, Production, PPC, Photography, HR Ops, Finance).
- An initial admin user account.
- Sample data for development and testing.

#### 2.5 Verify

```bash
npx prisma studio
```

Open Prisma Studio to visually inspect the database and verify tables were created correctly.

---

## 3. OAuth Setup

DAFTAR uses **NextAuth v5 (beta)** with two OAuth providers: Google and Microsoft Entra ID. At least one must be configured.

### 3.1 Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth 2.0 Client ID**.
5. Select **Web application** as the application type.
6. Set the following:
   - **Authorized JavaScript origins**: `https://yourdomain.com`
   - **Authorized redirect URIs**: `https://yourdomain.com/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret**.
8. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your environment.

For local development, add:
- Origin: `http://localhost:3000`
- Redirect URI: `http://localhost:3000/api/auth/callback/google`

### 3.2 Microsoft Entra ID (Azure AD)

1. Go to [Microsoft Entra admin center](https://entra.microsoft.com/).
2. Navigate to **Identity > Applications > App registrations**.
3. Click **New registration**.
4. Set:
   - **Name**: DAFTAR
   - **Supported account types**: Choose based on your needs:
     - "Accounts in this organizational directory only" for single-tenant.
     - "Accounts in any organizational directory" for multi-tenant.
   - **Redirect URI**: `https://yourdomain.com/api/auth/callback/azure-ad` (Web platform).
5. After registration:
   - Copy the **Application (client) ID** -> `AZURE_AD_CLIENT_ID`.
   - Copy the **Directory (tenant) ID** -> `AZURE_AD_TENANT_ID` (or use `common` for multi-tenant).
6. Navigate to **Certificates & secrets > New client secret**.
   - Create a secret and copy its **Value** -> `AZURE_AD_CLIENT_SECRET`.
7. Navigate to **API permissions**:
   - Add **Microsoft Graph > Delegated permissions**:
     - `openid`
     - `profile`
     - `email`
     - `User.Read`
   - Click **Grant admin consent** if required by your organization.

For local development, add an additional redirect URI:
- `http://localhost:3000/api/auth/callback/azure-ad`

---

## 4. Platform API Credentials

These credentials enable the Relay module to publish content to social media platforms on behalf of brands.

### 4.1 Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/).
2. Create a project and app.
3. Enable **OAuth 2.0** authentication.
4. Set the callback URL: `https://yourdomain.com/api/auth/callback/twitter`
5. Under **App permissions**, enable:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
6. Copy the **Client ID** and **Client Secret**.
7. Set `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET`.

### 4.2 LinkedIn

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/).
2. Create a new app.
3. Under **Products**, request access to:
   - **Share on LinkedIn** (for `w_member_social`)
   - **Sign In with LinkedIn using OpenID Connect** (for `r_liteprofile`)
4. Under **Auth**:
   - Set the redirect URL: `https://yourdomain.com/api/auth/callback/linkedin`
   - Copy the **Client ID** and **Client Secret**.
5. Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`.

### 4.3 YouTube

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **YouTube Data API v3** for your project.
3. Create OAuth 2.0 credentials (or reuse the Google OAuth credentials if scopes allow).
4. Add the YouTube-specific scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`
5. Set the redirect URI: `https://yourdomain.com/api/auth/callback/youtube`
6. Set `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`.

### 4.4 Meta (Facebook / Instagram)

1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Create a new **Business** type app.
3. Under **Settings > Basic**, copy the **App ID** and **App Secret**.
4. Add the **Facebook Login** product.
5. Configure the OAuth redirect URI: `https://yourdomain.com/api/auth/callback/facebook`
6. Request the following permissions:
   - `pages_manage_posts` -- Post to Facebook Pages
   - `pages_read_engagement` -- Read page engagement data
   - `instagram_basic` -- Basic Instagram access
   - `instagram_content_publish` -- Publish to Instagram
7. Submit your app for review to gain access to these permissions in production.
8. Set `META_APP_ID` and `META_APP_SECRET`.

---

## 5. AI API Keys

### 5.1 Google Gemini

Used by Yantri for AI content generation (scripts, articles, social posts).

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API Key**.
3. Create a new API key or select an existing project.
4. Copy the key and set `GEMINI_API_KEY`.

### 5.2 Anthropic

Used by the GI (General Intelligence) assistant for organizational chat and analysis.

1. Go to [Anthropic Console](https://console.anthropic.com/).
2. Navigate to **API Keys**.
3. Create a new API key.
4. Copy the key and set `ANTHROPIC_API_KEY`.

### 5.3 ElevenLabs

Used for voice generation in content deliverables.

1. Go to [ElevenLabs](https://elevenlabs.io/).
2. Sign in and navigate to your **Profile**.
3. Copy your **API Key**.
4. Set `ELEVENLABS_API_KEY`.

### 5.4 Tavily

Used by the GI engine for web search and research.

1. Go to [Tavily](https://tavily.com/).
2. Create an account and navigate to the **Dashboard**.
3. Copy your API key.
4. Set `TAVILY_API_KEY`.

### 5.5 Exa

Used for advanced search in signal intelligence (Khabri).

1. Go to [Exa](https://exa.ai/).
2. Create an account and navigate to the **Dashboard**.
3. Copy your API key.
4. Set `EXA_API_KEY`.

---

## 6. Inngest Setup

Inngest handles event-driven workflows in DAFTAR, including Yantri content generation pipelines and scheduled tasks.

### 6.1 Development

For local development, run the Inngest dev server:

```bash
npx inngest-cli dev
```

This starts the Inngest development dashboard at `http://localhost:8288`. It automatically discovers and registers your Inngest functions from the DAFTAR codebase.

No `INNGEST_EVENT_KEY` or `INNGEST_SIGNING_KEY` is needed for local development.

### 6.2 Production

1. Create an account at [Inngest](https://www.inngest.com/).
2. Create a new app in the Inngest dashboard.
3. Navigate to **Manage > Event Keys** and create a new event key.
   - Copy the key and set `INNGEST_EVENT_KEY`.
4. Navigate to **Manage > Signing Key**.
   - Copy the signing key and set `INNGEST_SIGNING_KEY`.
5. Set the Inngest serve URL in the Inngest dashboard:
   - `https://yourdomain.com/api/inngest`
6. Inngest will automatically sync your functions on deployment.

### 6.3 Key Workflows

Inngest powers these DAFTAR workflows:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| Yantri content pipeline | Deliverable creation | Multi-step AI content generation (research, script, assets, storyboard) |
| Scheduled publishing | Relay schedule | Publish content at scheduled times |
| Signal processing | New signals ingested | Process and analyze Khabri signals |
| GI analysis | Periodic / event-driven | Run GI predictions and generate insights |

---

## 7. Vercel Deployment

DAFTAR is designed to deploy on **Vercel** as a Next.js application.

### 7.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New > Project**.
3. Import your DAFTAR Git repository (GitHub, GitLab, or Bitbucket).
4. Select the repository and click **Import**.

### 7.2 Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `next build` (default) |
| Output Directory | `.next` (default) |
| Install Command | `npm install` (default) |
| Node.js Version | 18.x or 20.x |

### 7.3 Set Environment Variables

1. In the Vercel project settings, navigate to **Settings > Environment Variables**.
2. Add **all** environment variables listed in [Section 1](#1-environment-variables).
3. Set variables for the appropriate environments (Production, Preview, Development).
4. Sensitive values (secrets, API keys) should be marked as **Sensitive** in Vercel.

### 7.4 Database Connectivity

Ensure your PostgreSQL instance is accessible from Vercel's serverless functions:

- If using **Vercel Postgres**, **Supabase**, or **Neon**, connectivity is handled automatically.
- If using **AWS RDS** or self-hosted PostgreSQL:
  - Ensure the database accepts connections from Vercel's IP ranges (or allow all IPs with strong authentication).
  - Use SSL connections (`?sslmode=require` in the connection string).

### 7.5 Deploy

1. Click **Deploy** in the Vercel dashboard.
2. Monitor the build logs for errors.
3. After deployment, run database migrations if not done automatically:

```bash
npx prisma migrate deploy
```

Note: You may need to run this from a local machine connected to the production database, or set up a build script that runs migrations as part of the deployment.

### 7.6 Custom Domain

1. In Vercel project settings, navigate to **Settings > Domains**.
2. Add your custom domain.
3. Update DNS records as instructed by Vercel.
4. Update `NEXTAUTH_URL` to match the custom domain.
5. Update all OAuth redirect URIs (Google, Microsoft, Twitter, LinkedIn, etc.) to use the new domain.

---

## 8. Post-Deploy Smoke Test Checklist

After deployment, verify each critical feature works correctly.

### Authentication

- [ ] Login page loads at `/login` without errors
- [ ] Google OAuth login completes successfully and redirects to `/dashboard`
- [ ] Microsoft OAuth login completes successfully and redirects to `/dashboard`
- [ ] Unauthorized users are redirected to `/login`
- [ ] Logout works and redirects to `/login`

### Dashboard

- [ ] Dashboard renders without errors after login
- [ ] Dashboard displays correct user name, role, and avatar
- [ ] Sidebar shows correct items for the user's role

### PMS (Task Management)

- [ ] PMS page (`/pms`) loads and displays the Kanban board
- [ ] Can create a new task with title, description, assignee, and priority
- [ ] Task status can be updated (drag and drop or dropdown)
- [ ] Task detail panel opens and shows comments

### Khabri (Signal Intelligence)

- [ ] Khabri dashboard (`/m/khabri`) loads without errors
- [ ] Signals page (`/m/khabri/signals`) displays signal data
- [ ] Trends page (`/m/khabri/trends`) shows trending topics
- [ ] Signal search returns relevant results

### GI (General Intelligence)

- [ ] GI chat assistant button appears in the bottom-right corner
- [ ] Clicking the button opens the chat panel
- [ ] Sending a message to GI returns a meaningful response
- [ ] GI config page (`/admin/gi/config`) loads for ADMIN users

### Leaderboard and Gamification

- [ ] Leaderboard page (`/leaderboard`) loads and shows user rankings
- [ ] XP values are displayed correctly
- [ ] Achievements and streaks are shown

### Finance

- [ ] Finance page (`/finance`) loads and displays overview metrics
- [ ] Can create a new invoice
- [ ] Invoices list displays with correct statuses
- [ ] Expenses tab loads and displays expense data

### Communication

- [ ] Communication page (`/communication`) loads
- [ ] Announcements tab shows existing announcements
- [ ] Can create a new announcement (ADMIN)
- [ ] Feedback tab shows channels

### Content Pipeline

- [ ] Yantri dashboard (`/m/yantri`) loads
- [ ] Vritti articles page (`/m/vritti/articles`) loads
- [ ] Relay calendar (`/relay/calendar`) loads

### Infrastructure

- [ ] No 500 errors in Vercel function logs
- [ ] Database connections are stable (no timeout errors)
- [ ] Inngest dashboard shows functions are registered and healthy
- [ ] API response times are under 3 seconds for standard operations
- [ ] Static assets and images load correctly
