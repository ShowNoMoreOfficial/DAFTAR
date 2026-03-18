/**
 * GET /api/ads/google/campaigns/[id]/insights — Campaign performance by date
 *
 * Query params:
 *   brandId (required)
 *   startDate (optional, YYYY-MM-DD, default: 7 days ago)
 *   endDate (optional, YYYY-MM-DD, default: today)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import {
  GoogleAdsManager,
  createGoogleAdsManagerFromConnection,
} from "@/lib/ads/google-ads";

/* eslint-disable @typescript-eslint/no-explicit-any */

function getManager(connection: any | null): GoogleAdsManager {
  if (connection) return createGoogleAdsManagerFromConnection(connection);
  return new GoogleAdsManager();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;
  const brandId = req.nextUrl.searchParams.get("brandId");
  const startDate = req.nextUrl.searchParams.get("startDate") ?? undefined;
  const endDate = req.nextUrl.searchParams.get("endDate") ?? undefined;

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
    const insights = await manager.getCampaignPerformance(
      campaignId,
      startDate,
      endDate,
    );

    return NextResponse.json({ campaignId, insights });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Google Ads] GET insights error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
