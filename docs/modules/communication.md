# Communication -- Announcements & Feedback

## What it does

The Communication module provides two core capabilities for internal organizational communication:

1. **Announcements** -- Org-wide or department-scoped announcements with priority levels (LOW, NORMAL, HIGH, URGENT), pinning, expiration dates, and read tracking. Leaders (ADMIN, HEAD_HR, DEPT_HEAD) can create announcements; all authenticated users can read them. Announcements can be scoped to specific departments or broadcast org-wide.

2. **Feedback Channels** -- Structured feedback collection via named channels (suggestion boxes, concern reports, idea boards). Channels can be configured as anonymous. Any authenticated user can submit feedback. ADMIN and HEAD_HR can respond to entries, change statuses, and view all submissions. Regular users can only see their own submissions. Entries support upvoting and status tracking through a lifecycle (open, acknowledged, in_progress, resolved, closed).

## Database models

### Announcement
- `id` (cuid, PK)
- `title` (String)
- `content` (Text)
- `type` (String, default "general" -- "general", "urgent", "policy", "celebration")
- `priority` (AnnouncementPriority enum: LOW, NORMAL, HIGH, URGENT)
- `scope` (String, default "org" -- "org", "department", "brand")
- `scopeId` (String, optional -- departmentId or brandId if scoped)
- `authorId` (String -- FK to User)
- `departmentId` (String, optional -- null means org-wide)
- `isPinned` (Boolean, default false)
- `expiresAt` (DateTime, optional)
- `readBy` (relation to AnnouncementRead[])
- `createdAt` / `updatedAt` (DateTime)
- Indexes: `[departmentId, createdAt]`, `[scope, scopeId]`

### AnnouncementRead
- `id` (cuid, PK)
- `announcementId` (String -- FK to Announcement, cascade delete)
- `userId` (String)
- `readAt` (DateTime, default now)
- Unique constraint: `[announcementId, userId]`

### FeedbackChannel
- `id` (cuid, PK)
- `name` (String)
- `description` (String, optional)
- `type` (String, default "suggestion" -- "suggestion", "concern", "idea", "general")
- `isAnonymous` (Boolean, default true)
- `isActive` (Boolean, default true)
- `entries` (relation to FeedbackEntry[])
- `createdAt` (DateTime)

### FeedbackEntry
- `id` (cuid, PK)
- `channelId` (String -- FK to FeedbackChannel, cascade delete)
- `userId` (String, optional -- null if the channel is anonymous)
- `content` (Text)
- `status` (String, default "open" -- "open", "acknowledged", "in_progress", "resolved", "closed")
- `response` (Text, optional -- admin/HR response)
- `respondedBy` (String, optional -- userId of responder)
- `respondedAt` (DateTime, optional)
- `upvotes` (Int, default 0)
- `createdAt` / `updatedAt` (DateTime)
- Index: `[channelId, status]`

## API routes

### Announcements

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/communication/announcements` | Yes | List announcements with pagination. Filters: `departmentId`, `pinned` ("true"/"false"). Auto-filters: shows org-wide + user's department announcements. Expired announcements are excluded. Ordered by pinned first, then newest. Includes: read count, whether current user has read it, author name, department name. |
| POST | `/api/communication/announcements` | Yes (ADMIN, HEAD_HR, DEPT_HEAD) | Create an announcement. Required: `title`, `content`. Optional: `priority` (default NORMAL), `departmentId` (null = org-wide), `isPinned`, `expiresAt`. |
| GET | `/api/communication/announcements/[id]` | Yes | Get single announcement with read count and current user's read status. |
| PATCH | `/api/communication/announcements/[id]` | Yes (author or ADMIN) | Update an announcement. Supports: `title`, `content`, `priority`, `departmentId`, `isPinned`, `expiresAt`. |
| DELETE | `/api/communication/announcements/[id]` | Yes (author or ADMIN) | Delete an announcement. |
| POST | `/api/communication/announcements/[id]/read` | Yes | Mark announcement as read for the current user. Uses upsert to prevent duplicates. Returns the AnnouncementRead record. |

### Feedback Channels

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/communication/feedback/channels` | Yes | List active feedback channels with entry counts. Ordered by newest first. |
| POST | `/api/communication/feedback/channels` | Yes (ADMIN, HEAD_HR) | Create a feedback channel. Required: `name`. Optional: `description`, `type` (default "suggestion"), `isAnonymous` (default true). |

### Feedback Entries

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/communication/feedback/entries` | Yes | List feedback entries with pagination. Filters: `channelId`, `status`. ADMIN/HEAD_HR see all entries; other users see only their own. Includes channel info. |
| POST | `/api/communication/feedback/entries` | Yes | Submit a feedback entry. Required: `channelId`, `content`. If the channel is anonymous, `userId` is set to null. Validates channel exists and is active. |
| POST | `/api/communication/feedback/entries/[id]` | Yes | Upvote a feedback entry. Increments `upvotes` by 1. Returns new upvote count. |
| PATCH | `/api/communication/feedback/entries/[id]` | Yes (ADMIN, HEAD_HR) | Update a feedback entry -- respond or change status. Body: `{ status?, response? }`. When response is provided, sets `respondedBy` and `respondedAt`. |

### Request/Response shapes

**POST /api/communication/announcements (request body):**
```json
{
  "title": "string (required)",
  "content": "string (required)",
  "priority": "LOW|NORMAL|HIGH|URGENT",
  "departmentId": "string?",
  "isPinned": false,
  "expiresAt": "ISO date string?"
}
```

**GET /api/communication/announcements (paginated response):**
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "type": "general",
      "priority": "NORMAL",
      "scope": "org",
      "authorId": "string",
      "authorName": "John Doe",
      "departmentId": null,
      "departmentName": null,
      "isPinned": false,
      "expiresAt": null,
      "readCount": 12,
      "isRead": true,
      "readAt": "ISO date",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "meta": { "total": 25, "page": 1, "limit": 10 }
}
```

**POST /api/communication/feedback/entries (request body):**
```json
{
  "channelId": "string (required)",
  "content": "string (required)"
}
```

**PATCH /api/communication/feedback/entries/[id] (request body):**
```json
{
  "status": "acknowledged|in_progress|resolved|closed",
  "response": "string?"
}
```

## UI pages

| Path | Page | Description |
|------|------|-------------|
| `/communication` | Communication Hub | Single page at `src/app/(shell)/communication/page.tsx` that displays both announcements and feedback channels in a unified view. |

The Communication module also has pages within the HOCCR module:

| Path | Page | Description |
|------|------|-------------|
| `/hoccr/communication` | HOCCR Communication | Communication management view within the HOCCR context at `src/app/(shell)/hoccr/communication/page.tsx`. |

## Background jobs (Inngest)

None. The Communication module has no background jobs. All operations are synchronous via API calls.

## Known issues and gaps

1. **No push notifications** -- When an announcement is created, there is no mechanism to push-notify users (browser notifications, mobile push, or real-time WebSocket). Users discover announcements only when they visit the Communication page.
2. **No email delivery** -- Announcements are not sent via email. The `expiresAt` field exists for time-limited announcements, but there is no email notification when urgent announcements are posted.
3. **No real-time updates** -- No WebSocket or Server-Sent Events integration. The UI must poll or refresh to see new announcements/feedback.
4. **No channel management UI** -- Feedback channels can be created via API but there is no dedicated admin UI for managing channels (edit, deactivate, delete).
5. **No feedback analytics** -- No aggregated view of feedback trends, response times, or sentiment analysis on feedback content.
6. **Upvoting has no user tracking** -- The upvote endpoint simply increments a counter without tracking which users upvoted. This means a user can upvote the same entry multiple times.
7. **Read tracking is user-initiated** -- Announcements are marked as read only when the user explicitly calls the `/read` endpoint. There is no automatic read tracking when the announcement is viewed.
8. **No rich text support** -- Announcement and feedback content is stored as plain text. No markdown rendering or rich text formatting.
9. **Feedback channel deletion not supported** -- There is no DELETE endpoint for feedback channels. Channels can only be deactivated by setting `isActive: false` directly in the database.
10. **Department scoping is basic** -- Announcements scoped to a department use `departmentId`, but the `scope` and `scopeId` fields (which support "brand" scoping) are not fully utilized in the API logic.

## Dependencies on other modules

- **HOCCR** -- The culture monitor in HOCCR can auto-create announcements when a user's capacity exceeds 120% (urgent workload alerts). HOCCR also has its own communication page.
- **Users/Auth (core)** -- Author identity, read tracking, and role-based access all depend on the User model and session.
- **Departments (core)** -- Announcements can be scoped to departments. The announcement list auto-filters by the user's primary department.
