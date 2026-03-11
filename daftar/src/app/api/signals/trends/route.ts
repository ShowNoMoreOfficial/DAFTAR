import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

// GET /api/signals/trends — List active trends with lifecycle status
export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "20"));
  const lifecycle = searchParams.get("lifecycle"); // emerging, peaking, declining, resurgent

  const where = lifecycle ? { lifecycle } : {};

  const [trends, total] = await Promise.all([
    prisma.trend.findMany({
      where,
      include: {
        _count: { select: { signals: true } },
        signals: {
          orderBy: { detectedAt: "desc" },
          take: 3,
          select: { id: true, title: true, source: true, detectedAt: true },
        },
        relatedTrends: {
          include: {
            relatedTrend: { select: { id: true, name: true, lifecycle: true } },
          },
        },
      },
      orderBy: [{ velocityScore: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.trend.count({ where }),
  ]);

  return NextResponse.json({
    data: trends,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

// POST /api/signals/trends — Create/track a new trend
export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { name, description, lifecycle, velocityScore } = body;

  if (!name) return badRequest("name is required");

  const trend = await prisma.trend.create({
    data: {
      name,
      description: description ?? null,
      lifecycle: lifecycle ?? "emerging",
      velocityScore: velocityScore ?? null,
    },
  });

  return NextResponse.json({ data: trend }, { status: 201 });
}
