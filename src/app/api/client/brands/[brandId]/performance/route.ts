import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/client/brands/[brandId]/performance
export const GET = apiHandler(async (_req: NextRequest, { session, params }) => {
  const { brandId } = params;

  // Load brand with client ownership info
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      client: { select: { id: true, name: true, userId: true } },
      platforms: { select: { platform: true, isActive: true } },
    },
  });

  if (!brand) return notFound("Brand not found");

  // Verify ownership: CLIENT must own the brand, ADMIN can see all
  if (session.user.role === "CLIENT") {
    if (brand.client.userId !== session.user.id) return forbidden();
  } else if (session.user.role !== "ADMIN") {
    return forbidden();
  }

  // Fetch published posts with analytics
  const posts = await prisma.contentPost.findMany({
    where: {
      brandId,
      status: "PUBLISHED",
    },
    include: {
      analytics: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  // Aggregate metrics
  let totalViews = 0;
  let totalLikes = 0;
  let totalShares = 0;
  let totalEngagement = 0;
  let analyticsCount = 0;

  for (const post of posts) {
    if (post.analytics) {
      totalViews += post.analytics.views;
      totalLikes += post.analytics.likes;
      totalShares += post.analytics.shares;
      totalEngagement += post.analytics.engagementRate;
      analyticsCount++;
    }
  }

  const avgEngagement = analyticsCount > 0 ? totalEngagement / analyticsCount : 0;

  // Count pending deliverables
  const pendingDeliverables = await prisma.clientDeliverable.count({
    where: {
      brandId,
      status: { in: ["pending", "ready_for_review"] },
    },
  });

  return NextResponse.json({
    brand: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      client: brand.client,
      platforms: brand.platforms,
    },
    metrics: {
      totalPosts: posts.length,
      totalViews,
      totalLikes,
      totalShares,
      avgEngagement: Math.round(avgEngagement * 100) / 100,
      pendingDeliverables,
    },
    recentPosts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      platform: post.platform,
      publishedAt: post.publishedAt,
      publishedUrl: post.publishedUrl,
      analytics: post.analytics
        ? {
            views: post.analytics.views,
            likes: post.analytics.likes,
            comments: post.analytics.comments,
            shares: post.analytics.shares,
            engagementRate: post.analytics.engagementRate,
          }
        : null,
    })),
  });
});
