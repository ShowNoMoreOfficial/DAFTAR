import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";

// GET /api/relay/connections — List platform connections for accessible brands
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const brandId = searchParams.get("brandId");

  const where: Record<string, unknown> = {};

  // Role-based scoping
  const { role, accessibleBrandIds } = session.user;
  if (role === "CLIENT") {
    where.brandId = { in: accessibleBrandIds };
  } else if (role === "MEMBER" || role === "CONTRACTOR") {
    where.brandId = { in: accessibleBrandIds };
  } else if (role === "DEPT_HEAD") {
    if (accessibleBrandIds.length > 0) {
      where.brandId = { in: accessibleBrandIds };
    }
  }
  // ADMIN sees all

  if (brandId) where.brandId = brandId;

  const connections = await prisma.platformConnection.findMany({
    where,
    include: {
      brand: { select: { id: true, name: true } },
    },
    orderBy: { connectedAt: "desc" },
  });

  return NextResponse.json(connections);
}

// POST /api/relay/connections — Create or update a platform connection (ADMIN only)
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { brandId, platform, accountId, accountName, config } = body;

  if (!brandId) return badRequest("Brand ID is required");
  if (!platform) return badRequest("Platform is required");

  const validPlatforms = ["youtube", "x", "instagram", "linkedin", "facebook"];
  if (!validPlatforms.includes(platform)) {
    return badRequest("Invalid platform. Must be one of: " + validPlatforms.join(", "));
  }

  // Verify brand exists
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) return badRequest("Brand not found");

  const connection = await prisma.platformConnection.upsert({
    where: {
      brandId_platform: { brandId, platform },
    },
    create: {
      brandId,
      platform,
      accountId: accountId || null,
      accountName: accountName || null,
      config: config || undefined,
      isActive: true,
    },
    update: {
      accountId: accountId || null,
      accountName: accountName || null,
      config: config || undefined,
      isActive: true,
    },
    include: {
      brand: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(connection, { status: 201 });
}
