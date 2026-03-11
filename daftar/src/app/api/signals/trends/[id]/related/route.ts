import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

// GET /api/signals/trends/:id/related — Related trend graph
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const trend = await prisma.trend.findUnique({ where: { id } });
  if (!trend) return notFound("Trend not found");

  // Get both directions of relationships
  const [outgoing, incoming] = await Promise.all([
    prisma.trendRelation.findMany({
      where: { sourceTrendId: id },
      include: {
        relatedTrend: {
          select: { id: true, name: true, lifecycle: true, velocityScore: true },
          },
      },
    }),
    prisma.trendRelation.findMany({
      where: { relatedTrendId: id },
      include: {
        sourceTrend: {
          select: { id: true, name: true, lifecycle: true, velocityScore: true },
        },
      },
    }),
  ]);

  const relationships = [
    ...outgoing.map((r) => ({
      id: r.id,
      direction: "outgoing" as const,
      trend: r.relatedTrend,
      relationship: r.relationship,
      strength: r.strength,
    })),
    ...incoming.map((r) => ({
      id: r.id,
      direction: "incoming" as const,
      trend: r.sourceTrend,
      relationship: r.relationship,
      strength: r.strength,
    })),
  ];

  return NextResponse.json({ data: { trendId: id, relationships } });
}

// POST /api/signals/trends/:id/related — Create a trend relationship
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id: sourceTrendId } = await params;
  const body = await req.json();
  const { relatedTrendId, relationship, strength } = body;

  if (!relatedTrendId || !relationship) {
    return NextResponse.json(
      { error: "relatedTrendId and relationship are required" },
      { status: 400 }
    );
  }

  const relation = await prisma.trendRelation.upsert({
    where: {
      sourceTrendId_relatedTrendId: { sourceTrendId, relatedTrendId },
    },
    create: {
      sourceTrendId,
      relatedTrendId,
      relationship,
      strength: strength ?? 0.5,
    },
    update: {
      relationship,
      strength: strength ?? 0.5,
    },
  });

  return NextResponse.json({ data: relation }, { status: 201 });
}
