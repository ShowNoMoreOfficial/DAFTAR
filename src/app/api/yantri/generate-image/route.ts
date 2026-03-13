import { getAuthSession } from "@/lib/api-utils";
import { generateAndSaveAsset } from "@/lib/image-generator";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        model: "gemini-2.5-flash-image",
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
  } catch (err) {
    console.error("[generate-image] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
