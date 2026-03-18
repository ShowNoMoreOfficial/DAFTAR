import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini } from "@/lib/yantri/gemini";
import {
  getAuthSession,
  unauthorized,
  forbidden,
  badRequest,
  notFound,
  handleApiError,
} from "@/lib/api-utils";

/**
 * POST /api/ppc/recommendations
 * Generate AI recommendations for a campaign based on its metrics.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!["ADMIN", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  try {
    const body = await req.json();
    const { campaignId } = body;

    if (!campaignId) return badRequest("campaignId is required");

    const campaign = await prisma.pPCCampaign.findUnique({
      where: { id: campaignId },
      include: {
        brand: true,
        dailyMetrics: { orderBy: { date: "desc" }, take: 30 },
      },
    });

    if (!campaign) return notFound("Campaign not found");

    // Build context for Gemini
    const metricsText = campaign.dailyMetrics.length > 0
      ? campaign.dailyMetrics
          .map(
            (m) =>
              `${m.date.toISOString().split("T")[0]}: impressions=${m.impressions}, clicks=${m.clicks}, conversions=${m.conversions}, spend=₹${m.spend}, CTR=${m.ctr}%, CPC=₹${m.cpc}`
          )
          .join("\n")
      : "No metrics data available yet.";

    const systemPrompt = `You are a PPC advertising optimization expert. Analyze the campaign data and return 3-5 actionable recommendations.

Return a JSON array of recommendations:
[
  {
    "type": "budget" | "targeting" | "creative" | "timing" | "platform",
    "title": "Short title",
    "description": "Detailed recommendation with specific actionable advice",
    "confidence": 0.0 to 1.0
  }
]

Focus on:
- Budget allocation and pacing
- Audience targeting improvements
- Ad creative suggestions
- Optimal posting times
- Platform-specific optimizations

Be specific, data-driven, and actionable.`;

    const userMessage = `Campaign: ${campaign.name}
Platform: ${campaign.platform}
Objective: ${campaign.objective}
Status: ${campaign.status}
Daily Budget: ₹${campaign.dailyBudget ?? "Not set"}
Total Budget: ₹${campaign.totalBudget ?? "Not set"}
Start Date: ${campaign.startDate?.toISOString().split("T")[0] ?? "Not set"}
End Date: ${campaign.endDate?.toISOString().split("T")[0] ?? "Not set"}

Brand: ${campaign.brand.name}
Audience Demographics: ${campaign.brand.audienceDemographics ?? "Not specified"}
Audience Geography: ${campaign.brand.audienceGeography ?? "Not specified"}
Audience Interests: ${campaign.brand.audienceInterests ?? "Not specified"}

Last 30 days metrics:
${metricsText}

Analyze and provide recommendations.`;

    const result = await callGemini(systemPrompt, userMessage, {
      temperature: 0.4,
    });

    if (!result.parsed || !Array.isArray(result.parsed)) {
      return NextResponse.json(
        { error: "Could not generate recommendations. Please try again." },
        { status: 502 }
      );
    }

    // Save recommendations to DB
    const recommendations = [];
    for (const rec of result.parsed) {
      const saved = await prisma.pPCRecommendation.create({
        data: {
          campaignId,
          type: rec.type || "budget",
          title: rec.title || "Recommendation",
          description: rec.description || "",
          confidence: typeof rec.confidence === "number" ? rec.confidence : 0.5,
        },
      });
      recommendations.push(saved);
    }

    return NextResponse.json(recommendations, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
