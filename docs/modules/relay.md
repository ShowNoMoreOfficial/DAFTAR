# Relay -- Social Media Publishing

## What it does

Relay is the social media content distribution module. It lets teams create, schedule, and publish posts to multiple platforms (Twitter/X, LinkedIn, YouTube, Instagram, Facebook) across different brands. It includes a content calendar for planning, an analytics dashboard for tracking post performance, and platform connection management for OAuth-based account linking.

Currently, Twitter/X and LinkedIn have fully implemented publisher classes with real API integration. Instagram and Facebook publishers exist as stub files that return "not configured" errors. The publish endpoint in the API currently **simulates** publishing by generating fake platform post IDs rather than calling the real publisher classes.

## Database models

### ContentPost
- `id` (cuid, PK)
- `title` (String)
- `content` (Text, optional)
- `platform` (String -- "youtube", "x", "instagram", "linkedin", "facebook")
- `brandId` (String -- FK to Brand)
- `status` (PostStatus enum: DRAFT, QUEUED, SCHEDULED, PUBLISHING, PUBLISHED, FAILED, CANCELLED)
- `scheduledAt` (DateTime, optional)
- `publishedAt` (DateTime, optional)
- `publishedUrl` (String, optional)
- `platformPostId` (String, optional -- ID from the platform after publishing)
- `mediaUrls` (Json, optional -- array of media URLs)
- `metadata` (Json, optional -- platform-specific data: hashtags, thumbnails, etc.)
- `taskId` (String, optional -- link to originating PMS task)
- `createdById` (String)
- `errorMessage` (String, optional)
- `analytics` (relation to PostAnalytics, optional)
- `createdAt` / `updatedAt` (DateTime)
- Indexes: `[brandId, platform]`, `[status, scheduledAt]`, `[platform, status]`

### PostAnalytics
- `id` (cuid, PK)
- `postId` (String, unique -- FK to ContentPost, cascade delete)
- `views` (Int, default 0)
- `likes` (Int, default 0)
- `comments` (Int, default 0)
- `shares` (Int, default 0)
- `clicks` (Int, default 0)
- `reach` (Int, default 0)
- `impressions` (Int, default 0)
- `engagementRate` (Float, default 0)
- `rawData` (Json, optional -- full platform analytics response)
- `lastSyncedAt` (DateTime)
- `createdAt` / `updatedAt` (DateTime)

### PlatformConnection
- `id` (cuid, PK)
- `brandId` (String -- FK to Brand)
- `platform` (String -- "youtube", "x", "instagram", "linkedin", "facebook")
- `accessToken` (Text, optional)
- `refreshToken` (Text, optional)
- `accountId` (String, optional -- platform account/page ID)
- `accountName` (String, optional)
- `tokenExpiresAt` (DateTime, optional)
- `isActive` (Boolean, default true)
- `config` (Json, optional -- platform-specific config, e.g. `{ "type": "organization" }` for LinkedIn)
- `connectedAt` / `updatedAt` (DateTime)
- Unique constraint: `[brandId, platform]`

### ContentCalendarEntry
- `id` (cuid, PK)
- `title` (String)
- `description` (String, optional)
- `brandId` (String)
- `platform` (String)
- `deliverableType` (String -- "video", "carousel", "reel", "thread", "post", "story")
- `date` (DateTime)
- `assigneeId` (String, optional)
- `status` (String, default "planned" -- "planned", "in_progress", "ready", "posted")
- `postId` (String, optional -- links to ContentPost when created)
- `metadata` (Json, optional)
- `createdById` (String)
- `createdAt` / `updatedAt` (DateTime)
- Indexes: `[brandId, date]`, `[date]`

## API routes

### Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/relay/posts` | Yes (`relay.read.own`) | List posts with pagination and filters. Filters: `brandId`, `platform`, `status`, `dateFrom`, `dateTo`, `search`. Role-scoped: CLIENT sees only their brand posts; MEMBER/CONTRACTOR see only their own; DEPT_HEAD sees their accessible brands; ADMIN sees all. Includes analytics summary. |
| POST | `/api/relay/posts` | Yes (`relay.read.own`) | Create a post. Required: `title`, `platform`, `brandId`. Optional: `content`, `scheduledAt`, `mediaUrls`, `metadata`, `taskId`. Valid platforms: youtube, x, instagram, linkedin, facebook. Status set to SCHEDULED if scheduledAt provided, otherwise DRAFT. Emits `post.created` event. |
| GET | `/api/relay/posts/[id]` | Yes (`relay.read.own`) | Get single post with full analytics. Role-scoped access check. |
| PATCH | `/api/relay/posts/[id]` | Yes (creator or ADMIN) | Update a post. Supports: `title`, `content`, `platform`, `status`, `scheduledAt`, `mediaUrls`, `metadata`. |
| DELETE | `/api/relay/posts/[id]` | Yes (creator or ADMIN) | Delete a post. Only DRAFT or SCHEDULED posts can be deleted. |
| POST | `/api/relay/posts/[id]/publish` | Yes (creator or ADMIN) | Publish or schedule a post. If `scheduledAt` is in the future, sets status to SCHEDULED. Otherwise publishes immediately (SIMULATED -- generates `sim_{id}_{timestamp}` as platformPostId). Creates initial PostAnalytics record. Emits `post.published` event. |

### Calendar

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/relay/calendar` | Yes (`relay.read.own`) | Get posts for calendar display. Filters: `brandId`, `month`, `year`. Returns posts with status SCHEDULED, PUBLISHED, PUBLISHING, or DRAFT. Ordered by scheduledAt then createdAt. |
| PATCH | `/api/relay/calendar/[id]` | Yes (creator or ADMIN) | Update a calendar entry. Supports: `title`, `description`, `platform`, `deliverableType`, `date`, `assigneeId`, `status`, `metadata`, `postId`. |
| DELETE | `/api/relay/calendar/[id]` | Yes (creator or ADMIN) | Delete a calendar entry. |

### Connections

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/relay/connections` | Yes (`relay.read.own`) | List platform connections for accessible brands. Filter: `brandId`. Role-scoped. |
| POST | `/api/relay/connections` | Yes (ADMIN only) | Create or update (upsert) a platform connection. Required: `brandId`, `platform`. Optional: `accountId`, `accountName`, `config`. Validates brand exists. |
| DELETE | `/api/relay/connections?id=...` | Yes (ADMIN only) | Disconnect a platform (soft delete -- sets `isActive: false`). |

### Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/relay/analytics` | Yes (`relay.read.own`) | Aggregated analytics across posts. Filters: `brandId`, `platform`, `period` (7, 30, 90 days). Returns: totalPosts, totalViews, totalEngagement, avgEngagementRate, totalLikes/Shares/Comments/Clicks/Reach/Impressions, platformBreakdown, top 5 posts by engagement. |

### Request/Response shapes

**POST /api/relay/posts (request body):**
```json
{
  "title": "string (required)",
  "content": "string?",
  "platform": "youtube|x|instagram|linkedin|facebook (required)",
  "brandId": "string (required)",
  "scheduledAt": "ISO date string?",
  "mediaUrls": ["url1", "url2"],
  "metadata": { "hashtags": ["tag1"], "thumbnail": "url" },
  "taskId": "string?"
}
```

**GET /api/relay/analytics (response):**
```json
{
  "totalPosts": 42,
  "totalViews": 15000,
  "totalEngagement": 3500,
  "avgEngagementRate": 4.2,
  "totalLikes": 2000,
  "totalShares": 500,
  "totalComments": 800,
  "totalClicks": 200,
  "totalReach": 50000,
  "totalImpressions": 75000,
  "platformBreakdown": [
    { "platform": "x", "posts": 20, "views": 8000, "engagementRate": 3.5 }
  ],
  "topPosts": [
    { "id": "...", "title": "...", "platform": "x", "brandName": "...", "views": 5000, "engagementRate": 8.2, "publishedAt": "..." }
  ]
}
```

## UI pages

All Relay pages are under `src/app/(shell)/relay/`.

| Path | Page | Description |
|------|------|-------------|
| `/relay` | Queue / Dashboard | Main Relay landing page showing post queue and overview |
| `/relay/posts` | Posts List | Browse and manage all content posts with filters |
| `/relay/calendar` | Content Calendar | Monthly calendar view of scheduled and published posts |
| `/relay/analytics` | Analytics | Aggregated performance metrics across all platforms and brands |
| `/relay/connections` | Connections | Manage platform OAuth connections per brand |

Layout: `src/app/(shell)/relay/layout.tsx` -- shared navigation across Relay sub-pages.

Components: `src/components/relay/create-post-dialog.tsx` -- dialog for creating new posts.

## Publishers

Publisher classes handle actual platform API integration. Located in `src/lib/relay/publishers/`.

### TwitterPublisher (`twitter.ts`) -- IMPLEMENTED
- Uses X API v2 with OAuth 2.0 Bearer tokens
- **publishTweet(text, mediaIds?)** -- Post a single tweet, returns tweetId
- **publishThread(contentArray, mediaIds?)** -- Post a thread (replies chained), returns all tweetIds
- **deleteTweet(tweetId)** -- Delete a tweet
- **uploadMedia(buffer, mimeType)** -- Upload media via v1.1 endpoint (simple for images, chunked INIT/APPEND/FINALIZE for video/GIF)
- Rate limit tracking: 200 tweets per 15-min window, tracks remaining via response headers
- Token management: auto-refreshes expired tokens via `refreshTwitterToken()`

### LinkedInPublisher (`linkedin.ts`) -- IMPLEMENTED
- Uses LinkedIn Marketing / Community Management API (REST, version 202401)
- **publishText(text)** -- Text-only post
- **publishWithUrl(text, articleUrl, title?, description?)** -- Post with URL preview card
- **publishWithImage(text, imageUrn, altText?)** -- Post with uploaded image
- **uploadImage(buffer, mimeType)** -- Initialize upload, PUT binary, return imageUrn
- **deletePost(postUrn)** -- Delete a post by URN
- **publish(content, metadata?, mediaUrns?)** -- Convenience method that auto-selects the right publish method
- Supports both personal profiles (`urn:li:person:{id}`) and company pages (`urn:li:organization:{id}`) via connection config

### InstagramPublisher (`instagram.ts`) -- STUB
- Functions `publishToInstagram()`, `publishInstagramStory()`, `publishInstagramReel()` all return `{ success: false, status: "not_configured" }`
- TODO: Implement Graph API container flow (create container, check status, publish)

### FacebookPublisher (`facebook.ts`) -- STUB
- Functions `publishToFacebook()`, `publishFacebookReel()` all return `{ success: false, status: "not_configured" }`
- TODO: Implement Page Posts API

### Media Handler (`media-handler.ts`)
- Shared media upload utilities used by publishers

## OAuth

OAuth helpers are in `src/lib/relay/oauth-helpers.ts`. Supports four platforms:

| Platform | Flow | Env Vars Required |
|----------|------|-------------------|
| Twitter/X | OAuth 2.0 PKCE | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `TWITTER_REDIRECT_URI` |
| YouTube/Google | OAuth 2.0 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| LinkedIn | OAuth 2.0 | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` |
| Instagram/Meta | OAuth 2.0 (Facebook) | `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` |

Includes utilities: `generateOAuthState()`, `generateCodeVerifier()`, `generateCodeChallenge()`.

## Background jobs (Inngest)

There are no dedicated Inngest functions for Relay currently. Publishing is handled synchronously via the `/api/relay/posts/[id]/publish` endpoint. The system emits events via `daftarEvents` (`post.created`, `post.published`) which other modules can listen to, but no Inngest-based scheduled publisher exists.

Note: The Yantri workflow (`src/lib/inngest/yantri-workflows.ts`) has integration points that create Relay posts as part of the content production pipeline.

## Known issues and gaps

1. **Publishing is SIMULATED (STILL BROKEN — only remaining critical issue)** -- The `/api/relay/posts/[id]/publish` endpoint generates fake platform post IDs (`sim_{id}_{timestamp}`) instead of calling the real TwitterPublisher/LinkedInPublisher classes. The publisher classes are fully implemented but not wired into the publish flow. This fix is deferred to a future developer integration.
2. **Instagram and Facebook publishers are stubs** -- The files exist at `src/lib/relay/publishers/instagram.ts` and `src/lib/relay/publishers/facebook.ts` but all functions return "not configured" errors.
3. **Analytics sync not implemented** -- PostAnalytics records are created with zero values on publish. There is no background job that fetches actual engagement data from platform APIs.
4. **No scheduled publishing job** -- Posts can be set to SCHEDULED status with a future `scheduledAt`, but there is no cron job or Inngest function that automatically publishes them when the time arrives.
5. **No YouTube publisher** -- OAuth helpers for YouTube/Google exist, but there is no YouTubePublisher class.
6. **OAuth callback routes missing** -- The oauth-helpers.ts file defines auth URL builders and code exchange functions, but the actual `/api/relay/oauth/{platform}/callback` routes are not implemented.
7. **Calendar entries are separate from posts** -- ContentCalendarEntry is a separate model from ContentPost. The `postId` field links them, but there is no automatic synchronization.

## Dependencies on other modules

- **Brands (core)** -- Every post and calendar entry belongs to a brand. Platform connections are brand-scoped.
- **PMS** -- Posts can be linked to PMS tasks via `taskId`. Creating posts from tasks is supported.
- **Yantri** -- The Yantri content production pipeline creates ContentPost records as deliverables.
- **Event Bus** -- Emits `post.created` and `post.published` events that GI and Gamification modules listen to.
- **Users/Auth (core)** -- Posts are scoped by creator. Role-based access controls visibility per brand.
