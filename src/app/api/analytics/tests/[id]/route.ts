import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

// GET /api/analytics/tests/:id — Get test detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const test = await prisma.strategyTest.findUnique({ where: { id } });
  if (!test) return notFound("Strategy test not found");

  return NextResponse.json(test);
}

// PATCH /api/analytics/tests/:id — Update test (results, conclusion, status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;
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
}
