import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";

// GET /api/relay/analytics — Aggregate analytics overview
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
  if (from || to) {
    postWhere.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  // Get all posts matching filters
  const posts = await prisma.contentPost.findMany({
    where: postWhere,
    select: {
      id: true,
      title: true,
      platform: true,
      status: true,
      publishedAt: true,
      analytics: {
        select: {
          views: true,
          likes: true,
          shares: true,
          comments: true,
          clicks: true,
          reach: true,
          impressions: true,
          engagement: true,
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

  const platformMap: Record<string, { posts: number; views: number; engagement: number }> = {};

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
    }

    if (!platformMap[post.platform]) {
      platformMap[post.platform] = { posts: 0, views: 0, engagement: 0 };
    }
    platformMap[post.platform].posts++;
    if (a) {
      platformMap[post.platform].views += a.views;
      platformMap[post.platform].engagement += a.engagement;
    }
  }

  const totalEngagement = totalImpressions > 0
    ? ((totalLikes + totalComments + totalShares + totalClicks) / totalImpressions) * 100
    : 0;

  const platformBreakdown = Object.entries(platformMap).map(([name, data]) => ({
    platform: name,
    posts: data.posts,
    views: data.views,
    avgEngagement: data.posts > 0 ? data.engagement / data.posts : 0,
  }));

  // Top 5 posts by views
  const topPosts = posts
    .filter((p) => p.analytics)
    .sort((a, b) => (b.analytics?.views ?? 0) - (a.analytics?.views ?? 0))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.title,
      platform: p.platform,
      views: p.analytics?.views ?? 0,
      engagement: p.analytics?.engagement ?? 0,
    }));

  return NextResponse.json({
    totalPosts: posts.length,
    totalViews,
    totalEngagement: Math.round(totalEngagement * 100) / 100,
    totalLikes,
    totalShares,
    totalComments,
    totalClicks,
    totalReach,
    totalImpressions,
    platformBreakdown,
    topPosts,
  });
}
