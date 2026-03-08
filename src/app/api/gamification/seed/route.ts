import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { seedAchievements } from "@/lib/gamification";

export async function POST() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "ADMIN") return unauthorized();

  await seedAchievements();
  return NextResponse.json({ ok: true, message: "Achievements seeded" });
}
