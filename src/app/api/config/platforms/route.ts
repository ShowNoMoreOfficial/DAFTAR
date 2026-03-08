import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const platforms = await prisma.platformConfig.findMany({
    orderBy: { platform: "asc" },
  });

  return NextResponse.json(platforms);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

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
}
