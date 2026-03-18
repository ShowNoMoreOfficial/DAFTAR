/**
 * GET   /api/ads/google/campaigns/[id] — Get campaign performance summary
 * PATCH /api/ads/google/campaigns/[id] — Update campaign status (pause/resume)
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
    const insights = await manager.getCampaignPerformance(campaignId);

    return NextResponse.json({ campaignId, insights });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Google Ads] GET campaign detail error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can modify campaigns" },
      { status: 403 },
    );
  }

  const { id: campaignId } = await params;

  try {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Google Ads] PATCH campaign error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
