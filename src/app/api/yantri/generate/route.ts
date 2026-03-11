import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/yantri/gemini";
import { buildContentGenerationPrompt, getPlatformAgentName } from "@/lib/yantri/prompts";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { narrativeId } = await request.json();

    const narrative = await prisma.editorialNarrative.findUnique({
      where: { id: narrativeId },
      include: { trend: true, brand: true },
    });

    if (!narrative) {
      return NextResponse.json({ error: "Narrative not found" }, { status: 404 });
    }
    if (!narrative.researchResults) {
      return NextResponse.json(
        { error: "No research results. Complete research first." },
        { status: 400 }
      );
    }

    const voiceRules = Array.isArray(narrative.brand.voiceRules)
      ? (narrative.brand.voiceRules as string[]).join("; ")
      : String(narrative.brand.voiceRules ?? "");

    const { systemPrompt, userMessage } = await buildContentGenerationPrompt(
      narrative.platform,
      narrative.angle,
      narrative.format,
      narrative.brand.name ?? "Unknown Brand",
      narrative.brand.tone ?? "neutral",
      voiceRules,
      narrative.brand.language ?? "en",
      narrative.researchResults,
      narrative.trend.headline
    );

    const { parsed, raw } = await callGemini(systemPrompt, userMessage);

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to generate content. AI response could not be parsed.", raw },
        { status: 500 }
      );
    }

    // Save: enginePrompt stores the internal prompt (debug), packageData stores full deliverable
    await prisma.editorialNarrative.update({
      where: { id: narrativeId },
      data: {
        enginePrompt: systemPrompt,
        packageData: JSON.stringify(parsed),
        status: "producing",
      },
    });

    const agentName = getPlatformAgentName(narrative.platform);

    await prisma.editorialLog.create({
      data: {
        action: "content_generated",
        reasoning: `${agentName} generated content for ${narrative.platform}`,
        trendHeadline: narrative.trend.headline,
        narrativeAngle: narrative.angle,
        platform: narrative.platform,
        brandName: narrative.brand.name ?? "Unknown Brand",
      },
    });

    return NextResponse.json({ deliverable: parsed, raw });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generate error:", message);
    return NextResponse.json(
      { error: `Content generation failed: ${message}` },
      { status: 500 }
    );
  }
}
