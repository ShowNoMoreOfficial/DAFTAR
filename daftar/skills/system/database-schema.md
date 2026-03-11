# Skill: Database Schema Reference
## Module: daftar
## Trigger: Data model questions, schema decisions, query optimization
## Inputs: entity_name, relationship_type, query_pattern
## Outputs: schema_info, relationship_map, index_recommendations
## Dependencies:
## Scripts:

---

## Instructions

Reference for Daftar's database schema. Used by GI to understand data relationships and by developers for schema decisions.

### Core Models

#### User & Auth
- `User` — id, name, email, role, department, password hash
- `Account` / `Session` — NextAuth managed models
- `Department` — organizational units (7 default departments)

#### PMS (Project Management)
- `Task` — id, title, status, priority, assignee, reporter, department, due date, tags
- `TaskComment` — comments on tasks
- `TaskActivity` — audit log of task changes

#### Content & Relay
- `ContentPost` — scheduled content with platform, status, scheduled time
- `PlatformConnection` — OAuth connections to social platforms

#### Finance
- `Invoice` — client invoices with status, amounts, due dates
- `Expense` — team expenses with categories, approvals

#### HOCCR & Culture
- `Announcement` — organizational announcements
- `FeedbackChannel` — feedback collection channels
- `FeedbackResponse` — individual feedback responses

#### GI (Intelligence)
- `GIMotivationProfile` — per-user motivation preferences
- `GITierAssignment` — current GI tier per user/department
- `GIPrediction` — predictions with confidence, outcome tracking
- `GILearningLog` — category-key-value learning entries
- `GIPatternLog` — detected patterns with severity
- `GIAutonomousAction` — actions GI can take with approval tracking

#### Gamification
- `Achievement` — unlockable achievements
- `UserAchievement` — earned achievements per user
- `Challenge` — active challenges
- `ChallengeParticipant` — challenge enrollment
- `XPTransaction` — XP ledger
- `UserLevel` — current level per user

#### Skills Ecosystem
- `Skill` — registered skill files with domain, module, metadata
- `SkillExecution` — execution log with performance scoring
- `SkillLearningLog` — learning entries per skill

#### CMS (Vritti)
- `ArticleCategory` — content categories
- `Article` — CMS articles with status, SEO fields

#### Client
- `Client` — client organizations
- `Brand` — brands per client
- `Deliverable` — client deliverables with status tracking

#### Multi-Tenant SaaS
- `Organization` — tenant organizations
- `SaaSProduct` — product catalog

### Key Relationships
```
User → Department (many-to-one)
Task → User (assignee, reporter)
Task → Department
ContentPost → User (author)
Invoice → Client
Skill → SkillExecution (one-to-many)
Skill → SkillLearningLog (one-to-many)
Client → Brand (one-to-many)
Brand → Deliverable (one-to-many)
```

### Index Strategy
- All foreign keys are indexed
- Composite indexes on frequently queried combinations (e.g., `skillId + executedAt`)
- Status fields indexed for filtered queries
- `isActive` indexed for soft-delete patterns

---

## Learning Log

### Entry: Initial
- Schema location: `prisma/schema.prisma`
- Run `npx prisma db push` for schema sync (stop dev server first on Windows)
- Prisma generate fails if dev server holds lock on query_engine DLL
