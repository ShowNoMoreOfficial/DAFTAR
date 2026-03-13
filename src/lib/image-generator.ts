/**
 * Image generation using Gemini (single provider, no fallbacks).
 * Returns base64 data URI or null.
 */

import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";

export async function generateImage(
  prompt: string,
): Promise<{ url: string; mimeType: string } | null> {
  try {
    const imagePrompt = `Generate a high-quality, professional image:

${prompt}

Style requirements:
- Professional, editorial quality
- Clean composition
- Bold colors with high contrast
- Suitable for social media / digital publishing
- No text overlays (text will be added separately)
- No watermarks or logos`;

    const response = await genAI.models.generateContent({
      model: IMAGE_MODEL,
      contents: imagePrompt,
      config: { responseModalities: ["IMAGE", "TEXT"] },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      const inline = (part as { inlineData?: { mimeType?: string; data?: string } }).inlineData;
      if (inline?.mimeType?.startsWith("image/") && inline.data) {
        return {
          url: `data:${inline.mimeType};base64,${inline.data}`,
          mimeType: inline.mimeType,
        };
      }
    }

    console.warn("[image-gen] Gemini did not return image data");
    return null;
  } catch (err: unknown) {
    console.error("[image-gen] Gemini image generation failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Generate image and save to asset record
 */
export async function generateAndSaveAsset(
  assetId: string,
  prompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const result = await generateImage(prompt);

    if (!result) {
      return { success: false, error: "Image generation returned no data" };
    }

    await prisma.asset.update({
      where: { id: assetId },
      data: {
        url: result.url,
        metadata: {
          mimeType: result.mimeType,
          generatedAt: new Date().toISOString(),
          model: IMAGE_MODEL,
          status: "complete",
        },
      },
    });

    return { success: true, url: result.url };
  } catch (err: unknown) {
    console.error("[image-gen] Save failed:", err instanceof Error ? err.message : err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
