import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

/**
 * GET /api/pipeline/runs
 * Lists active pipeline runs (tasks created by the pipeline, prefixed with [Pipeline])
 */
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const pipelineTasks = await prisma.task.findMany({
    where: {
      title: { startsWith: "[Pipeline]" },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      brand: { select: { name: true } },
    },
  });

  const runs = pipelineTasks.map((t) => {
    // Derive stage from task status
    let stage = "pending";
    switch (t.status) {
      case "TODO": stage = "pending"; break;
      case "IN_PROGRESS": stage = "researching"; break;
      case "REVIEW": stage = "review"; break;
      case "DONE": stage = "approved"; break;
      default: stage = "pending";
    }

    // Extract signal title from task title
    const signalTitle = t.title.replace("[Pipeline] ", "").split(" \u2014 ")[0];

    return {
      id: t.id,
      signalTitle,
      brandName: t.brand?.name || "Unknown",
      status: stage,
      startedAt: t.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ runs });
}
