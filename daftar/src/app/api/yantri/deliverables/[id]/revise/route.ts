import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";
import { yantriInngest } from "@/lib/yantri/inngest/client";

// POST /api/yantri/deliverables/[id]/revise
// Request revision on a deliverable. Stores notes and optionally re-triggers pipeline.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: { brand: { select: { id: true, name: true } } },
  });

  if (!deliverable) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }

  let body: { notes?: string; autoRegenerate?: boolean };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (!body.notes) {
    return badRequest("notes are required when requesting revision");
  }

  // Store revision history in postingPlan metadata
  const existingMeta = (deliverable.postingPlan as Record<string, unknown>) ?? {};
  const revisionHistory = (existingMeta.revisions as unknown[]) ?? [];
  revisionHistory.push({
    version: revisionHistory.length + 1,
    notes: body.notes,
    requestedBy: session.user.id,
    requestedAt: new Date().toISOString(),
    previousStatus: deliverable.status,
  });

  // Update status and store revision notes
  const updated = await prisma.deliverable.update({
    where: { id },
    data: {
      status: "PLANNED",
      postingPlan: JSON.parse(JSON.stringify({ ...existingMeta, revisions: revisionHistory })),
      // Prepend revision notes to research prompt so the pipeline picks them up
      researchPrompt: [
        `[REVISION NOTES]: ${body.notes}`,
        deliverable.researchPrompt ?? "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    include: {
      brand: { select: { id: true, name: true } },
      assets: true,
    },
  });

  // Auto-retrigger pipeline if requested
  if (body.autoRegenerate !== false) {
    const eventMap: Record<string, string> = {
      viral_micro: "yantri/deliverable.viral-micro",
      carousel: "yantri/deliverable.carousel",
      cinematic: "yantri/deliverable.cinematic",
      reel: "yantri/deliverable.reel",
      standard: "yantri/strategy.decided",
    };
    const eventName = eventMap[deliverable.pipelineType] ?? "yantri/deliverable.viral-micro";

    // The strategy.decided event needs extra data; others just need deliverableId
    if (eventName === "yantri/strategy.decided") {
      await yantriInngest.send({
        name: eventName,
        data: {
          deliverableId: id,
          treeId: deliverable.treeId ?? "",
          factDossierId: deliverable.factDossierId ?? "",
        },
      });
    } else {
      await yantriInngest.send({
        name: eventName,
        data: { deliverableId: id },
      });
    }
  }

  return NextResponse.json({
    deliverable: updated,
    revisionVersion: revisionHistory.length,
    regenerating: body.autoRegenerate !== false,
  });
}
