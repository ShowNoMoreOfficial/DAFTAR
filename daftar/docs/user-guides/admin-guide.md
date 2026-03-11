# DAFTAR Admin Guide

This guide is for users with the **ADMIN** role. Admins have full access to every module and are responsible for system configuration, user management, and organizational oversight.

---

## Table of Contents

1. [First Login Setup](#1-first-login-setup)
2. [Creating and Managing Users](#2-creating-and-managing-users)
3. [Setting Up Departments](#3-setting-up-departments)
4. [Creating Clients and Brands](#4-creating-clients-and-brands)
5. [Configuring Brand Platforms and Identity](#5-configuring-brand-platforms-and-identity)
6. [Managing GI Configuration](#6-managing-gi-configuration)
7. [Monitoring System Health](#7-monitoring-system-health)
8. [Reviewing GI Autonomous Actions](#8-reviewing-gi-autonomous-actions)
9. [Managing Announcements and Feedback](#9-managing-announcements-and-feedback)
10. [Common Admin Tasks and Troubleshooting](#10-common-admin-tasks-and-troubleshooting)

---

## 1. First Login Setup

DAFTAR uses **OAuth-only authentication** through Google or Microsoft Entra ID. There are no username/password accounts.

### Steps

1. Navigate to the DAFTAR login page (e.g., `https://yourdomain.com/login`).
2. Click **Sign in with Google** or **Sign in with Microsoft**.
3. Complete the OAuth consent flow with your organizational account.
4. On first login, DAFTAR will match your email to an existing invite. If your email is pre-registered as an ADMIN, you will land on the **Dashboard**.
5. If no invite exists for your email, access will be denied. The initial ADMIN account must be seeded via the database seed script (`npx ts-node prisma/seed.ts`).

### Post-Login Orientation

After logging in, you will see the full admin sidebar with the following sections:

| Sidebar Item | Path | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Overview of organizational metrics |
| Khabri | `/m/khabri` | Signal intelligence and trend tracking |
| Yantri | `/m/yantri` | AI content generation pipeline |
| Relay | `/relay` | Social media publishing queue and calendar |
| PMS | `/pms` | Project management (Kanban boards) |
| HOCCR | `/hoccr` | HR operations, culture, hiring, reports |
| Communication | `/communication` | Announcements and feedback channels |
| Vritti | `/m/vritti` | Editorial CMS pipeline and articles |
| Finance | `/finance` | Invoices, expenses, financial overview |
| Users & Roles | `/admin/users` | User management and invitations |
| Departments | `/admin/departments` | Department configuration |
| Clients & Brands | `/admin/clients` | Client and brand management |
| Skills | `/admin/skills` | Skill definitions and performance |
| GI Intelligence | `/admin/gi` | GI overview, actions, predictions, config |
| SaaS Platform | `/admin/saas` | SaaS dashboard and onboarding |
| Leaderboard | `/leaderboard` | Gamification leaderboard |
| Credibility | `/credibility` | Credibility scores |
| Calendar | `/calendar` | Content and task calendar |
| Reports | `/reports` | Cross-module reporting |

---

## 2. Creating and Managing Users

DAFTAR is **invitation-only**. Users cannot self-register.

### Inviting a New User

1. Navigate to **Users & Roles** (`/admin/users`).
2. Click the **Invite User** button.
3. Fill in the invitation form:
   - **Email**: The user's organizational email (must match their Google or Microsoft account).
   - **Role**: Select one of the seven roles:
     - `ADMIN` -- Full system access
     - `HEAD_HR` -- HR operations lead
     - `DEPT_HEAD` -- Department head
     - `MEMBER` -- Standard team member
     - `CLIENT` -- External client (limited access)
     - `FINANCE` -- Finance operations
     - `CONTRACTOR` -- External contractor
   - **Department** (optional): Assign a primary department.
4. Click **Send Invite**. An invite record is created with status `PENDING` and a unique token.
5. Share the invite link with the user. The link contains the token that activates their account on first login.

### Invite Lifecycle

| Status | Meaning |
|--------|---------|
| `PENDING` | Invite sent, not yet accepted |
| `ACCEPTED` | User has logged in and activated |
| `REVOKED` | Admin has cancelled the invite |

### Managing Existing Users

- **Deactivate**: Toggle the `isActive` flag to disable a user's access without deleting their data.
- **Change Role**: Update a user's role from the user detail view. Role changes take effect on their next session.
- **Reassign Department**: Move a user to a different primary department.

---

## 3. Setting Up Departments

Departments organize your team and control access to tasks, brands, and reports.

### Creating a Department

1. Navigate to **Departments** (`/admin/departments`).
2. Click **Create Department**.
3. Fill in:
   - **Name**: Unique department name (e.g., "Media", "Marketing").
   - **Type**: Select from predefined types:
     - `MEDIA`, `TECH`, `MARKETING`, `PRODUCTION`, `PPC`, `PHOTOGRAPHY`, `HR_OPS`, `FINANCE_DEPT`, `CUSTOM`
   - **Description** (optional): Brief description of the department's function.
4. Save the department.

### Assigning a Department Head

1. Open the department detail view.
2. Set the **Head** field to a user with the `DEPT_HEAD` role.
3. The department head will gain management access to all tasks, team members, and capacity metrics within that department.

### Adding Members

- Assign members to departments either during the invite process or from the department detail page.
- Users can belong to multiple departments via `DepartmentMember` records, but each user has one **primary department**.

---

## 4. Creating Clients and Brands

### Creating a Client

1. Navigate to **Clients & Brands** (`/admin/clients`).
2. Click **Create Client**.
3. Enter the client's name, company name, and contact email.
4. Optionally link the client to a user account (if the client will log in to DAFTAR, they need a user with the `CLIENT` role).

### Creating a Brand

1. From the Clients & Brands page, select a client.
2. Click **Add Brand**.
3. Fill in brand details:
   - **Name**: Brand display name.
   - **Description**: Brand overview.
   - **Industry / Niche**: For signal intelligence (Khabri) relevance.
4. Save the brand.

### Brand Access Control

- Use **UserBrandAccess** to grant specific team members access to a brand's content pipeline, signals, and deliverables.
- Clients automatically see all brands linked to their client record.

---

## 5. Configuring Brand Platforms and Identity

Each brand can publish to multiple platforms via the Relay module. Configuration determines which platforms are active and how content is formatted.

### Supported Platforms

| Platform | Content Types |
|----------|--------------|
| YouTube | Video content |
| X (Twitter) | Single tweets, threads |
| LinkedIn | Professional posts |
| Meta (Facebook/Instagram) | Reels, carousels, posts |
| Blog | Long-form articles |

### Setting Up Platform Connections

1. Navigate to the brand detail page.
2. Under **Platforms**, add each platform the brand will publish to.
3. For each platform, configure:
   - **Platform type** (e.g., `YOUTUBE`, `X_SINGLE`, `X_THREAD`, `LINKEDIN`, `META_REEL`, `META_CAROUSEL`, `META_POST`, `BLOG`).
   - **Platform credentials** (OAuth tokens for the brand's social accounts).
   - **Publishing preferences** (tone, hashtag strategy, posting schedule).

### Brand Identity

- Define the brand's voice, tone guidelines, and visual identity.
- These settings feed into Yantri's AI content generation to ensure brand-consistent output.
- Platform rules can be configured under **Yantri > Platform Rules** (`/m/yantri/platform-rules`, ADMIN only).

---

## 6. Managing GI Configuration

GI (General Intelligence) is DAFTAR's autonomous organizational copilot. Admins control its behavior through configuration tiers.

### Accessing GI Config

Navigate to **GI Intelligence > Config** (`/admin/gi/config`).

### Autonomy Tiers

GI operates on autonomy tiers that determine what it can do without human approval:

| Tier | Behavior |
|------|----------|
| **Advisory** | GI generates insights and recommendations only. No autonomous actions. |
| **Supervised** | GI can propose actions that require admin approval before execution. |
| **Autonomous** | GI can execute certain predefined actions independently. |

### Configuration Options

- **Chat Settings**: Enable or disable the GI floating assistant that appears on every page.
- **Prediction Thresholds**: Set confidence thresholds for GI predictions to surface.
- **Action Types**: Control which action categories GI is allowed to propose or execute (e.g., task creation, alert generation, resource reallocation).
- **Learning**: Review GI's learning log and accumulated organizational knowledge at `/admin/gi/learning`.

### GI Sub-Pages

| Page | Path | Purpose |
|------|------|---------|
| Overview | `/admin/gi` | GI health, recent activity |
| Actions | `/admin/gi/actions` | Review proposed and executed actions |
| Predictions | `/admin/gi/predictions` | View predictions and their outcomes |
| Learning | `/admin/gi/learning` | GI knowledge base and learning log |
| Config | `/admin/gi/config` | Autonomy and behavior settings |

---

## 7. Monitoring System Health via Dashboard

The Admin Dashboard (`/dashboard`) provides an at-a-glance view of organizational health:

- **Team Overview**: Active users, pending invites, role distribution.
- **Task Metrics**: Tasks created, in progress, completed, overdue.
- **Content Pipeline**: Yantri deliverables by status (PLANNED through PUBLISHED).
- **Signal Intelligence**: Recent Khabri signals, trending topics, anomalies.
- **Financial Summary**: Revenue, expenses, outstanding invoices.
- **Gamification**: Top performers, XP distribution, active streaks.

### Key Indicators to Monitor

- **Overdue tasks**: High count may indicate capacity issues.
- **Stale deliverables**: Content stuck in DRAFTED or REVIEW status.
- **Anomaly alerts**: Khabri anomalies requiring attention.
- **GI action queue**: Pending actions awaiting approval.

---

## 8. Reviewing GI Autonomous Actions

GI records every action it takes or proposes. Admins must review these regularly.

### Reviewing Actions

1. Navigate to **GI Intelligence > Actions** (`/admin/gi/actions`).
2. Each action shows:
   - **Type**: What GI intended to do (e.g., create task, send alert).
   - **Reasoning**: Why GI proposed this action.
   - **Status**: Pending, approved, executed, or rejected.
   - **Timestamp**: When the action was created.
3. For pending actions:
   - Click **Approve** to allow execution.
   - Click **Reject** to dismiss.
4. Review completed actions periodically to assess GI's accuracy and adjust autonomy tiers if needed.

### Reviewing Predictions

1. Navigate to **GI Intelligence > Predictions** (`/admin/gi/predictions`).
2. Each prediction shows a confidence score, the predicted outcome, and the actual outcome (if resolved).
3. Use prediction accuracy to calibrate GI's confidence thresholds in the config.

---

## 9. Managing Announcements and Feedback

The Communication module (`/communication`) has two sections: **Announcements** and **Feedback**.

### Announcements

Admins can create organization-wide or department-specific announcements.

1. Navigate to **Communication** (`/communication`).
2. Switch to the **Announcements** tab.
3. Click **New Announcement**.
4. Fill in:
   - **Title**: Announcement headline.
   - **Content**: Full message body.
   - **Priority**: `LOW`, `NORMAL`, `HIGH`, or `URGENT`.
   - **Department** (optional): Restrict to a specific department, or leave blank for all.
   - **Pin**: Toggle to pin the announcement at the top.
   - **Expires At** (optional): Set an expiration date.
5. Published announcements show a **read count** so you can track engagement.

### Feedback Channels

1. From the Communication page, switch to the **Feedback** tab.
2. Create feedback channels (e.g., "Feature Requests", "Bug Reports", "General Feedback").
3. Configure each channel:
   - **Name**: Channel display name.
   - **Description**: What kind of feedback this channel collects.
   - **Type**: Channel category.
   - **Anonymous**: Whether submissions are anonymous.
4. Team members can submit entries to these channels.
5. Admin can view all entries, respond to them, and update their status:
   - `open` -- New submission
   - `acknowledged` -- Admin has seen it
   - `in_progress` -- Being worked on
   - `resolved` -- Issue addressed
   - `closed` -- Closed without action
6. Entries support **upvotes** so the team can prioritize popular feedback.

---

## 10. Common Admin Tasks and Troubleshooting

### Resending an Invite

If a user's invite expired or was lost:
1. Go to **Users & Roles**.
2. Find the pending invite.
3. Revoke the old invite and create a new one with the same email and role.

### User Cannot Log In

- Verify the user has a `PENDING` or `ACCEPTED` invite for their exact email.
- Confirm the user is logging in with the correct OAuth provider (Google or Microsoft).
- Check that the user's account `isActive` flag is `true`.
- Ensure the OAuth provider email matches the invite email exactly (case-sensitive).

### Fixing Role Permissions

If a user reports missing sidebar items or access errors:
1. Verify their role in **Users & Roles**.
2. Check the sidebar configuration -- each module is visible only to specific roles.
3. If needed, update their role or add permission overrides via `UserPermission` records.

### Database Maintenance

- Run `npx prisma migrate deploy` after schema updates.
- Reseed data if needed with `npx ts-node prisma/seed.ts`.
- Monitor PostgreSQL performance, especially for pgvector queries used by GI embeddings.

### Inngest Workflow Monitoring

- In development: Access the Inngest dashboard at `http://localhost:8288`.
- In production: Monitor via the Inngest cloud dashboard.
- Check for failed workflow steps, especially in Yantri content generation pipelines.

### Environment Variables

If features are not working (e.g., GI chat, voice generation, social publishing):
- Verify all required API keys are set in environment variables.
- See the [Deployment Checklist](../deployment-checklist.md) for the full list of required environment variables.

### GI Not Responding

- Verify `ANTHROPIC_API_KEY` is set and valid.
- Check that GI chat is enabled in **GI Intelligence > Config**.
- Review server logs for API errors.

### Content Not Publishing to Social Platforms

- Verify platform OAuth tokens are configured for the brand.
- Check that `TWITTER_CLIENT_ID`, `LINKEDIN_CLIENT_ID`, `META_APP_ID`, or `YOUTUBE_CLIENT_ID` (and their secrets) are set in environment variables.
- Review the Relay queue (`/relay/queue`) for failed publishing attempts.
