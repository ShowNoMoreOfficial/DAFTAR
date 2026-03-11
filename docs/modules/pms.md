# PMS -- Project Management System

## What It Does

PMS is DAFTAR's Kanban-based task management system. Every piece of work flowing through the agency -- whether it is a client deliverable, an internal operations task, or a content production item -- is tracked as a Task. Tasks move through a strict status workflow (CREATED -> ASSIGNED -> IN_PROGRESS -> REVIEW -> APPROVED -> DONE), with an optional CANCELLED branch. The module also maintains a **credibility scoring** system that evaluates each team member's reliability, quality, and consistency based on their task completion history.

Key capabilities:

- Kanban board view grouped by status columns.
- List view with filtering by status, priority, assignee, department, brand, and project.
- Workload dashboard showing active task counts, difficulty weight, and overdue counts per team member.
- CSV export of tasks.
- Role-based scoping: MEMBER/CONTRACTOR see only their own tasks, DEPT_HEAD sees their department, ADMIN sees everything.
- Task comments with notification to creator/assignee.
- Full activity log tracking every field change and status transition.
- Credibility scoring recalculated on every task completion.
- Gamification integration: XP is awarded and achievements are checked when a task reaches DONE or APPROVED.
- GI integration: events are emitted on task creation, status changes, and review transitions for the GI engine to consume.

---

## Database Models

### Task
Table: `tasks`

| Field            | Type           | Notes                                                |
|------------------|----------------|------------------------------------------------------|
| id               | String (cuid)  | Primary key                                          |
| title            | String         | Required                                             |
| description      | String (Text)  | Optional long-form description                       |
| status           | TaskStatus     | Enum: CREATED, ASSIGNED, IN_PROGRESS, REVIEW, APPROVED, DONE, CANCELLED. Default CREATED |
| priority         | TaskPriority   | Enum: LOW, MEDIUM, HIGH, URGENT. Default MEDIUM      |
| difficultyWeight | Int            | Default 1. Used in XP calculation and workload aggregation |
| creatorId        | String (FK)    | -> User. Who created the task                        |
| assigneeId       | String? (FK)   | -> User. Who the task is assigned to                 |
| departmentId     | String? (FK)   | -> Department                                        |
| brandId          | String? (FK)   | -> Brand                                             |
| projectId        | String? (FK)   | -> Project                                           |
| dueDate          | DateTime?      | Optional deadline                                    |
| startedAt        | DateTime?      | Set when status moves to IN_PROGRESS                 |
| completedAt      | DateTime?      | Set when status moves to DONE                        |
| createdAt        | DateTime       | Auto                                                 |
| updatedAt        | DateTime       | Auto                                                 |

Indexes: `[assigneeId, status]`, `[departmentId, status]`, `[status]`

### TaskComment
Table: `task_comments`

| Field    | Type          | Notes                    |
|----------|---------------|--------------------------|
| id       | String (cuid) | Primary key              |
| content  | String (Text) | Comment body             |
| taskId   | String (FK)   | -> Task (cascade delete) |
| authorId | String (FK)   | -> User                  |
| createdAt| DateTime      | Auto                     |
| updatedAt| DateTime      | Auto                     |

### TaskActivity
Table: `task_activities`

| Field    | Type          | Notes                                   |
|----------|---------------|-----------------------------------------|
| id       | String (cuid) | Primary key                             |
| taskId   | String (FK)   | -> Task (cascade delete)                |
| actorId  | String (FK)   | -> User                                 |
| action   | String        | e.g. "created", "updated", "status_changed", "commented" |
| field    | String?       | Which field changed                     |
| oldValue | String?       | Previous value                          |
| newValue | String?       | New value                               |
| createdAt| DateTime      | Auto                                    |

### TaskTag
Table: `task_tags`

| Field  | Type          | Notes                          |
|--------|---------------|--------------------------------|
| id     | String (cuid) | Primary key                    |
| taskId | String (FK)   | -> Task (cascade delete)       |
| name   | String        | Tag label                      |

Unique constraint: `[taskId, name]`

### CredibilityScore
Table: `credibility_scores`

| Field          | Type          | Notes                                |
|----------------|---------------|--------------------------------------|
| id             | String (cuid) | Primary key                          |
| userId         | String (FK)   | -> User. Unique per user             |
| reliability    | Float         | Default 50. On-time delivery ratio   |
| quality        | Float         | Default 50. Direct approval ratio    |
| consistency    | Float         | Default 50. Regularity of completions over 30 days |
| overallScore   | Float         | Default 50. Average of three sub-scores |
| tasksCompleted | Int           | Default 0                            |
| tasksOnTime    | Int           | Default 0                            |
| tasksLate      | Int           | Default 0                            |
| updatedAt      | DateTime      | Auto                                 |

### Project
Table: `projects`

| Field       | Type          | Notes                   |
|-------------|---------------|-------------------------|
| id          | String (cuid) | Primary key             |
| name        | String        | Project name            |
| description | String?       | Optional description    |
| deptId      | String (FK)   | -> Department           |
| status      | String        | Default "active"        |
| createdAt   | DateTime      | Auto                    |
| updatedAt   | DateTime      | Auto                    |

### ProjectMember
Table: `project_members`

| Field     | Type          | Notes                              |
|-----------|---------------|------------------------------------|
| id        | String (cuid) | Primary key                        |
| projectId | String (FK)   | -> Project (cascade delete)        |
| userId    | String (FK)   | -> User (cascade delete)           |
| role      | String?       | Role within the project            |

Unique constraint: `[projectId, userId]`

---

## API Routes

All routes require authentication via NextAuth session. Returns `401 Unauthorized` if no session.

### GET /api/tasks
List tasks with filtering and pagination.

**Auth:** All authenticated roles (scoped by role).

**Query params:**
- `status` -- TaskStatus filter
- `assigneeId` -- Filter by assignee
- `departmentId` -- Filter by department
- `brandId` -- Filter by brand
- `projectId` -- Filter by project
- `priority` -- TaskPriority filter
- `search` -- Title substring search (case-insensitive)
- `page`, `limit` -- Pagination (default limit 25)

**Role scoping:**
- MEMBER/CONTRACTOR: only tasks they created or are assigned to.
- DEPT_HEAD: only tasks in their primary department.
- ADMIN: all tasks.

**Response:** Paginated response with tasks including assignee, creator, department, brand, project, tags, and comment count.

---

### POST /api/tasks
Create a new task.

**Auth:** Requires `pms.write.own` permission.

**Request body:**
```json
{
  "title": "string (required)",
  "description": "string?",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "assigneeId": "string?",
  "departmentId": "string?",
  "brandId": "string?",
  "projectId": "string?",
  "dueDate": "ISO date string?",
  "difficultyWeight": "number?",
  "tags": ["string"]
}
```

**Response:** `201` with the created task (includes assignee, creator, department, brand).

**Side effects:**
- TaskActivity "created" entry logged.
- Notification sent to assignee if different from creator.
- `PMS_TASK_CREATED` event emitted for GI.

---

### GET /api/tasks/[id]
Get a single task with full details.

**Auth:** All authenticated roles.

**Response:** Task with assignee, creator, department, brand, project, tags, comments (with authors), and last 20 activities.

---

### PATCH /api/tasks/[id]
Update task fields.

**Auth:** All authenticated roles.

**Request body:** Any combination of: `title`, `description`, `priority`, `assigneeId`, `departmentId`, `brandId`, `projectId`, `dueDate`, `difficultyWeight`.

**Response:** Updated task.

**Side effects:** TaskActivity entries logged for each changed field.

---

### DELETE /api/tasks/[id]
Delete a task.

**Auth:** Task creator or ADMIN only. Returns `403` otherwise.

**Response:** `{ "success": true }`

---

### PATCH /api/tasks/[id]/status
Change task status with validation of allowed transitions.

**Auth:** All authenticated roles.

**Request body:**
```json
{
  "status": "TaskStatus (required)"
}
```

**Valid transitions:**
| From        | Allowed to                      |
|-------------|---------------------------------|
| CREATED     | ASSIGNED, CANCELLED             |
| ASSIGNED    | IN_PROGRESS, CANCELLED          |
| IN_PROGRESS | REVIEW, ASSIGNED, CANCELLED     |
| REVIEW      | APPROVED, IN_PROGRESS           |
| APPROVED    | DONE, IN_PROGRESS               |
| DONE        | (none)                          |
| CANCELLED   | CREATED                         |

**Response:** Updated task.

**Side effects:**
- `startedAt` set on first move to IN_PROGRESS.
- `completedAt` set on move to DONE.
- TaskActivity "status_changed" entry logged.
- Notification to creator/assignee about status change.
- When APPROVED and task has a brand with a client, the client is notified that a deliverable is ready.
- **Gamification on DONE:** XP awarded (formula: `difficultyWeight * 10 * priorityMultiplier`), task and speed achievements checked.
- **Gamification on APPROVED:** Quality achievements checked.
- **Credibility score update on DONE:** Recalculates reliability, quality, and consistency sub-scores.
- `PMS_TASK_STATUS_CHANGED` event emitted.
- `PMS_TASK_NEEDS_REVIEW` event emitted when status reaches REVIEW.

---

### POST /api/tasks/[id]/comments
Add a comment to a task.

**Auth:** All authenticated roles.

**Request body:**
```json
{
  "content": "string (required)"
}
```

**Response:** `201` with the created comment (includes author).

**Side effects:**
- TaskActivity "commented" entry logged.
- Notifications sent to task creator and assignee (excluding the commenter).

---

### GET /api/tasks/board
Get Kanban board data grouped by status columns.

**Auth:** All authenticated roles (scoped by role).

**Query params:**
- `departmentId` -- Optional department filter.

**Response:** Array of 6 column objects (CREATED, ASSIGNED, IN_PROGRESS, REVIEW, APPROVED, DONE), each containing an array of tasks. CANCELLED tasks are excluded.

---

### GET /api/tasks/workload
Get workload distribution across team members.

**Auth:** All authenticated roles.

**Query params:**
- `departmentId` -- Optional (defaults to user's primary department).

**Response:** Array of user workload objects:
```json
[
  {
    "user": { "id": "...", "name": "...", "avatar": "...", "role": "..." },
    "activeTasks": 5,
    "totalWeight": 8,
    "overdueTasks": 1,
    "tasksByStatus": { "assigned": 2, "inProgress": 2, "review": 1 },
    "credibility": { "overallScore": 72, "tasksCompleted": 30, "tasksOnTime": 25, "tasksLate": 5 }
  }
]
```

Sorted by totalWeight descending (most loaded first).

---

### GET /api/tasks/export
Export tasks as CSV.

**Auth:** All authenticated roles except CLIENT (returns `403`).

**Query params:**
- `status` -- Filter by status.
- `priority` -- Filter by priority.

**Response:** CSV file download. Columns: Title, Status, Priority, Assignee, Department, Brand, Due Date, Started At, Completed At, Created At.

---

## UI Pages

### /pms (Main Page)
The primary PMS entry point. Renders the overview with quick stats and navigation to sub-views.

### /pms/board
Kanban board with 6 status columns. Tasks are displayed as cards showing title, priority badge, assignee avatar, tag pills, and comment count. Department filter available for DEPT_HEAD/ADMIN.

### /pms/list
Tabular task list with sorting, filtering by status/priority/assignee/department/brand, search, and pagination.

### /pms/workload
Workload dashboard showing each team member's active task count, total difficulty weight, overdue count, breakdown by status, and credibility score.

### /pms/gamification
Gamification view within PMS context -- likely shows leaderboard/achievements relevant to task performance.

### Task Detail Panel
Component: `src/components/pms/task-detail-panel.tsx`. A slide-out or inline panel showing full task details, comments thread, activity timeline, and status transition controls.

---

## Background Jobs (Inngest)

PMS does not define its own Inngest functions. However, it emits events consumed by other modules:

| Event                      | Emitted when         | Consumer     |
|----------------------------|----------------------|--------------|
| PMS_TASK_CREATED           | Task created         | GI engine    |
| PMS_TASK_STATUS_CHANGED    | Any status change    | GI engine    |
| PMS_TASK_NEEDS_REVIEW      | Status -> REVIEW     | GI engine    |

PMS also listens for events from Yantri (`YANTRI_DELIVERABLE_READY`) which may trigger task creation or updates.

---

## Known Issues and Gaps

1. **No drag-and-drop reorder.** The Kanban board sorts by priority and creation date. Users cannot drag tasks between columns or reorder within a column.
2. **No subtasks.** Tasks are flat -- there is no parent/child task hierarchy.
3. **No time tracking.** `startedAt` and `completedAt` are recorded but there is no built-in time logging or time estimates.
4. **Delete restricted to DRAFT-like state.** Any task can be deleted by the creator or ADMIN regardless of status -- there is no soft-delete or archive.
5. **Credibility scoring is one-directional.** Positive actions increment on-time counts, but there is no decay or penalty mechanism beyond late delivery counting.
6. **No recurring tasks.** All tasks are one-off.
7. **No task templates.** Tasks must be created manually each time.

---

## Dependencies on Other Modules

| Module       | Direction | Description                                                              |
|--------------|-----------|--------------------------------------------------------------------------|
| Gamification | PMS -> Gamification | Task completion triggers XP award, streak update, and achievement checks |
| GI           | PMS -> GI | Task events (created, status changed, needs review) are emitted for GI to generate insights and autonomous actions |
| GI           | GI -> PMS | GI autonomous actions can reassign tasks, extend deadlines, and escalate stalled reviews |
| Yantri       | Yantri -> PMS | Yantri deliverables may trigger PMS task creation for editorial review |
| Relay        | Relay reads PMS | Published content posts may be linked to tasks                          |
| Notifications| PMS -> Notifications | Task assignment, status changes, and comments trigger in-app notifications |
