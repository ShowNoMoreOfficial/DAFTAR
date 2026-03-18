import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/analytics/tests/:id — Get test detail
export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params;
  const test = await prisma.strategyTest.findUnique({ where: { id } });
  if (!test) return notFound("Strategy test not found");

  return NextResponse.json(test);
});

// PATCH /api/analytics/tests/:id — Update test (results, conclusion, status)
export const PATCH = apiHandler(async (req: NextRequest, { params }) => {
  const { id } = params;
  const body = await req.json();

  const test = await prisma.strategyTest.findUnique({ where: { id } });
  if (!test) return notFound("Strategy test not found");

  const updated = await prisma.strategyTest.update({
    where: { id },
    data: {
      ...(body.results !== undefined && { results: body.results }),
      ...(body.conclusion !== undefined && { conclusion: body.conclusion }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
    },
  });

  return NextResponse.json(updated);
});
