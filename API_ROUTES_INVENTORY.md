# DAFTAR API Routes Inventory

**Total Routes: 172 route files**  
**Last Updated: 2026-03-12**

## Global Authentication

### Middleware (`/src/middleware.ts`)
- **Pattern**: Protects all routes except:
  - `/login` — Login page
  - `/api/auth/*` — NextAuth routes
  - `/portal/*` — Client portal
  - `/api/client/action` — Token-based client actions
- **Method**: Checks for NextAuth session token cookies
- **Redirect**: Non-authenticated requests redirect to `/login`

### Public Routes (No Auth Required)
- `/api/auth/[...nextauth]` — NextAuth handler
- `/api/client/action` — Token-based deliverable approval/revision
- `/api/cron/learning-loop` — External cron trigger
- `/api/cron/overdue-check` — External cron trigger
- `/api/inngest` — Inngest background job webhook
- `/api/yantri/content-pieces` — Content piece management
- `/api/yantri/content-pieces/[id]` — Individual content piece
- `/api/yantri/deliverables` — Deliverable listing
- `/api/yantri/deliverables/[id]/assets` — Asset handling
- `/api/yantri/fact-engine` — Fact dossier generation
- `/api/yantri/fact-engine/[treeId]` — Specific fact dossier
- `/api/yantri/ingest` — Signal ingestion
- `/api/yantri/narrative-trees` — Narrative tree management
- `/api/yantri/narrative-trees/[treeId]` — Individual narrative tree
- `/api/yantri/narrative-trees/[treeId]/hypothesis` — Hypothesis testing

**Note**: Public routes typically validate requests via:
- Token headers (for integrations)
- Request signatures
- Other inline validation logic

---

## API Routes by Module

### Activity & Monitoring
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/activity` | GET | yes | User activity log (role-scoped: MEMBER/CONTRACTOR see own, DEPT_HEAD see dept, ADMIN see all) |

### Analytics
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/analytics/competitors` | GET | yes | Competitive benchmarking analysis |
| `/api/analytics/learning-report` | POST | yes | Trigger learning cycle and generate report |
| `/api/analytics/performance` | GET, POST | yes | List content performance records |
| `/api/analytics/performance/[brandId]` | GET | yes | Brand-specific performance metrics |
| `/api/analytics/skills` | GET | yes | Skill performance dashboard |
| `/api/analytics/tests` | GET, POST | yes | List strategy tests |
| `/api/analytics/tests/[id]` | GET, PATCH | yes | Get/update test detail |

### Authentication
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | no | NextAuth handler (Google + Microsoft Entra ID) |

### Brands
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/brands` | GET, POST | yes | List brands (filtered by user access) |
| `/api/brands/[id]/platforms` | POST | yes | Add platform to brand |

### Client Portal
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/client/action` | POST | no | Token-based deliverable approval/revision (public) |
| `/api/client/brands/[brandId]/deliverables` | GET, POST | yes | List deliverables for client brand |
| `/api/client/brands/[brandId]/performance` | GET | yes | Client brand performance |
| `/api/client/brands/[brandId]/reports` | GET | yes | Client brand reports |
| `/api/client/deliverables/[id]/review` | POST | yes | Submit deliverable review/approval |
| `/api/clients` | GET, POST | yes | List/create clients |

### Communication
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/communication/announcements` | GET, POST | yes | List/create organization announcements |
| `/api/communication/announcements/[id]` | DELETE, GET, PATCH | yes | Get/update/delete announcement |
| `/api/communication/announcements/[id]/read` | POST | yes | Mark announcement as read |
| `/api/communication/feedback/channels` | GET, POST | yes | List/create feedback channels |
| `/api/communication/feedback/entries` | GET, POST | yes | List/create feedback entries |
| `/api/communication/feedback/entries/[id]` | PATCH, POST | yes | Upvote/update feedback entry |

### Configuration
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/config/brands/[id]` | GET, PATCH | yes | Get/update brand configuration |
| `/api/config/departments/[id]` | GET, PATCH | yes | Get/update department configuration |
| `/api/config/platforms` | GET, POST | yes | List/create platforms |
| `/api/config/platforms/[id]` | DELETE, GET, PATCH | yes | Get/update/delete platform |
| `/api/config/roles` | GET, POST, PUT | yes | List/create/update roles |
| `/api/config/workflows` | GET, POST | yes | List/create workflows |
| `/api/config/workflows/[id]` | DELETE, GET, PATCH | yes | Get/update/delete workflow |

### Credibility
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/credibility` | GET | yes | Get credibility scores |
| `/api/credibility/recalculate` | POST | yes | Recalculate credibility scores |

### Cron Jobs
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/cron/learning-loop` | GET | no | External cron trigger for learning cycle |
| `/api/cron/overdue-check` | GET | no | External cron trigger for overdue task checks |
| `/api/cron/relay-executor` | GET | yes | Publish scheduled posts (internal use) |

### Departments
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/departments` | GET, POST | yes | List/create departments |
| `/api/departments/[id]` | DELETE, GET, PATCH | yes | Get/update/delete department |

### Finance
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/finance/expenses` | GET, POST | yes | List/create expenses |
| `/api/finance/expenses/[id]` | DELETE, GET, PATCH | yes | Get/update/delete expense |
| `/api/finance/expenses/export` | GET | yes | Export expenses (CSV/PDF) |
| `/api/finance/invoices` | GET, POST | yes | List/create invoices |
| `/api/finance/invoices/[id]` | DELETE, GET, PATCH | yes | Get/update/delete invoice |
| `/api/finance/invoices/[id]/pdf` | GET | yes | Generate invoice PDF |
| `/api/finance/invoices/export` | GET | yes | Export invoices |
| `/api/finance/overview` | GET | yes | Finance overview dashboard |
| `/api/finance/summary` | GET | yes | Finance summary metrics |

### Gamification
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/gamification/achievements` | GET | yes | List achievements |
| `/api/gamification/challenges` | GET, POST | yes | List/create challenges |
| `/api/gamification/challenges/[id]` | GET, POST | yes | Get/update challenge |
| `/api/gamification/leaderboard` | GET | yes | Leaderboard rankings |
| `/api/gamification/me` | GET | yes | User's gamification stats |
| `/api/gamification/rewards` | GET, PATCH | yes | List/claim rewards |
| `/api/gamification/seed` | POST | yes | Seed gamification data |

### GI (AI Assistant Copilot)
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/gi/actions` | GET | yes | List GI actions |
| `/api/gi/actions/[id]` | PATCH | yes | Log GI action activity |
| `/api/gi/chat` | POST | yes | Chat with GI copilot |
| `/api/gi/config` | GET | yes | Get GI configuration |
| `/api/gi/insights` | GET | yes | Get GI insights |
| `/api/gi/learning` | GET | yes | Get GI learning data |
| `/api/gi/predictions` | GET, POST | yes | Get/trigger GI predictions |
| `/api/gi/suggestions` | GET | yes | Get GI suggestions |
| `/api/gi/tiers` | GET, PATCH | yes | Get/update GI tiers |

### HOCCR (Team/HR Operations)
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/hoccr/announcements` | GET, POST | yes | List/create HR announcements |
| `/api/hoccr/announcements/[id]` | DELETE, GET, PATCH | yes | Get/update/delete announcement |
| `/api/hoccr/candidates` | GET, PATCH, POST | yes | List/manage candidates |
| `/api/hoccr/culture/engagement` | GET, POST | yes | Engagement metrics |
| `/api/hoccr/culture/metrics` | GET | yes | Culture metrics |
| `/api/hoccr/culture/recognition` | GET, POST | yes | Employee recognition |
| `/api/hoccr/culture/sentiment` | GET, POST | yes | Team sentiment analysis |
| `/api/hoccr/dependencies` | GET, PATCH, POST | yes | Team dependencies |
| `/api/hoccr/intelligence` | GET | yes | HR intelligence dashboard |
| `/api/hoccr/intelligence/charts` | GET | yes | HR intelligence charts |
| `/api/hoccr/operations` | GET | yes | Operations overview |
| `/api/hoccr/operations/bottlenecks` | GET, POST | yes | Identify bottlenecks |
| `/api/hoccr/operations/capacity` | GET | yes | Team capacity |
| `/api/hoccr/operations/dependencies` | GET, POST | yes | Operational dependencies |
| `/api/hoccr/positions` | GET, POST | yes | List/create positions |
| `/api/hoccr/positions/[id]` | GET, PATCH | yes | Get/update position |
| `/api/hoccr/reports` | GET, POST | yes | HR reports |

### Inngest
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/inngest` | — | no | Background job webhook (processSignal, generateDeliverable, publishPost, etc.) |

### Invitations
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/invites` | GET, PATCH, POST | yes | Manage user invitations (admin/HR only) |

### Khabri (Intelligence Signals & Trends)
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/khabri/analytics/categories` | GET | yes | Signal categories |
| `/api/khabri/analytics/sentiment` | GET, PATCH | yes | Sentiment analysis (with editorial override) |
| `/api/khabri/analytics/volume` | GET | yes | Signal volume metrics |
| `/api/khabri/anomalies` | GET | yes | Anomaly detection |
| `/api/khabri/anomalies/trending` | GET | yes | Trending anomalies |
| `/api/khabri/geo/[countryCode]` | GET | yes | Geo-specific signals |
| `/api/khabri/geo/hotspots` | GET | yes | Geographic hotspots |
| `/api/khabri/narratives` | GET | yes | List narratives |
| `/api/khabri/narratives/[id]` | GET | yes | Get narrative detail |
| `/api/khabri/narratives/[id]/stakeholders` | GET | yes | Narrative stakeholders |
| `/api/khabri/narratives/[id]/timeline` | GET | yes | Narrative timeline |
| `/api/khabri/signals` | GET | yes | List signals |
| `/api/khabri/signals/search` | GET | yes | Search signals |
| `/api/khabri/trends` | GET | yes | List trends |
| `/api/khabri/trends/top` | GET | yes | Top trends |

### KPI
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/kpi` | GET | yes | Key performance indicators |

### Leaderboard
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/leaderboard` | GET | yes | User leaderboard |

### Mock Data (Development)
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/m/khabri/signals` | GET | yes | Mock signal data |
| `/api/m/khabri/trends` | GET | yes | Mock trend time-series |
| `/api/m/yantri/narrative-trees` | GET | yes | Redirects to real narrative-trees data |

### Notifications
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/notifications` | GET, PATCH | yes | List/update user notifications |
| `/api/notifications/[id]` | DELETE, PATCH | yes | Mark notification as read/unread or delete |
| `/api/notifications/preferences` | GET, PUT | yes | Get/update notification preferences |
| `/api/notifications/stream` | GET | yes | SSE stream for real-time notifications |

### Pipeline
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/pipeline/performance` | GET | yes | Pipeline performance metrics |
| `/api/pipeline/runs` | GET | yes | List pipeline runs |
| `/api/pipeline/trigger` | POST | yes | Trigger pipeline execution |

### Relay (Publishing)
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/relay/analytics` | GET | yes | Aggregated post analytics |
| `/api/relay/calendar` | GET | yes | Calendar view of posts (scheduled & published) |
| `/api/relay/calendar/[id]` | DELETE, PATCH | yes | Update calendar entry |
| `/api/relay/connections` | DELETE, GET, POST | yes | Platform connections (simulated publishers) |
| `/api/relay/posts` | GET, POST | yes | List/create posts (role-scoped) |
| `/api/relay/posts/[id]` | DELETE, GET, PATCH | yes | Get/update/delete post |
| `/api/relay/posts/[id]/publish` | POST | yes | Publish or schedule post |

### SaaS Configuration
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/saas/organizations` | GET, POST | yes | List organizations (ADMIN only) |
| `/api/saas/products` | GET | yes | List SaaS products |

### Search
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/search` | GET | yes | Global search across entities |

### Signals (Khabri Signals Pipeline)
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/signals/ingest` | POST | yes | Ingest signal from external API or manual input |
| `/api/signals/promote` | POST | yes | Promote trend to narrative pipeline (Khabri → Yantri) |
| `/api/signals/trends` | GET, POST | yes | List/create trends |
| `/api/signals/trends/[id]` | GET, PATCH | yes | Get/update trend |
| `/api/signals/trends/[id]/related` | GET, POST | yes | Related trend graph |
| `/api/signals/trends/[id]/signals` | POST | yes | Add signal to trend |
| `/api/signals/velocity` | GET | yes | Real-time velocity rankings |

### Skills
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/skills` | GET | yes | List skills (with optional filtering) |
| `/api/skills/[path]` | GET, PATCH | yes | Get skill detail + learning logs + executions |
| `/api/skills/execute` | POST | yes | Execute skill or skill chain (for testing) |
| `/api/skills/performance` | GET | yes | Skill performance leaderboard |
| `/api/skills/sync` | POST | yes | Scan /skills/ directory and sync files to DB |

### Tasks (PMS)
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/tasks` | GET, POST | yes | List/create tasks |
| `/api/tasks/[id]` | DELETE, GET, PATCH | yes | Get/update/delete task |
| `/api/tasks/[id]/comments` | POST | yes | Add comment to task |
| `/api/tasks/[id]/status` | PATCH | yes | Update task status |
| `/api/tasks/board` | GET | yes | Kanban board view |
| `/api/tasks/export` | GET | yes | Export tasks (CSV) |
| `/api/tasks/workload` | GET | yes | Workload distribution |

### Upload
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/upload/presigned` | POST | yes | Generate S3 presigned URL |

### Users
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/users` | GET, POST | yes | List users (Admin/HEAD_HR only) |
| `/api/users/[id]` | DELETE, GET, PATCH | yes | Get/update/delete user |
| `/api/users/me` | GET, PATCH | yes | Current user profile |

### Vritti (Editorial CMS)
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/vritti/articles` | GET, POST | yes | List/create articles |
| `/api/vritti/articles/[id]` | DELETE, GET, PATCH | yes | Get/update/delete article |
| `/api/vritti/articles/[id]/comments` | GET, POST | yes | List/create editorial comments |
| `/api/vritti/categories` | GET, POST | yes | List/create categories |
| `/api/vritti/categories/[id]` | DELETE, PATCH | yes | Update/delete category (ADMIN only) |
| `/api/vritti/media` | GET, POST | yes | List/upload media files |

### Workflows
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/workflows/active` | GET | yes | List active strategy tests |
| `/api/workflows/execute` | POST | yes | Execute named workflow |
| `/api/workflows/history` | GET | yes | Historical learning cycle data |
| `/api/workflows/process` | POST | yes | Run workflow engine (auto-advance + escalations) |

### Yantri (Content Generation)
| Route | Methods | Auth | Description |
|---|---|---|---|
| `/api/yantri/content-pieces` | GET, POST | no | List/create content pieces |
| `/api/yantri/content-pieces/[id]` | DELETE, GET, PUT | no | Get/update/delete content piece |
| `/api/yantri/deliverables` | GET, POST | no | List deliverables |
| `/api/yantri/deliverables/[id]` | DELETE, GET, PATCH | yes | Get/update/delete deliverable |
| `/api/yantri/deliverables/[id]/assets` | GET, POST | no | Get/upload deliverable assets |
| `/api/yantri/editorial-narratives` | GET | yes | List editorial narratives |
| `/api/yantri/editorial-narratives/[id]` | GET, PUT | yes | Get/update editorial narrative |
| `/api/yantri/editorial-narratives/cluster` | POST | yes | Cluster editorial narratives |
| `/api/yantri/fact-engine` | GET, POST | no | Generate/list fact dossiers |
| `/api/yantri/fact-engine/[treeId]` | DELETE, GET | no | Get/delete specific fact dossier |
| `/api/yantri/generate` | POST | yes | Generate content |
| `/api/yantri/generate-image` | POST | yes | Generate image via AI |
| `/api/yantri/history` | GET | yes | Generation history |
| `/api/yantri/ingest` | POST | no | Ingest/validate content |
| `/api/yantri/narrative-trees` | GET | no | List narrative trees |
| `/api/yantri/narrative-trees/[treeId]` | DELETE, GET, PUT | no | Get/update/delete narrative tree |
| `/api/yantri/narrative-trees/[treeId]/hypothesis` | POST | no | Test hypothesis on tree |
| `/api/yantri/narrative-trees/merge` | POST | no | Merge narrative trees |
| `/api/yantri/narratives` | GET, POST | yes | List/create narratives |
| `/api/yantri/narratives/[id]` | DELETE, GET, PATCH | yes | Get/update/delete narrative |
| `/api/yantri/narratives/[id]/deliverables` | POST | yes | Create deliverables from narrative |
| `/api/yantri/package` | POST | yes | Package narrative output |
| `/api/yantri/performance` | GET, POST | yes | Content performance tracking |
| `/api/yantri/performance/[id]` | DELETE, GET, PUT | yes | Update performance metrics |
| `/api/yantri/performance/summary` | GET | yes | Performance summary |
| `/api/yantri/pipeline/run` | POST | yes | Run content pipeline |
| `/api/yantri/pipeline/status` | GET | yes | Get pipeline status |
| `/api/yantri/platform-rules` | GET, POST | yes | List/create platform rules |
| `/api/yantri/platform-rules/[id]` | DELETE, PUT | yes | Update/delete platform rule |
| `/api/yantri/prompt-templates` | GET, POST | yes | List/create prompt templates |
| `/api/yantri/prompt-templates/[id]` | DELETE, GET, PUT | yes | Get/update/delete template |
| `/api/yantri/prompt-templates/test` | POST | yes | Test prompt template |
| `/api/yantri/quick-generate` | POST | yes | Quick content generation |
| `/api/yantri/relay/publish` | GET, POST | yes | Publish via relay |
| `/api/yantri/research` | POST | yes | Generate research content |
| `/api/yantri/rewrite-segment` | POST | yes | Micro-regenerate text segment |
| `/api/yantri/route-prompt` | POST | yes | Route to appropriate prompt |
| `/api/yantri/scan` | POST | yes | Scan content |
| `/api/yantri/stats` | GET | yes | Dashboard stats |
| `/api/yantri/strategist` | POST | yes | Run strategy agent |
| `/api/yantri/trends/batch/[id]` | DELETE, GET, PUT | yes | Manage trend batch |
| `/api/yantri/trends/batches` | GET | yes | List trend batches |
| `/api/yantri/trends/fetch` | POST | yes | Fetch trends |
| `/api/yantri/trends/import` | POST | yes | Import trends |

---

## Summary Statistics

- **Total Routes**: 172
- **Authenticated Routes**: 162 (94%)
- **Public Routes**: 10 (6%)
- **HTTP Methods**:
  - GET: ~100+ routes
  - POST: ~70+ routes
  - PATCH: ~40+ routes
  - DELETE: ~20+ routes
  - PUT: ~15+ routes
- **Main Modules**:
  - Yantri (Content): 44 routes
  - Khabri (Intelligence): 19 routes
  - HOCCR (Team): 17 routes
  - Tasks/PMS: 8 routes
  - Finance: 9 routes
  - Communication: 7 routes
  - Relay (Publishing): 7 routes

