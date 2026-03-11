# Vritti -- Editorial CMS

## What it does

Vritti is the editorial content management system for DAFTAR. It provides a full publishing pipeline for articles -- from initial idea through drafting, editing, review, approval, and publication. Articles can be assigned to categories, brands, authors, editors, and reviewers. When an article is published, a RAG (Retrieval-Augmented Generation) ingestion pipeline chunks the content, generates vector embeddings, and stores them for semantic search via the knowledge base.

Vritti also includes a media library for managing images, videos, documents, and audio files that can be attached to articles, and an editorial comment system for inline feedback during the review process.

## Database models

### ArticleCategory
- `id` (cuid, PK)
- `name` (String, unique)
- `slug` (String, unique)
- `description` (String, optional)
- `color` (String, optional -- hex color for UI)
- `parentId` (String, optional -- self-referencing for nested categories)
- `parent` / `children` (self-relation via "CategoryTree")
- `articles` (relation to Article[])
- `createdAt` (DateTime)

### Article
- `id` (cuid, PK)
- `title` (String)
- `slug` (String, unique -- auto-generated from title)
- `excerpt` (Text, optional)
- `body` (Text, optional -- rich text / markdown)
- `status` (ArticleStatus enum: IDEA, DRAFTING, EDITING, REVIEW, APPROVED, PUBLISHED, ARCHIVED)
- `categoryId` (String, optional -- FK to ArticleCategory)
- `brandId` (String, optional -- FK to Brand)
- `tags` (String[] -- array of tag strings)
- `coverImageUrl` (String, optional)
- `seoTitle` / `seoDescription` (String, optional)
- `authorId` (String -- FK to User, required)
- `editorId` (String, optional -- FK to User)
- `reviewerId` (String, optional -- FK to User)
- `wordCount` (Int, default 0 -- auto-computed from body)
- `readTimeMin` (Int, default 0 -- auto-computed at 200 words/min)
- `publishedAt` / `scheduledAt` (DateTime, optional)
- `metadata` (Json, optional -- custom fields, layout config)
- `versions` (relation to ArticleVersion[])
- `media` (relation to ArticleMedia[])
- `comments` (relation to EditorialComment[])
- `createdAt` / `updatedAt` (DateTime)
- Indexes: `[status, categoryId]`, `[authorId, status]`, `[brandId]`, `[publishedAt]`

### ArticleVersion
- `id` (cuid, PK)
- `articleId` (String -- FK to Article, cascade delete)
- `version` (Int -- sequential version number)
- `title` (String)
- `body` (Text, optional)
- `editedById` (String -- FK to User)
- `changeNote` (String, optional -- e.g. "Status changed from DRAFTING to REVIEW")
- `createdAt` (DateTime)
- Unique constraint: `[articleId, version]`

### ArticleMedia
- `id` (cuid, PK)
- `articleId` (String, optional -- FK to Article, set null on delete)
- `fileName` (String)
- `fileUrl` (String)
- `fileType` (String -- image, video, document, audio)
- `fileSize` (Int, default 0 -- bytes)
- `altText` / `caption` (String, optional)
- `uploadedById` (String -- FK to User)
- `createdAt` (DateTime)
- Indexes: `[articleId]`, `[fileType]`

### EditorialComment
- `id` (cuid, PK)
- `articleId` (String -- FK to Article, cascade delete)
- `authorId` (String -- FK to User)
- `content` (Text)
- `type` (String, default "comment" -- "comment", "suggestion", "revision_request")
- `resolved` (Boolean, default false)
- `createdAt` (DateTime)
- Index: `[articleId, resolved]`

## API routes

### Articles

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/vritti/articles` | Yes (`vritti.read.own`) | List articles with pagination. Filters: `status`, `categoryId`, `authorId`, `brandId`, `search`. Pass `view=pipeline` to get articles grouped by status (Kanban view). Role-scoped: MEMBER/CONTRACTOR see only own authored/edited articles; CLIENT sees only PUBLISHED articles for their brands; ADMIN/DEPT_HEAD see all. |
| POST | `/api/vritti/articles` | Yes (ADMIN, DEPT_HEAD, MEMBER) | Create a new article. Required: `title`. Optional: `categoryId`, `brandId`, `excerpt`, `body`, `tags`, `coverImageUrl`, `seoTitle`, `seoDescription`, `editorId`, `reviewerId`. Auto-generates slug, computes wordCount and readTimeMin. Initial status is IDEA. |
| GET | `/api/vritti/articles/[id]` | Yes | Get single article with versions (latest 5), media, comments, and related user/brand/category info. Role-scoped access: MEMBER/CONTRACTOR must be author or editor; CLIENT must have brand access and article must be PUBLISHED. |
| PATCH | `/api/vritti/articles/[id]` | Yes (author, editor, ADMIN, DEPT_HEAD) | Update article fields. When `status` changes, an ArticleVersion snapshot is automatically created. When status changes to PUBLISHED, `publishedAt` is set. Supports: `title`, `categoryId`, `brandId`, `excerpt`, `body`, `tags`, `coverImageUrl`, `seoTitle`, `seoDescription`, `editorId`, `reviewerId`, `status`, `scheduledAt`. |
| DELETE | `/api/vritti/articles/[id]` | Yes (author or ADMIN) | Delete an article. Only articles in IDEA or ARCHIVED status can be deleted. |

### Comments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/vritti/articles/[id]/comments` | Yes | List all editorial comments for an article, ordered by creation date ascending. |
| POST | `/api/vritti/articles/[id]/comments` | Yes | Add an editorial comment. Required: `content`. Optional: `type` ("comment", "suggestion", "revision_request"). |

### Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/vritti/categories` | Yes (`vritti.read.own`) | List all categories with parent/children relationships and article counts. |
| POST | `/api/vritti/categories` | Yes (ADMIN only) | Create a category. Required: `name`. Optional: `description`, `color`, `parentId`. Auto-generates slug. |
| PATCH | `/api/vritti/categories/[id]` | Yes (ADMIN only) | Update a category. Supports: `name`, `description`, `color`, `parentId`. Validates parentId is not self-referencing. |
| DELETE | `/api/vritti/categories/[id]` | Yes (ADMIN only) | Delete a category. Fails if the category has any articles assigned. |

### Media

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/vritti/media` | Yes (`vritti.read.own`) | List media files with pagination. Filters: `fileType`, `articleId`, `search` (filename). |
| POST | `/api/vritti/media` | Yes (`vritti.read.own`) | Create a media record (metadata only -- actual file upload handled separately via S3). Required: `fileName`, `fileUrl`, `fileType`. Optional: `fileSize`, `altText`, `caption`, `articleId`. |

### Request/Response shapes

**POST /api/vritti/articles (request body):**
```json
{
  "title": "string (required)",
  "categoryId": "string?",
  "brandId": "string?",
  "excerpt": "string?",
  "body": "string?",
  "tags": ["string"],
  "coverImageUrl": "string?",
  "seoTitle": "string?",
  "seoDescription": "string?",
  "editorId": "string?",
  "reviewerId": "string?"
}
```

**GET /api/vritti/articles (paginated response):**
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "status": "IDEA|DRAFTING|EDITING|REVIEW|APPROVED|PUBLISHED|ARCHIVED",
      "category": { "id": "string", "name": "string", "slug": "string" },
      "author": { "id": "string", "name": "string" },
      "editor": { "id": "string", "name": "string" },
      "brand": { "id": "string", "name": "string" },
      "wordCount": 0,
      "readTimeMin": 0,
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "meta": { "total": 0, "page": 1, "limit": 25 }
}
```

**GET /api/vritti/articles?view=pipeline (pipeline response):**
```json
{
  "data": [
    {
      "status": "IDEA",
      "articles": [...],
      "count": 5
    },
    {
      "status": "DRAFTING",
      "articles": [...],
      "count": 3
    }
  ]
}
```

## UI pages

All Vritti pages are under `src/app/(shell)/m/vritti/`.

| Path | Page | Description |
|------|------|-------------|
| `/m/vritti` | Dashboard | Main Vritti landing page |
| `/m/vritti/pipeline` | Pipeline View | Kanban-style board showing articles grouped by status (IDEA through PUBLISHED) |
| `/m/vritti/articles` | Articles List | Paginated table/grid of all articles with filters |
| `/m/vritti/media` | Media Library | Browse and manage uploaded media files |
| `/m/vritti/categories` | Categories | Manage article categories (create, edit, delete, view hierarchy) |

Layout: `src/app/(shell)/m/vritti/layout.tsx` -- shared navigation tabs across Vritti sub-pages.

## Background jobs (Inngest)

### ingestVrittiArticle (`vritti/article.published`)

**File:** `src/lib/inngest/vritti-workflows.ts`

Triggered when an article is published. Runs the RAG ingestion pipeline:

1. **fetch-article** -- Loads the published article (title, body, excerpt, category, author)
2. **clear-existing-chunks** -- Deletes any existing vector chunks for this article (handles re-publish)
3. **chunk-content** -- Chunks the article content using `chunkText()` with 500-token chunks and 50-token overlap. Prepends title, category, and author metadata for richer semantic context.
4. **embed-batch-N** -- Processes chunks in batches of 5. For each chunk:
   - Generates a 768-dimension embedding via `generateEmbedding()`
   - Stores in the `knowledge_base_chunks` table with the vector as `vector(768)`
   - Falls back to storing without embedding if generation fails (can be backfilled later)

Configuration:
- Retries: 2
- Concurrency: 3 (max 3 articles ingesting simultaneously)
- Chunk IDs prefixed with `kbc_`

## Known issues and gaps

1. **No rich text editor** -- Article body is stored as plain text/markdown. No WYSIWYG editor (e.g. TipTap, ProseMirror) is integrated in the UI.
2. **Article versioning is basic** -- Versions are only created on status changes, not on every save. No diff viewer. Only the latest 5 versions are returned by the API.
3. **No scheduled publishing** -- The `scheduledAt` field exists on the Article model, but there is no background job that automatically publishes articles when their scheduled time arrives.
4. **Media upload is metadata-only** -- The API creates media records with URLs but does not handle actual file upload to S3. File upload to storage must be handled separately.
5. **No search indexing beyond RAG** -- Full-text search on articles uses basic `contains` (ILIKE). No dedicated search index.
6. **SEO fields are stored but not rendered** -- `seoTitle` and `seoDescription` are persisted but there is no public-facing rendering of articles with SEO metadata.
7. **No Vritti-specific UI components** -- Unlike other modules, Vritti pages are defined but there is no `src/components/vritti/` directory.

## Dependencies on other modules

- **Yantri** -- Yantri narrative trees reference articles through editorial workflow. Some Yantri pages import from Vritti.
- **Khabri** -- The RAG ingestion pipeline uses `generateEmbedding()` from `src/lib/khabri/vector-store.ts` to create vector embeddings.
- **Brands (core)** -- Articles can be scoped to brands via `brandId`. CLIENT users see only articles for their accessible brands.
- **Users/Auth (core)** -- Article authorship, editing, and reviewing are tied to User records. Role-based access controls article visibility.
- **Knowledge Base** -- Published articles feed into the `knowledge_base_chunks` table for GI semantic search.
