import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params;

  const config = await prisma.platformConfig.findUnique({ where: { id } });
  if (!config) return notFound("Platform config not found");

  return NextResponse.json(config);
});

export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const existing = await prisma.platformConfig.findUnique({ where: { id } });
  if (!existing) return notFound("Platform config not found");

  const body = await req.json();
  const { platform, displayName, deliverableTypes, postingRules, analyticsMetrics, isActive } = body;

  const data: Record<string, unknown> = {};
  if (platform !== undefined) data.platform = platform;
  if (displayName !== undefined) data.displayName = displayName;
  if (deliverableTypes !== undefined) data.deliverableTypes = deliverableTypes;
  if (postingRules !== undefined) data.postingRules = postingRules;
  if (analyticsMetrics !== undefined) data.analyticsMetrics = analyticsMetrics;
  if (isActive !== undefined) data.isActive = isActive;

  const config = await prisma.platformConfig.update({
    where: { id },
    data,
  });

  return NextResponse.json(config);
});

export const DELETE = apiHandler(async (_req: NextRequest, { session, params }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const existing = await prisma.platformConfig.findUnique({ where: { id } });
  if (!existing) return notFound("Platform config not found");

  await prisma.platformConfig.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
