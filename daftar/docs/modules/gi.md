# GI -- General Intelligence Copilot

## What It Does

GI (General Intelligence) is DAFTAR's autonomous organizational copilot. It serves as a context-aware assistant that sits in a right-sidebar panel accessible from every page in the application. GI provides three tiers of intelligence:

1. **Reactive Chat:** Users ask questions and GI responds with data-backed answers pulled from live database queries (task stats, credibility scores, deadlines, department metrics, content stats, predictions, patterns, and more).

2. **Proactive Insights:** On every chat interaction, GI also returns a `proactiveInsight` -- an unsolicited observation about the user's current state (overdue tasks, bottleneck alerts, predictions, pending actions, etc.) that surfaces the most important thing they should pay attention to.

3. **Predictive Analytics and Autonomous Actions:** GI generates predictions (deadline risks, capacity crunches, burnout signals) and can take autonomous actions (task reassignment, deadline extension, workload rebalancing) through a tier-based approval system.

Key capabilities:

- **Context-aware chat** that queries 15+ data sources based on the user's role, department, and current view.
- **Credibility and performance insights** with personalized coaching messages.
- **Prediction engine** that forecasts deadline risks, capacity crunches, quality decline, burnout risk, bottleneck formation, and dependency stalls.
- **Autonomous action system** with a 4-tier approval model: Tier 1 (inform only) -> Tier 2 (suggest, needs approval) -> Tier 3 (act and notify) -> Tier 4 (act silently).
- **Pattern detection** tracking velocity trends, quality trends, workload shifts, engagement drops, and collaboration patterns.
- **Motivation profiling** with personalized tone, nudge frequency, and motivator/demotivator tracking.
- **Learning system** that accumulates organizational knowledge (rhythms, preferences, patterns, corrections, outcomes) with confidence scores.
- **Skill-aware suggestions** via the GI Skill Engine for module-specific contextual help.

---

## Database Models

### GIConfig
Table: `gi_configs`

| Field       | Type          | Notes                           |
|-------------|---------------|---------------------------------|
| id          | String (cuid) | Primary key                    |
| key         | String        | Unique. Configuration key       |
| value       | Json          | Configuration value             |
| description | String?       | What this config controls       |
| updatedBy   | String        | Who last changed it             |
| updatedAt   | DateTime      | Auto                            |

### GITierAssignment
Table: `gi_tier_assignments`

| Field      | Type          | Notes                                     |
|------------|---------------|-------------------------------------------|
| id         | String (cuid) | Primary key                               |
| actionType | String        | Unique. e.g. "task_reassignment", "deadline_extension" |
| tier       | Int           | 1-4. Which autonomy tier this action runs at |
| updatedBy  | String        | Who configured this                       |
| updatedAt  | DateTime      | Auto                                      |

### GIPatternLog
Table: `gi_pattern_logs`

| Field        | Type          | Notes                                                   |
|--------------|---------------|---------------------------------------------------------|
| id           | String (cuid) | Primary key                                             |
| userId       | String?       | User the pattern relates to (null for department-wide)  |
| departmentId | String?       | Department the pattern relates to                       |
| patternType  | String        | velocity_trend, quality_trend, workload_shift, engagement_drop, collaboration_pattern |
| description  | String (Text) | Human-readable pattern description                      |
| data         | Json          | `{trend, periods, values, comparison}`                  |
| severity     | String        | info, warning, critical. Default "info"                 |
| isActive     | Boolean       | Default true. Inactive patterns are historical          |
| detectedAt   | DateTime      | When the pattern was first detected                     |
| expiresAt    | DateTime?     | Optional auto-expiry                                    |

Indexes: `[userId, patternType]`, `[departmentId, patternType]`, `[isActive, detectedAt]`

### GIMotivationProfile
Table: `gi_motivation_profiles`

| Field           | Type          | Notes                                                 |
|-----------------|---------------|-------------------------------------------------------|
| id              | String (cuid) | Primary key                                           |
| userId          | String        | Unique per user                                       |
| preferredTone   | String        | encouraging, direct, balanced, competitive. Default "balanced" |
| nudgeFrequency  | String        | minimal, normal, frequent. Default "normal"           |
| motivators      | Json          | Array of strings: achievement, recognition, mastery, autonomy |
| demotivators    | Json          | Array of strings: micromanagement, repetition, isolation |
| responseHistory | Json          | `{insight_type: {shown, clicked, dismissed}}`         |
| lastCalibrated  | DateTime      | When the profile was last updated                     |
| updatedAt       | DateTime      | Auto                                                  |

### GIAutonomousAction
Table: `gi_autonomous_actions`

| Field        | Type            | Notes                                                |
|--------------|-----------------|------------------------------------------------------|
| id           | String (cuid)   | Primary key                                          |
| actionType   | String          | task_reassignment, deadline_extension, workload_rebalance, scheduling, notification_batch |
| tier         | Int             | 1 = inform, 2 = suggest, 3 = act & notify, 4 = act silently |
| status       | GIActionStatus  | Enum: PENDING, APPROVED, EXECUTED, REJECTED, UNDONE, FAILED |
| description  | String (Text)   | What GI intends to do                                |
| targetUserId | String?         | User affected by the action                          |
| targetEntity | String?         | Entity reference e.g. "task:cuid123" or "dept:cuid456" |
| actionData   | Json            | Type-specific payload for execution                  |
| reasoning    | String? (Text)  | Why GI decided to take this action                   |
| result       | Json?           | Outcome data after execution                         |
| triggeredBy  | String?         | Prediction or pattern that triggered this            |
| approvedById | String?         | Who approved (for Tier 2)                            |
| executedAt   | DateTime?       | When the action was executed                         |
| undoneAt     | DateTime?       | When the action was undone                           |
| expiresAt    | DateTime?       | Auto-expire for pending actions                      |
| createdAt    | DateTime        | Auto                                                 |
| updatedAt    | DateTime        | Auto                                                 |

Indexes: `[status, tier]`, `[targetUserId, status]`, `[actionType, createdAt]`

### GIPrediction
Table: `gi_predictions`

| Field        | Type          | Notes                                                   |
|--------------|---------------|---------------------------------------------------------|
| id           | String (cuid) | Primary key                                             |
| type         | String        | deadline_risk, capacity_crunch, quality_decline, burnout_risk, bottleneck_forming, dependency_stall |
| confidence   | Float         | 0-1 confidence score                                    |
| severity     | String        | low, medium, high, critical. Default "medium"           |
| title        | String        | Short prediction headline                               |
| description  | String (Text) | Full prediction explanation                             |
| data         | Json          | Prediction-specific data, evidence, and factors         |
| targetUserId | String?       | User the prediction is about                            |
| departmentId | String?       | Department scope                                        |
| entityRef    | String?       | Entity reference e.g. "task:id", "dept:id"              |
| isActive     | Boolean       | Default true                                            |
| actionTaken  | String?       | What was done about it                                  |
| actionId     | String?       | Links to GIAutonomousAction if action was taken         |
| accuracy     | Float?        | Retrospective: was the prediction correct? 0-1          |
| resolvedAt   | DateTime?     | When the prediction was resolved or became irrelevant   |
| predictsAt   | DateTime      | When the predicted event is expected to occur           |
| createdAt    | DateTime      | Auto                                                    |

Indexes: `[type, isActive]`, `[targetUserId, isActive]`, `[departmentId, isActive]`, `[predictsAt]`

### GILearningLog
Table: `gi_learning_logs`

| Field        | Type          | Notes                                                    |
|--------------|---------------|----------------------------------------------------------|
| id           | String (cuid) | Primary key                                              |
| category     | String        | rhythm, preference, pattern, correction, outcome         |
| key          | String        | e.g. "team_peak_hours", "approval_avg_time", "dept_velocity_baseline" |
| value        | Json          | The learned data                                         |
| confidence   | Float         | 0-1. Default 0.5. Higher = more data points observed    |
| observations | Int           | Default 1. Number of data points                         |
| departmentId | String?       | Department scope (null for org-wide)                     |
| userId       | String?       | User scope (null for team-wide)                          |
| isActive     | Boolean       | Default true                                             |
| lastObserved | DateTime      | Last time this learning was reinforced                   |
| createdAt    | DateTime      | Auto                                                     |
| updatedAt    | DateTime      | Auto                                                     |

Unique constraint: `[category, key, departmentId, userId]`

---

## API Routes

### POST /api/gi/chat
Main GI chat endpoint. Processes a user message with full organizational context.

**Auth:** All authenticated roles.

**Request body:**
```json
{
  "message": "string (required)",
  "context": {
    "currentEntityType": "task | ...",
    "currentEntityId": "string"
  }
}
```

**Response:**
```json
{
  "message": "GI's response text",
  "suggestions": ["Follow-up suggestion 1", "Follow-up suggestion 2"],
  "contextUsed": ["userTaskStats", "credibility", "upcomingDeadlines"],
  "proactiveInsight": "You have 3 overdue tasks..."
}
```

**Context gathered automatically based on role:**
- All users: task stats, credibility score, upcoming deadlines (3 days), unread notifications, content stats, article stats, active predictions, pending actions, recent patterns, motivation profile.
- DEPT_HEAD / ADMIN: department task breakdown, active bottlenecks, team size.
- ADMIN: org-wide stats (users, brands, departments, open positions, bottlenecks).

**Supported query topics:** tasks, status, overdue, credibility, upcoming deadlines, notifications, bottlenecks, department, organization, content/relay, announcements, articles/vritti, predictions, autonomous actions, learnings, patterns/trends, leaderboard, help/capabilities, greetings.

---

### GET /api/gi/config
Get all GI configuration entries.

**Auth:** ADMIN only.

**Response:** Array of GIConfig objects.

---

### GET /api/gi/tiers
Get all GI tier assignments.

**Auth:** ADMIN only.

**Response:** Array of GITierAssignment objects.

---

### GET /api/gi/predictions
List active predictions.

**Auth:** ADMIN, HEAD_HR, DEPT_HEAD only. DEPT_HEAD scoped to their department.

**Query params:**
- `type` -- Filter by prediction type.
- `active` -- Boolean (default true). Show active only or all.
- `refresh` -- Boolean. If true, triggers prediction generation before returning.

**Response:**
```json
{
  "predictions": [...],
  "stats": {
    "total": 12,
    "critical": 2,
    "high": 3,
    "medium": 7,
    "avgConfidence": 72,
    "withAccuracy": 5,
    "avgAccuracy": 68,
    "predictionTypes": ["deadline_risk", "capacity_crunch"],
    "methodology": {
      "deadline_risk": "Compares estimated hours against remaining time...",
      "capacity_crunch": "Counts tasks due next week vs. 4-week average...",
      "burnout_risk": "Flags members with 10+ active tasks, low sentiment..."
    }
  }
}
```

---

### POST /api/gi/predictions
Trigger fresh prediction generation.

**Auth:** ADMIN, HEAD_HR, DEPT_HEAD only.

**Response:** Count of generated insights and new predictions created in the last 60 seconds.

---

### GET /api/gi/actions
List autonomous actions.

**Auth:** ADMIN, HEAD_HR, DEPT_HEAD only. DEPT_HEAD scoped to their department members.

**Query params:**
- `status` -- Filter by GIActionStatus.
- `tier` -- Filter by tier number.
- `limit` -- Max results (default 50, max 100).

**Response:**
```json
{
  "actions": [...],
  "stats": {
    "total": 25,
    "PENDING": 3,
    "EXECUTED": 15,
    "REJECTED": 5,
    "UNDONE": 2
  }
}
```

---

### PATCH /api/gi/actions/[id]
Approve, reject, or undo an autonomous action.

**Auth:** ADMIN, HEAD_HR, DEPT_HEAD only.

**Request body:**
```json
{
  "action": "approve | reject | undo"
}
```

**Behavior by action:**
- **approve:** Validates status is PENDING, executes the action, records result. Supported action types:
  - `task_reassignment`: Moves stalled reviews from REVIEW to IN_PROGRESS.
  - `deadline_extension`: Updates task dueDate to the new date.
  - `workload_rebalance`: Reassigns task to a different user.
- **reject:** Sets status to REJECTED (only for PENDING actions).
- **undo:** Reverses an EXECUTED action. Restores previous status, deadline, or assignee.

All state changes are logged as TaskActivity entries with GI-specific action codes (GI_ESCALATE_REVIEW, GI_DEADLINE_EXTENSION, GI_WORKLOAD_REBALANCE, etc.).

---

### GET /api/gi/suggestions
Get skill-aware contextual suggestions.

**Auth:** All authenticated roles.

**Query params:**
- `module` -- Current module (default "dashboard").
- `view` -- Current view (default "main").
- `entityId` -- Optional entity ID.
- `brand` -- Optional brand slug.
- `platform` -- Optional platform.

**Response:** Array of GIInsight objects generated by the GI Skill Engine.

---

### GET /api/gi/learning
Get accumulated learnings.

**Auth:** ADMIN only.

**Query params:**
- `category` -- Filter by learning category (rhythm, preference, pattern, correction, outcome).

**Response:**
```json
{
  "learnings": [...],
  "byCategory": { "rhythm": [...], "preference": [...] },
  "stats": {
    "totalLearnings": 42,
    "categories": 5,
    "avgConfidence": 68,
    "totalObservations": 310
  }
}
```

---

## UI Pages

### GI Assistant Panel (Right Sidebar)
Component in the shell layout. A collapsible right-side panel accessible from every page. Contains a chat interface where users type questions and receive contextual responses with follow-up suggestion chips. Shows proactive insights at the top.

### /admin/gi (Config)
Admin-only page for managing GI configuration:
- Tier assignments (which actions need approval vs. auto-execute).
- Global GI settings.
- Learning log viewer with category grouping and confidence scores.
- Prediction and action dashboards.

---

## Background Jobs (Inngest)

GI does not define its own Inngest functions in the `yantri-workflows.ts` file. Instead, the GI engine operates through:

1. **Event Bus Consumption:** The `daftarEvents` event bus receives PMS events (PMS_TASK_CREATED, PMS_TASK_STATUS_CHANGED, PMS_TASK_NEEDS_REVIEW) and Yantri events (YANTRI_DELIVERABLE_READY) that GI processes to generate insights, update patterns, and trigger autonomous actions.

2. **On-demand Generation:** The `generateInsights` function in `gi-engine.ts` runs in real-time when users interact with GI or when prediction refresh is triggered.

---

## Known Issues and Gaps

1. **~~Actions log intent but do not fully execute~~ FIXED.** GI actions now execute on approval — task reassignment, deadline extension, and workload rebalancing all work end-to-end. Status transitions: PENDING → EXECUTED. Note: the prediction-to-action pipeline still does not automatically create GIAutonomousAction records from predictions — actions must be triggered through admin tooling or the chat interface.
2. **No real task reassignment intelligence.** The `workload_rebalance` action requires the `newAssigneeId` to be pre-determined in the action data. GI does not yet analyze team capacity to suggest optimal reassignment targets.
3. **Chat is keyword-based, not LLM-powered.** The `generateReactiveResponse` function uses keyword matching (e.g., checking if the message contains "task", "overdue", "credibility") rather than an LLM. This means nuanced questions or requests phrased in unexpected ways may get generic responses.
4. **Prediction generation is basic.** Methodology descriptions reference historical pace analysis and throughput comparisons, but the actual `generateInsights` function generates simple heuristic-based insights rather than statistical predictions.
5. **Learning logs are not consumed.** GILearningLog records are stored and displayed but the GI engine does not use them to improve its responses or predictions over time.
6. **Motivation profiles are not applied.** GIMotivationProfile records exist but the chat engine does not adjust its tone or nudge frequency based on the user's profile.
7. **No streaming responses.** GI chat returns complete responses synchronously. There is no streaming/typewriter effect for longer responses.
8. **Tier assignments are static.** The tier system exists in the database but there is no dynamic tier escalation based on GI's track record.

---

## Dependencies on Other Modules

| Module       | Direction     | Description                                                                   |
|--------------|---------------|-------------------------------------------------------------------------------|
| PMS          | PMS -> GI     | Task events (created, status changed, needs review) feed GI's context engine  |
| PMS          | GI -> PMS     | GI autonomous actions modify tasks (reassign, extend deadlines, escalate)     |
| Gamification | Gamification -> GI | GI chat queries credibility scores and streak/XP data for personalized insights |
| Yantri       | Yantri -> GI  | YANTRI_DELIVERABLE_READY events inform GI about content readiness             |
| HOCCR        | HOCCR -> GI   | GI queries bottleneck data, department metrics, and hiring stats              |
| Khabri       | GI reads Khabri | GI provides content/signal status information in chat responses              |
| Communication| GI reads Comms | GI surfaces unread announcement counts in chat                              |
| Relay        | GI reads Relay | GI surfaces content post stats (scheduled, draft, published, failed)         |
