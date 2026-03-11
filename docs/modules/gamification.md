# Gamification

## What It Does

The Gamification module adds an XP/level system, daily streaks, achievements, micro-challenges, variable rewards, and a leaderboard to DAFTAR. Its purpose is to drive consistent engagement across the platform by rewarding task completion, quality work, collaboration, and daily activity. The module is entirely event-driven -- it does not run on its own schedule but is triggered by actions in other modules (primarily PMS).

Key capabilities:

- **XP and Leveling:** Users earn XP when they complete tasks. XP requirements scale with a power curve (`100 * level^1.5`). Level is recalculated on every XP change.
- **Streaks:** Consecutive daily activity is tracked. Completing at least one task per day increments the streak counter.
- **Achievements:** 11 built-in achievements across 5 categories (milestone, streak, speed, quality, collaboration). Unlocked automatically when thresholds are met.
- **Micro-Challenges:** Time-boxed competitions (speed, quality, volume, collaboration) that department heads and admins can create. Users submit entries and compete for bonus points.
- **Variable Rewards:** Surprise bonuses, spotlights, badge upgrades, and streak saves that can be awarded to users. Rewards have optional expiry dates and must be claimed to receive points.
- **Leaderboard:** Org-wide and department-filtered rankings by total XP.

---

## Database Models

### UserStreak
Table: `user_streaks`

| Field          | Type          | Notes                                      |
|----------------|---------------|--------------------------------------------|
| id             | String (cuid) | Primary key                                |
| userId         | String (FK)   | -> User. Unique per user                   |
| currentStreak  | Int           | Default 0. Days of consecutive activity    |
| longestStreak  | Int           | Default 0. All-time best streak            |
| lastActivityAt | DateTime      | Last day a task was completed              |
| totalXp        | Int           | Default 0. Cumulative XP earned            |
| level          | Int           | Default 1. Current level (derived from XP) |
| updatedAt      | DateTime      | Auto                                       |

### Achievement
Table: `achievements`

| Field       | Type          | Notes                                                        |
|-------------|---------------|--------------------------------------------------------------|
| id          | String (cuid) | Primary key                                                  |
| key         | String        | Unique. Machine identifier (e.g. "first_task", "streak_7")  |
| name        | String        | Display name                                                 |
| description | String        | What the user did to earn it                                 |
| icon        | String        | Emoji or icon name                                           |
| category    | String        | milestone, streak, quality, speed, collaboration, special    |
| threshold   | Int           | Default 1. Numeric target to unlock                          |
| points      | Int           | Default 10. XP bonus on unlock                               |
| isActive    | Boolean       | Default true. Inactive achievements cannot be unlocked       |
| createdAt   | DateTime      | Auto                                                         |

**Default achievements (seeded):**

| Key           | Name            | Category      | Threshold | Points | Condition                         |
|---------------|-----------------|---------------|-----------|--------|-----------------------------------|
| first_task    | First Step      | milestone     | 1         | 10     | Complete 1 task                   |
| ten_tasks     | Getting Started | milestone     | 10        | 50     | Complete 10 tasks                 |
| fifty_tasks   | Workhorse       | milestone     | 50        | 150    | Complete 50 tasks                 |
| centurion     | Centurion       | milestone     | 100       | 300    | Complete 100 tasks                |
| streak_3      | Hat Trick       | streak        | 3         | 15     | 3-day activity streak             |
| streak_7      | Weekly Warrior  | streak        | 7         | 50     | 7-day activity streak             |
| streak_30     | Unstoppable     | streak        | 30        | 200    | 30-day activity streak            |
| speed_demon   | Speed Demon     | speed         | 1         | 25     | Complete a task within 1 hour     |
| rapid_fire    | Rapid Fire      | speed         | 3         | 40     | Complete 3 tasks in a single day  |
| team_player   | Team Player     | collaboration | 5         | 30     | Give 5 recognitions               |
| quality_king  | Quality King    | quality       | 10        | 75     | 10 tasks approved without revision|

### UserAchievement
Table: `user_achievements`

| Field         | Type          | Notes                                  |
|---------------|---------------|----------------------------------------|
| id            | String (cuid) | Primary key                            |
| userId        | String (FK)   | -> User (cascade delete)               |
| achievementId | String (FK)   | -> Achievement (cascade delete)        |
| unlockedAt    | DateTime      | When the achievement was earned        |
| notified      | Boolean       | Default false. Set true after user sees it |

Unique constraint: `[userId, achievementId]`

### MicroChallenge
Table: `micro_challenges`

| Field         | Type          | Notes                                             |
|---------------|---------------|---------------------------------------------------|
| id            | String (cuid) | Primary key                                       |
| title         | String        | Challenge name                                    |
| description   | String        | What the challenge is about                       |
| type          | String        | speed, quality, volume, collaboration             |
| metric        | String        | e.g. "fastest_task_completion", "most_first_pass_approvals" |
| targetValue   | Float?        | Optional target to beat                           |
| currentRecord | Json?         | `{userId, value, recordedAt}`                     |
| departmentId  | String?       | Null = org-wide                                   |
| startsAt      | DateTime      | Challenge start                                   |
| endsAt        | DateTime      | Challenge end                                     |
| bonusPoints   | Int           | Default 25. XP bonus for winners                  |
| isActive      | Boolean       | Default true                                      |
| createdAt     | DateTime      | Auto                                              |

Index: `[isActive, endsAt]`

### ChallengeEntry
Table: `challenge_entries`

| Field       | Type          | Notes                                    |
|-------------|---------------|------------------------------------------|
| id          | String (cuid) | Primary key                              |
| challengeId | String (FK)   | -> MicroChallenge (cascade delete)       |
| userId      | String        | Who submitted                            |
| value       | Float         | The metric value achieved                |
| taskId      | String?       | Optional link to the task that counted   |
| submittedAt | DateTime      | Auto                                     |

Unique constraint: `[challengeId, userId]` (one entry per user per challenge)

### VariableReward
Table: `variable_rewards`

| Field     | Type          | Notes                                              |
|-----------|---------------|----------------------------------------------------|
| id        | String (cuid) | Primary key                                        |
| userId    | String        | Recipient user                                     |
| type      | String        | surprise_bonus, spotlight, badge_upgrade, streak_save |
| title     | String        | Display name of the reward                         |
| message   | String        | Description message                                |
| points    | Int           | Default 0. XP awarded on claim                     |
| metadata  | Json?         | Additional data                                    |
| claimed   | Boolean       | Default false. User must claim to receive points   |
| expiresAt | DateTime?     | Optional. Reward expires and cannot be claimed after this |
| createdAt | DateTime      | Auto                                               |

Index: `[userId, claimed]`

---

## API Routes

All routes require authentication via NextAuth session.

### GET /api/gamification/me
Get the current user's gamification profile.

**Auth:** All authenticated roles.

**Response:**
```json
{
  "totalXp": 1250,
  "level": 4,
  "xpInLevel": 150,
  "xpNeeded": 800,
  "currentStreak": 5,
  "longestStreak": 12,
  "achievements": [
    {
      "key": "first_task",
      "name": "First Step",
      "description": "Complete your first task",
      "icon": "rocket",
      "category": "milestone",
      "points": 10,
      "unlockedAt": "2026-02-15T10:30:00.000Z"
    }
  ],
  "newUnlocks": [
    { "name": "Speed Demon", "icon": "timer", "points": 25 }
  ]
}
```

**Side effects:** Any unnotified achievements are marked as `notified: true` after being returned.

---

### GET /api/gamification/leaderboard
Get XP leaderboard.

**Auth:** All authenticated roles.

**Query params:**
- `departmentId` -- Optional. Filter to a specific department.

**Response:** Array of ranked entries (top 20):
```json
[
  {
    "rank": 1,
    "user": { "id": "...", "name": "...", "avatar": "...", "role": "..." },
    "totalXp": 5400,
    "level": 8,
    "currentStreak": 14,
    "longestStreak": 30
  }
]
```

---

### GET /api/gamification/achievements
Get all available achievements with unlock status for the current user.

**Auth:** All authenticated roles.

**Response:** Array of achievement objects with an `unlocked: boolean` field indicating whether the current user has earned each one.

---

### GET /api/gamification/challenges
List active micro-challenges that have not yet ended.

**Auth:** All authenticated roles.

**Response:** Array of challenges with their top 5 entries.

---

### POST /api/gamification/challenges
Create a new micro-challenge.

**Auth:** ADMIN, HEAD_HR, or DEPT_HEAD only.

**Request body:**
```json
{
  "title": "string (required)",
  "description": "string?",
  "type": "string (required) -- speed, quality, volume, collaboration",
  "metric": "string (required)",
  "targetValue": "number?",
  "departmentId": "string? -- null for org-wide",
  "startsAt": "ISO date string (required)",
  "endsAt": "ISO date string (required)",
  "bonusPoints": "number? -- default 25"
}
```

**Response:** `201` with the created challenge.

---

### PATCH /api/gamification/challenges/[id]
Update a micro-challenge entry. (Route exists at `src/app/api/gamification/challenges/[id]/route.ts`.)

---

### GET /api/gamification/rewards
Get the current user's variable rewards (claimed and unclaimed, up to 20 most recent).

**Auth:** All authenticated roles.

**Response:** Array of VariableReward objects. Expired unclaimed rewards are excluded.

---

### PATCH /api/gamification/rewards
Claim a variable reward.

**Auth:** All authenticated roles.

**Request body:**
```json
{
  "rewardId": "string (required)"
}
```

**Response:** Updated reward. Returns `404` if not found or already claimed, `410` if expired.

**Side effects:** If the reward has points > 0, the user's totalXp is incremented.

---

### POST /api/gamification/seed
Seed the default achievements into the database. Upserts all 11 default achievements. Intended for initial setup or resets.

---

## UI Pages

### /leaderboard
Full-page leaderboard showing ranked users by XP. Displays level, streak, and XP progress. Supports department filtering.

### /credibility
Credibility score dashboard for the current user. Shows reliability, quality, and consistency sub-scores, overall score, tasks completed/on-time/late breakdown.

### /pms/gamification
Gamification view within the PMS context. Shows achievements, streak info, and XP progress alongside task management.

---

## Background Jobs (Inngest)

The Gamification module does not define its own Inngest functions. All gamification logic executes synchronously within the PMS task status change handler (`PATCH /api/tasks/[id]/status`).

**Trigger flow:**
1. User completes a task (status -> DONE).
2. PMS status route calls `recordActivity(userId, xp)` which updates streak and XP.
3. PMS status route calls `checkTaskAchievements(userId)`, `checkSpeedAchievements(userId)`, and `checkQualityAchievements(userId)`.
4. Each check function queries task history and unlocks achievements if thresholds are met.
5. Achievement unlock also awards bonus XP.

---

## Known Issues and Gaps

1. **Achievements are not resettable.** Once unlocked, a UserAchievement cannot be deleted or reset without direct database access. There is no API endpoint for clearing achievements.
2. **No admin panel for custom achievements.** The 11 built-in achievements are seeded via code. Admins cannot create, edit, or deactivate achievements through the UI.
3. **No challenge winner resolution.** MicroChallenges track entries but there is no automated process to determine winners, announce results, or award bonus points when a challenge ends.
4. **Variable rewards are manually created.** There is no automated system for generating surprise bonuses or streak saves -- these must be created directly in the database or through a future admin interface.
5. **XP only from tasks.** Currently, only task completions award XP. Other activities (commenting, reviewing, publishing content) do not contribute.
6. **No leaderboard history.** Rankings are calculated in real-time with no snapshots. There is no weekly/monthly leaderboard archive.
7. **Streak timezone handling.** Streak calculations use server UTC time, which may not align with the user's local timezone for day boundaries.

---

## Dependencies on Other Modules

| Module | Direction              | Description                                                                  |
|--------|------------------------|------------------------------------------------------------------------------|
| PMS    | PMS -> Gamification    | Task completion (DONE status) triggers `recordActivity`, `checkTaskAchievements`, `checkSpeedAchievements`. Task approval (APPROVED) triggers `checkQualityAchievements` |
| HOCCR  | HOCCR -> Gamification  | Recognition creation triggers `checkCollaborationAchievements` (team_player achievement) |
| GI     | Gamification -> GI     | GI chat queries credibility scores and streak data to provide personalized insights |
| PMS    | Gamification -> PMS    | Credibility scores are displayed alongside workload data in PMS workload view |
