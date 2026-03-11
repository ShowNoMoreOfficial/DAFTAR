import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { daftarEvents } from "@/lib/event-bus";

// POST /api/yantri/deliverables/[id]/approve
// Approve a deliverable and auto-create a PMS task for the production team.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true } },
      tree: { include: { dossier: true } },
      assets: true,
    },
  });

  if (!deliverable) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }

  if (deliverable.status === "APPROVED") {
    return NextResponse.json({ error: "Deliverable already approved" }, { status: 400 });
  }

  // Update deliverable status
  const updated = await prisma.deliverable.update({
    where: { id },
    data: { status: "APPROVED" },
    include: {
      brand: { select: { id: true, name: true } },
      assets: true,
    },
  });

  // Determine task priority from pipeline urgency
  const urgency = deliverable.tree?.urgency ?? "normal";
  const priorityMap: Record<string, "URGENT" | "HIGH" | "MEDIUM" | "LOW"> = {
    breaking: "URGENT",
    high: "HIGH",
    normal: "MEDIUM",
    low: "LOW",
  };
  const priority = priorityMap[urgency] ?? "MEDIUM";

  // Determine due date from priority
  const now = new Date();
  const dueDateMap: Record<string, number> = { URGENT: 0, HIGH: 2, MEDIUM: 7, LOW: 14 };
  const dueDate = new Date(now.getTime() + (dueDateMap[priority] ?? 7) * 86400000);

  // Build task description from assets
  const assetSummary = deliverable.assets
    .map((a) => `- ${a.type}: ${a.url || "(generated)"}`)
    .join("\n");

  const platformLabel = deliverable.platform.replace(/_/g, " ");
  const brandName = updated.brand?.name ?? "Brand";

  // Create PMS task
  const task = await prisma.task.create({
    data: {
      title: `${platformLabel} — ${brandName}`,
      description: [
        `Approved Yantri deliverable ready for production.`,
        ``,
        `**Deliverable ID:** ${id}`,
        `**Pipeline:** ${deliverable.pipelineType}`,
        `**Platform:** ${platformLabel}`,
        `**Brand:** ${brandName}`,
        ``,
        `**Assets:**`,
        assetSummary || "No assets yet",
        ``,
        deliverable.tree?.dossier
          ? `**Source Dossier:** ${deliverable.tree.title}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      status: "CREATED",
      priority,
      creatorId: session.user.id,
      brandId: deliverable.brandId,
      dueDate,
    },
    include: {
      brand: { select: { id: true, name: true } },
    },
  });

  // Log activity
  await prisma.taskActivity.create({
    data: {
      taskId: task.id,
      actorId: session.user.id,
      action: "created",
      newValue: `Auto-created from approved Yantri deliverable (${id})`,
    },
  });

  // Emit events
  daftarEvents.emitEvent("PMS_TASK_CREATED", {
    taskId: task.id,
    title: task.title,
    creatorId: session.user.id,
    source: "yantri-deliverable-approval",
    deliverableId: id,
  });

  daftarEvents.emitEvent("DELIVERABLE_APPROVED", {
    deliverableId: id,
    taskId: task.id,
    brandId: deliverable.brandId,
    approvedBy: session.user.id,
  });

  return NextResponse.json({ deliverable: updated, task });
}
