import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/yantri/gemini";
import { buildContentGenerationPrompt, getPlatformAgentName } from "@/lib/yantri/prompts";
import { apiHandler } from "@/lib/api-handler";

export const POST = apiHandler(async (request) => {
  const { narrativeId } = await request.json();

  const narrative = await prisma.editorialNarrative.findUnique({
    where: { id: narrativeId },
    include: { trend: true },
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

  const brand = await prisma.brand.findUnique({ where: { id: narrative.brandId } });

  const voiceRules = Array.isArray(brand?.voiceRules)
    ? (brand.voiceRules as string[]).join("; ")
    : String(brand?.voiceRules ?? "");

  const { systemPrompt, userMessage } = await buildContentGenerationPrompt(
    narrative.platform,
    narrative.angle,
    narrative.format,
    brand?.name ?? "Unknown Brand",
    brand?.tone ?? "neutral",
    voiceRules,
    brand?.language ?? "en",
    narrative.researchResults,
    narrative.trend.headline
  );

  const { parsed, raw } = await callGemini(systemPrompt, userMessage);

  if (!parsed) {
    console.error("[generate] Failed to parse AI response. Raw:", raw?.slice(0, 300));
    return NextResponse.json(
      { error: "Content generation failed — AI response could not be processed. Please try again." },
      { status: 502 }
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
      brandName: brand?.name ?? "Unknown Brand",
    },
  });

  return NextResponse.json({ deliverable: parsed, raw });
});
