import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/api-utils";
import { getSentimentAnalysis } from "@/lib/khabri";

export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const hours = Number(searchParams.get("hours")) || 24;
  const interval = (searchParams.get("interval") || "hour") as "hour" | "day";
  const source = searchParams.get("source"); // "external" | "local" | null (both)

  try {
    // External: Khabri API sentiment timeline
    const external = source !== "local" ? await getSentimentAnalysis(hours, interval).catch(() => null) : null;

    // Local: aggregated sentiment from stored signals
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const localSignals = source !== "external"
      ? await prisma.signal.groupBy({
          by: ["sentiment"],
          where: {
            detectedAt: { gte: cutoff },
            sentiment: { not: null },
          },
          _count: { id: true },
        })
      : null;

    const localBreakdown = localSignals
      ? Object.fromEntries(localSignals.map((s) => [s.sentiment, s._count.id]))
      : null;

    return NextResponse.json({
      external,
      local: localBreakdown,
      hours,
      interval,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch sentiment analysis";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});

// PATCH — Update sentiment for a specific signal (editorial override)
export const PATCH = apiHandler(async (req: NextRequest) => {
  const { signalId, sentiment } = await req.json();
  if (!signalId) return badRequest("signalId is required");
  if (!sentiment || !["positive", "negative", "neutral", "mixed"].includes(sentiment)) {
    return badRequest("sentiment must be one of: positive, negative, neutral, mixed");
  }

  const updated = await prisma.signal.update({
    where: { id: signalId },
    data: { sentiment },
    select: { id: true, title: true, sentiment: true },
  });

  return NextResponse.json(updated);
});
