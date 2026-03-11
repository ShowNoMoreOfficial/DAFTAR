import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

/**
 * POST /api/pipeline/trigger
 * Khabri -> Yantri pipeline entry point.
 * Creates a NarrativeTree from an incoming signal.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { signalId, trendTitle, summary, urgency } = body;

  if (!trendTitle) {
    return badRequest("trendTitle is required");
  }

  try {
    const tree = await prisma.narrativeTree.create({
      data: {
        title: trendTitle,
        summary: summary || null,
        signalId: signalId || null,
        signalData: body,
        urgency: urgency === "breaking" ? "breaking" : urgency === "high" ? "high" : "normal",
        status: "INCOMING",
        createdById: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      narrativeTreeId: tree.id,
      message: "Signal sent to Yantri. Open Yantri to evaluate and create deliverables.",
    });
  } catch (err) {
    console.error("[pipeline/trigger] Error creating narrative tree:", err);
    const message = err instanceof Error ? err.message : "Failed to create narrative tree";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
