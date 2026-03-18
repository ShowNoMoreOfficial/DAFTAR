import { NextResponse } from "next/server";
import { forbidden } from "@/lib/api-utils";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import { apiHandler } from "@/lib/api-handler";

// POST /api/skills/sync — Scan /skills/ directory and sync all skill files to DB
export const POST = apiHandler(async (_req, { session }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const result = await skillOrchestrator.syncSkillsToDb();

  return NextResponse.json({
    message: `Synced ${result.synced} skills`,
    synced: result.synced,
    errors: result.errors,
  });
});
