import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest, notFound } from "@/lib/api-utils";

// POST /api/signals/trends/:id/signals — Add signal to trend
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id: trendId } = await params;

  // Verify trend exists
  const trend = await prisma.trend.findUnique({ where: { id: trendId } });
  if (!trend) return notFound("Trend not found");

  const body = await req.json();
  const {
    title,
    content,
    source,
    sourceCredibility,
    eventType,
    stakeholders,
    eventMarkers,
    visualAnchors,
    geoRelevance,
    sentiment,
    isDuplicate,
    duplicateOfId,
  } = body;

  if (!title || !source) return badRequest("title and source are required");

  const signal = await prisma.signal.create({
    data: {
      trendId,
      title,
      content: content ?? null,
      source,
      sourceCredibility: sourceCredibility ?? null,
      eventType: eventType ?? null,
      stakeholders: stakeholders ?? undefined,
      eventMarkers: eventMarkers ?? undefined,
      visualAnchors: visualAnchors ?? undefined,
      geoRelevance: geoRelevance ?? undefined,
      sentiment: sentiment ?? null,
      isDuplicate: isDuplicate ?? false,
      duplicateOfId: duplicateOfId ?? null,
    },
  });

  // Update trend's signal count context (touch updatedAt)
  await prisma.trend.update({
    where: { id: trendId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ data: signal }, { status: 201 });
}
