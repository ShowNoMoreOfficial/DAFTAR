import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/analytics/tests — List strategy tests
export const GET = apiHandler(async (req: NextRequest) => {
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
});

// POST /api/analytics/tests — Create a strategy test
export const POST = apiHandler(async (req: NextRequest) => {
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
});
