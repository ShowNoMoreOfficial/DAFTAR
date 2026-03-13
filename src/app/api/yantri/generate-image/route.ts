import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    // Strategy 1: Gemini image generation
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: prompt,
        config: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find(
        (p: { inlineData?: { mimeType?: string } }) =>
          p.inlineData?.mimeType?.startsWith("image/")
      );

      if (imagePart?.inlineData?.data) {
        return NextResponse.json({
          success: true,
          image: imagePart.inlineData.data,
          source: "gemini",
        });
      }
    } catch (geminiErr) {
      console.warn("[generate-image] Gemini failed, trying fallback:", geminiErr);
    }

    // Strategy 2: Together.ai FLUX
    if (process.env.TOGETHER_API_KEY) {
      try {
        const res = await fetch("https://api.together.xyz/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "black-forest-labs/FLUX.1-schnell-Free",
            prompt: prompt.substring(0, 500),
            width: 1280,
            height: 720,
            n: 1,
          }),
        });
        const data = await res.json();
        if (data.data?.[0]?.b64_json) {
          return NextResponse.json({ success: true, image: data.data[0].b64_json, source: "together" });
        }
        if (data.data?.[0]?.url) {
          return NextResponse.json({ success: true, imageUrl: data.data[0].url, source: "together" });
        }
      } catch {
        console.warn("[generate-image] Together.ai fallback failed");
      }
    }

    // Strategy 3: Pollinations.ai (free, no key)
    const encoded = encodeURIComponent(prompt.substring(0, 200));
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true`;

    return NextResponse.json({
      success: true,
      imageUrl: pollinationsUrl,
      source: "pollinations",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generate Image error:", message);
    return NextResponse.json(
      { error: `Image generation failed: ${message}` },
      { status: 500 }
    );
  }
}
