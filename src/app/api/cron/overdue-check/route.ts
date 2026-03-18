import { NextResponse } from "next/server";
import { checkOverdueTasks } from "@/lib/notifications";
import { apiHandler } from "@/lib/api-handler";

// GET /api/cron/overdue-check
// Call via external cron service (e.g., Vercel Cron, GitHub Actions)
export const GET = apiHandler(async () => {
  const result = await checkOverdueTasks();

  return NextResponse.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
}, { requireCronSecret: true });
