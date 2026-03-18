import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/yantri/gemini";
import { buildEnginePrompt } from "@/lib/yantri/prompts";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { narrativeId } = await request.json();

    const narrative = await prisma.editorialNarrative.findUnique({
      where: { id: narrativeId },
    });

    if (!narrative) return NextResponse.json({ error: "Narrative not found" }, { status: 404 });
    if (!narrative.researchResults) {
      return NextResponse.json({ error: "No research results yet" }, { status: 400 });
    }

    const brand = await prisma.brand.findUnique({ where: { id: narrative.brandId } });

    const { systemPrompt, userMessage } = buildEnginePrompt(
      narrative.angle,
      narrative.platform,
      narrative.format,
      brand?.name ?? "Unknown Brand",
      Array.isArray(brand?.voiceRules)
        ? (brand.voiceRules as string[]).join("; ")
        : String(brand?.voiceRules ?? ""),
      narrative.researchResults
    );

    const { parsed, raw } = await callGemini(systemPrompt, userMessage);

    if (!parsed) {
      console.error("[route-prompt] Failed to parse AI response. Raw:", raw?.slice(0, 300));
      return NextResponse.json(
        { error: "Engine prompt generation failed. Please try again." },
        { status: 502 }
      );
    }

    await prisma.editorialNarrative.update({
      where: { id: narrativeId },
      data: {
        enginePrompt: parsed.prompt || raw,
        status: "producing",
      },
    });

    return NextResponse.json({ engine: parsed });
  } catch (err) {
    console.error("[route-prompt] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Engine prompt generation temporarily unavailable. Please try again in a moment." },
      { status: 503 }
    );
  }
}
