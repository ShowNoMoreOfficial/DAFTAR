# HOCCR -- HR Operations & Culture

## What it does

HOCCR (HR Operations, Culture, Collaboration, and Resources) is the human resources intelligence module. It provides real-time operational monitoring, culture/sentiment tracking, hiring pipeline management, and organizational intelligence across departments.

The module has four main areas:

1. **Operations** -- Real-time capacity monitoring per user (weighted by task priority), department-level velocity tracking (14-day rolling window of task completions), bottleneck detection (stale reviews, overdue tasks, overloaded users, cross-department stalls), and cross-department dependency tracking.

2. **Culture** -- Sentiment tracking at individual and department level (1-5 scale), peer recognition system (kudos, teamwork, innovation, quality, leadership categories), engagement metrics computation, and composite culture scoring (weighted: 30% sentiment, 25% engagement, 20% recognition, 15% collaboration, 10% retention).

3. **Hiring** -- Position management per department, candidate pipeline tracking through stages (APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, REJECTED, WITHDRAWN), and auto-generated pipeline reports.

4. **Intelligence** -- Cross-department interaction mapping, velocity charts (tasks completed per week over 8 weeks), department capacity visualization, and resource sharing analysis.

## Database models

### EmployeeProfile
- `id` (cuid, PK)
- `userId` (String, unique -- FK to User, cascade delete)
- `sentimentScore` (Float, optional -- 0.0 to 10.0, tracked by GI interactions and culture monitor)
- `capacity` (Int, default 100 -- percentage of workload)
- `skills` (String[] -- e.g. ["Video Editing", "Copywriting"])
- `updatedAt` (DateTime)

### DepartmentMetrics
- `id` (cuid, PK)
- `departmentId` (String, unique -- FK to Department, cascade delete)
- `velocity` (Float -- average tasks completed per week)
- `openBlockers` (Int, default 0)
- `recordedAt` (DateTime, default now)

### HiringPosition
- `id` (cuid, PK)
- `title` (String)
- `departmentId` (String -- FK to Department)
- `description` (Text, optional)
- `requirements` (Json, optional)
- `isOpen` (Boolean, default true)
- `candidates` (relation to HiringCandidate[])
- `createdAt` / `updatedAt` (DateTime)

### HiringCandidate
- `id` (cuid, PK)
- `name` (String)
- `email` (String)
- `phone` (String, optional)
- `resumeUrl` (String, optional)
- `status` (CandidateStatus enum: APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, REJECTED, WITHDRAWN)
- `positionId` (String -- FK to HiringPosition, cascade delete)
- `notes` (Text, optional)
- `rating` (Int, optional)
- `interviewDate` (DateTime, optional)
- `createdAt` / `updatedAt` (DateTime)

### SentimentEntry
- `id` (cuid, PK)
- `userId` (String)
- `departmentId` (String, optional)
- `sentiment` (SentimentLevel enum: VERY_NEGATIVE, NEGATIVE, NEUTRAL, POSITIVE, VERY_POSITIVE)
- `score` (Float, default 3.0 -- 1-5 scale)
- `source` (String, default "manual" -- "manual", "pulse", "gi_detected")
- `notes` (Text, optional)
- `isAnonymous` (Boolean, default false)
- `createdAt` (DateTime)
- Indexes: `[userId, createdAt]`, `[departmentId, createdAt]`

### Recognition
- `id` (cuid, PK)
- `fromUserId` (String)
- `toUserId` (String)
- `category` (String -- "kudos", "teamwork", "innovation", "quality", "leadership")
- `message` (Text)
- `isPublic` (Boolean, default true)
- `createdAt` (DateTime)
- Indexes: `[toUserId, createdAt]`, `[fromUserId]`

### EngagementMetric
- `id` (cuid, PK)
- `userId` (String)
- `departmentId` (String, optional)
- `period` (String -- "2026-W10" or "2026-03")
- `taskCompletionRate` (Float, default 0 -- percentage)
- `avgResponseTime` (Float, default 0 -- hours)
- `collaborationScore` (Float, default 0 -- 0-100)
- `activeDays` (Int, default 0)
- `recognitionsGiven` / `recognitionsReceived` (Int, default 0)
- `overallScore` (Float, default 0 -- 0-100, weighted composite)
- `computedAt` (DateTime)
- Unique constraint: `[userId, period]`
- Index: `[departmentId, period]`

### Bottleneck
- `id` (cuid, PK)
- `type` (String -- "task_blocked", "approval_delayed", "capacity_exceeded", "dependency_waiting")
- `severity` (String, default "medium" -- "low", "medium", "high", "critical")
- `title` (String)
- `description` (Text, optional)
- `departmentId` (String, optional)
- `taskId` (String, optional)
- `blockedById` (String, optional -- user causing the block)
- `affectedIds` (Json, optional -- array of affected user/task IDs)
- `status` (String, default "active" -- "active", "acknowledged", "resolved")
- `detectedAt` (DateTime, default now)
- `resolvedAt` (DateTime, optional)
- Indexes: `[status, severity]`, `[departmentId]`

### CapacitySnapshot
- `id` (cuid, PK)
- `userId` (String)
- `departmentId` (String, optional)
- `period` (String -- "2026-W10")
- `totalCapacity` (Int, default 40 -- hours/week)
- `allocatedHours` (Float, default 0)
- `activeTaskCount` (Int, default 0)
- `totalWeight` (Float, default 0)
- `utilizationPct` (Float, default 0 -- 0-100)
- `computedAt` (DateTime)
- Unique constraint: `[userId, period]`
- Index: `[departmentId, period]`

### CrossDeptDependency
- `id` (cuid, PK)
- `fromDeptId` (String)
- `toDeptId` (String)
- `taskId` (String, optional)
- `description` (String)
- `status` (String, default "waiting" -- "waiting", "acknowledged", "resolved", "escalated")
- `priority` (String, default "medium" -- "low", "medium", "high", "critical")
- `createdById` (String)
- `acknowledgedById` (String, optional)
- `resolvedAt` (DateTime, optional)
- `createdAt` / `updatedAt` (DateTime)
- Indexes: `[fromDeptId, status]`, `[toDeptId, status]`

### Report
- `id` (cuid, PK)
- `title` (String)
- `type` (ReportType enum: DEPARTMENT_PERFORMANCE, TEAM_WORKLOAD, TASK_COMPLETION, HIRING_PIPELINE, CUSTOM)
- `description` (String, optional)
- `config` (Json, optional)
- `generatedData` (Json, optional -- auto-generated report data)
- `createdById` (String -- FK to User)
- `departmentId` (String, optional -- FK to Department)
- `createdAt` / `updatedAt` (DateTime)

## API routes

### Operations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/hoccr/operations` | Yes (ADMIN, HEAD_HR, DEPT_HEAD) | Operations dashboard. Returns KPIs (active tasks, completion rate, avg completion hours, overdue tasks), department breakdown, review bottlenecks (tasks in REVIEW > 24hrs), and team capacity overview. DEPT_HEAD sees only their department. |
| GET | `/api/hoccr/operations/capacity` | Yes (ADMIN, HEAD_HR, DEPT_HEAD) | Real-time capacity for all users. Params: `departmentId`. Returns per-user capacity data (utilization %, status, priority breakdown), recommended assignees (lowest-loaded available users), and summary counts. Uses CapacityEngine. |
| GET | `/api/hoccr/operations/bottlenecks` | Yes (ADMIN, HEAD_HR) | List active bottlenecks. Params: `status`. Sorted by severity (critical first). |
| POST | `/api/hoccr/operations/bottlenecks` | Yes (ADMIN, HEAD_HR) | Run bottleneck detection scan. Detects: (1) tasks in REVIEW > 24hrs (approval_delayed), (2) tasks overdue > 2 days (task_blocked), (3) users with > 10 active tasks (capacity_exceeded), (4) cross-dept tasks stale > 3 days (dependency_waiting). Creates new Bottleneck records for newly detected issues. Returns all active bottlenecks. |
| GET | `/api/hoccr/operations/dependencies` | Yes (ADMIN, HEAD_HR, DEPT_HEAD) | List cross-department dependencies. Params: `status`, `departmentId`. DEPT_HEAD sees only deps involving their department. Includes stats (total, waiting, acknowledged, escalated, resolved). |
| POST | `/api/hoccr/operations/dependencies` | Yes (ADMIN, HEAD_HR, DEPT_HEAD) | Create a cross-department dependency. Required: `fromDeptId`, `toDeptId`, `description`. Optional: `priority`, `taskId`. |

### Culture

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/hoccr/culture/sentiment` | Yes (ADMIN, HEAD_HR, DEPT_HEAD) | Department sentiment overview (last 28 days). Params: `departmentId`. Returns per-department average score, total entries, weekly trend data, and trend direction (up/down/stable). Flags departments with declining sentiment. |
| POST | `/api/hoccr/culture/sentiment` | Yes | Submit a pulse sentiment entry. Required: `score` (1-5). Optional: `notes`, `isAnonymous`. Auto-maps score to SentimentLevel enum. Sets source to "pulse". |
| GET | `/api/hoccr/culture/recognition` | Yes | List recognitions. Params: `limit` (default 30). Public recognitions visible to all; private ones only to sender/receiver/HR. Includes user info and top-5 most recognized this month. |
| POST | `/api/hoccr/culture/recognition` | Yes | Give recognition. Required: `toUserId`, `category`, `message`. Optional: `isPublic` (default true). Valid categories: kudos, teamwork, innovation, quality, leadership. Cannot self-recognize. Triggers gamification achievement check. Boosts recipient's sentiment score by +0.15 (capped at 10). |
| GET | `/api/hoccr/culture/engagement` | Yes (ADMIN, HEAD_HR, DEPT_HEAD) | Engagement metrics. Params: `departmentId`, `period` (default current month "YYYY-MM"). Returns per-department and per-individual engagement scores with all component metrics. |
| POST | `/api/hoccr/culture/engagement` | Yes (ADMIN, HEAD_HR) | Compute engagement metrics for all active users for the current month. Calculates: taskCompletionRate, collaborationScore (comments on others' tasks), activeDays, recognitions given/received. Overall score weighted: 40% task completion, 25% collaboration, 20% activity, 15% recognition. Upserts EngagementMetric records. |
| GET | `/api/hoccr/culture/metrics` | Yes (ADMIN, HEAD_HR) | Comprehensive culture metrics. Computes a composite culture score per department weighted by: 30% sentiment, 25% engagement, 20% recognition frequency, 15% cross-dept collaboration, 10% retention (active days). Also returns: org-wide score, declining departments, low-culture departments, engagement drops, and unrecognized performers (high task completion but zero recognitions). |

### Intelligence

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/hoccr/intelligence` | Yes (ADMIN, HEAD_HR, DEPT_HEAD) | Cross-department intelligence. Returns: department interaction map (strength of cross-dept collaboration from tasks and projects), cross-dept bottlenecks, dependency health (resolution rate), resource sharing patterns (multi-dept users), and least-collaborating departments. |
| GET | `/api/hoccr/intelligence/charts` | Yes (ADMIN, HEAD_HR, DEPT_HEAD) | Time-series chart data. Returns: (1) Company Velocity -- tasks completed per week for the last 8 weeks. (2) Department Capacity -- percentage workload per department (open tasks per person, scaled to 0-100 where 5 tasks/person = 100%). Summary includes avg weekly velocity, velocity trend, avg capacity, and count of overloaded departments. |

### Hiring

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/hoccr/positions` | Yes (`hoccr.read.own`) | List hiring positions. Params: `departmentId`, `isOpen`. Includes department info and candidate counts. |
| POST | `/api/hoccr/positions` | Yes (`hoccr.write.own`) | Create a position. Required: `title`, `departmentId`. Optional: `description`, `requirements`. |
| GET | `/api/hoccr/candidates` | Yes (ADMIN, HEAD_HR, DEPT_HEAD) | List candidates. Params: `positionId`, `status`, `search` (name or email). Includes position and department info. |
| POST | `/api/hoccr/candidates` | Yes | Create a candidate. Required: `name`, `email`, `positionId`. Optional: `phone`, `resumeUrl`, `notes`. |
| PATCH | `/api/hoccr/candidates` | Yes | Update a candidate. Required: `id`. Supports: `status`, `rating`, `notes`, `interviewDate`. |

### Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/hoccr/reports` | Yes | List reports. Params: `departmentId`, `type`. |
| POST | `/api/hoccr/reports` | Yes | Create a report. Required: `title`, `type`. Optional: `description`, `config`, `departmentId`. Auto-generates data for known types: TASK_COMPLETION (total/completed/in-progress/rate), HIRING_PIPELINE (candidates by status), DEPARTMENT_PERFORMANCE (30-day tasks breakdown), TEAM_WORKLOAD (active tasks per member). |

### HOCCR Announcements (legacy)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/hoccr/announcements` | Yes | List HOCCR-specific announcements. |
| GET/PATCH/DELETE | `/api/hoccr/announcements/[id]` | Yes | Single announcement CRUD. |

### Request/Response shapes

**GET /api/hoccr/operations/capacity (response):**
```json
{
  "capacity": [
    {
      "id": "user-id",
      "name": "Jane Doe",
      "avatar": "url",
      "departmentId": "dept-id",
      "activeTaskCount": 6,
      "utilizationPct": 75,
      "breakdown": [
        { "priority": "URGENT", "count": 1, "weight": 40 },
        { "priority": "HIGH", "count": 1, "weight": 25 },
        { "priority": "MEDIUM", "count": 2, "weight": 30 },
        { "priority": "LOW", "count": 2, "weight": 20 }
      ],
      "status": "busy"
    }
  ],
  "recommended": [...],
  "summary": { "totalUsers": 15, "available": 5, "busy": 7, "overloaded": 3 }
}
```

**GET /api/hoccr/intelligence/charts (response):**
```json
{
  "companyVelocity": [
    { "week": "3 Feb", "tasks": 12 },
    { "week": "10 Feb", "tasks": 15 }
  ],
  "departmentCapacity": [
    { "department": "Engineering", "capacity": 72, "headcount": 8 }
  ],
  "summary": {
    "avgWeeklyVelocity": 14,
    "velocityTrend": "up",
    "avgCapacity": 65,
    "overloadedDepts": 1
  }
}
```

## UI pages

All HOCCR pages are under `src/app/(shell)/hoccr/`.

| Path | Page | Description |
|------|------|-------------|
| `/hoccr` | Dashboard | Main HOCCR landing page with KPIs and overview |
| `/hoccr/operations` | Operations | Real-time capacity monitoring, bottleneck detection, team workload |
| `/hoccr/culture` | Culture | Sentiment tracking, recognition wall, engagement metrics, culture scores |
| `/hoccr/hiring` | Hiring | Position management and candidate pipeline tracking |
| `/hoccr/intelligence` | Intelligence | Cross-department interaction maps, velocity charts, dependency health |
| `/hoccr/reports` | Reports | Generate and view HR reports (task completion, hiring, performance, workload) |
| `/hoccr/communication` | Communication | Department-level announcements and communication |

Layout: `src/app/(shell)/hoccr/layout.tsx` -- shared navigation tabs across HOCCR sub-pages.
Loading: `src/app/(shell)/hoccr/loading.tsx` -- loading skeleton for HOCCR pages.

Components: `src/components/hoccr/capacity-table.tsx` -- capacity visualization table component.

## Engines

Three core computation engines live in `src/lib/hoccr/`.

### CapacityEngine (`capacity-engine.ts`)

Computes real-time capacity load for users based on their active (non-DONE, non-CANCELLED) tasks weighted by priority:

| Priority | Weight per task |
|----------|----------------|
| URGENT | 40% |
| HIGH | 25% |
| MEDIUM | 15% |
| LOW | 10% |

Max capacity: 150%. Status thresholds:
- **available**: 0-50%
- **busy**: 51-80%
- **overloaded**: 81-95%
- **critical**: 96%+

Functions:
- `calculateUserCapacity(userId)` -- Fetches tasks and computes capacity for one user
- `computeCapacity(userId, tasks)` -- Pure computation (accepts pre-fetched tasks)
- `calculateDepartmentCapacity(departmentId?)` -- Capacity for all users in a department

### VelocityEngine (`velocity-engine.ts`)

Calculates task completion velocity over a 14-day rolling window:

- `calculateAllVelocities()` -- Velocity for all departments
- `calculateDepartmentVelocity(deptId)` -- Single department velocity with daily breakdown
- `syncVelocityMetrics()` -- Persists latest velocity to DepartmentMetrics (for periodic use)

Returns: `completedLast14Days`, `dailyAverage`, `weeklyAverage`, and a `dailyBreakdown` array.

### CultureMonitor (`culture-monitor.ts`)

Event-driven sentiment adjustment system. Registers on the DAFTAR event bus via `registerCultureMonitor()` (called from instrumentation.ts at server startup).

**PMS_TASK_OVERDUE handler:**
1. Calculates assignee's capacity load via CapacityEngine
2. If capacity > 95%, reduces EmployeeProfile.sentimentScore by 0.3 (min 0)
3. Notifies department manager and admins with a detailed capacity breakdown message
4. If capacity > 120%, auto-creates an urgent announcement in the user's department
5. Emits `hoccr.burnout_risk_detected` event for GI

**PMS_TASK_STATUS_CHANGED handler (positive tracking):**
1. On task completion (status = DONE), checks if completed on time
2. On-time completion: +0.2 sentiment boost
3. Early completion (1+ day before deadline): +0.3 sentiment boost
4. Late completions receive no boost
5. Sentiment capped at 10.0

## Background jobs (Inngest)

None currently. The HOCCR module does not have dedicated Inngest functions. Operations are either:
- On-demand via API calls (bottleneck detection scan, engagement computation)
- Event-driven via the CultureMonitor (reacts to PMS events in real-time)
- Called from other modules' workflows

## Known issues and gaps

1. **~~Sentiment was decrement-only~~ FIXED.** Sentiment is now bidirectional — increments on task completion (+0.2 on-time, +0.3 early), streaks, and recognition events. Decrements on overload/overdue events. The CultureMonitor's `handleTaskCompleted` handler is wired and functional.
2. **No pulse surveys** -- The POST endpoint on `/api/hoccr/culture/sentiment` supports manual pulse submissions, but there is no scheduled survey mechanism or UI for triggering pulse surveys across teams.
3. **Bottleneck detection is basic** -- Detection uses simple heuristics (time thresholds, task counts). No ML-based prediction of upcoming bottlenecks or pattern recognition.
4. **CapacitySnapshot model not used by the API** -- The CapacitySnapshot model exists in the schema but the `/operations/capacity` endpoint computes capacity in real-time rather than reading from snapshots. No periodic job writes to CapacitySnapshot.
5. **Engagement metrics require manual trigger** -- The POST endpoint on `/api/hoccr/culture/engagement` must be called manually to compute metrics. There is no cron job that auto-computes monthly engagement.
6. **No interview scheduling** -- The hiring pipeline tracks `interviewDate` on candidates but has no calendar integration or scheduling functionality.
7. **Report generation is synchronous** -- Reports are generated inline during the POST request. For large organizations, this could be slow. No background job for report generation.
8. **Culture metrics endpoint is expensive** -- `/api/hoccr/culture/metrics` makes many sequential database queries per department (sentiment, engagement, recognition, collaboration, retention). No caching.
9. **No HOCCR-specific Inngest jobs** -- Velocity sync, engagement computation, and bottleneck scans should ideally run on cron schedules but are currently manual API calls.
10. **HOCCR announcements endpoint is redundant** -- `/api/hoccr/announcements` duplicates functionality from the Communication module's `/api/communication/announcements`.

## Dependencies on other modules

- **PMS (Task Management)** -- Core dependency. Capacity, velocity, bottleneck detection, and engagement computation all read from Task data. The CultureMonitor listens to PMS events (PMS_TASK_OVERDUE, PMS_TASK_STATUS_CHANGED).
- **Communication** -- The CultureMonitor auto-creates announcements when capacity exceeds 120%. HOCCR has its own communication page and announcement routes.
- **Gamification** -- Recognition POST triggers `checkCollaborationAchievements()` from the Gamification module.
- **GI** -- Emits `hoccr.burnout_risk_detected` event that GI processes for autonomous insight generation. EmployeeProfile.sentimentScore is tracked by GI interactions.
- **Event Bus** -- CultureMonitor registers listeners on the DAFTAR event bus for real-time event processing.
- **Notifications** -- Uses `createNotification()` to alert managers about burnout risks.
- **Departments (core)** -- All HOCCR data is organized by department. Department membership determines data access for DEPT_HEAD role.
- **Users/Auth (core)** -- Role-based access: ADMIN and HEAD_HR have full access, DEPT_HEAD sees own department only. User profiles via EmployeeProfile.
