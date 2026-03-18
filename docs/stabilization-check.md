# Stabilization Check — March 18, 2026

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | Build | PASS | 0 errors, compiled in 41s, 230 pages generated |
| 2 | Search Signal button crash | FIXED | All 6 `res.json()` calls in intelligence page wrapped with `safeJson()` — prevents crash on non-JSON responses (HTML error pages, text errors) |
| 3 | Khabri signals | STALE | 6 signals total, newest: 2026-03-10. Scan endpoint `/api/khabri/scan` exists and is correct. RSS feeds reachable (200 OK). Scraper works. Signals are 8 days old — need a fresh scan. |
| 4 | Image generation | BROKEN | Gemini API key is INVALID locally (`.env.local`). Vercel has a key (set 7 days ago) — may also be expired. Image model set to `gemini-3.1-flash-image-preview`. Assets in DB: 77 total (37 real images, 0 placeholders, 0 nulls, 40 with non-http/non-data URLs). |
| 5 | Content generation (Gemini-only) | PASS | Model router returns `"gemini"` for ALL tasks. `callClaude`/`anthropic` only appears in `gi/chat/route.ts`. No Claude leaks in content pipeline. |
| 6 | GI chat | PASS | Claude brain wired — Anthropic SDK imported, `messages.stream()` in use. 3 conversations in DB. |
| 7 | Relay OAuth | PASS | All required env vars set locally: `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. Missing locally: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`. |
| 8 | Deliverables | PASS | 26 deliverables: 18 REVIEW, 4 RELAYED, 2 APPROVED, 1 KILLED, 1 PLANNED. 5 in REVIEW are loadable (META_CAROUSEL, X_THREAD x2, META_REEL, YOUTUBE). |
| 9 | User accounts | PASS | 8 users, all active: 3 ADMIN (Lavan, ShowNo More, Stallone), 1 HEAD_HR (Muskan), 3 MEMBER (Deepak, Parth, Sudhanshu), 1 CLIENT (Bhupendra Chaubey). |
| 10 | Skills | PASS | 155 skills synced, 588 total executions, 40 unique skills used (25.8% utilization). |

## Fixes Applied This Session

1. **Search Signal button crash (CHECK 2)**: Added `safeJson()` helper to `intelligence/page.tsx` that uses `res.text()` + `JSON.parse()` with try/catch instead of raw `res.json()`. All 6 fetch calls in the page now use this — scan button, signal fetch, signal search error, trend signals, trend list, and research trees.

## Still Broken (Needs Manual Work)

1. **Gemini API key invalid** — The key in `.env.local` returns "API key not valid" from Google. The Vercel production key (set 7 days ago) may also be expired. **Action**: Generate a new Gemini API key at https://aistudio.google.com/apikey and update both `.env.local` and Vercel (`vercel env rm GEMINI_API_KEY production --yes && vercel env add GEMINI_API_KEY production`).

2. **Image model may not exist** — `image-generator.ts` uses `gemini-3.1-flash-image-preview` which may not be a valid model. **Action**: After getting a valid API key, test which image models are available. Candidates: `gemini-2.0-flash-exp`, `gemini-2.0-flash-preview-image-generation`, `imagen-3.0-generate-001`.

3. **Signals are stale (8 days old)** — Only 6 signals, newest from March 10. The scan endpoint works but hasn't been triggered. **Action**: Click "Scan Now" on the Intelligence page (admin only), or `POST /api/khabri/scan`.

4. **LinkedIn OAuth not configured locally** — `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` missing from `.env.local`. May be set on Vercel. **Action**: Check Vercel env vars or add LinkedIn API credentials.

5. **40 assets with non-standard URLs** — 77 total assets, only 37 have real http/data URLs. The other 40 may have stale/broken URLs from previous generation attempts. **Action**: Audit and regenerate once Gemini API key is fixed.
