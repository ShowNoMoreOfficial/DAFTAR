import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { getTopTrends } from "@/lib/khabri";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const limit = Number(req.nextUrl.searchParams.get("limit")) || 10;

  try {
    const result = await getTopTrends(limit);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Khabri] trends/top error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch top trends";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
