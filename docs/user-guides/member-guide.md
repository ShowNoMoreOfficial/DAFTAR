# DAFTAR Member Guide

This guide is for users with the **MEMBER** role. Members are standard team members who work on tasks, create content, track signals, and participate in the gamification system.

---

## Table of Contents

1. [Logging In and Navigating the Dashboard](#1-logging-in-and-navigating-the-dashboard)
2. [Viewing and Managing My Tasks](#2-viewing-and-managing-my-tasks)
3. [Using the Content Calendar](#3-using-the-content-calendar)
4. [Checking the Leaderboard and Tracking XP](#4-checking-the-leaderboard-and-tracking-xp)
5. [Viewing Khabri Signals](#5-viewing-khabri-signals)
6. [Interacting with the GI Assistant](#6-interacting-with-the-gi-assistant)
7. [Submitting Feedback](#7-submitting-feedback)

---

## 1. Logging In and Navigating the Dashboard

### Logging In

1. Navigate to the DAFTAR login page.
2. Click **Sign in with Google** or **Sign in with Microsoft** (use the same provider your admin set up for your invite).
3. Complete the OAuth flow. You will be redirected to the Dashboard.

Note: DAFTAR is invite-only. If you see an access denied message, contact your admin to verify your invite status.

### Dashboard Overview

After logging in, you will see your personalized Dashboard at `/dashboard`. The dashboard displays:

- **Your active tasks** and upcoming deadlines.
- **XP and achievement progress** from the gamification system.
- **Recent announcements** from your organization.
- **Quick links** to frequently used modules.

### Sidebar Navigation

As a Member, your sidebar includes:

| Sidebar Item | Path | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Your home page with key metrics |
| My Tasks | `/tasks` | Personal task list and management |
| Khabri | `/m/khabri` | Signal intelligence (Dashboard, Trends, Signals, Narratives, Geo Intel, Analytics) |
| Yantri | `/m/yantri` | Content generation (Dashboard, Narrative Trees, Trends, Workspace, History) |
| Relay | `/relay` | Publishing queue, calendar, and analytics |
| PMS | `/pms` | Kanban project management |
| Communication | `/communication` | Announcements and feedback |
| Vritti | `/m/vritti` | Editorial CMS (Pipeline, Articles, Media) |
| Leaderboard | `/leaderboard` | Gamification rankings |
| Credibility | `/credibility` | Your credibility score and history |
| Calendar | `/calendar` | Content and task calendar |

You can collapse the sidebar by clicking the toggle button at the bottom to gain more screen space.

---

## 2. Viewing and Managing My Tasks

### Accessing My Tasks

Navigate to **My Tasks** (`/tasks`) to see all tasks assigned to you.

### Task Statuses

Each task moves through a lifecycle:

| Status | Meaning |
|--------|---------|
| `CREATED` | Task has been created but not yet assigned or started |
| `ASSIGNED` | Task has been assigned to you |
| `IN_PROGRESS` | You are actively working on the task |
| `REVIEW` | Task is submitted for review |
| `APPROVED` | Task has been approved by a reviewer |
| `DONE` | Task is complete |
| `CANCELLED` | Task has been cancelled |

### Updating Task Status

1. Click on a task to open the task detail panel.
2. Use the status dropdown to update the task status.
3. Typical workflow: `ASSIGNED` -> `IN_PROGRESS` -> `REVIEW` -> (reviewer approves) -> `DONE`.

### Adding Comments

1. Open a task detail panel.
2. Scroll to the comments section.
3. Type your comment and click **Send**.
4. Comments are visible to anyone with access to the task.

### Task Priority

Tasks have priority levels that affect their visual treatment:

- **LOW**: Standard priority.
- **MEDIUM**: Default priority for new tasks.
- **HIGH**: Should be addressed promptly.
- **URGENT**: Requires immediate attention.

### Task Difficulty and XP

Each task has a **difficulty weight** (default: 1). Completing tasks with higher difficulty earns more XP. See the Leaderboard section for details on XP.

### Using the PMS Kanban Board

For a visual overview of all project tasks (not just yours), navigate to **PMS** (`/pms`):

1. View tasks organized in columns by status.
2. Drag and drop tasks between columns to update their status.
3. Filter by department, assignee, or priority.
4. Click a task card to open the detail panel.

---

## 3. Using the Content Calendar

The **Calendar** (`/calendar`) provides a unified view of scheduled content and deadlines.

### What You See

- **Content deliverables** from Yantri with their scheduled publish dates.
- **Task deadlines** from PMS.
- **Relay scheduled posts** and their planned publishing times.

### Navigating the Calendar

- Switch between **month**, **week**, and **day** views.
- Click on a date to see all items scheduled for that day.
- Click on a specific item to open its detail view.

### Relay Calendar

The Relay module has its own calendar at `/relay/calendar` that focuses specifically on social media publishing schedules across all brands and platforms you have access to.

---

## 4. Checking the Leaderboard and Tracking XP

DAFTAR includes a gamification system that rewards consistent, high-quality work.

### Leaderboard

Navigate to **Leaderboard** (`/leaderboard`) to see rankings across your organization.

- Rankings are based on **XP (Experience Points)** earned through various activities.
- The leaderboard shows the top performers with their XP totals, achievements, and streaks.

### Earning XP

You earn XP through:

- **Completing tasks**: XP scales with the task's difficulty weight.
- **On-time delivery**: Bonus XP for completing tasks before their deadline.
- **Quality work**: Tasks approved on first review earn bonus XP.
- **Consistent activity**: Maintaining daily streaks.

### Achievements

Achievements are milestone badges earned for specific accomplishments (e.g., completing your first task, maintaining a 7-day streak, reaching 1000 XP). View your achievements from the leaderboard or your profile.

### Streaks

A streak tracks consecutive days of activity. Maintaining a streak earns bonus XP multipliers. Breaking a streak resets the counter.

### Credibility Score

Navigate to **Credibility** (`/credibility`) to see your credibility score. This score reflects:

- Task completion rate.
- On-time delivery percentage.
- Review pass rate (how often your work is approved without rework).
- Overall consistency.

---

## 5. Viewing Khabri Signals

Khabri is DAFTAR's signal intelligence module. It tracks trends, signals, and anomalies relevant to your organization's brands and industry.

### Khabri Dashboard

Navigate to **Khabri** (`/m/khabri`) for the main dashboard showing:

- Recent signal volume and trends.
- Anomaly alerts.
- Top trending topics.

### Sub-Pages

| Page | Path | What It Shows |
|------|------|--------------|
| Dashboard | `/m/khabri` | Overview of signal activity |
| Trends | `/m/khabri/trends` | Trending topics over time |
| Signals | `/m/khabri/signals` | Individual signal items with sentiment and source |
| Narratives | `/m/khabri/narratives` | Grouped signal narratives with timelines and stakeholders |
| Geo Intel | `/m/khabri/geo` | Geographic distribution of signals |
| Analytics | `/m/khabri/analytics` | Signal volume, sentiment breakdowns, category analysis |

### Working with Signals

1. Navigate to **Signals** (`/m/khabri/signals`).
2. Browse or search signals by keyword, category, or sentiment.
3. Each signal shows:
   - **Title and summary**: What the signal is about.
   - **Sentiment**: Positive, negative, or neutral.
   - **Source**: Where the signal originated.
   - **Entities**: Key people, organizations, or topics mentioned.
4. You can send signals to Yantri for content generation using the **Send to Yantri** action.

### Narratives

Narratives group related signals into storylines:

1. Navigate to **Narratives** (`/m/khabri/narratives`).
2. Click a narrative to see its timeline, stakeholders, and related signals.
3. Use narratives to understand evolving stories and identify content opportunities.

---

## 6. Interacting with the GI Assistant

GI (General Intelligence) is DAFTAR's AI copilot. It appears as a floating chat button in the bottom-right corner of every page.

### Opening GI

- Click the **GI assistant button** (sparkle icon) at the bottom-right of any page.
- A chat panel will slide open.

### What GI Can Help With

- **Answering questions** about your tasks, deadlines, and workload.
- **Providing insights** based on organizational data.
- **Suggesting actions** like prioritizing tasks or identifying content opportunities.
- **Explaining data** from Khabri signals, leaderboard stats, or financial summaries.

### Using GI Chat

1. Click the GI button to open the chat.
2. Type your question or request in natural language.
3. GI will respond with relevant information, suggestions, or actions.
4. The conversation persists during your session.

### Examples

- "What tasks are due this week?"
- "Summarize the top Khabri signals for today."
- "What is my current XP and streak?"
- "Show me the content pipeline status for [brand name]."

---

## 7. Submitting Feedback

### Accessing Communication

Navigate to **Communication** (`/communication`).

### Viewing Announcements

1. The **Announcements** tab shows all organization-wide and department-specific announcements.
2. Pinned announcements appear at the top.
3. Announcements are marked with priority levels: `LOW`, `NORMAL`, `HIGH`, `URGENT`.
4. Unread announcements are highlighted. They are marked as read when you view them.

### Submitting Feedback

1. Switch to the **Feedback** tab.
2. You will see available feedback channels (e.g., "Feature Requests", "Bug Reports", "General Feedback").
3. Select a channel and click to submit a new entry.
4. Write your feedback in the text area and submit.
5. If the channel allows anonymous submissions, your identity will not be attached.

### Tracking Your Feedback

- After submitting, you can track your feedback entry's status:
  - `open` -- Submitted, awaiting review.
  - `acknowledged` -- Admin has seen it.
  - `in_progress` -- Being worked on.
  - `resolved` -- Issue has been addressed.
  - `closed` -- Closed.
- You can upvote other team members' feedback to help prioritize popular requests.
