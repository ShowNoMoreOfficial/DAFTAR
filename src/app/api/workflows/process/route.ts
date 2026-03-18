import { NextResponse } from "next/server";
import { processAutoAdvance, processEscalations } from "@/lib/workflow-engine";
import { apiHandler } from "@/lib/api-handler";

// POST /api/workflows/process — Run workflow engine (auto-advance + escalations)
// Can be called by cron job or admin manually
export const POST = apiHandler(async (_req, { session }) => {
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
});
