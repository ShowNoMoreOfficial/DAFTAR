import { NextResponse } from "next/server";
import { getAuthSession, unauthorized, handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/yantri/gemini";

/**
 * GET /api/yantri/editorial-brief
 * Lightweight daily editorial brief: top 3 trends → single Gemini call → 5 recommendations.
 * Designed for dashboard display — much lighter than the full /recommend pipeline.
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorized();

    // Fetch top 3 trends by velocity with their top signals
    const topTrends = await prisma.trend.findMany({
      orderBy: { velocityScore: "desc" },
      take: 3,
      include: {
        signals: {
          where: { isDuplicate: false },
          orderBy: { detectedAt: "desc" },
          take: 2,
        },
      },
    });

    if (topTrends.length === 0) {
      return NextResponse.json({
        recommendations: [],
        trends: [],
        generatedAt: new Date().toISOString(),
        empty: true,
      });
    }

    // Build compact trend context
    const trendSummary = topTrends
      .map((t, i) => {
        const sigs = t.signals
          .map((s) => `"${s.title}" (${s.source})`)
          .join("; ");
        return `${i + 1}. ${t.name} (velocity: ${t.velocityScore ?? "N/A"}, lifecycle: ${t.lifecycle})\n   Signals: ${sigs || "none"}`;
      })
      .join("\n");

    // Load brands for context
    const brands = await prisma.brand.findMany({
      select: { id: true, name: true, tone: true, language: true },
    });

    const brandContext = brands
      .map((b) => `- ${b.name} (id: ${b.id}, ${b.tone || "neutral"}, ${b.language || "en"})`)
      .join("\n");

    const result = await callGemini(
      `You are an editorial desk AI for a media agency. Given today's trending topics and available brands, produce exactly 5 brief content recommendations ranked by editorial urgency. Return valid JSON only.`,
      `TOP TRENDS TODAY:\n${trendSummary}\n\nBRANDS:\n${brandContext}\n\nReturn JSON:\n{\n  "recommendations": [\n    {\n      "title": "suggested content title",\n      "angle": "specific editorial angle in 1 sentence",\n      "brandName": "brand name from list above",\n      "brandId": "brand id from list above",\n      "platform": "YOUTUBE|X_THREAD|INSTAGRAM|LINKEDIN",\n      "contentType": "youtube_explainer|x_thread|instagram_carousel|quick_take|blog_post",\n      "urgency": "immediate|within_24h|within_48h|evergreen",\n      "reason": "1 sentence explaining why"\n    }\n  ]\n}\n\nRules:\n- Exactly 5 items, ranked by editorial value\n- Use ACTUAL brand IDs from the list above\n- Each recommendation must have a different angle\n- Return ONLY valid JSON`
    );

    const parsed = result.parsed as {
      recommendations: Array<{
        title: string;
        angle: string;
        brandName: string;
        brandId: string;
        platform: string;
        contentType: string;
        urgency: string;
        reason: string;
      }>;
    } | null;

    return NextResponse.json({
      recommendations: parsed?.recommendations || [],
      trends: topTrends.map((t) => ({
        id: t.id,
        name: t.name,
        velocity: t.velocityScore,
        lifecycle: t.lifecycle,
        signalCount: t.signals.length,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
