# Relay Repo → Daftar Merge Plan

## Source Repo
- `https://github.com/ShowNoMoreOfficial/relay.git`
- Tech: Next.js 16.1.1, Prisma 5, Cloudflare R2, twitter-api-v2, googleapis

## Audit Summary

### Relay Repo Publishers (Real)
| Platform   | Status     | Method                                      |
|-----------|------------|---------------------------------------------|
| YouTube   | Real       | googleapis (resumable upload)               |
| Twitter/X | Real       | twitter-api-v2 (tweet + thread + media)     |
| Facebook  | Real       | Meta Graph API v19.0 (text/photo/Reels 3-phase) |
| Instagram | Real       | Meta Graph API v19.0 (image/Reel/Story/Carousel + container polling) |
| LinkedIn  | Not present | —                                           |

### Daftar's Relay Module (Before Merge)
| Platform   | Status     | Notes                                       |
|-----------|------------|---------------------------------------------|
| YouTube   | Real       | Already had real publisher via googleapis    |
| Twitter/X | Real       | Already had real publisher via twitter-api-v2 |
| Facebook  | Stub       | Threw "not yet implemented"                 |
| Instagram | Stub       | Threw "not yet implemented"                 |
| LinkedIn  | Real       | Already had real publisher via LinkedIn API  |

## What Was Merged

### 1. `src/lib/relay/meta.ts` (NEW)
Shared Meta API helpers for both Facebook and Instagram:
- `exchangeForLongLivedToken()` — short-lived → long-lived token (60 days)
- `discoverPagesAndIG()` — discovers FB Pages + linked IG Business accounts
- `getMetaPageToken()` — extracts page token from `PlatformConnection.config`
- `handleMetaApiError()` — detects auth errors (code 190/102), marks connection inactive

### 2. `src/lib/relay/publishers/facebook.ts` (REPLACED)
Replaced 91-line stub with ~250-line real publisher:
- `publishToFacebook()` — text/link posts, photo posts
- `publishFacebookReel()` — 3-phase Reels upload (start → binary upload → finish)

### 3. `src/lib/relay/publishers/instagram.ts` (REPLACED)
Replaced 108-line stub with ~415-line real publisher:
- `publishToInstagram()` — routes to image/carousel/reel based on postType
- `publishInstagramStory()` — Story publishing (image or video)
- `publishInstagramReel()` — container create → poll → publish
- `publishCarousel()` — up to 10 child containers → carousel container → publish
- `pollContainerStatus()` — exponential backoff (2s→10s, 24 attempts, ~4 min max)

### 4. `src/app/api/cron/relay-executor/route.ts` (UPDATED)
Wired Instagram and Facebook cases to use real publishers instead of throwing errors.
Auto-detects content type from media URLs (video vs image, single vs carousel).

### 5. `.env.template` (UPDATED)
Added `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`.

## Key Adaptations from Relay → Daftar
| Relay Concept               | Daftar Equivalent                          |
|-----------------------------|--------------------------------------------|
| `Integration` model         | `PlatformConnection` model                 |
| `integration.settings.pageAccessToken` | `connection.config.pageAccessToken` |
| `isHealthy: false`          | `isActive: false`                          |
| Cloudflare R2 storage       | S3 (existing media-handler.ts)             |
| Standalone OAuth routes     | Existing `oauth-helpers.ts`                |

## Not Merged (Already Existed in Daftar)
- YouTube publisher — Daftar already had a real one
- Twitter/X publisher — Daftar already had a real one
- LinkedIn publisher — Relay didn't have one; Daftar already had a real one

## Required Environment Variables
```
META_APP_ID=        # Facebook App ID from developers.facebook.com
META_APP_SECRET=    # Facebook App Secret
META_REDIRECT_URI=  # OAuth callback URL
```

## Testing
- All publishers use `PlatformConnection` for auth — requires valid Meta OAuth tokens
- Instagram requires an IG Business Account linked to a Facebook Page
- Facebook Reels downloads video from URL → uploads binary → publishes
- Container polling has a ~4 min timeout to stay within Vercel's 5-min limit
