import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";

// GET /api/relay/calendar — Get calendar entries for a date range
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const brandId = searchParams.get("brandId");
  const platform = searchParams.get("platform");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};

  // Role-based scoping
  const { role, id: userId, accessibleBrandIds } = session.user;
  if (role === "CLIENT") {
    where.brandId = { in: accessibleBrandIds };
  } else if (role === "MEMBER" || role === "CONTRACTOR") {
    where.OR = [{ assigneeId: userId }, { createdById: userId }];
  }

  if (brandId) where.brandId = brandId;
  if (platform) where.platform = platform;
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const entries = await prisma.contentCalendarEntry.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json(entries);
}

// POST /api/relay/calendar — Create a calendar entry
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, brandId, platform, deliverableType, date, assigneeId, metadata } = body;

  if (!title) return badRequest("Title is required");
  if (!brandId) return badRequest("Brand ID is required");
  if (!platform) return badRequest("Platform is required");
  if (!deliverableType) return badRequest("Deliverable type is required");
  if (!date) return badRequest("Date is required");

  // CLIENT users can only create entries for their brands
  if (session.user.role === "CLIENT") {
    if (!session.user.accessibleBrandIds.includes(brandId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const entry = await prisma.contentCalendarEntry.create({
    data: {
      title,
      description,
      brandId,
      platform,
      deliverableType,
      date: new Date(date),
      assigneeId: assigneeId || null,
      metadata: metadata || undefined,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
