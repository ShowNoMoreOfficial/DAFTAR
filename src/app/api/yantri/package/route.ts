import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/yantri/gemini";
import { buildPackagingPrompt } from "@/lib/yantri/prompts";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { narrativeId } = await request.json();

    const narrative = await prisma.editorialNarrative.findUnique({
      where: { id: narrativeId },
      include: { trend: true },
    });

    if (!narrative) return NextResponse.json({ error: "Narrative not found" }, { status: 404 });

    const brand = await prisma.brand.findUnique({ where: { id: narrative.brandId } });

    let keyDataPoints = "No research data available yet";
    if (narrative.researchResults) {
      try {
        const { parsed: summary } = await callGemini(
          "Extract the key data points from this research for content packaging. Return JSON: {\"key_points\": \"a concise summary of the most important numbers, facts, quotes, and contradictions (under 1500 chars)\"}",
          narrative.researchResults
        );
        keyDataPoints = summary?.key_points || narrative.researchResults.slice(0, 1500);
      } catch (err) {
        console.error("[package] Research summary failed:", err instanceof Error ? err.message : err);
        keyDataPoints = narrative.researchResults.slice(0, 1500);
      }
    }

    const { systemPrompt, userMessage } = buildPackagingPrompt(
      narrative.angle,
      narrative.platform,
      brand?.name ?? "Unknown Brand",
      keyDataPoints
    );

    const { parsed } = await callGemini(systemPrompt, userMessage);

    if (!parsed) {
      return NextResponse.json(
        { error: "Content packaging could not be completed. Please try again." },
        { status: 502 }
      );
    }

    await prisma.editorialNarrative.update({
      where: { id: narrativeId },
      data: {
        packageData: JSON.stringify(parsed),
      },
    });

    return NextResponse.json({ package: parsed });
  } catch (err) {
    console.error("[package] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Content packaging temporarily unavailable. Please try again in a moment." },
      { status: 503 }
    );
  }
}
