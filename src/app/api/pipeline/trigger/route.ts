import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";
import { yantriInngest } from "@/lib/yantri/inngest/client";

/**
 * POST /api/pipeline/trigger
 * Khabri -> Yantri pipeline entry point.
 * Creates a NarrativeTree from an incoming signal and triggers gap analysis.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { signalId, trendTitle, summary, urgency, source, category } = body;

  if (!trendTitle) {
    return badRequest("trendTitle is required");
  }

  // Verify user exists in DB (session JWT may contain stale ID)
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!userExists) {
    return NextResponse.json(
      { error: "User not found. Please sign out and sign in again." },
      { status: 403 }
    );
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
        // Create an initial NarrativeNode from the signal
        nodes: {
          create: {
            signalTitle: trendTitle.slice(0, 150),
            signalScore: urgency === "breaking" ? 90 : urgency === "high" ? 70 : 50,
            signalData: {
              source: source || "khabri",
              category: category || "general",
              summary: summary || trendTitle,
              signalId: signalId || null,
            },
          },
        },
      },
    });

    // Trigger downstream processing: dossier build + gap analysis
    await yantriInngest.send([
      {
        name: "yantri/dossier.build",
        data: { treeId: tree.id },
      },
      {
        name: "yantri/tree.updated",
        data: { treeId: tree.id },
      },
    ]);

    return NextResponse.json({
      success: true,
      narrativeTreeId: tree.id,
      message: "Signal sent to Yantri. Pipeline triggered — dossier synthesis and content planning started.",
    });
  } catch (err) {
    console.error("[pipeline/trigger] Error creating narrative tree:", err);
    const message = err instanceof Error ? err.message : "Failed to create narrative tree";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
