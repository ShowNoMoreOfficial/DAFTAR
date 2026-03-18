/**
 * POST /api/ads/meta/campaigns — Create a new Meta Ads campaign
 * GET  /api/ads/meta/campaigns — List campaigns for a brand
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import {
  createMetaAdsManagerFromConnection,
  type CampaignObjective,
} from "@/lib/ads/meta-ads";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
        platform: { in: ["facebook", "meta_ads"] },
        isActive: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        {
          error:
            "No active Meta connection found. Connect via Publishing > Connections.",
        },
        { status: 404 },
      );
    }

    const manager = createMetaAdsManagerFromConnection(connection);
    const campaigns = await manager.getCampaigns();

    return NextResponse.json({
      campaigns: campaigns.map((c: any) => ({
        id: c.id,
        name: c._data?.name ?? c.name,
        objective: c._data?.objective ?? c.objective,
        status: c._data?.status ?? c.status,
        dailyBudget: c._data?.daily_budget ?? c.daily_budget,
        createdTime: c._data?.created_time ?? c.created_time,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Meta Ads] GET campaigns error:", msg);
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
    const { brandId, name, objective, dailyBudgetCents, status } = body as {
      brandId: string;
      name: string;
      objective: CampaignObjective;
      dailyBudgetCents: number;
      status?: "PAUSED" | "ACTIVE";
    };

    if (!brandId || !name || !objective || !dailyBudgetCents) {
      return NextResponse.json(
        {
          error:
            "brandId, name, objective, and dailyBudgetCents are required",
        },
        { status: 400 },
      );
    }

    const validObjectives: CampaignObjective[] = [
      "OUTCOME_AWARENESS",
      "OUTCOME_ENGAGEMENT",
      "OUTCOME_TRAFFIC",
      "OUTCOME_LEADS",
      "OUTCOME_SALES",
    ];
    if (!validObjectives.includes(objective)) {
      return NextResponse.json(
        {
          error: `Invalid objective. Must be one of: ${validObjectives.join(", ")}`,
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
        {
          error:
            "No active Meta connection found. Connect via Publishing > Connections.",
        },
        { status: 404 },
      );
    }

    const manager = createMetaAdsManagerFromConnection(connection);
    const campaign = await manager.createCampaign({
      name,
      objective,
      dailyBudgetCents,
      status: status || "PAUSED",
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id || campaign._data?.id,
      name,
      objective,
      status: status || "PAUSED",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Meta Ads] POST campaign error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
