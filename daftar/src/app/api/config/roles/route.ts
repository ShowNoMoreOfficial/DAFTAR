import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const roles = await prisma.roleConfig.findMany({
    orderBy: { role: "asc" },
  });

  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { role, dashboardViews, notifications, reportAccess, giConversation } = body;

  if (!role) return badRequest("Role is required");
  if (!dashboardViews) return badRequest("Dashboard views are required");

  const config = await prisma.roleConfig.upsert({
    where: { role },
    update: {
      dashboardViews,
      notifications,
      reportAccess,
      giConversation,
    },
    create: {
      role,
      dashboardViews,
      notifications,
      reportAccess,
      giConversation,
    },
  });

  return NextResponse.json(config, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { role, dashboardViews, notifications, reportAccess, giConversation } = body;

  if (!role) return badRequest("Role is required");
  if (!dashboardViews) return badRequest("Dashboard views are required");

  const config = await prisma.roleConfig.upsert({
    where: { role },
    update: {
      dashboardViews,
      notifications,
      reportAccess,
      giConversation,
    },
    create: {
      role,
      dashboardViews,
      notifications,
      reportAccess,
      giConversation,
    },
  });

  return NextResponse.json(config);
}
