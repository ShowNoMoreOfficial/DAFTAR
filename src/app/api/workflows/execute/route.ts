import { NextRequest, NextResponse } from "next/server";
import { badRequest } from "@/lib/api-utils";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import { runLearningCycle } from "@/lib/learning-loop";
import { daftarEvents } from "@/lib/event-bus";
import { apiHandler } from "@/lib/api-handler";

// POST /api/workflows/execute — Execute a named workflow
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { workflow, params: workflowParams } = body;

  if (!workflow) {
    return badRequest("workflow name is required");
  }

  const startTime = Date.now();

  daftarEvents.emitEvent("workflow.started", {
    workflow,
    triggeredBy: session.user.id,
  });

  let result: Record<string, unknown>;

  switch (workflow) {
    case "monthly-learning-cycle": {
      const periodStart = workflowParams?.periodStart
        ? new Date(workflowParams.periodStart)
        : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      const periodEnd = workflowParams?.periodEnd
        ? new Date(workflowParams.periodEnd)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 0);

      const cycleResult = await runLearningCycle(periodStart, periodEnd);
      result = cycleResult as unknown as Record<string, unknown>;
      break;
    }

    case "skill-chain": {
      if (!workflowParams?.skillPaths || !Array.isArray(workflowParams.skillPaths)) {
        return badRequest("skillPaths array required for skill-chain workflow");
      }
      const chainResult = await skillOrchestrator.executeChain({
        skillPaths: workflowParams.skillPaths,
        context: workflowParams.context || {},
        brandId: workflowParams.brandId,
        platform: workflowParams.platform,
      });
      result = chainResult as unknown as Record<string, unknown>;
      break;
    }

    default:
      return badRequest(`Unknown workflow: ${workflow}`);
  }

  const duration = Date.now() - startTime;

  daftarEvents.emitEvent("workflow.completed", {
    workflow,
    durationMs: duration,
    triggeredBy: session.user.id,
  });

  return NextResponse.json({
    workflow,
    durationMs: duration,
    result,
  });
});
