import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

// GET /api/signals/velocity — Real-time velocity rankings
export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const hours = Math.min(72, parseInt(searchParams.get("hours") ?? "24"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Get active trends with signal counts in the time window
  const trends = await prisma.trend.findMany({
    where: {
      signals: { some: { detectedAt: { gte: since } } },
    },
    include: {
      _count: {
        select: { signals: true },
      },
      signals: {
        where: { detectedAt: { gte: since } },
        select: { detectedAt: true },
        orderBy: { detectedAt: "desc" },
      },
    },
    orderBy: { velocityScore: "desc" },
    take: limit,
  });

  // Calculate velocity metrics
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const threeHoursAgo = now - 3 * 60 * 60 * 1000;

  const velocityRankings = trends
    .map((trend) => {
      const signalTimes = trend.signals.map((s) => s.detectedAt.getTime());
      const signalsLastHour = signalTimes.filter((t) => t >= oneHourAgo).length;
      const signalsLast3h = signalTimes.filter((t) => t >= threeHoursAgo).length;
      const signalsInWindow = trend.signals.length;
      const avgPerHour = signalsInWindow / hours;

      // Velocity = signals in last hour relative to average
      const velocity = avgPerHour > 0 ? signalsLastHour / avgPerHour : signalsLastHour;

      let velocityCategory: string;
      if (signalsLastHour === 0 && signalsLast3h === 0) velocityCategory = "dormant";
      else if (velocity < 2) velocityCategory = "low";
      else if (velocity < 5) velocityCategory = "moderate";
      else if (velocity < 10) velocityCategory = "high";
      else velocityCategory = "spike";

      // Acceleration: compare last hour vs previous 2 hours average
      const prev2hAvg = (signalsLast3h - signalsLastHour) / 2;
      let acceleration: string;
      if (signalsLastHour > prev2hAvg * 1.3) acceleration = "accelerating";
      else if (signalsLastHour < prev2hAvg * 0.7) acceleration = "decelerating";
      else if (signalsLastHour === 0 && prev2hAvg === 0) acceleration = "stalled";
      else acceleration = "steady";

      return {
        trendId: trend.id,
        name: trend.name,
        lifecycle: trend.lifecycle,
        velocity: Math.round(velocity * 100) / 100,
        velocityCategory,
        acceleration,
        signalsLastHour,
        signalsLast3h,
        signalsInWindow: signalsInWindow,
        totalSignals: trend._count.signals,
        avgPerHour: Math.round(avgPerHour * 100) / 100,
      };
    })
    .sort((a, b) => b.velocity - a.velocity);

  return NextResponse.json({
    data: velocityRankings,
    meta: { hours, since: since.toISOString(), measuredAt: new Date().toISOString() },
  });
});
