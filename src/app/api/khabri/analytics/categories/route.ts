import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { getCategoryDistribution } from "@/lib/khabri";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const hours = Number(req.nextUrl.searchParams.get("hours")) || 24;

  try {
    const result = await getCategoryDistribution(hours);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Khabri] analytics/categories error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch category distribution";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
