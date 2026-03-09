import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { getGeoHotspots } from "@/lib/khabri";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const hours = Number(req.nextUrl.searchParams.get("hours")) || 24;
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 10;

  try {
    const result = await getGeoHotspots(hours, limit);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch geo hotspots";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
