SPRINT 3 — You are building the Yantri content creation and pipeline UI.

Read CLAUDE.md for project context. The backend team (Session A) is simultaneously building the strategy and content generation APIs. You're building the UI that users interact with.

### WHAT YOU'RE BUILDING

The Yantri section of Daftar needs these pages:

#### Page 1: `/yantri/workspace` — The Command Center

This is where a user sees all their in-progress content pipelines. Think of it as a dashboard for content creation.

**Layout:**
- Top: Quick actions bar (+ New Signal, View Dossiers, View Deliverables)
- Main area: Pipeline cards showing active content pipelines

**Pipeline Card** (one per active signal):
```
+---------------------------------------------------+
| Signal: India's Semiconductor Push                 |
| Brand: The Squirrels  |  Created: 2 hours ago      |
|                                                     |
| * Signal ---- * Dossier ---- o Strategy ---- o Content ---- o Review |
|   Done         Done         Pending       Waiting      Waiting |
|                                                     |
| [View Dossier]  [Generate Strategy]                 |
+---------------------------------------------------+
```

Each pipeline card shows:
- Signal topic
- Brand
- Pipeline progress (which stages are complete)
- Action buttons for the next step
- Timestamp

Clicking a card opens the detail view.

#### Page 2: `/yantri/workspace/[id]` — Pipeline Detail View

Shows the full pipeline for one signal with expandable sections:

**Section 1: Signal**
- Original topic/URL
- When it was submitted
- Source (manual or Khabri)

**Section 2: FactDossier** (expandable)
- Key facts discovered
- Sources
- Statistics
- Timeline
- Full dossier content in a collapsible text area

**Section 3: Strategy Decision** (expandable, may be empty if not yet generated)
- Content type chosen (with icon)
- Platform target
- Editorial angle
- Hook approach
- Priority level
- AI reasoning
- Button: [Regenerate Strategy] (if user disagrees with the AI's choice)
- OR: Button: [Generate Strategy] (if not yet generated)

**Section 4: Manual Strategy Override**
If the user wants to override the AI's decision:
- Dropdown: Content Type (all 13 types)
- Dropdown: Platform (filtered by brand's connected platforms)
- Text input: Custom angle
- Text input: Custom hook
- Button: [Use My Strategy]

**Section 5: Generated Content** (expandable, may be empty if not yet generated)
- Script with sections (each section collapsible)
- Title options (radio select)
- Description (editable text area)
- Tags (editable tag pills)
- Thumbnail briefs (cards with visual descriptions)
- Button: [Regenerate Content] (keeps same strategy, new generation)

**Section 6: Actions**
- [Approve] — Green button, sends to production
- [Request Revision] — Yellow button, opens notes field
- [Reject] — Red button, opens reason field
- [Save Draft] — Grey button, saves any manual edits

#### Page 3: `/yantri/dossiers` — Dossier Library

List of all FactDossiers with:
- Topic
- Brand
- Date created
- Status (has strategy? has content? approved?)
- Link to pipeline detail

Filterable by brand, by date range, by status.

#### Page 4: `/yantri/deliverables` — Content Review Queue

Shows all deliverables with status filters:
- Pending Review (default view)
- Approved
- Revision Requested
- Rejected

Each deliverable card shows:
- Title (selected title option)
- Content type icon
- Platform icon
- Brand
- Created date
- Status badge
- Preview snippet (first 100 chars of script)

Clicking opens the full review view (same as Section 5 of the pipeline detail).

#### Page 5: `/yantri/content-types` — Content Type Reference

A reference page showing all 13 content types with:
- Name
- Icon
- Description
- Platform(s) it applies to
- What gets generated (script? slides? tweets?)
- Example output structure

This is informational, not interactive.

### TECHNICAL IMPLEMENTATION NOTES

**API endpoints you'll call (Session A is building these):**

```
GET  /api/yantri/narrative-trees          — List all pipelines
GET  /api/yantri/narrative-trees/[id]     — Pipeline detail with dossier, strategy, deliverables
POST /api/yantri/strategy/generate        — Trigger strategy for a dossier
GET  /api/yantri/deliverables             — List deliverables (with status filter)
GET  /api/yantri/deliverables/[id]        — Full deliverable with assets
POST /api/yantri/deliverables/[id]/approve — Approve
POST /api/yantri/deliverables/[id]/reject  — Reject
POST /api/yantri/deliverables/[id]/revise  — Request revision
```

**If an API doesn't exist yet** (Session A may not be done), build the UI anyway with:
- Mock data for display
- Proper loading states
- Error states
- The actual API call in place (it'll work once Session A deploys)

**UI Framework:**
- Tailwind 4 for styling
- shadcn/ui for components (buttons, dropdowns, cards, badges, dialogs, tabs)
- Use the existing shell layout — these pages go inside /(shell)/yantri/
- Match Daftar's design tokens:
  - Background: #FFFFFF / #F8F9FA
  - Text: #1A1A1A / #6B7280
  - Accent Primary: #2E86AB
  - Accent Secondary: #A23B72
  - Border: #E5E7EB
  - Radius: 12px cards, 8px buttons
  - Font: Inter, system-ui

**Pipeline Progress Component:**
Build a reusable `<PipelineProgress>` component that shows the 5 stages as connected dots:
- Signal -> Dossier -> Strategy -> Content -> Review
- Each dot: filled (complete), pulsing (in progress), empty (waiting)
- Clickable to jump to that section in the detail view

**Content Type Icons:**
Assign an icon to each content type (use lucide-react):
- YouTube Explainer: Play circle
- YouTube Shorts: Smartphone
- X Thread: MessageSquare
- X Post: Twitter (or MessageCircle)
- Instagram Carousel: Images
- Instagram Reel: Film
- LinkedIn Post: Briefcase
- LinkedIn Article: FileText
- Blog Post: PenTool
- Newsletter: Mail
- Podcast Script: Mic
- Quick Take: Zap
- Community Post: Users

### SIDEBAR UPDATE

Make sure the Yantri section in the sidebar has sub-items:
- Workspace (the command center)
- Dossiers
- Deliverables
- Content Types

### FILES YOU OWN
/src/app/(shell)/yantri/* (all pages)
/src/components/yantri/* (all components)

### DO NOT TOUCH
/src/lib/yantri/* (backend — Session A owns this)
/src/inngest/* (Session A)
/src/app/(shell)/pms/* (not yours)
Auth, shell layout, middleware (not yours)
