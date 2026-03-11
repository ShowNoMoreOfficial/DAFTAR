SPRINT 3 — You are building brand/platform management and the approval-to-production flow.

Read CLAUDE.md for project context.

### PROBLEM 1: Brand & Platform Configuration

The Yantri pipeline needs to know which brands exist, which platforms each brand publishes to, and what content types are available per platform. This configuration doesn't have a proper management UI.

### Build: Brand Management UI Enhancement

The `/brands` section may already have basic CRUD. You need to enhance it:

#### Brand Detail Page: `/brands/[id]`

**Section: Basic Info**
- Brand name (editable)
- Description (editable)
- Language (dropdown: English, Hindi, Hinglish)
- Client link (dropdown of clients)

**Section: Connected Platforms**
Show which platforms this brand publishes to, with per-platform config:

```
+---------------------------------------------------+
| > YouTube                              [Remove]    |
|   Channel URL: ___________                         |
|   Content Types: [x] Explainer [x] Shorts          |
|                  [x] Community Post                 |
|   Default Language: English                        |
|   Posting Frequency: 3/week                        |
+---------------------------------------------------+
+---------------------------------------------------+
| > X/Twitter                            [Remove]    |
|   Handle: @___________                             |
|   Content Types: [x] Thread [x] Single Post        |
|   Posting Frequency: Daily                         |
+---------------------------------------------------+

[+ Add Platform]
```

The "Add Platform" button opens a modal:
- Dropdown: Platform (YouTube, X/Twitter, Instagram, LinkedIn, Blog, Newsletter)
- Checkboxes: Available content types for that platform (auto-filtered)
- Platform-specific fields (channel URL, handle, page ID, etc.)

**Section: Brand Voice**
- Tone description (text area)
- Editorial guidelines (text area)
- Example content links (list of URLs)
- Voice keywords (tag input: "authoritative", "provocative", "data-driven")

This data gets saved to the Brand model and/or BrandPlatform records. The strategist reads this when making decisions.

**Content Type <-> Platform Mapping:**

```
YouTube:    Explainer, Shorts, Community Post
X/Twitter:  Thread, Single Post
Instagram:  Carousel, Reel
LinkedIn:   Post, Article
Blog:       Blog Post
Newsletter: Newsletter
Podcast:    Podcast Script
General:    Quick Take
```

### Build API Routes:

**PUT /api/brands/[id]** — Update brand details including voice config
**POST /api/brands/[id]/platforms** — Add a platform to a brand
**DELETE /api/brands/[id]/platforms/[platformId]** — Remove a platform
**PUT /api/brands/[id]/platforms/[platformId]** — Update platform config (content types, frequency, etc.)
**GET /api/brands/[id]/platforms** — List platforms for a brand with their content type configs

### PROBLEM 2: Approval -> PMS Task Creation

When Session B's UI fires the approve action (POST /api/yantri/deliverables/[id]/approve), Session A handles changing the status. But YOU handle the PMS task creation that follows.

### Build: Approval -> Task Pipeline

When a deliverable is approved:

1. Read the deliverable + its assets + its strategy decision
2. Create a PMS Task with:
   - Title: "[Content Type] — [Selected Title]" (e.g., "YouTube Explainer — India's $10B Chip Gamble")
   - Description: Summary of what needs to be produced
   - Brand: Same as the deliverable's brand
   - Priority: Based on strategy's urgency (breaking = URGENT, trending = HIGH, evergreen = MEDIUM)
   - Status: TODO
   - Assignee: Auto-assign based on department capacity (or leave unassigned for manual assignment)
   - Due date: Based on priority (breaking = today, trending = +2 days, evergreen = +7 days)
3. Attach all generated assets to the task:
   - Script (as task attachment or linked document)
   - Thumbnail briefs
   - Description + tags
   - Original FactDossier (as reference)
4. Create TaskActivity entry: "Task auto-created from approved Yantri deliverable"
5. Trigger gamification: "deliverable approved" event for XP

### Build: Revision Flow

When a deliverable gets "Request Revision":

1. The revision notes are stored on the deliverable record
2. Session A's backend picks this up and re-generates content with revision notes added to the prompt
3. A new version of the deliverable is created (keep the old one for history)
4. The new version appears in the review queue
5. UI should show version history: "v1 (rejected) -> v2 (pending review)"

### Build API Route:

**POST /api/yantri/deliverables/[id]/approve** — If Session A hasn't built this yet, YOU build it:
```
1. Update deliverable status to "approved"
2. Create PMS Task (as described above)
3. Create TaskActivity
4. Trigger gamification event
5. Return { deliverable, task }
```

### PROBLEM 3: Content Calendar Integration

Approved deliverables should appear on the content calendar. Build or wire:

**GET /api/calendar/content** — Returns approved deliverables + scheduled posts for calendar display
- Query params: brandId, startDate, endDate, platform
- Returns items with: title, date, platform, status, contentType, deliverableId

The existing calendar page at `/calendar` should show these items.

### FILES YOU OWN
/src/app/(shell)/brands/* (brand management UI)
/src/app/api/brands/* (brand APIs)
/src/app/api/yantri/review/* (if separate from deliverables)
/src/app/api/tasks/ (ONLY the auto-creation logic from approved deliverables)
/src/app/api/calendar/ (content calendar data)
/src/components/yantri/review/* (review-specific components)

### DO NOT TOUCH
/src/lib/yantri/* (Session A)
/src/app/(shell)/yantri/* (Session B)
/src/inngest/* (Session A)
Auth, shell layout, middleware
