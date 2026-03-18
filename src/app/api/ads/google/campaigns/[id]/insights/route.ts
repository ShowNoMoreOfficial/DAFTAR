/**
 * GET /api/ads/google/campaigns/[id]/insights — Campaign performance by date
 *
 * Query params:
 *   brandId (required)
 *   startDate (optional, YYYY-MM-DD, default: 7 days ago)
 *   endDate (optional, YYYY-MM-DD, default: today)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  GoogleAdsManager,
  createGoogleAdsManagerFromConnection,
} from "@/lib/ads/google-ads";
import { apiHandler } from "@/lib/api-handler";

/* eslint-disable @typescript-eslint/no-explicit-any */

function getManager(connection: any | null): GoogleAdsManager {
  if (connection) return createGoogleAdsManagerFromConnection(connection);
  return new GoogleAdsManager();
}

export const GET = apiHandler(async (req: NextRequest, { session, params }) => {
  const { id: campaignId } = params;
  const brandId = req.nextUrl.searchParams.get("brandId");
  const startDate = req.nextUrl.searchParams.get("startDate") ?? undefined;
  const endDate = req.nextUrl.searchParams.get("endDate") ?? undefined;

  if (!brandId) {
    return NextResponse.json(
      { error: "brandId is required" },
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
  const insights = await manager.getCampaignPerformance(
    campaignId,
    startDate,
    endDate,
  );

  return NextResponse.json({ campaignId, insights });
});
