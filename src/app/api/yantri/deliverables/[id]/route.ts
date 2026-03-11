import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { yantriInngest } from "@/lib/yantri/inngest/client";
import { getAuthSession } from "@/lib/api-utils";
import { daftarEvents } from "@/lib/event-bus";

// ─── GET /api/yantri/deliverables/[id] ─────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: {
      brand: true,
      tree: { include: { dossier: true } },
      assets: { orderBy: { slideIndex: "asc" } },
    },
  });

  if (!deliverable) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }

  return NextResponse.json(deliverable);
}

// ─── PATCH /api/yantri/deliverables/[id] ───────────────────────────────────────────
// Update status, content, or trigger pipeline re-run
//
// Body: {
//   status?: string,
//   copyMarkdown?: string,
//   postingPlan?: object,
//   action?: "approve" | "kill" | "retrigger"
// }

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const deliverable = await prisma.deliverable.findUnique({ where: { id } });
  if (!deliverable) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }

  const { action, status, copyMarkdown, postingPlan } = body as {
    action?: string;
    status?: string;
    copyMarkdown?: string;
    postingPlan?: object;
  };

  // Handle actions
  if (action === "approve") {
    const updated = await prisma.deliverable.update({
      where: { id },
      data: { status: "APPROVED" },
      include: { brand: { select: { id: true, name: true } } },
    });

    // Auto-create PMS task for approved deliverable
    const session = await getAuthSession();
    const creatorId = session?.user?.id;
    if (creatorId) {
      const task = await prisma.task.create({
        data: {
          title: `Publish: ${updated.brand?.name ?? "Brand"} — ${updated.platform.replace(/_/g, " ")}`,
          description: `Approved Yantri deliverable ready for publishing.\n\nDeliverable ID: ${id}\nPipeline: ${updated.pipelineType}\nPlatform: ${updated.platform}`,
          status: "CREATED",
          priority: "HIGH",
          creatorId,
          brandId: updated.brandId,
        },
      });

      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          actorId: creatorId,
          action: "created",
        },
      });

      daftarEvents.emitEvent("PMS_TASK_CREATED", {
        taskId: task.id,
        title: task.title,
        creatorId,
        source: "yantri-deliverable-approval",
        deliverableId: id,
      });
    }

    return NextResponse.json(updated);
  }

  if (action === "kill") {
    const updated = await prisma.deliverable.update({
      where: { id },
      data: { status: "KILLED" },
    });
    return NextResponse.json(updated);
  }

  if (action === "retrigger") {
    const eventMap: Record<string, string> = {
      viral_micro: "yantri/deliverable.viral-micro",
      carousel: "yantri/deliverable.carousel",
      cinematic: "yantri/deliverable.cinematic",
    };

    const eventName = eventMap[deliverable.pipelineType] ?? "yantri/deliverable.viral-micro";

    await prisma.deliverable.update({
      where: { id },
      data: { status: "PLANNED" },
    });

    await yantriInngest.send({
      name: eventName,
      data: { deliverableId: id },
    });

    return NextResponse.json({ status: "retriggered", deliverableId: id }, { status: 202 });
  }

  // Generic field update
  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (copyMarkdown !== undefined) updateData.copyMarkdown = copyMarkdown;
  if (postingPlan !== undefined) updateData.postingPlan = postingPlan;

  const updated = await prisma.deliverable.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/yantri/deliverables/[id] ──────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({ where: { id } });
  if (!deliverable) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }

  // Delete assets first (cascade should handle this but be explicit)
  await prisma.asset.deleteMany({ where: { deliverableId: id } });
  await prisma.deliverable.delete({ where: { id } });

  return NextResponse.json({ deleted: true, id });
}
