import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async () => {
  const platforms = await prisma.platformConfig.findMany({
    orderBy: { platform: "asc" },
  });

  return NextResponse.json(platforms);
});

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { platform, displayName, deliverableTypes, postingRules, analyticsMetrics, isActive } = body;

  if (!platform) return badRequest("Platform identifier is required");
  if (!displayName) return badRequest("Display name is required");
  if (!deliverableTypes) return badRequest("Deliverable types are required");

  const config = await prisma.platformConfig.create({
    data: {
      platform,
      displayName,
      deliverableTypes,
      postingRules,
      analyticsMetrics,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  return NextResponse.json(config, { status: 201 });
});
