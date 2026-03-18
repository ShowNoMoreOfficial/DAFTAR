/**
 * GET /api/ads/meta/account — Get Meta Ads account info + summary insights
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { createMetaAdsManagerFromConnection } from "@/lib/ads/meta-ads";

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
            "No active Meta Ads connection found. Connect via Publishing > Connections and set your Ad Account ID.",
        },
        { status: 404 },
      );
    }

    const manager = createMetaAdsManagerFromConnection(connection);

    const [accountInfo, insights] = await Promise.all([
      manager.getAccountInfo().catch(() => null),
      manager.getAccountInsights("last_30d").catch(() => []),
    ]);

    return NextResponse.json({
      account: accountInfo
        ? {
            id: accountInfo._data?.id ?? accountInfo.id,
            name: accountInfo._data?.name ?? accountInfo.name,
            status:
              accountInfo._data?.account_status ?? accountInfo.account_status,
            currency:
              accountInfo._data?.currency ?? accountInfo.currency,
            timezone:
              accountInfo._data?.timezone_name ?? accountInfo.timezone_name,
            amountSpent:
              accountInfo._data?.amount_spent ?? accountInfo.amount_spent,
            balance: accountInfo._data?.balance ?? accountInfo.balance,
          }
        : null,
      insights,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Meta Ads] GET account error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
