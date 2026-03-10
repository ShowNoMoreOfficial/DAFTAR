import { NextResponse } from "next/server";
import { getAuthSession, unauthorized, forbidden } from "@/lib/api-utils";
import { skillOrchestrator } from "@/lib/skill-orchestrator";

// POST /api/skills/sync — Scan /skills/ directory and sync all skill files to DB
export async function POST() {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const result = await skillOrchestrator.syncSkillsToDb();

  return NextResponse.json({
    message: `Synced ${result.synced} skills`,
    synced: result.synced,
    errors: result.errors,
  });
}
