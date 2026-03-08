import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";

// GET /api/relay/calendar — Get scheduled and published posts for calendar display
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const brandId = searchParams.get("brandId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = {};

  // Role-based scoping
  const { role, id: userId, accessibleBrandIds } = session.user;
  if (role === "CLIENT") {
    where.brandId = { in: accessibleBrandIds };
  } else if (role === "MEMBER" || role === "CONTRACTOR") {
    where.createdById = userId;
  } else if (role === "DEPT_HEAD") {
    if (accessibleBrandIds.length > 0) {
      where.brandId = { in: accessibleBrandIds };
    }
  }

  if (brandId) where.brandId = brandId;

  // Only show posts that are scheduled or published
  where.status = { in: ["SCHEDULED", "PUBLISHED", "PUBLISHING", "DRAFT"] };

  // Date range based on month/year
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  where.OR = [
    { scheduledAt: { gte: startDate, lte: endDate } },
    { publishedAt: { gte: startDate, lte: endDate } },
    { createdAt: { gte: startDate, lte: endDate }, scheduledAt: null, publishedAt: null },
  ];

  const posts = await prisma.contentPost.findMany({
    where,
    select: {
      id: true,
      title: true,
      platform: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
      createdAt: true,
      brandId: true,
      brand: { select: { id: true, name: true } },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
  });

  // Format for calendar display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendarEntries = (posts as any[]).map((post: any) => ({
    id: post.id,
    title: post.title,
    platform: post.platform,
    status: post.status,
    date: post.scheduledAt || post.publishedAt || post.createdAt,
    brandId: post.brandId,
    brandName: post.brand?.name ?? "",
  }));

  return NextResponse.json(calendarEntries);
}
