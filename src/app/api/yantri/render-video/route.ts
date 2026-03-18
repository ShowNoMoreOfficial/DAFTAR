import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateEditorialVideoSpecs,
  generateDataCardSpec,
  generateStakeholderCardSpec,
  generateTimelineSpec,
  generateInfographicSpec,
  generateBreakingBannerSpec,
  type VideoProjectSpec,
} from "@/lib/video-generator";
import { apiHandler } from "@/lib/api-handler";

/**
 * POST /api/yantri/render-video
 *
 * Two modes:
 * 1. { deliverableId } — Auto-generate video specs from a deliverable's production brief
 * 2. { compositionId, inputProps } — Generate a single composition spec
 *
 * Returns a VideoProjectSpec with Remotion render commands the team can execute locally.
 * Remotion rendering is CPU-intensive; this API generates the project spec, not the video.
 */
export const POST = apiHandler(async (request) => {
  const body = await request.json();

  // ─── Mode 1: Generate from deliverable ───
  if (body.deliverableId) {
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: body.deliverableId },
      include: { brand: true, assets: true },
    });

    if (!deliverable) {
      return NextResponse.json(
        { error: "Deliverable not found" },
        { status: 404 },
      );
    }

    // Parse structured data
    const scriptData =
      typeof deliverable.scriptData === "string"
        ? JSON.parse(deliverable.scriptData)
        : deliverable.scriptData;
    const postingPlan =
      typeof deliverable.postingPlan === "string"
        ? JSON.parse(deliverable.postingPlan)
        : deliverable.postingPlan;

    const spec = generateEditorialVideoSpecs({
      deliverableId: deliverable.id,
      brandName: deliverable.brand.name,
      platform: deliverable.platform,
      visualAnchors: postingPlan?.visualAnchors,
      keyStakeholders: postingPlan?.keyStakeholders,
      eventMarkers: postingPlan?.eventMarkers,
      animationBriefs: postingPlan?.animationBriefs,
      scriptSections:
        scriptData?.script?.sections ?? scriptData?.sections,
    });

    // Store the video spec as a VIDEO_CLIP asset on the deliverable
    await prisma.asset.create({
      data: {
        deliverableId: deliverable.id,
        type: "VIDEO_CLIP",
        url: "",
        metadata: {
          type: "remotion-project-spec",
          compositionCount: spec.compositions.length,
          compositions: spec.compositions.map((c) => ({
            id: c.compositionId,
            output: c.outputFilename,
            duration: c.durationInFrames / c.fps,
          })),
          renderAllCommand: spec.renderAllCommand,
        },
      },
    });

    return NextResponse.json({
      success: true,
      spec,
      message: `Generated ${spec.compositions.length} Remotion composition specs. Use the render commands to generate videos locally.`,
    });
  }

  // ─── Mode 2: Single composition spec ───
  if (body.compositionId && body.inputProps) {
    const { compositionId, inputProps } = body;
    let spec: VideoProjectSpec;

    const compositionMap: Record<
      string,
      () => ReturnType<typeof generateDataCardSpec>
    > = {
      DataCard: () => generateDataCardSpec(inputProps, 0, false),
      "DataCard-Vertical": () => generateDataCardSpec(inputProps, 0, true),
      StakeholderCard: () => generateStakeholderCardSpec(inputProps, 0),
      TimelineAnimation: () => generateTimelineSpec(inputProps),
      InfographicSlide: () => generateInfographicSpec(inputProps, 0),
      BreakingBanner: () => generateBreakingBannerSpec(inputProps, false),
      "BreakingBanner-Vertical": () =>
        generateBreakingBannerSpec(inputProps, true),
    };

    const builder = compositionMap[compositionId];
    if (!builder) {
      return NextResponse.json(
        {
          error: `Unknown composition: ${compositionId}`,
          available: Object.keys(compositionMap),
        },
        { status: 400 },
      );
    }

    const composition = builder();
    spec = {
      deliverableId: body.deliverableId ?? "standalone",
      brandName: body.brandName ?? "DAFTAR",
      platform: body.platform ?? "YOUTUBE",
      compositions: [composition],
      renderAllCommand: composition.renderCommand,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, spec });
  }

  return NextResponse.json(
    {
      error:
        "Provide either { deliverableId } or { compositionId, inputProps }",
    },
    { status: 400 },
  );
});
