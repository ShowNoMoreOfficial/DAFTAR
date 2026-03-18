import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { yantriInngest } from "@/lib/yantri/inngest/client";
import { getAuthSession } from "@/lib/api-utils";
import { daftarEvents } from "@/lib/event-bus";
import { generateVisualPrompts } from "@/lib/yantri/engines/nanoBanana";
import { getBrandColorMood } from "@/lib/yantri/brand-voice";
import { generateImage } from "@/lib/image-generator";

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

      // Auto-generate Story version for Instagram/YouTube content
      generateStoryOnApproval(deliverable, updated, creatorId).catch((err) =>
        console.error("[deliverable] Story auto-gen failed:", err instanceof Error ? err.message : err)
      );
    }

    return NextResponse.json(updated);
  }

  if (action === "publish") {
    const updated = await prisma.deliverable.update({
      where: { id },
      data: { status: "PUBLISHED" },
      include: { brand: { select: { id: true, name: true } } },
    });

    // Trigger performance feedback loop
    await yantriInngest.send({
      name: "yantri/deliverable.published",
      data: {
        deliverableId: id,
        brandId: updated.brandId,
        platform: updated.platform,
      },
    });

    return NextResponse.json(updated);
  }

  if (action === "kill") {
    const updated = await prisma.deliverable.update({
      where: { id },
      data: { status: "KILLED" },
    });
    return NextResponse.json(updated);
  }

  if (action === "revision") {
    const { revisionNotes } = body as { revisionNotes?: string };
    const existingPlan = (deliverable.postingPlan as Record<string, unknown>) ?? {};
    const updated = await prisma.deliverable.update({
      where: { id },
      data: {
        status: "DRAFTED",
        postingPlan: {
          ...existingPlan,
          revisionNotes: revisionNotes ?? "",
          revisionRequestedAt: new Date().toISOString(),
        },
      },
    });
    return NextResponse.json(updated);
  }

  if (action === "retrigger") {
    const eventMap: Record<string, string> = {
      viral_micro: "yantri/deliverable.viral-micro",
      carousel: "yantri/deliverable.carousel",
      cinematic: "yantri/deliverable.cinematic",
      reel: "yantri/deliverable.reel",
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

  // If status changed to PUBLISHED via generic update, also trigger tracking
  if (status === "PUBLISHED") {
    yantriInngest.send({
      name: "yantri/deliverable.published",
      data: {
        deliverableId: id,
        brandId: deliverable.brandId,
        platform: deliverable.platform,
      },
    }).catch((err: unknown) =>
      console.error("[deliverable] Failed to emit publish event:", err)
    );
  }

  return NextResponse.json(updated);
}

// ─── Auto-generate Story on approval ────────────────────────────────────────────

async function generateStoryOnApproval(
  deliverable: { id: string; platform: string; brandId: string; copyMarkdown: string | null; postingPlan: unknown },
  updated: { brand?: { id: string; name: string } | null },
  userId: string
) {
  // Only generate stories for Instagram and YouTube content
  const storyPlatforms = ["META_CAROUSEL", "META_REEL", "META_POST", "YOUTUBE"];
  if (!storyPlatforms.includes(deliverable.platform)) return;

  const brandName = updated.brand?.name ?? "Brand";
  const title = deliverable.copyMarkdown?.slice(0, 100) ?? "Content";

  // Generate a story visual prompt
  const storyVisual = await generateVisualPrompts({
    narrativeAngle: `Story promoting: "${title}"`,
    platform: "meta",
    brandName,
    emotion: "excitement",
    colorMood: await getBrandColorMood(brandName, "vibrant, eye-catching, story-optimized"),
    generatedContent: deliverable.copyMarkdown?.slice(0, 2000) ?? "",
  });

  // Create a Story deliverable (use META_POST with pipelineType instagram_story)
  const storyDeliverable = await prisma.deliverable.create({
    data: {
      brandId: deliverable.brandId,
      platform: "META_POST",
      pipelineType: "instagram_story",
      status: "REVIEW",
      copyMarkdown: `Story: ${title}`,
      postingPlan: {
        sourceDeliverableId: deliverable.id,
        sourcePlatform: deliverable.platform,
        storyType: "content_promotion",
        format: "vertical_1080x1920",
        notes: "Auto-generated story to promote approved content. Add swipe-up/link sticker.",
      },
    },
  });

  // Create story image asset
  await prisma.asset.create({
    data: {
      deliverableId: storyDeliverable.id,
      type: "IMAGE",
      url: "",
      promptUsed: storyVisual.storyPrompt ?? storyVisual.socialCardPrompt,
      metadata: {
        purpose: "story_promotion",
        sourceDeliverableId: deliverable.id,
        format: "9:16 (1080x1920)",
        stickerZone: "bottom 20% reserved for swipe-up/link sticker",
      },
    },
  });

  // Try to generate the actual story image via shared image generator
  try {
    const storyPrompt = `Create an Instagram/Facebook Story promoting: "${title}".
Style: Eye-catching, vertical (1080x1920), vibrant colors.
Include: Key quote or data point from the content, brand watermark area at top-right.
Reserve bottom 20% for swipe-up/link sticker area.
Brand: ${brandName}. Make it scroll-stopping.`;

    const result = await generateImage(storyPrompt);

    const asset = await prisma.asset.findFirst({
      where: { deliverableId: storyDeliverable.id, type: "IMAGE" },
    });

    if (asset) {
      if (result) {
        await prisma.asset.update({
          where: { id: asset.id },
          data: {
            url: result.url,
            metadata: {
              ...(typeof asset.metadata === "object" && asset.metadata !== null ? asset.metadata : {}),
              generated: true,
              generatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // Gemini returned no image — use Pollinations fallback
        const encoded = encodeURIComponent(storyPrompt.substring(0, 200));
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1920&nologo=true`;
        await prisma.asset.update({
          where: { id: asset.id },
          data: { url: fallbackUrl, metadata: { ...(typeof asset.metadata === "object" && asset.metadata !== null ? asset.metadata : {}), generated: true, source: "pollinations" } },
        });
      }
    }
  } catch (err) {
    console.error("[deliverable] Story image gen failed:", err instanceof Error ? err.message : err);
  }

  console.log(`[deliverable] Story auto-generated: ${storyDeliverable.id} for source ${deliverable.id}`);
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
