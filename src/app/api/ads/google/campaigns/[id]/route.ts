/**
 * GET   /api/ads/google/campaigns/[id] — Get campaign performance summary
 * PATCH /api/ads/google/campaigns/[id] — Update campaign status (pause/resume)
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
  const insights = await manager.getCampaignPerformance(campaignId);

  return NextResponse.json({ campaignId, insights });
});

export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can modify campaigns" },
      { status: 403 },
    );
  }

  const { id: campaignId } = params;

  const body = await req.json();
  const { brandId, status } = body as {
    brandId: string;
    status: "PAUSED" | "ENABLED" | "REMOVED";
  };

  if (!brandId || !status) {
    return NextResponse.json(
      { error: "brandId and status are required" },
      { status: 400 },
    );
  }

  const validStatuses = ["PAUSED", "ENABLED", "REMOVED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      {
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      },
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

  if (status === "PAUSED") {
    await manager.pauseCampaign(campaignId);
  } else if (status === "ENABLED") {
    await manager.resumeCampaign(campaignId);
  }

  return NextResponse.json({
    success: true,
    campaignId,
    status,
  });
});
