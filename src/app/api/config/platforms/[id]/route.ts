import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const config = await prisma.platformConfig.findUnique({ where: { id } });
  if (!config) return notFound("Platform config not found");

  return NextResponse.json(config);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
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
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.platformConfig.findUnique({ where: { id } });
  if (!existing) return notFound("Platform config not found");

  await prisma.platformConfig.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
