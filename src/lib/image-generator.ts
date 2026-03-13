/**
 * Image generation using Pollinations.ai (FREE, no API key)
 * Uses FLUX model for high-quality AI image generation
 * Simply construct a URL — the image is generated on request
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

  try {
    // Clean and encode the prompt
    const cleanPrompt = prompt
      .replace(/[^\w\s,.-]/g, " ")
      .trim()
      .substring(0, 500);

    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const seedParam = seed || Math.floor(Math.random() * 1000000);

    // Pollinations.ai generates images via URL — no API key needed
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seedParam}&nologo=true&model=flux`;

    // Verify the URL resolves (Pollinations generates on first request)
    const check = await fetch(imageUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (check.ok) {
      return imageUrl; // Return the URL — image is served from Pollinations CDN
    }

    console.warn("[image-gen] Pollinations returned", check.status);
    return null;
  } catch (err) {
    console.error("[image-gen] Failed:", err);
    return null;
  }
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
    `Instagram carousel slide ${slideNum} of ${totalSlides}, clean data infographic style, "${text.substring(0, 100)}", ${brand} brand aesthetic, square format`,
    { width: 1080, height: 1080 }
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
