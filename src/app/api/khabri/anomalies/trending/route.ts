import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { getTrendingAnomalies } from "@/lib/khabri";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  try {
    const result = await getTrendingAnomalies();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch trending anomalies";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
