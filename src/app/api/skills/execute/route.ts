import { NextRequest, NextResponse } from "next/server";
import {
  getAuthSession,
  unauthorized,
  forbidden,
  badRequest,
} from "@/lib/api-utils";
import { skillOrchestrator } from "@/lib/skill-orchestrator";

// POST /api/skills/execute — Execute a skill or skill chain (for testing)
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const body = await req.json();
  const { skillPath, skillPaths, context, model, brandId, platform } = body;

  // Chain execution
  if (skillPaths && Array.isArray(skillPaths)) {
    const result = await skillOrchestrator.executeChain({
      skillPaths,
      context: context ?? {},
      model,
      executedById: session.user.id,
      brandId,
      platform,
    });
    return NextResponse.json(result);
  }

  // Single skill execution
  if (!skillPath) return badRequest("skillPath is required");

  const result = await skillOrchestrator.executeSkill({
    skillPath,
    context: context ?? {},
    model,
    executedById: session.user.id,
    brandId,
    platform,
  });

  return NextResponse.json(result);
}
