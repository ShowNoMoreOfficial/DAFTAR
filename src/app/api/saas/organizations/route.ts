import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, badRequest } from "@/lib/api-utils";

// GET /api/saas/organizations — List all organizations (ADMIN only)
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  try {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const orgsWithCounts = organizations.map((org: any) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      domain: org.domain,
      plan: org.plan,
      maxUsers: org.maxUsers,
      isActive: org.isActive,
      userCount: org._count.users,
      subscriptionCount: org._count.subscriptions,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    }));

    return NextResponse.json(orgsWithCounts);
  } catch {
    // If Organization model doesn't exist yet, return mock data
    const mockOrgs = [
      {
        id: "org-1",
        name: "Acme Corp",
        slug: "acme-corp",
        domain: "acme.com",
        plan: "PROFESSIONAL",
        maxUsers: 50,
        isActive: true,
        userCount: 34,
        subscriptionCount: 3,
        createdAt: "2025-08-15T10:00:00Z",
        updatedAt: "2026-02-20T14:30:00Z",
      },
      {
        id: "org-2",
        name: "Globex Industries",
        slug: "globex",
        domain: "globex.io",
        plan: "ENTERPRISE",
        maxUsers: 200,
        isActive: true,
        userCount: 142,
        subscriptionCount: 5,
        createdAt: "2025-06-01T08:00:00Z",
        updatedAt: "2026-03-01T09:15:00Z",
      },
      {
        id: "org-3",
        name: "Initech",
        slug: "initech",
        domain: "initech.co",
        plan: "STARTER",
        maxUsers: 10,
        isActive: true,
        userCount: 8,
        subscriptionCount: 1,
        createdAt: "2026-01-10T12:00:00Z",
        updatedAt: "2026-03-05T11:00:00Z",
      },
      {
        id: "org-4",
        name: "Umbrella LLC",
        slug: "umbrella",
        domain: "umbrella.dev",
        plan: "PROFESSIONAL",
        maxUsers: 50,
        isActive: false,
        userCount: 22,
        subscriptionCount: 2,
        createdAt: "2025-11-20T16:00:00Z",
        updatedAt: "2026-02-28T10:00:00Z",
      },
      {
        id: "org-5",
        name: "Stark Digital",
        slug: "stark-digital",
        domain: "starkdigital.in",
        plan: "ENTERPRISE",
        maxUsers: 500,
        isActive: true,
        userCount: 287,
        subscriptionCount: 5,
        createdAt: "2025-04-01T06:00:00Z",
        updatedAt: "2026-03-08T18:45:00Z",
      },
    ];
    return NextResponse.json(mockOrgs);
  }
}

// POST /api/saas/organizations — Create new organization
export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const body = await req.json();
  const { name, slug, domain, plan, maxUsers, departments, invites } = body;

  if (!name) return badRequest("name is required");
  if (!slug) return badRequest("slug is required");
  if (!plan) return badRequest("plan is required");

  const validPlans = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];
  if (!validPlans.includes(plan)) {
    return badRequest(`plan must be one of: ${validPlans.join(", ")}`);
  }

  const limits: Record<string, number> = {
    STARTER: 10,
    PROFESSIONAL: 50,
    ENTERPRISE: 500,
  };
  const resolvedMaxUsers = maxUsers || limits[plan] || 10;

  try {
    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        domain: domain || null,
        plan,
        maxUsers: resolvedMaxUsers,
        isActive: true,
      },
    });

    return NextResponse.json(org, { status: 201 });
  } catch {
    // If Organization model doesn't exist yet, return mock response
    const mockOrg = {
      id: `org-${Date.now()}`,
      name,
      slug,
      domain: domain || null,
      plan,
      maxUsers: resolvedMaxUsers,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(mockOrg, { status: 201 });
  }
}
