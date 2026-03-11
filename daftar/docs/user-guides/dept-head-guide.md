# DAFTAR Department Head Guide

This guide is for users with the **DEPT_HEAD** role. Department Heads manage their team's tasks, monitor capacity and velocity, oversee the content pipeline for department brands, and use signal intelligence for strategic decisions.

---

## Table of Contents

1. [Department Dashboard Overview](#1-department-dashboard-overview)
2. [Managing Team Tasks](#2-managing-team-tasks)
3. [Monitoring Team Capacity and Velocity](#3-monitoring-team-capacity-and-velocity)
4. [Reviewing KPIs and Performance Metrics](#4-reviewing-kpis-and-performance-metrics)
5. [Managing the Yantri Content Pipeline](#5-managing-the-yantri-content-pipeline)
6. [Using Khabri for Signal Intelligence](#6-using-khabri-for-signal-intelligence)
7. [Team Management and Workload Balancing](#7-team-management-and-workload-balancing)

---

## 1. Department Dashboard Overview

### Logging In

1. Navigate to the DAFTAR login page.
2. Click **Sign in with Google** or **Sign in with Microsoft**.
3. Complete the OAuth flow. You will be redirected to the Dashboard.

### Sidebar Navigation

As a Department Head, your sidebar includes:

| Sidebar Item | Path | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Department and organizational overview |
| Khabri | `/m/khabri` | Signal intelligence (all sub-pages) |
| Yantri | `/m/yantri` | Content pipeline (Dashboard, Narrative Trees, Trends, Workspace, Prompts, History, Performance) |
| Relay | `/relay` | Publishing queue, calendar, analytics |
| PMS | `/pms` | Kanban project management |
| HOCCR | `/hoccr` | HR operations (Operations, Culture, Hiring, Reports) |
| Communication | `/communication` | Announcements and feedback |
| Vritti | `/m/vritti` | Editorial CMS (Pipeline, Articles, Media, Categories) |
| Leaderboard | `/leaderboard` | Gamification rankings |
| Credibility | `/credibility` | Credibility scores for you and your team |
| Calendar | `/calendar` | Content and task calendar |
| Reports | `/reports` | Department and cross-module reports |

### Dashboard Metrics

Your Dashboard (`/dashboard`) shows:

- **Department task summary**: Tasks by status across your team.
- **Team member activity**: Who is working on what.
- **Content pipeline status**: Deliverables in each stage for your department's brands.
- **Upcoming deadlines**: Tasks and content due soon.
- **Capacity alerts**: Team members who are overloaded or underutilized.

---

## 2. Managing Team Tasks

### PMS Kanban Board

Navigate to **PMS** (`/pms`) to manage tasks across your department.

#### Creating Tasks

1. Click **Create Task** or the **+** button in any status column.
2. Fill in:
   - **Title**: Clear, concise task name.
   - **Description**: Detailed requirements and context.
   - **Assignee**: Select a team member from your department.
   - **Priority**: `LOW`, `MEDIUM`, `HIGH`, or `URGENT`.
   - **Difficulty Weight**: Set 1-5 to reflect task complexity (affects XP rewards).
   - **Due Date**: When the task should be completed.
   - **Department**: Defaults to your department.
3. The task starts in `CREATED` status.

#### Task Lifecycle

| Status | Action Required |
|--------|----------------|
| `CREATED` | Assign to a team member |
| `ASSIGNED` | Member begins work |
| `IN_PROGRESS` | Member is actively working |
| `REVIEW` | Member has submitted work for your review |
| `APPROVED` | You approve the work |
| `DONE` | Task is complete |
| `CANCELLED` | Task is no longer needed |

#### Reviewing and Approving Tasks

1. Filter the Kanban board to show tasks in `REVIEW` status.
2. Click a task to open the detail panel.
3. Review the work, comments, and any attached deliverables.
4. Move the task to `APPROVED` if satisfied, or add a comment and send it back to `IN_PROGRESS` for revisions.

#### Task Comments and Activity

- Use the comments section to communicate with the assignee.
- The activity log shows all status changes, assignments, and comments with timestamps.

---

## 3. Monitoring Team Capacity and Velocity

### HOCCR Operations

Navigate to **HOCCR > Operations** (`/hoccr/operations`) to monitor your team's operational health.

#### Capacity Dashboard

The capacity dashboard shows:

- **Per-member workload**: Number of active tasks per team member.
- **Capacity utilization**: Percentage of available capacity being used.
- **Overloaded members**: Team members with more tasks than their recommended capacity.
- **Available capacity**: Team members with room for additional assignments.

#### Velocity Tracking

Velocity measures how quickly your team completes work:

- **Tasks completed per week/sprint**: Track throughput over time.
- **Average time to completion**: How long tasks take from assignment to done.
- **On-time delivery rate**: Percentage of tasks completed before their deadline.

### Using Capacity Data

- Before assigning new tasks, check the capacity dashboard to identify team members with available bandwidth.
- If a team member is consistently overloaded, redistribute their tasks or escalate staffing needs.
- Use velocity trends to set realistic deadlines for future work.

---

## 4. Reviewing KPIs and Performance Metrics

### HOCCR Reports

Navigate to **HOCCR > Reports** (`/hoccr/reports`) for detailed performance reports.

#### Available Metrics

- **Task completion rates** by team member and department.
- **Average review cycles**: How many iterations tasks go through before approval.
- **Credibility scores**: Individual and team-level credibility standings.
- **XP and gamification stats**: Top performers and engagement levels.

### Credibility Scores

Navigate to **Credibility** (`/credibility`) to see detailed credibility scores:

- View scores for each team member in your department.
- Credibility factors include on-time delivery, quality (first-pass approval rate), and consistency.
- Use credibility data during performance reviews and task assignment decisions.

### Leaderboard

Navigate to **Leaderboard** (`/leaderboard`) to see gamification rankings:

- View XP totals, achievements, and streaks for your team.
- Identify top performers and those who may need support.
- Use leaderboard data to recognize high achievers.

### HOCCR Culture

Navigate to **HOCCR > Culture** (`/hoccr/culture`) to monitor team sentiment and culture metrics:

- **Recognition tracking**: See who is being recognized and for what.
- **Sentiment indicators**: Team morale and engagement signals.
- Use culture data to identify potential issues before they escalate.

---

## 5. Managing the Yantri Content Pipeline

### Yantri Dashboard

Navigate to **Yantri** (`/m/yantri`) to manage your department's AI content generation pipeline.

#### Content Pipeline Stages

| Stage | What Happens |
|-------|-------------|
| `PLANNED` | Content topic and platform are defined |
| `RESEARCHING` | AI researches the topic using signals and data |
| `SCRIPTING` | AI generates the script or copy |
| `GENERATING_ASSETS` | Visual and audio assets are created |
| `STORYBOARDING` | Layout and sequence are planned |
| `DRAFTED` | First draft is ready for review |
| `REVIEW` | Team reviews the content |
| `APPROVED` | Content is approved for publishing |
| `RELAYED` | Sent to the Relay publishing queue |
| `PUBLISHED` | Content is live on the target platform |
| `KILLED` | Content has been cancelled |

#### Managing the Pipeline

1. **Yantri Dashboard** (`/m/yantri`): Overview of all deliverables and their statuses.
2. **Narrative Trees** (`/m/yantri/narrative-trees`): View and manage content narratives that branch into multiple deliverables across platforms.
3. **Workspace** (`/m/yantri/workspace`): Active workspace for content currently being generated.
4. **Prompts** (`/m/yantri/prompt-library`): Manage prompt templates used for content generation (DEPT_HEAD and ADMIN only).
5. **History** (`/m/yantri/history`): View completed and past content generation runs.
6. **Performance** (`/m/yantri/performance`): Content performance metrics (DEPT_HEAD and ADMIN only).

#### Reviewing Content

1. Navigate to deliverables in `DRAFTED` or `REVIEW` status.
2. Review the generated content for accuracy, brand voice, and quality.
3. Approve to move to publishing, or request revisions with specific feedback.

#### Trends

Navigate to **Yantri > Trends** (`/m/yantri/trends`) to see trending topics that can inform content planning. Use these trends alongside Khabri signals to identify timely content opportunities.

---

## 6. Using Khabri for Signal Intelligence

Khabri provides real-time signal tracking, trend analysis, and anomaly detection relevant to your department's brands.

### Khabri Sub-Pages

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/m/khabri` | Signal overview and recent activity |
| Trends | `/m/khabri/trends` | Trending topics over time with volume charts |
| Signals | `/m/khabri/signals` | Individual signals with sentiment, source, and entities |
| Narratives | `/m/khabri/narratives` | Grouped signal narratives with timelines and stakeholders |
| Geo Intel | `/m/khabri/geo` | Geographic distribution of signal activity |
| Analytics | `/m/khabri/analytics` | Signal volume, sentiment breakdowns, and category analysis |

### Strategic Use of Signals

As a Department Head, use Khabri signals to:

- **Identify content opportunities**: Trending topics relevant to your brands.
- **Monitor brand mentions**: Track how your brands are being discussed.
- **Detect anomalies**: Sudden spikes or drops in signal volume that may require attention.
- **Inform client conversations**: Use signal data to support strategic recommendations.
- **Feed Yantri pipeline**: Send promising signals directly to Yantri for content generation using the "Send to Yantri" action.

### Anomaly Alerts

Khabri automatically detects anomalies in signal patterns. When an anomaly is detected:

1. An alert appears on the Khabri dashboard.
2. Review the anomaly details to understand what changed and why.
3. Decide whether action is needed (e.g., creating reactive content, alerting the client, adjusting strategy).

---

## 7. Team Management and Workload Balancing

### Viewing Your Team

Navigate to **HOCCR > Operations** (`/hoccr/operations`) to see your full team roster and their current workloads.

### Workload Balancing Strategies

1. **Review the capacity dashboard** before assigning new tasks.
2. **Check velocity trends** to understand each team member's throughput.
3. **Monitor the PMS board** for bottlenecks (e.g., too many tasks in `REVIEW` suggesting you need to review faster).
4. **Use priority levels** to help team members focus on the most important work first.
5. **Adjust difficulty weights** on tasks to ensure XP rewards are proportional to effort.

### Communication

Use the **Communication** module (`/communication`) to:

- **View announcements**: Stay informed of organization-wide updates.
- **Create department-specific announcements**: Share updates with your team only.
- **Monitor feedback channels**: See what your team is raising as concerns or suggestions.
- **Respond to feedback**: Acknowledge and address feedback entries from your team.

### HOCCR Hiring

Navigate to **HOCCR > Hiring** (`/hoccr/hiring`) to:

- Track open positions in your department.
- Review candidate pipelines.
- Monitor hiring progress and timelines.

### Relay Management

As a Department Head, you have access to the full Relay module:

- **Queue** (`/relay/queue`): Manage the publishing queue for your department's brands.
- **Calendar** (`/relay/calendar`): View and manage the publishing schedule.
- **Analytics** (`/relay/analytics`): Track publishing performance and engagement metrics.

### Vritti Editorial Management

Navigate to **Vritti** (`/m/vritti`) to manage editorial content:

- **Pipeline** (`/m/vritti/pipeline`): Kanban view of editorial content stages.
- **Articles** (`/m/vritti/articles`): Browse and review articles.
- **Media** (`/m/vritti/media`): Manage uploaded media assets.
- **Categories** (`/m/vritti/categories`): Manage article categories (DEPT_HEAD and ADMIN only).
