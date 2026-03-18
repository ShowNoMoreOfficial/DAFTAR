import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAndClearOAuthStateCookie } from "@/lib/relay/oauth-state";
import {
  exchangeTwitterCode,
  exchangeYouTubeCode,
  exchangeLinkedInCode,
  exchangeInstagramCode,
  exchangeFacebookCode,
} from "@/lib/relay/oauth-helpers";
import { exchangeForLongLivedToken, discoverPagesAndIG } from "@/lib/relay/meta";

const BASE_URL = process.env.NEXTAUTH_URL || "https://daftar-one.vercel.app";

/**
 * GET /api/relay/oauth/[platform]/callback?code=xxx&state=yyy
 *
 * OAuth callback handler for all platforms. Exchanges the authorization code
 * for tokens, fetches account info, and upserts a PlatformConnection.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const errorDescription = req.nextUrl.searchParams.get("error_description");

  // Handle provider-side errors
  if (error) {
    const msg = errorDescription || error;
    return NextResponse.redirect(
      `${BASE_URL}/relay/connections?error=${encodeURIComponent(msg)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${BASE_URL}/relay/connections?error=${encodeURIComponent("Missing code or state parameter")}`
    );
  }

  // Validate CSRF state against cookie
  const oauthState = await getAndClearOAuthStateCookie(state);
  if (!oauthState) {
    return NextResponse.redirect(
      `${BASE_URL}/relay/connections?error=${encodeURIComponent("Invalid or expired OAuth state. Please try again.")}`
    );
  }

  const { brandId } = oauthState;

  try {
    switch (platform) {
      case "x":
        await handleTwitterCallback(code, oauthState.codeVerifier!, brandId);
        break;
      case "youtube":
        await handleYouTubeCallback(code, brandId);
        break;
      case "linkedin":
        await handleLinkedInCallback(code, brandId);
        break;
      case "instagram":
        await handleInstagramCallback(code, brandId);
        break;
      case "facebook":
        await handleFacebookCallback(code, brandId);
        break;
      default:
        return NextResponse.redirect(
          `${BASE_URL}/relay/connections?error=${encodeURIComponent("Unsupported platform")}`
        );
    }

    return NextResponse.redirect(
      `${BASE_URL}/relay/connections?connected=${platform}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[OAuth Callback] ${platform} error:`, msg);
    return NextResponse.redirect(
      `${BASE_URL}/relay/connections?error=${encodeURIComponent(
        `Connection failed: ${msg}`
      )}`
    );
  }
}

// ─── Platform-specific handlers ─────────────────────────

async function handleTwitterCallback(code: string, codeVerifier: string, brandId: string) {
  const tokens = await exchangeTwitterCode(code, codeVerifier);

  // Fetch user info
  const userRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userData = await userRes.json();
  const user = userData.data;

  await prisma.platformConnection.upsert({
    where: { brandId_platform: { brandId, platform: "x" } },
    create: {
      brandId,
      platform: "x",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      accountId: user?.id || null,
      accountName: user?.username ? `@${user.username}` : null,
      isActive: true,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      accountId: user?.id || null,
      accountName: user?.username ? `@${user.username}` : null,
      isActive: true,
      connectedAt: new Date(),
    },
  });
}

async function handleYouTubeCallback(code: string, brandId: string) {
  const tokens = await exchangeYouTubeCode(code);

  // Fetch channel info
  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];

  await prisma.platformConnection.upsert({
    where: { brandId_platform: { brandId, platform: "youtube" } },
    create: {
      brandId,
      platform: "youtube",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      accountId: channel?.id || null,
      accountName: channel?.snippet?.title || null,
      isActive: true,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      accountId: channel?.id || null,
      accountName: channel?.snippet?.title || null,
      isActive: true,
      connectedAt: new Date(),
    },
  });
}

async function handleLinkedInCallback(code: string, brandId: string) {
  const tokens = await exchangeLinkedInCode(code);

  // Fetch profile info
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileRes.json();

  await prisma.platformConnection.upsert({
    where: { brandId_platform: { brandId, platform: "linkedin" } },
    create: {
      brandId,
      platform: "linkedin",
      accessToken: tokens.access_token,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      accountId: profile.sub || null,
      accountName: profile.name || null,
      isActive: true,
      config: { type: "person" },
    },
    update: {
      accessToken: tokens.access_token,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      accountId: profile.sub || null,
      accountName: profile.name || null,
      isActive: true,
      config: { type: "person" },
      connectedAt: new Date(),
    },
  });
}

async function handleInstagramCallback(code: string, brandId: string) {
  // Step 1: Exchange code for short-lived token
  const shortLived = await exchangeInstagramCode(code);

  // Step 2: Exchange for long-lived token (60 days)
  const longLived = await exchangeForLongLivedToken(shortLived.access_token);

  // Step 3: Discover pages + IG business accounts
  const pages = await discoverPagesAndIG(longLived.access_token);

  // Find the first page with an IG business account
  const pageWithIG = pages.find((p) => p.igAccount !== null);
  if (!pageWithIG) {
    throw new Error(
      "No Instagram Business account found. Ensure your Facebook Page is linked to an Instagram Business account."
    );
  }

  await prisma.platformConnection.upsert({
    where: { brandId_platform: { brandId, platform: "instagram" } },
    create: {
      brandId,
      platform: "instagram",
      accessToken: longLived.access_token,
      tokenExpiresAt: new Date(Date.now() + longLived.expires_in * 1000),
      accountId: pageWithIG.igAccount!.id,
      accountName: pageWithIG.igAccount!.name,
      isActive: true,
      config: {
        pageAccessToken: pageWithIG.pageAccessToken,
        pageId: pageWithIG.pageId,
        pageName: pageWithIG.pageName,
      },
    },
    update: {
      accessToken: longLived.access_token,
      tokenExpiresAt: new Date(Date.now() + longLived.expires_in * 1000),
      accountId: pageWithIG.igAccount!.id,
      accountName: pageWithIG.igAccount!.name,
      isActive: true,
      config: {
        pageAccessToken: pageWithIG.pageAccessToken,
        pageId: pageWithIG.pageId,
        pageName: pageWithIG.pageName,
      },
      connectedAt: new Date(),
    },
  });
}

async function handleFacebookCallback(code: string, brandId: string) {
  // Step 1: Exchange code for short-lived token
  const shortLived = await exchangeFacebookCode(code);

  // Step 2: Exchange for long-lived token (60 days)
  const longLived = await exchangeForLongLivedToken(shortLived.access_token);

  // Step 3: Discover managed pages
  const pages = await discoverPagesAndIG(longLived.access_token);

  if (pages.length === 0) {
    throw new Error(
      "No Facebook Pages found. Ensure your Facebook account manages at least one Page."
    );
  }

  // Auto-select first page (v1 approach)
  const page = pages[0];

  await prisma.platformConnection.upsert({
    where: { brandId_platform: { brandId, platform: "facebook" } },
    create: {
      brandId,
      platform: "facebook",
      accessToken: longLived.access_token,
      tokenExpiresAt: new Date(Date.now() + longLived.expires_in * 1000),
      accountId: page.pageId,
      accountName: page.pageName,
      isActive: true,
      config: {
        pageAccessToken: page.pageAccessToken,
        pageId: page.pageId,
        pageName: page.pageName,
      },
    },
    update: {
      accessToken: longLived.access_token,
      tokenExpiresAt: new Date(Date.now() + longLived.expires_in * 1000),
      accountId: page.pageId,
      accountName: page.pageName,
      isActive: true,
      config: {
        pageAccessToken: page.pageAccessToken,
        pageId: page.pageId,
        pageName: page.pageName,
      },
      connectedAt: new Date(),
    },
  });
}
