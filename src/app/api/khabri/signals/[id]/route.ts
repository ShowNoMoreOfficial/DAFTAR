import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const signal = await prisma.signal.findUnique({
    where: { id },
    include: {
      trend: {
        select: { id: true, name: true, lifecycle: true, velocityScore: true },
      },
    },
  });

  if (!signal) return notFound("Signal not found");

  return NextResponse.json({
    id: signal.id,
    title: signal.title,
    content: signal.content,
    source: signal.source,
    sourceCredibility: signal.sourceCredibility,
    eventType: signal.eventType,
    stakeholders: signal.stakeholders,
    eventMarkers: signal.eventMarkers,
    visualAnchors: signal.visualAnchors,
    geoRelevance: signal.geoRelevance,
    sentiment: signal.sentiment,
    detectedAt: signal.detectedAt.toISOString(),
    trend: signal.trend
      ? {
          id: signal.trend.id,
          name: signal.trend.name,
          lifecycle: signal.trend.lifecycle,
          velocity: signal.trend.velocityScore,
        }
      : null,
  });
}
