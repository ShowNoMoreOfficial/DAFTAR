import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { getSentimentAnalysis } from "@/lib/khabri";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const hours = Number(searchParams.get("hours")) || 24;
  const interval = (searchParams.get("interval") || "hour") as "hour" | "day";

  try {
    const result = await getSentimentAnalysis(hours, interval);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch sentiment analysis";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
