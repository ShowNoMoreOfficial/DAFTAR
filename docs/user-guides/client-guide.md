# DAFTAR Client Guide

This guide is for users with the **CLIENT** role. Clients are external stakeholders who have limited, read-focused access to DAFTAR for brand oversight, content review, and invoice tracking.

---

## Table of Contents

1. [Logging In](#1-logging-in)
2. [Viewing My Brands Dashboard](#2-viewing-my-brands-dashboard)
3. [Checking the Content Calendar](#3-checking-the-content-calendar)
4. [Reviewing Approved Deliverables](#4-reviewing-approved-deliverables)
5. [Viewing Invoices and Payment Status](#5-viewing-invoices-and-payment-status)
6. [Accessing Brand Performance Reports](#6-accessing-brand-performance-reports)
7. [What Clients Cannot Access](#7-what-clients-cannot-access)

---

## 1. Logging In

### Invitation Required

DAFTAR uses invitation-only access. You cannot self-register. Your agency admin will send you an invitation to the email associated with your Google or Microsoft account.

### Steps

1. You will receive an invitation link from your agency contact.
2. Click the link and navigate to the DAFTAR login page.
3. Click **Sign in with Google** or **Sign in with Microsoft** (use the account matching the email your invitation was sent to).
4. Complete the OAuth consent flow.
5. On first login, your invitation is accepted and you will land on the **Dashboard**.

### If You Cannot Log In

- Verify you are using the same email address the invitation was sent to.
- Verify you are using the correct OAuth provider (Google or Microsoft).
- Contact your agency admin to resend the invitation if it has expired.

---

## 2. Viewing My Brands Dashboard

After logging in, your sidebar will include the following items:

| Sidebar Item | Path | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Overview of your brands and activity |
| My Brands | `/brands` | Detailed view of all your brands |
| Relay | `/relay` | Content calendar and analytics |
| Vritti | `/m/vritti` | Published articles and content |
| Calendar | `/calendar` | Unified content schedule |
| Reports | `/reports` | Brand performance reports |

### My Brands

Navigate to **My Brands** (`/brands`) to see all brands associated with your client account. For each brand you can view:

- **Brand name and description**.
- **Active platforms**: Which social platforms the brand publishes to (YouTube, X/Twitter, LinkedIn, Meta, Blog).
- **Content pipeline status**: How many deliverables are in each stage.
- **Recent activity**: Latest published or scheduled content.

---

## 3. Checking the Content Calendar

### Calendar View

Navigate to **Calendar** (`/calendar`) to see a unified view of all scheduled content for your brands.

- View by **month**, **week**, or **day**.
- Each calendar entry shows the content title, target platform, and scheduled date.
- Click on an entry to see content details.

### Relay Calendar

Navigate to **Relay > Calendar** (`/relay/calendar`) for a focused view of social media publishing schedules:

- See upcoming posts across all your brands and platforms.
- Posts are color-coded by platform.
- View past posts and their publishing status.

### Relay Analytics

Navigate to **Relay > Analytics** (`/relay/analytics`) to see performance metrics for published content:

- Post engagement metrics.
- Publishing success rates.
- Platform-by-platform breakdowns.

---

## 4. Reviewing Approved Deliverables

### Vritti Articles

Navigate to **Vritti > Articles** (`/m/vritti/articles`) to browse content created for your brands:

- View articles that have been published or are in review.
- Read full article content including text, media, and formatting.
- See which team members authored and edited each piece.

### Content Pipeline

The Yantri content pipeline produces deliverables that move through these stages:

| Status | Meaning |
|--------|---------|
| `PLANNED` | Content has been planned but not started |
| `RESEARCHING` | Research phase is underway |
| `SCRIPTING` | Script or copy is being written |
| `GENERATING_ASSETS` | Visual/audio assets are being created |
| `STORYBOARDING` | Visual layout is being planned |
| `DRAFTED` | First draft is complete |
| `REVIEW` | Content is being reviewed by the team |
| `APPROVED` | Content has been approved for publishing |
| `RELAYED` | Content has been sent to the publishing queue |
| `PUBLISHED` | Content is live |
| `KILLED` | Content has been cancelled |

As a client, you will primarily see content in the `APPROVED`, `RELAYED`, and `PUBLISHED` stages. You can review approved content before it goes live.

---

## 5. Viewing Invoices and Payment Status

### Accessing Invoices

Your agency will create invoices linked to your brands. You can view these from the **Reports** section or through direct links shared by your agency.

### Invoice Information

Each invoice shows:

- **Invoice number**: Unique identifier (e.g., `INV-2026-001`).
- **Amount**: Base amount for services.
- **Tax**: Applicable tax amount.
- **Total amount**: Sum of amount and tax.
- **Due date**: When payment is expected.
- **Status**: Current invoice status.

### Invoice Statuses

| Status | Meaning |
|--------|---------|
| `DRAFT` | Invoice is being prepared (you may not see this) |
| `SENT` | Invoice has been sent to you for payment |
| `PAID` | Payment has been received |
| `OVERDUE` | Payment is past the due date |
| `CANCELLED` | Invoice has been cancelled |

### Line Items

Invoices may include itemized line items showing:

- Description of each service or deliverable.
- Quantity and rate.
- Line item total.

---

## 6. Accessing Brand Performance Reports

### Reports Page

Navigate to **Reports** (`/reports`) to access performance reports for your brands.

Reports may include:

- **Content output**: Number of deliverables created, approved, and published per period.
- **Platform performance**: Engagement metrics across social platforms.
- **Publishing cadence**: How consistently content is being published.
- **Signal intelligence**: Relevant industry signals and trends affecting your brand.

### Dashboard Metrics

Your **Dashboard** (`/dashboard`) also surfaces key brand metrics in a summary format.

---

## 7. What Clients Cannot Access

The CLIENT role is intentionally limited to protect internal operations. As a client, you **cannot**:

| Action | Reason |
|--------|--------|
| Create or edit content | Content creation is managed by the internal team via Yantri |
| Manage team members | User and role management is admin-only |
| Access PMS (Kanban boards) | Internal task management is not visible to clients |
| View Khabri signal intelligence | Signal tracking is an internal tool |
| Access HOCCR (HR operations) | Internal HR data is not exposed |
| Access Finance module | Financial management is restricted to ADMIN and FINANCE roles |
| View the Leaderboard | Internal gamification is not visible to clients |
| Access GI Intelligence config | GI administration is admin-only |
| Create announcements | Communication management is for internal roles |
| Manage departments | Organizational structure is admin-managed |

### Sidebar Items NOT Available to Clients

The following sidebar items will not appear for your role:

- My Tasks
- Khabri
- PMS
- HOCCR
- Finance
- Users & Roles
- Departments
- Skills
- GI Intelligence
- SaaS Platform
- Leaderboard
- Credibility
- Communication

### Getting Help

If you need information that is not available through your client portal, contact your agency representative directly. They can share specific data, reports, or deliverables with you outside of DAFTAR if needed.
