import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/yantri/gemini";
import { buildEditorialScanPrompt, buildResearchPrompt } from "@/lib/yantri/prompts";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { batchId } = await request.json();

    const [batch, brands, rules] = await Promise.all([
      prisma.trendBatch.findUnique({
        where: { id: batchId },
        include: { trends: { orderBy: { rank: "asc" } } },
      }),
      prisma.brand.findMany(),
      prisma.platformRule.findMany(),
    ]);

    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    if (brands.length === 0) return NextResponse.json({ error: "No active brands" }, { status: 400 });

    const { systemPrompt, userMessage } = buildEditorialScanPrompt(
      brands,
      rules,
      batch.trends
    );

    const { parsed, raw } = await callGemini(systemPrompt, userMessage);

    if (!parsed) {
      console.error("[scan] Failed to parse AI response. Raw:", raw?.slice(0, 300));
      return NextResponse.json(
        { error: "Editorial scan could not be completed. Please try again." },
        { status: 502 }
      );
    }

    // Create editorial narratives for priorities
    const narratives = [];
    for (const priority of parsed.priorities || []) {
      const trend = batch.trends.find((t) => t.id === priority.trend_id)
        || batch.trends.find(
          (t) =>
            t.headline.toLowerCase().includes(priority.trend_headline?.toLowerCase()?.slice(0, 20)) ||
            priority.trend_headline?.toLowerCase()?.includes(t.headline.toLowerCase().slice(0, 20))
        ) || batch.trends[0];

      const brand = brands.find(
        (b) => b.name.toLowerCase() === priority.brand?.toLowerCase()
      ) || brands[0];

      const fallbackPrompt = buildResearchPrompt(
        priority.narrative_angle || "",
        trend.headline,
        brand.name ?? "Unknown Brand",
        priority.platform || ""
      ).systemPrompt;

      const narrative = await prisma.editorialNarrative.create({
        data: {
          angle: priority.narrative_angle || "",
          whyThisAngle: priority.why_this_narrative || "",
          informationGap: priority.information_gap || "",
          priority: priority.priority || 1,
          platform: priority.platform || "",
          secondaryPlatform: priority.secondary_platform || null,
          format: priority.format || "",
          urgency: priority.urgency || "",
          researchPrompt: priority.deep_research_prompt || fallbackPrompt,
          trendId: trend.id,
          brandId: brand.id,
        },
        include: { trend: true },
      });

      // Update trend status
      await prisma.importedTrend.update({
        where: { id: trend.id },
        data: { status: "selected" },
      });

      // Log selection
      await prisma.editorialLog.create({
        data: {
          action: "selected",
          reasoning: priority.why_this_narrative || "",
          trendHeadline: trend.headline,
          narrativeAngle: priority.narrative_angle,
          platform: priority.platform,
          brandName: brand.name ?? "Unknown Brand",
        },
      });

      narratives.push(narrative);
    }

    // Log skips
    for (const skip of parsed.skipped || []) {
      const trend = batch.trends.find((t) => t.id === skip.trend_id)
        || batch.trends.find(
          (t) =>
            t.headline.toLowerCase().includes(skip.trend_headline?.toLowerCase()?.slice(0, 20)) ||
            skip.trend_headline?.toLowerCase()?.includes(t.headline.toLowerCase().slice(0, 20))
        );

      if (trend) {
        await prisma.importedTrend.update({
          where: { id: trend.id },
          data: { status: "skipped", skipReason: skip.reason },
        });
      }

      await prisma.editorialLog.create({
        data: {
          action: "skipped",
          reasoning: skip.reason || "",
          trendHeadline: skip.trend_headline || "",
        },
      });
    }

    return NextResponse.json({ plan: parsed, narratives, raw });
  } catch (err) {
    console.error("[scan] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Editorial scan temporarily unavailable. Please try again in a moment." },
      { status: 503 }
    );
  }
}
