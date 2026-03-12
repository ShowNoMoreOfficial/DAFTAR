import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden } from "@/lib/api-utils";

// GET /api/client/dashboard — Aggregated client dashboard data
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") {
    return forbidden();
  }

  const userId = session.user.id;

  // Find the client record linked to this user
  const client = await prisma.client.findFirst({
    where: { userId },
    include: {
      brands: {
        include: {
          platforms: { select: { platform: true, isActive: true } },
        },
      },
    },
  });

  if (!client) {
    // Fallback: check UserBrandAccess
    const brandAccess = await prisma.userBrandAccess.findMany({
      where: { userId },
      include: {
        brand: {
          include: {
            client: { select: { id: true, name: true } },
            platforms: { select: { platform: true, isActive: true } },
          },
        },
      },
    });

    if (brandAccess.length === 0) {
      return NextResponse.json({
        brands: [],
        pendingReview: [],
        recentContent: [],
        calendar: [],
        stats: { totalBrands: 0, pendingReviewCount: 0, publishedCount: 0, totalViews: 0 },
      });
    }

    const brandIds = brandAccess.map((ba) => ba.brandId);
    return buildDashboardResponse(brandIds, brandAccess.map((ba) => ({
      id: ba.brand.id,
      name: ba.brand.name,
      slug: (ba.brand as { slug?: string }).slug || "",
      clientName: ba.brand.client.name,
      platforms: ba.brand.platforms,
    })));
  }

  const brandIds = client.brands.map((b) => b.id);

  return buildDashboardResponse(brandIds, client.brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    clientName: client.name,
    platforms: b.platforms,
  })));
}

async function buildDashboardResponse(
  brandIds: string[],
  brands: { id: string; name: string; slug: string; clientName: string; platforms: { platform: string; isActive: boolean }[] }[]
) {
  if (brandIds.length === 0) {
    return NextResponse.json({
      brands: [],
      pendingReview: [],
      recentContent: [],
      calendar: [],
      stats: { totalBrands: 0, pendingReviewCount: 0, publishedCount: 0, totalViews: 0 },
    });
  }

  // Pending deliverables across all brands
  const pendingReview = await prisma.clientDeliverable.findMany({
    where: {
      brandId: { in: brandIds },
      status: { in: ["pending", "ready_for_review"] },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Recently published content
  const recentContent = await prisma.contentPost.findMany({
    where: {
      brandId: { in: brandIds },
      status: "PUBLISHED",
    },
    include: {
      analytics: true,
      brand: { select: { id: true, name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 10,
  });

  // Upcoming scheduled posts (calendar)
  const now = new Date();
  const twoWeeksLater = new Date(now);
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

  const calendar = await prisma.contentPost.findMany({
    where: {
      brandId: { in: brandIds },
      status: "SCHEDULED",
      scheduledAt: { gte: now, lte: twoWeeksLater },
    },
    include: {
      brand: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 20,
  });

  // Aggregate stats
  const publishedCount = await prisma.contentPost.count({
    where: { brandId: { in: brandIds }, status: "PUBLISHED" },
  });

  let totalViews = 0;
  for (const post of recentContent) {
    if (post.analytics) {
      totalViews += post.analytics.views;
    }
  }

  return NextResponse.json({
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      clientName: b.clientName,
      platforms: b.platforms,
    })),
    pendingReview: pendingReview.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      status: d.status,
      brandName: d.brand.name,
      brandId: d.brand.id,
      createdAt: d.createdAt,
    })),
    recentContent: recentContent.map((p) => ({
      id: p.id,
      title: p.title,
      platform: p.platform,
      brandName: p.brand.name,
      publishedAt: p.publishedAt,
      views: p.analytics?.views ?? 0,
      likes: p.analytics?.likes ?? 0,
      engagementRate: p.analytics?.engagementRate ?? 0,
    })),
    calendar: calendar.map((p) => ({
      id: p.id,
      title: p.title,
      platform: p.platform,
      brandName: p.brand.name,
      scheduledAt: p.scheduledAt,
    })),
    stats: {
      totalBrands: brands.length,
      pendingReviewCount: pendingReview.length,
      publishedCount,
      totalViews,
    },
  });
}
