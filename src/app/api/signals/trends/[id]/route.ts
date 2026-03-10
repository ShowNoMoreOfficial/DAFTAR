import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

// GET /api/signals/trends/:id — Trend detail with all signals
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

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
}

// PATCH /api/signals/trends/:id — Update trend
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;
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
}
