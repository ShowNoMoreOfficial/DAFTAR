/**
 * GET /api/ads/meta/campaigns/[id]/insights — Fetch campaign performance insights
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMetaAdsManagerFromConnection } from "@/lib/ads/meta-ads";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (req: NextRequest, { session, params }) => {
  const { id: campaignId } = params;
  const brandId = req.nextUrl.searchParams.get("brandId");
  const datePreset = req.nextUrl.searchParams.get("datePreset") || "last_7d";

  if (!brandId) {
    return NextResponse.json(
      { error: "brandId is required" },
      { status: 400 },
    );
  }

  const validPresets = [
    "today",
    "yesterday",
    "last_3d",
    "last_7d",
    "last_14d",
    "last_28d",
    "last_30d",
    "last_90d",
    "this_month",
    "last_month",
  ];
  if (!validPresets.includes(datePreset)) {
    return NextResponse.json(
      { error: `Invalid datePreset. Must be one of: ${validPresets.join(", ")}` },
      { status: 400 },
    );
  }

  const connection = await prisma.platformConnection.findFirst({
    where: {
      brandId,
      platform: { in: ["facebook", "meta_ads"] },
      isActive: true,
    },
  });

  if (!connection) {
    return NextResponse.json(
      { error: "No active Meta connection found." },
      { status: 404 },
    );
  }

  const manager = createMetaAdsManagerFromConnection(connection);
  const insights = await manager.getCampaignInsights(campaignId, datePreset);

  return NextResponse.json({
    campaignId,
    datePreset,
    insights,
  });
});
