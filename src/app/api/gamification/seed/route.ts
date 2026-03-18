import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { seedAchievements } from "@/lib/gamification";

export const POST = apiHandler(async (_req, { session }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await seedAchievements();
  return NextResponse.json({ ok: true, message: "Achievements seeded" });
});
