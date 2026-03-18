import { generateAndSaveAsset } from "@/lib/image-generator";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export const maxDuration = 60;

export const POST = apiHandler(async (request) => {
  const { assetId, prompt } = await request.json();

  if (!assetId || !prompt) {
    return Response.json({ error: "assetId and prompt required" }, { status: 400 });
  }

  // Verify asset exists
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    return Response.json({ error: "Asset not found" }, { status: 404 });
  }

  // Update status to generating
  await prisma.asset.update({
    where: { id: assetId },
    data: {
      metadata: {
        ...((asset.metadata as Record<string, unknown>) || {}),
        status: "generating",
      },
    },
  });

  // Generate with Gemini
  const result = await generateAndSaveAsset(assetId, prompt, prisma);

  if (result.success) {
    return Response.json({
      success: true,
      url: result.url,
      model: "gemini-3.1-flash-image-preview",
    });
  } else {
    // Mark as failed
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        metadata: {
          ...((asset.metadata as Record<string, unknown>) || {}),
          status: "failed",
          error: result.error,
        },
      },
    });
    return Response.json(
      { success: false, error: result.error || "Image generation failed" },
      { status: 500 },
    );
  }
});
