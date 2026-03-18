import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/analytics/performance — List content performance records
export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform");
  const tier = searchParams.get("tier");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};
  if (platform) where.platform = platform;
  if (tier) where.performanceTier = tier;

  const [records, total] = await Promise.all([
    prisma.contentPerformance.findMany({
      where,
      orderBy: { lastUpdated: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contentPerformance.count({ where }),
  ]);

  return NextResponse.json({ records, total, page, limit });
});

// POST /api/analytics/performance — Record content performance
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { deliverableId, brandId, platform, metrics, skillsUsed } = body;

  if (!deliverableId || !brandId || !platform || !metrics) {
    return badRequest("deliverableId, brandId, platform, and metrics are required");
  }

  const record = await prisma.contentPerformance.create({
    data: {
      deliverableId,
      brandId,
      platform,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      metrics,
      revenueGenerated: body.revenueGenerated,
      skillsUsed: skillsUsed || [],
      narrativeAngle: body.narrativeAngle,
      hookType: body.hookType,
      performanceTier: body.performanceTier,
      benchmarkDelta: body.benchmarkDelta,
    },
  });

  return NextResponse.json(record, { status: 201 });
});
