import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/client/brands/[brandId]/reports
export const GET = apiHandler(async (_req: NextRequest, { session, params }) => {
  const { brandId } = params;

  // Verify brand ownership
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { client: { select: { id: true, userId: true } } },
  });

  if (!brand) return notFound("Brand not found");

  if (session.user.role === "CLIENT") {
    if (brand.client.userId !== session.user.id) return forbidden();
  } else if (session.user.role !== "ADMIN") {
    return forbidden();
  }

  const reports = await prisma.clientReport.findMany({
    where: { brandId },
    orderBy: { generatedAt: "desc" },
  });

  return NextResponse.json(reports);
});
