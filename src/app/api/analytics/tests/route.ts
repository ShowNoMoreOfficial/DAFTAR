import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

// GET /api/analytics/tests — List strategy tests
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const brandId = searchParams.get("brandId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (brandId) where.brandId = brandId;

  const tests = await prisma.strategyTest.findMany({
    where,
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ tests });
}

// POST /api/analytics/tests — Create a strategy test
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { name, hypothesis, skillPath, brandId, platform, variant } = body;

  if (!name || !hypothesis || !skillPath || !brandId || !platform || !variant) {
    return badRequest("name, hypothesis, skillPath, brandId, platform, and variant are required");
  }

  const test = await prisma.strategyTest.create({
    data: {
      name,
      hypothesis,
      skillPath,
      brandId,
      platform,
      variant,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : null,
      status: "active",
    },
  });

  return NextResponse.json(test, { status: 201 });
}
