/**
 * Meta (Facebook + Instagram) API helpers.
 *
 * Shared utilities for both Facebook and Instagram publishers:
 * - Long-lived token exchange
 * - Page + IG Business account discovery
 * - Page token extraction from PlatformConnection config
 * - Error handling with auth error detection
 *
 * Ported from standalone Relay repo, adapted for Daftar's PlatformConnection model.
 */

import { prisma } from "@/lib/prisma";

const META_GRAPH_URL = "https://graph.facebook.com/v19.0";

// ─── Token Management ────────────────────────────────────

/**
 * Exchange a short-lived User Token for a Long-Lived User Token (60 days).
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(
    `${META_GRAPH_URL}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        fb_exchange_token: shortLivedToken,
      })
  );

  if (!res.ok) {
    throw new Error(`Meta token exchange failed: ${await res.text()}`);
  }

  return res.json();
}

/**
 * Discover all Facebook Pages the user manages, including linked IG business accounts.
 * Returns page info + never-expiring page access tokens.
 */
export async function discoverPagesAndIG(
  userAccessToken: string
): Promise<
  Array<{
    pageId: string;
    pageName: string;
    pageImage: string;
    pageAccessToken: string;
    igAccount: {
      id: string;
      name: string;
      profilePicture: string;
    } | null;
  }>
> {
  const res = await fetch(
    `${META_GRAPH_URL}/me/accounts?fields=id,name,picture,access_token,instagram_business_account{id,name,profile_picture_url}&access_token=${userAccessToken}`
  );

  if (!res.ok) {
    throw new Error(`Meta page discovery failed: ${await res.text()}`);
  }

  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data || []).map((page: any) => ({
    pageId: page.id,
    pageName: page.name,
    pageImage: page.picture?.data?.url || "",
    pageAccessToken: page.access_token,
    igAccount: page.instagram_business_account
      ? {
          id: page.instagram_business_account.id,
          name: page.instagram_business_account.name || page.name,
          profilePicture:
            page.instagram_business_account.profile_picture_url || "",
        }
      : null,
  }));
}

// ─── Token Extraction ────────────────────────────────────

/**
 * Get the Meta page access token from a PlatformConnection's config JSON.
 *
 * During OAuth setup, the pageAccessToken should be stored in
 * PlatformConnection.config.pageAccessToken.
 * Page tokens derived from long-lived user tokens are never-expiring.
 */
export function getMetaPageToken(connection: {
  accessToken: string | null;
  config: unknown;
}): string {
  // First try config.pageAccessToken (preferred — never-expiring page token)
  const config = (connection.config ?? {}) as Record<string, unknown>;
  const pageToken = config.pageAccessToken as string | undefined;
  if (pageToken) return pageToken;

  // Fall back to the connection's accessToken (may be a short-lived user token)
  if (connection.accessToken) return connection.accessToken;

  throw new Error(
    "No Meta access token found. Re-authenticate via OAuth in Settings > Connections."
  );
}

// ─── Error Handling ──────────────────────────────────────

/**
 * Check a Meta Graph API response for auth errors (expired/revoked token).
 * If detected, marks the connection as inactive so the user knows to reconnect.
 * Returns the response body text for error reporting.
 */
export async function handleMetaApiError(
  res: Response,
  connectionId: string
): Promise<string> {
  const body = await res.text();

  // Meta returns error code 190 for expired/invalid OAuth tokens
  // and code 102 for API session expired
  if (res.status === 401 || res.status === 400) {
    try {
      const parsed = JSON.parse(body);
      const code = parsed?.error?.code;
      if (code === 190 || code === 102) {
        await prisma.platformConnection.update({
          where: { id: connectionId },
          data: { isActive: false },
        });
        console.warn(
          `[Meta] Token expired for connection ${connectionId} (error code ${code}). Marked inactive.`
        );
      }
    } catch {
      // Body wasn't JSON — still return it for error message
    }
  }

  return body;
}
