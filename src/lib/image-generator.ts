/**
 * Image generation with 3-tier fallback:
 * 1. Pollinations.ai (free, no key)
 * 2. Together.ai FLUX (if TOGETHER_API_KEY set)
 * 3. Gemini image generation (if GEMINI_API_KEY set)
 *
 * Returns: HTTP URL, data URI, or null
 */

export async function generateImage(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    style?: string;
    seed?: number;
  } = {}
): Promise<string | null> {
  const { width = 1280, height = 720, seed } = options;
  const cleanPrompt = prompt
    .replace(/[^\w\s,.\-!?]/g, " ")
    .trim()
    .substring(0, 500);
  const encoded = encodeURIComponent(cleanPrompt);
  const seedParam = seed || Math.floor(Math.random() * 1000000);

  // Attempt 1: Pollinations.ai (free, no key)
  try {
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seedParam}&nologo=true&model=flux`;
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return url;
    console.warn("[image-gen] Pollinations returned", res.status);
  } catch (e) {
    console.warn("[image-gen] Pollinations failed:", (e as Error).message);
  }

  // Attempt 2: Together.ai FLUX (free tier)
  const togetherKey = process.env.TOGETHER_API_KEY;
  if (togetherKey) {
    try {
      const res = await fetch(
        "https://api.together.xyz/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${togetherKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "black-forest-labs/FLUX.1-schnell-Free",
            prompt: cleanPrompt,
            width,
            height,
            n: 1,
          }),
          signal: AbortSignal.timeout(30000),
        }
      );
      const data = await res.json();
      if (data.data?.[0]?.url) return data.data[0].url;
      if (data.data?.[0]?.b64_json)
        return `data:image/png;base64,${data.data[0].b64_json}`;
      console.warn("[image-gen] Together returned no image");
    } catch (e) {
      console.warn("[image-gen] Together failed:", (e as Error).message);
    }
  }

  // Attempt 3: Gemini (if available)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({ apiKey: geminiKey });
      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: `Generate a professional image: ${cleanPrompt}`,
        config: { responseModalities: ["IMAGE", "TEXT"] },
      });
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (
          (part as { inlineData?: { mimeType?: string; data?: string } })
            .inlineData?.mimeType?.startsWith("image/")
        ) {
          const inline = (
            part as { inlineData: { mimeType: string; data: string } }
          ).inlineData;
          return `data:${inline.mimeType};base64,${inline.data}`;
        }
      }
    } catch (e) {
      console.warn("[image-gen] Gemini failed:", (e as Error).message);
    }
  }

  console.error(
    "[image-gen] ALL providers failed for:",
    cleanPrompt.substring(0, 60)
  );
  return null;
}

// Platform-specific image generators
export async function generateThumbnail(
  title: string,
  brand: string
): Promise<string | null> {
  return generateImage(
    `YouTube video thumbnail, bold text overlay "${title.substring(0, 50)}", dramatic political analysis style, high contrast, ${brand} brand`,
    { width: 1280, height: 720 }
  );
}

export async function generateCarouselSlide(
  text: string,
  slideNum: number,
  totalSlides: number,
  brand: string
): Promise<string | null> {
  return generateImage(
    `Instagram carousel slide ${slideNum} of ${totalSlides}, clean data infographic style, "${text.substring(0, 100)}", ${brand} brand aesthetic, portrait format`,
    { width: 1080, height: 1350 }
  );
}

export async function generateSocialCard(
  topic: string,
  platform: string
): Promise<string | null> {
  const dimensions =
    platform === "youtube_short" || platform === "instagram_reel"
      ? { width: 1080, height: 1920 } // Vertical
      : { width: 1200, height: 675 }; // Landscape

  return generateImage(
    `${platform} social media card about "${topic.substring(0, 100)}", bold modern design, political analysis aesthetic`,
    dimensions
  );
}

export async function generateInfographic(
  data: string,
  style: string = "modern"
): Promise<string | null> {
  return generateImage(
    `Data infographic: ${data.substring(0, 200)}. Style: ${style}, clean layout, professional colors`,
    { width: 1080, height: 1350 } // Portrait infographic
  );
}
