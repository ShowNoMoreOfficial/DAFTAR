import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { processAutoAdvance, processEscalations } from "@/lib/workflow-engine";

// POST /api/workflows/process — Run workflow engine (auto-advance + escalations)
// Can be called by cron job or admin manually
export async function POST() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [advancedCount, escalationCount] = await Promise.all([
    processAutoAdvance(),
    processEscalations(),
  ]);

  return NextResponse.json({
    success: true,
    advancedCount,
    escalationCount,
    processedAt: new Date().toISOString(),
  });
}
