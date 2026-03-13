import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/api-utils";
import { setOAuthStateCookie } from "@/lib/relay/oauth-state";
import {
  getTwitterAuthUrl,
  getYouTubeAuthUrl,
  getLinkedInAuthUrl,
  getInstagramAuthUrl,
  getFacebookAuthUrl,
  generateOAuthState,
  generateCodeVerifier,
  generateCodeChallenge,
} from "@/lib/relay/oauth-helpers";

const VALID_PLATFORMS = ["x", "youtube", "linkedin", "instagram", "facebook"];

/**
 * GET /api/relay/oauth/[platform]?brandId=xxx
 *
 * Initiates the OAuth flow for a social media platform.
 * ADMIN only. Generates CSRF state, stores in cookie, redirects to provider.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can connect platforms" }, { status: 403 });
  }

  const { platform } = await params;
  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { error: `Invalid platform: ${platform}. Must be one of: ${VALID_PLATFORMS.join(", ")}` },
      { status: 400 }
    );
  }

  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) {
    return NextResponse.json({ error: "brandId is required" }, { status: 400 });
  }

  // Verify brand exists
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  // Generate CSRF state
  const state = generateOAuthState();
  let codeVerifier: string | undefined;

  // Build the auth URL
  let authUrl: string;

  switch (platform) {
    case "x": {
      codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      authUrl = getTwitterAuthUrl(state, codeChallenge);
      break;
    }
    case "youtube":
      authUrl = getYouTubeAuthUrl(state);
      break;
    case "linkedin":
      authUrl = getLinkedInAuthUrl(state);
      break;
    case "instagram":
      authUrl = getInstagramAuthUrl(state);
      break;
    case "facebook":
      authUrl = getFacebookAuthUrl(state);
      break;
    default:
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  // Store state in cookie for CSRF validation in callback
  await setOAuthStateCookie({
    state,
    codeVerifier,
    brandId,
    platform,
  });

  return NextResponse.redirect(authUrl);
}
