/**
 * GET  /api/ads/google/campaigns — List Google Ads campaigns for a brand
 * POST /api/ads/google/campaigns — Create a YouTube or Search campaign
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import {
  GoogleAdsManager,
  createGoogleAdsManagerFromConnection,
  type GoogleAdsCampaignType,
} from "@/lib/ads/google-ads";

/* eslint-disable @typescript-eslint/no-explicit-any */

function getManager(connection: any | null): GoogleAdsManager {
  if (connection) return createGoogleAdsManagerFromConnection(connection);
  return new GoogleAdsManager();
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) {
    return NextResponse.json(
      { error: "brandId is required" },
      { status: 400 },
    );
  }

  try {
    const connection = await prisma.platformConnection.findFirst({
      where: {
        brandId,
        platform: "google_ads",
        isActive: true,
      },
    });

    const manager = getManager(connection);
    const campaigns = await manager.getCampaigns();

    return NextResponse.json({ campaigns });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Google Ads] GET campaigns error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can create campaigns" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const {
      brandId,
      name,
      type,
      dailyBudgetMicros,
      startDate,
      endDate,
      status,
      videoId,
      keywords,
      targeting,
    } = body as {
      brandId: string;
      name: string;
      type: GoogleAdsCampaignType;
      dailyBudgetMicros: number;
      startDate: string;
      endDate?: string;
      status?: "PAUSED" | "ENABLED";
      videoId?: string;
      keywords?: string[];
      targeting?: any;
    };

    if (!brandId || !name || !type || !dailyBudgetMicros || !startDate) {
      return NextResponse.json(
        {
          error:
            "brandId, name, type, dailyBudgetMicros, and startDate are required",
        },
        { status: 400 },
      );
    }

    const validTypes: GoogleAdsCampaignType[] = ["YOUTUBE", "SEARCH"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 },
      );
    }

    const connection = await prisma.platformConnection.findFirst({
      where: {
        brandId,
        platform: "google_ads",
        isActive: true,
      },
    });

    const manager = getManager(connection);
    const config = {
      name,
      type,
      dailyBudgetMicros,
      startDate,
      endDate,
      status: status || "PAUSED",
      videoId,
      keywords,
      targeting,
    };

    const campaignId =
      type === "YOUTUBE"
        ? await manager.createYouTubeAdCampaign(config)
        : await manager.createSearchCampaign(config);

    return NextResponse.json({
      success: true,
      campaignId,
      name,
      type,
      status: status || "PAUSED",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Google Ads] POST campaign error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
