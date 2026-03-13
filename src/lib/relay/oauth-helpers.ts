/**
 * OAuth 2.0 helpers for Relay platform connections.
 *
 * Required environment variables:
 *
 * Twitter / X (OAuth 2.0 PKCE):
 *   TWITTER_CLIENT_ID        — Twitter app client ID
 *   TWITTER_CLIENT_SECRET     — Twitter app client secret
 *   TWITTER_REDIRECT_URI      — e.g. https://your-domain.com/api/relay/oauth/twitter/callback
 *
 * YouTube / Google (OAuth 2.0):
 *   GOOGLE_CLIENT_ID          — Google Cloud OAuth client ID
 *   GOOGLE_CLIENT_SECRET      — Google Cloud OAuth client secret
 *   GOOGLE_REDIRECT_URI       — e.g. https://your-domain.com/api/relay/oauth/youtube/callback
 *
 * LinkedIn (OAuth 2.0):
 *   LINKEDIN_CLIENT_ID        — LinkedIn app client ID
 *   LINKEDIN_CLIENT_SECRET    — LinkedIn app client secret
 *   LINKEDIN_REDIRECT_URI     — e.g. https://your-domain.com/api/relay/oauth/linkedin/callback
 *
 * Instagram (via Facebook/Meta OAuth 2.0):
 *   META_APP_ID               — Meta app ID
 *   META_APP_SECRET           — Meta app secret
 *   META_REDIRECT_URI         — e.g. https://your-domain.com/api/relay/oauth/instagram/callback
 */

// ─── Twitter / X ────────────────────────────────────────

const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";

/** Build the Twitter OAuth 2.0 authorization URL (PKCE flow). */
export function getTwitterAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID ?? "",
    redirect_uri: process.env.TWITTER_REDIRECT_URI ?? "",
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${TWITTER_AUTH_URL}?${params.toString()}`;
}

/** Exchange a Twitter authorization code for access + refresh tokens. */
export async function exchangeTwitterCode(
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const res = await fetch(TWITTER_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.TWITTER_REDIRECT_URI ?? "",
      code_verifier: codeVerifier,
    }),
  });
  return res.json();
}

/** Refresh a Twitter access token. */
export async function refreshTwitterToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const res = await fetch(TWITTER_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  return res.json();
}

// ─── YouTube / Google ───────────────────────────────────

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Build the Google OAuth 2.0 authorization URL for YouTube access. */
export function getYouTubeAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID ?? "",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
    scope: "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload",
    state,
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Exchange a Google authorization code for access + refresh tokens. */
export async function exchangeYouTubeCode(
  code: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
      client_id: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  });
  return res.json();
}

/** Refresh a Google/YouTube access token. */
export async function refreshYouTubeToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  });
  return res.json();
}

// ─── LinkedIn ───────────────────────────────────────────

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

/** Build the LinkedIn OAuth 2.0 authorization URL. */
export function getLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID ?? "",
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI ?? "",
    scope: "openid profile w_member_social",
    state,
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

/** Exchange a LinkedIn authorization code for an access token. */
export async function exchangeLinkedInCode(
  code: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI ?? "",
      client_id: process.env.LINKEDIN_CLIENT_ID ?? "",
      client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
    }),
  });
  return res.json();
}

// ─── Instagram / Meta ───────────────────────────────────

const META_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
const META_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token";

/** Build the Meta OAuth URL for Instagram Business access. */
export function getInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.META_APP_ID ?? "",
    redirect_uri: process.env.META_IG_REDIRECT_URI ?? process.env.META_REDIRECT_URI ?? "",
    scope: "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
    state,
  });
  return `${META_AUTH_URL}?${params.toString()}`;
}

/** Exchange a Meta authorization code for an access token (Instagram flow). */
export async function exchangeInstagramCode(
  code: string
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const res = await fetch(META_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.META_IG_REDIRECT_URI ?? process.env.META_REDIRECT_URI ?? "",
      client_id: process.env.META_APP_ID ?? "",
      client_secret: process.env.META_APP_SECRET ?? "",
    }),
  });
  return res.json();
}

/** Build the Meta OAuth URL for Facebook Page management. */
export function getFacebookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.META_APP_ID ?? "",
    redirect_uri: process.env.META_FB_REDIRECT_URI ?? process.env.META_REDIRECT_URI ?? "",
    scope: "pages_manage_posts,pages_read_engagement,pages_show_list",
    state,
  });
  return `${META_AUTH_URL}?${params.toString()}`;
}

/** Exchange a Meta authorization code for an access token (Facebook flow). */
export async function exchangeFacebookCode(
  code: string
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const res = await fetch(META_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.META_FB_REDIRECT_URI ?? process.env.META_REDIRECT_URI ?? "",
      client_id: process.env.META_APP_ID ?? "",
      client_secret: process.env.META_APP_SECRET ?? "",
    }),
  });
  return res.json();
}

// ─── Utilities ──────────────────────────────────────────

/** Generate a cryptographically random state parameter for CSRF protection. */
export function generateOAuthState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a PKCE code verifier (43-128 chars, URL-safe). */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array)
    .toString("base64url")
    .slice(0, 64);
}

/** Derive a PKCE S256 code challenge from a code verifier. */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("base64url");
}
