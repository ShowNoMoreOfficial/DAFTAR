import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api-utils";

// GET /api/signals/trends/:id — Trend detail with all signals
export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params;

  const trend = await prisma.trend.findUnique({
    where: { id },
    include: {
      signals: {
        orderBy: { detectedAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          source: true,
          sourceCredibility: true,
          eventType: true,
          stakeholders: true,
          geoRelevance: true,
          sentiment: true,
          detectedAt: true,
          isDuplicate: true,
        },
      },
      relatedTrends: {
        include: {
          relatedTrend: { select: { id: true, name: true, lifecycle: true, velocityScore: true } },
        },
      },
      relatedFrom: {
        include: {
          sourceTrend: { select: { id: true, name: true, lifecycle: true, velocityScore: true } },
        },
      },
      _count: { select: { signals: true } },
    },
  });

  if (!trend) return notFound("Trend not found");

  return NextResponse.json({ data: trend });
});

// PATCH /api/signals/trends/:id — Update trend
export const PATCH = apiHandler(async (req: NextRequest, { params }) => {
  const { id } = params;
  const body = await req.json();
  const { name, description, lifecycle, velocityScore } = body;

  const trend = await prisma.trend.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(lifecycle !== undefined && { lifecycle }),
      ...(velocityScore !== undefined && { velocityScore }),
    },
  });

  return NextResponse.json({ data: trend });
});
