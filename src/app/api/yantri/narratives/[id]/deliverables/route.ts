import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound, badRequest } from "@/lib/api-utils";

// POST /api/yantri/narratives/:id/deliverables
// Creates deliverables (Task + ContentPost + Narrative records) for selected brands/platforms
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  // body.deliverables: [{ brandId, platform, angle, formatNotes }]
  const { deliverables } = body;
  if (!deliverables || !Array.isArray(deliverables) || deliverables.length === 0) {
    return badRequest("deliverables array is required");
  }

  const tree = await prisma.narrativeTree.findUnique({ where: { id } });
  if (!tree) return notFound("Narrative tree not found");

  const created = [];

  for (const d of deliverables) {
    const { brandId, platform, angle, formatNotes } = d;

    if (!brandId || !platform) continue;

    // Create PMS Task
    const task = await prisma.task.create({
      data: {
        title: `[${platform.toUpperCase()}] ${tree.title}`,
        description: [
          `Narrative: ${tree.title}`,
          tree.summary ? `\nContext: ${tree.summary}` : "",
          angle ? `\nAngle: ${angle}` : "",
          formatNotes ? `\nFormat: ${formatNotes}` : "",
          `\nUrgency: ${tree.urgency}`,
        ].join(""),
        priority: tree.urgency === "breaking" ? "URGENT" : tree.urgency === "high" ? "HIGH" : "MEDIUM",
        status: "CREATED",
        creatorId: session.user.id,
        brandId,
      },
    });

    // Create ContentPost (draft)
    const post = await prisma.contentPost.create({
      data: {
        title: `${tree.title}`,
        content: angle || tree.summary || "",
        platform,
        brandId,
        status: "DRAFT",
        taskId: task.id,
        createdById: session.user.id,
        metadata: {
          narrativeTreeId: tree.id,
          angle,
          formatNotes,
          urgency: tree.urgency,
        },
      },
    });

    // Create or update Narrative record
    const narrative = await prisma.narrative.upsert({
      where: {
        treeId_brandId_platform: { treeId: id, brandId, platform },
      },
      create: {
        treeId: id,
        brandId,
        platform,
        angle: angle || null,
        formatNotes: formatNotes || null,
        status: "IN_PRODUCTION",
        taskId: task.id,
        contentPostId: post.id,
      },
      update: {
        angle: angle || undefined,
        formatNotes: formatNotes || undefined,
        status: "IN_PRODUCTION",
        taskId: task.id,
        contentPostId: post.id,
      },
    });

    created.push({
      narrativeId: narrative.id,
      taskId: task.id,
      contentPostId: post.id,
      brandId,
      platform,
    });
  }

  // Update tree status
  await prisma.narrativeTree.update({
    where: { id },
    data: { status: "IN_PRODUCTION" },
  });

  return NextResponse.json({ success: true, created }, { status: 201 });
}
