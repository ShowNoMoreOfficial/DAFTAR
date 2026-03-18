import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { hasPermission } from "@/lib/permissions";

// GET /api/relay/analytics — Aggregated analytics across posts
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const brandId = searchParams.get("brandId");
  const platform = searchParams.get("platform");
  const period = searchParams.get("period") || "30"; // 7, 30, 90 days

  const postWhere: Record<string, unknown> = {};

  // Role-based scoping
  const { role, id: userId, accessibleBrandIds } = session.user;
  if (role === "CLIENT") {
    postWhere.brandId = { in: accessibleBrandIds };
  } else if (role === "MEMBER" || role === "CONTRACTOR") {
    postWhere.createdById = userId;
  }

  if (brandId) postWhere.brandId = brandId;
  if (platform) postWhere.platform = platform;

  // Apply period filter
  const periodDays = parseInt(period) || 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - periodDays);
  postWhere.createdAt = { gte: fromDate };

  // Get all posts matching filters
  const posts = await prisma.contentPost.findMany({
    where: postWhere,
    select: {
      id: true,
      title: true,
      platform: true,
      status: true,
      publishedAt: true,
      brand: { select: { id: true, name: true } },
      analytics: {
        select: {
          views: true,
          likes: true,
          shares: true,
          comments: true,
          clicks: true,
          reach: true,
          impressions: true,
          engagementRate: true,
        },
      },
    },
  });

  // Aggregate totals
  let totalViews = 0;
  let totalLikes = 0;
  let totalShares = 0;
  let totalComments = 0;
  let totalClicks = 0;
  let totalReach = 0;
  let totalImpressions = 0;
  let totalEngagementSum = 0;
  let postsWithAnalytics = 0;

  const platformMap: Record<string, { posts: number; views: number; engagementSum: number; analyticsCount: number }> = {};

  for (const post of posts) {
    const a = post.analytics;
    if (a) {
      totalViews += a.views;
      totalLikes += a.likes;
      totalShares += a.shares;
      totalComments += a.comments;
      totalClicks += a.clicks;
      totalReach += a.reach;
      totalImpressions += a.impressions;
      totalEngagementSum += a.engagementRate;
      postsWithAnalytics++;
    }

    if (!platformMap[post.platform]) {
      platformMap[post.platform] = { posts: 0, views: 0, engagementSum: 0, analyticsCount: 0 };
    }
    platformMap[post.platform].posts++;
    if (a) {
      platformMap[post.platform].views += a.views;
      platformMap[post.platform].engagementSum += a.engagementRate;
      platformMap[post.platform].analyticsCount++;
    }
  }

  const avgEngagementRate = postsWithAnalytics > 0
    ? Math.round((totalEngagementSum / postsWithAnalytics) * 100) / 100
    : 0;

  const totalEngagement = totalLikes + totalComments + totalShares + totalClicks;

  const platformBreakdown = Object.entries(platformMap).map(([name, data]) => ({
    platform: name,
    posts: data.posts,
    views: data.views,
    engagementRate: data.analyticsCount > 0
      ? Math.round((data.engagementSum / data.analyticsCount) * 100) / 100
      : 0,
  }));

  // Top 5 posts by engagement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topPosts = (posts as any[])
    .filter((p: any) => p.analytics)
    .sort((a: any, b: any) => (b.analytics?.engagementRate ?? 0) - (a.analytics?.engagementRate ?? 0))
    .slice(0, 5)
    .map((p: any) => ({
      id: p.id,
      title: p.title,
      platform: p.platform,
      brandName: p.brand?.name ?? "",
      views: p.analytics?.views ?? 0,
      engagementRate: p.analytics?.engagementRate ?? 0,
      publishedAt: p.publishedAt,
    }));

  return NextResponse.json({
    totalPosts: posts.length,
    totalViews,
    totalEngagement,
    avgEngagementRate,
    totalLikes,
    totalShares,
    totalComments,
    totalClicks,
    totalReach,
    totalImpressions,
    platformBreakdown,
    topPosts,
  });
});
