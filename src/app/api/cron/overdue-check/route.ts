import { NextRequest, NextResponse } from "next/server";
import { checkOverdueTasks } from "@/lib/notifications";

// GET /api/cron/overdue-check
// Call via external cron service (e.g., Vercel Cron, GitHub Actions)
// Protect with a shared secret in production
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkOverdueTasks();

  return NextResponse.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
}
