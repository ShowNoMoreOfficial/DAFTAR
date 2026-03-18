import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getGeoHotspots } from "@/lib/khabri";

export const GET = apiHandler(async (req: NextRequest) => {
  const hours = Number(req.nextUrl.searchParams.get("hours")) || 24;
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 10;

  try {
    const result = await getGeoHotspots(hours, limit);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch geo hotspots";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
