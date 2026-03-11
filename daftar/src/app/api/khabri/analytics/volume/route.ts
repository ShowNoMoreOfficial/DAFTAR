import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getSignalVolume } from "@/lib/khabri";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const hours = Number(searchParams.get("hours")) || 24;
  const interval = (searchParams.get("interval") || "hour") as "hour" | "day";
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Try local DB: compute volume timeline from signals
  try {
    const signals = await prisma.signal.findMany({
      where: { detectedAt: { gte: cutoff } },
      select: { detectedAt: true },
      orderBy: { detectedAt: "asc" },
    });

    if (signals.length > 0) {
      const buckets = new Map<string, number>();

      for (const s of signals) {
        const d = new Date(s.detectedAt);
        let key: string;
        if (interval === "day") {
          key = d.toISOString().slice(0, 10) + "T00:00:00.000Z";
        } else {
          d.setMinutes(0, 0, 0);
          key = d.toISOString();
        }
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }

      const data = [...buckets.entries()].map(([timestamp, count]) => ({
        timestamp,
        count,
      }));

      return NextResponse.json({
        data,
        meta: { total: data.length, page: 1, pageSize: data.length, hasMore: false, source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local volume query failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getSignalVolume(hours, interval);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch signal volume";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
