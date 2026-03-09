import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { getAnomalies } from "@/lib/khabri";
import type { AnomalySeverity } from "@/types/khabri";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const severity = req.nextUrl.searchParams.get("severity") as AnomalySeverity | null;

  try {
    const result = await getAnomalies(severity || undefined);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch anomalies";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
