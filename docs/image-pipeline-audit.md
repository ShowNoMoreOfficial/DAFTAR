# Image & Visual Asset Pipeline — End-to-End Audit

**Date:** 2026-03-13
**Status:** CRITICAL issues found — images broken for most recent content

---

## Executive Summary

Images appear broken/missing on dashboard and review pages because:

1. **Background image generation uses the wrong function** — calls `image-generator.ts` (Pollinations-only, returns HTTP URL) instead of the API route `/api/yantri/generate-image` (which has Gemini → Together → Pollinations fallback chain with server-side fetching)
2. **Pollinations.ai is currently returning HTTP 500** — so the single-provider library function fails silently, leaving assets stuck with `placeholder://` URLs
3. **No retry mechanism** — failed background image generation is fire-and-forget; assets remain as placeholders permanently
4. **No Next.js image domain config** — `next.config.ts` has no `images.remotePatterns` for `image.pollinations.ai`

**Result:** 12 out of 36 assets (33%) are stuck with `placeholder://` URLs and show as "Generating..." spinners forever.

---

## 1. Database State

### Asset Counts by Type and URL Format

| Type | Total | HTTP URLs | Base64 | NULL | Placeholder/Text |
|------|-------|-----------|--------|------|-------------------|
| THUMBNAIL | 9 | 2 | 0 | 0 | **7** |
| SOCIAL_CARD | 6 | 1 | 0 | 0 | **5** |
| CAROUSEL_SLIDE | 11 | 11 | 0 | 0 | 0 |
| IMAGE | 10 | 10 | 0 | 0 | 0 |

**Key findings:**
- **12 assets stuck as placeholders** — all THUMBNAILs and SOCIAL_CARDs from recent generates
- Older CAROUSEL_SLIDEs and IMAGEs have working Pollinations HTTP URLs (generated when Pollinations was working)
- Zero base64 assets in DB — the server-side fetch API route is not used by the pipeline
- All placeholder URLs follow `placeholder://thumbnail-N`, `placeholder://social-card`, `placeholder://cover-frame` pattern

### Recent Asset Samples (newest first)

| ID | Type | URL Type | URL Preview |
|----|------|----------|-------------|
| cmmovc34... | SOCIAL_CARD | placeholder | `placeholder://social-card` |
| cmmovc34... | THUMBNAIL | placeholder | `placeholder://thumbnail-1` |
| cmmoul9h... | SOCIAL_CARD | placeholder | `placeholder://social-card` |
| cmmoul9h... | THUMBNAIL | placeholder | `placeholder://thumbnail-1` |
| cmmotsgp... | THUMBNAIL | placeholder | `placeholder://thumbnail-1` |
| cmmotsgp... | SOCIAL_CARD | placeholder | `placeholder://social-card` |
| cmmotrhub... | SOCIAL_CARD | placeholder | `placeholder://social-card` |
| cmmotrhub... | THUMBNAIL | placeholder | `placeholder://thumbnail-1` |
| cmmopton... | THUMBNAIL | placeholder | `placeholder://thumbnail-2` |
| cmmopton... | SOCIAL_CARD | placeholder | `placeholder://cover-frame` |
| cmmopton... | THUMBNAIL | placeholder | `placeholder://thumbnail-3` |
| cmmopton... | THUMBNAIL | placeholder | `placeholder://thumbnail-1` |
| cmmooccnq... | THUMBNAIL | **HTTP** | `https://image.pollinations.ai/...` |
| cmmooccnq... | SOCIAL_CARD | **HTTP** | `https://image.pollinations.ai/...` |
| cmmno3ncn... | THUMBNAIL | **HTTP** | `https://image.pollinations.ai/...` |
| cmmmlp2qf... | CAROUSEL_SLIDE | **HTTP** | `https://image.pollinations.ai/...` |

**Pattern:** Older assets succeeded (Pollinations was responding), newer ones all stuck as placeholders.

---

## 2. Image Generation Architecture

### Two Separate Systems (the root problem)

#### System A: Library Function (`src/lib/image-generator.ts`)
- **Used by:** `quick-generate/route.ts` background `fireImageGeneration()`
- **Provider:** Pollinations.ai only (no fallback)
- **Returns:** Direct Pollinations HTTP URL (e.g., `https://image.pollinations.ai/prompt/...`)
- **Verification:** `HEAD` request with 30s timeout
- **On failure:** Returns `null` → asset stays as placeholder

#### System B: API Route (`src/app/api/yantri/generate-image/route.ts`)
- **Used by:** BlogPreview.tsx, TwitterPreview.tsx (client-side "Generate Image" buttons)
- **Providers:** Gemini → Together.ai FLUX → Pollinations (3-tier fallback)
- **Returns:** Base64 data URI (server-side fetch, converts to `data:image/...;base64,...`)
- **On failure:** Falls back to Pollinations URL as final resort

### The Disconnect

```
Pipeline (quick-generate) → fireImageGeneration() → generateImage() [lib]
                                                         ↓
                                                   Pollinations ONLY
                                                   Returns HTTP URL
                                                   No fallback chain
                                                   ❌ Currently 500

Client components → POST /api/yantri/generate-image [API route]
                         ↓
                   Gemini → Together → Pollinations
                   Returns base64 data URI
                   Full fallback chain
                   ✅ More resilient
```

**The pipeline uses the weak, single-provider function. The robust API route with fallback chain is only available to manual client-side generation.**

---

## 3. Pipeline Flow (Step by Step)

### Content Creation → Image Generation

```
POST /api/yantri/quick-generate
  │
  ├─ Step 1-6: Generate content with LLM
  │
  ├─ Step 6b: Create placeholder assets in DB
  │    ├─ THUMBNAIL → url: "placeholder://thumbnail-1"
  │    ├─ CAROUSEL_SLIDE → url: "placeholder://slide-N"
  │    ├─ SOCIAL_CARD → url: "placeholder://social-card"
  │    └─ IMAGE → url: "placeholder://featured-image"
  │
  ├─ Step 7: Fire image generation (BACKGROUND, fire-and-forget)
  │    └─ fireImageGeneration() → for each asset type:
  │         └─ generateAndSaveImage(prompt, deliverableId, type, index)
  │              ├─ Find placeholder asset by deliverableId + type
  │              ├─ Call generateImage() from image-generator.ts
  │              │    └─ Build Pollinations URL → HEAD check → return URL or null
  │              └─ If URL returned: update asset.url with HTTP URL
  │                 If null: asset stays as placeholder:// ← BUG
  │
  └─ Step 8: Return response to client
       (client sees "Generating..." spinner on review page)
```

### Placeholder Asset Creation (quick-generate lines 1440-1535)

Placeholder URLs created per content type:
- `placeholder://thumbnail-{N}` — All content types with thumbnailBriefs
- `placeholder://slide-{N}` — Carousel content
- `placeholder://cover-frame` — YouTube Shorts, Reels
- `placeholder://social-card` — X threads/singles
- `placeholder://linkedin-header` — LinkedIn posts
- `placeholder://featured-image` — Blog posts

---

## 4. Image Display (UI Components)

### Review Page (`src/app/(shell)/m/yantri/review/[id]/page.tsx`, lines 1071-1146)

**Most robust handling:**
```
asset.url → classify:
  ├─ startsWith("data:") or startsWith("http") → hasRealImage = true
  │    └─ Render <img> with onError fallback
  ├─ missing or startsWith("placeholder://") → isPending = true
  │    └─ Show spinner + "Generating..."
  ├─ length > 100 and not real/pending → isPromptAsUrl = true
  │    └─ Show prompt text
  └─ else → "No image"
```

**Issue:** "Generating..." spinner shows forever because there's no retry and no polling. The background job already failed silently.

### Blog Preview (`_components/BlogPreview.tsx`)
- Uses POST `/api/yantri/generate-image` (the robust route)
- Manual "Generate Image" button per image slot
- No error handling on `<img>` tags

### Twitter Preview (`_components/TwitterPreview.tsx`)
- Uses POST `/api/yantri/generate-image` (the robust route)
- Manual generation per tweet image
- No `onError` handler on `<img>` tags

### Dashboard (`dashboard/page.tsx`, `editorial-brief.tsx`)
- **No images displayed** — editorial brief shows text badges and trend recommendations only
- Dashboard doesn't render asset images; it shows pipeline status and KPIs

### Intelligence (`intelligence/page.tsx`)
- **No images** — signals show text, badges, sentiment bars

### Content Studio (`content-studio/page.tsx`)
- **No images** — shows cards with asset counts as text, not rendered images

---

## 5. Test Results

### Pollinations.ai Direct Test
```
curl "https://image.pollinations.ai/prompt/test%20image..." → HTTP 500
```
**Status: DOWN** — Pollinations is currently returning 500 errors.

### Next.js Image Config
```typescript
// next.config.ts — NO images config at all
const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/**": ["./skills/**/*"] },
};
```
**Missing:** No `images.remotePatterns` for `image.pollinations.ai`. Not currently blocking (all display uses native `<img>`, not `next/image`), but would block any future migration.

---

## 6. Bugs Identified

### BUG 1: Pipeline uses single-provider function instead of fallback API (CRITICAL)

**File:** `src/app/api/yantri/quick-generate/route.ts`, line 12 + line 1130

```typescript
import { generateImage } from "@/lib/image-generator"; // ← Pollinations only!
...
const imageUrl = await generateImage(prompt, dims);    // ← No Gemini/Together fallback
```

**Impact:** When Pollinations is down (like now), ALL pipeline images fail. The robust 3-tier fallback in `/api/generate-image` is unused.

**Fix:** Replace the library call with an internal fetch to `/api/yantri/generate-image`, or extract the fallback chain into a shared function usable by both.

### BUG 2: No retry mechanism for failed image generation (CRITICAL)

**File:** `src/app/api/yantri/quick-generate/route.ts`, line 941-943

```typescript
fireImageGeneration(...).catch(err => console.error(...));
```

**Impact:** Fire-and-forget. If it fails, assets remain as `placeholder://` forever. No retries, no Inngest event, no cron job to regenerate.

**Fix:** Either:
- Use Inngest to queue image generation with retries
- Add a "Regenerate Images" button on the review page
- Add a cron job that scans for placeholder:// assets and retries

### BUG 3: Carousel slide dimensions wrong (MINOR)

**File:** `src/app/api/yantri/quick-generate/route.ts`, line 1126

```typescript
assetType === "CAROUSEL_SLIDE"
  ? { width: 1080, height: 1080 }   // ← Square (1:1)
  : { width: 1280, height: 720 };
```

**But the prompt says:** `"4:5 portrait, 1080x1350px"` (line 1035)
**And `image-generator.ts` says:** `{ width: 1080, height: 1080 }` (line 68)

**Impact:** Carousel slides are generated as 1:1 squares instead of 4:5 portrait format (1080x1350) that Instagram expects.

**Fix:** Change to `{ width: 1080, height: 1350 }` in both files.

### BUG 4: Review page "Generating..." spinner never resolves (UX)

**File:** `src/app/(shell)/m/yantri/review/[id]/page.tsx`, lines 1105-1109

The spinner shows when `isPending` is true, but there's no:
- Polling to check if the image was generated
- Manual "Retry" button
- Timeout message saying "Generation failed"

**Impact:** Users see an infinite spinner with no way to resolve it.

**Fix:** Add a "Retry Generation" button next to pending assets, and/or auto-poll for updates.

### BUG 5: Next.js image domain not configured (LATENT)

**File:** `next.config.ts`

No `images.remotePatterns` configured. Currently not breaking because all `<img>` tags are native HTML (with `@next/next/no-img-element` eslint disable). But any migration to `next/image` would fail for Pollinations URLs.

---

## 7. Fix Priority

| Priority | Bug | Effort | Impact |
|----------|-----|--------|--------|
| P0 | BUG 1: Use fallback chain in pipeline | Medium | Fixes all future image generation |
| P0 | BUG 2: Add retry for failed images | Medium | Fixes stuck placeholder assets |
| P1 | BUG 4: Add retry UI on review page | Small | Users can manually fix stuck images |
| P2 | BUG 3: Carousel dimensions | Trivial | Correct aspect ratio for Instagram |
| P3 | BUG 5: Next.js image config | Trivial | Future-proofing |

---

## 8. Recommended Fix Plan

### Phase 1: Immediate (fix new content)

1. **Extract the fallback chain** from `/api/yantri/generate-image/route.ts` into a shared `generateImageWithFallback()` function in `src/lib/image-generator.ts`
2. **Replace** `generateImage()` call in `generateAndSaveImage()` with the new fallback function
3. **Fix carousel dimensions** to 1080x1350

### Phase 2: Resilience (fix stuck assets + prevent recurrence)

4. **Add Inngest function** `yantri/image.generate` with 3 retries and exponential backoff
5. **Add cron/scheduled function** that scans for `placeholder://` assets older than 5 minutes and retries
6. **Add "Retry" button** on review page for pending assets

### Phase 3: Cleanup (fix existing data)

7. **Run migration script** to regenerate all 12 stuck `placeholder://` assets using the new fallback function
8. **Add `images.remotePatterns`** for `image.pollinations.ai` in `next.config.ts`

---

## Appendix: File Map

| File | Role | Lines |
|------|------|-------|
| `src/lib/image-generator.ts` | Pollinations-only URL builder | 96 |
| `src/app/api/yantri/generate-image/route.ts` | 3-tier fallback API (Gemini/Together/Pollinations) | 115 |
| `src/app/api/yantri/quick-generate/route.ts` | Content pipeline + background image gen | ~1535 |
| `src/app/(shell)/m/yantri/review/[id]/page.tsx` | Asset display with 4-state handling | ~1300 |
| `src/app/(shell)/m/yantri/plan/[batchId]/_components/BlogPreview.tsx` | Manual image gen for blog | ~400 |
| `src/app/(shell)/m/yantri/plan/[batchId]/_components/TwitterPreview.tsx` | Manual image gen for tweets | ~200 |
| `next.config.ts` | Missing image domain config | 10 |
