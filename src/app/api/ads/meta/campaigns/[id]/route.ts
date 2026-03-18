/**
 * GET    /api/ads/meta/campaigns/[id] — Get campaign details + ad sets
 * PATCH  /api/ads/meta/campaigns/[id] — Update campaign status
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMetaAdsManagerFromConnection } from "@/lib/ads/meta-ads";
import { apiHandler } from "@/lib/api-handler";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
  const adSets = await manager.getAdSets(campaignId);

  return NextResponse.json({
    campaignId,
    adSets: adSets.map((s: any) => ({
      id: s.id,
      name: s._data?.name ?? s.name,
      status: s._data?.status ?? s.status,
      dailyBudget: s._data?.daily_budget ?? s.daily_budget,
      optimizationGoal:
        s._data?.optimization_goal ?? s.optimization_goal,
      startTime: s._data?.start_time ?? s.start_time,
      endTime: s._data?.end_time ?? s.end_time,
    })),
  });
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
    status: "PAUSED" | "ACTIVE" | "DELETED";
  };

  if (!brandId || !status) {
    return NextResponse.json(
      { error: "brandId and status are required" },
      { status: 400 },
    );
  }

  const validStatuses = ["PAUSED", "ACTIVE", "DELETED"];
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
  await manager.updateCampaignStatus(campaignId, status);

  return NextResponse.json({
    success: true,
    campaignId,
    status,
  });
});
