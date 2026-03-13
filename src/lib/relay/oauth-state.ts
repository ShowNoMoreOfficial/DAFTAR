/**
 * OAuth state management via httpOnly cookies.
 *
 * Stores the CSRF state + PKCE verifier + brandId during the OAuth redirect
 * round-trip. The cookie lives for 10 minutes max and is cleared on callback.
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "relay_oauth_state";

export interface OAuthStatePayload {
  state: string;
  codeVerifier?: string; // Only for Twitter (PKCE)
  brandId: string;
  platform: string;
}

/** Store OAuth state in an httpOnly cookie before redirecting to the provider. */
export async function setOAuthStateCookie(payload: OAuthStatePayload): Promise<void> {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/relay/oauth",
    maxAge: 600, // 10 minutes
  });
}

/**
 * Read and clear the OAuth state cookie.
 * Validates the state parameter matches to prevent CSRF.
 * Returns null if cookie is missing or state doesn't match.
 */
export async function getAndClearOAuthStateCookie(
  expectedState: string
): Promise<OAuthStatePayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;

  if (!raw) return null;

  // Clear immediately — single use
  cookieStore.delete(COOKIE_NAME);

  try {
    const payload = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf-8")
    ) as OAuthStatePayload;

    // CSRF validation
    if (payload.state !== expectedState) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
