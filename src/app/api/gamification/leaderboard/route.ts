import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { getLeaderboard } from "@/lib/gamification";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const leaderboard = await getLeaderboard(20);
  return NextResponse.json(leaderboard);
}
