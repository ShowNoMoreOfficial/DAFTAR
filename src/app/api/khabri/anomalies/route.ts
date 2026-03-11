import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAnomalies } from "@/lib/khabri";
import type { AnomalySeverity } from "@/types/khabri";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const severity = req.nextUrl.searchParams.get("severity") as AnomalySeverity | null;

  // Try local: detect anomalies from signal volume spikes
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [recentCount, weeklyAvg] = await Promise.all([
      prisma.signal.count({ where: { detectedAt: { gte: dayAgo } } }),
      prisma.signal.count({ where: { detectedAt: { gte: weekAgo } } }),
    ]);

    const dailyAvg = weeklyAvg / 7;
    const anomalies = [];

    if (dailyAvg > 0 && recentCount > dailyAvg * 2) {
      const spikeSeverity = recentCount > dailyAvg * 4 ? "CRITICAL" : recentCount > dailyAvg * 3 ? "HIGH" : "ELEVATED";
      if (!severity || severity === spikeSeverity) {
        anomalies.push({
          id: `local-volume-spike-${now.toISOString().slice(0, 10)}`,
          type: "KEYWORD_SPIKE",
          severity: spikeSeverity,
          subject: "Signal Volume Spike",
          description: `${recentCount} signals in last 24h vs ${Math.round(dailyAvg)} daily average`,
          deviation: recentCount / dailyAvg,
          baseline: Math.round(dailyAvg),
          current: recentCount,
          detectedAt: now.toISOString(),
        });
      }
    }

    if (anomalies.length > 0) {
      return NextResponse.json({
        data: anomalies,
        meta: { total: anomalies.length, page: 1, pageSize: 25, hasMore: false, source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local anomaly detection failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getAnomalies(severity || undefined);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch anomalies";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
