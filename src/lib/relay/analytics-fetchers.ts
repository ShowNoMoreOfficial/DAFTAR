/**
 * Platform Analytics Fetchers
 *
 * Fetch real performance metrics from platform APIs for published content.
 * Each fetcher takes a PlatformConnection + platformPostId and returns
 * standardized metrics.
 *
 * Platforms:
 *  - YouTube Data API v3
 *  - Twitter/X API v2
 *  - Instagram Insights (Meta Graph API)
 *  - Facebook Insights (Meta Graph API)
 *  - LinkedIn Analytics (Community Management API)
 */

import { prisma } from "@/lib/prisma";
import { refreshTwitterToken, refreshYouTubeToken } from "@/lib/relay/oauth-helpers";

// ─── Standardized metrics shape ──────────────────────────

export interface PlatformMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  // Platform-specific
  ctr?: number; // YouTube
  retention?: number; // YouTube avg % retention
  watchTime?: number; // YouTube total watch seconds
  saves?: number; // Instagram
  retweets?: number; // Twitter/X
  quotes?: number; // Twitter/X
  rawData: Record<string, unknown>;
}

// ─── Get access token (with refresh if needed) ───────────

async function getAccessToken(
  connectionId: string,
  platform: string
): Promise<string | null> {
  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
  });
  if (!conn?.accessToken) return null;

  // Check if token might be expired and refresh
  if (conn.tokenExpiresAt && conn.tokenExpiresAt < new Date()) {
    if (platform === "x" && conn.refreshToken) {
      try {
        const refreshed = await refreshTwitterToken(conn.refreshToken);
        const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000);
        await prisma.platformConnection.update({
          where: { id: connectionId },
          data: {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token ?? conn.refreshToken,
            tokenExpiresAt: newExpiry,
          },
        });
        return refreshed.access_token;
      } catch {
        return null;
      }
    }
    // YouTube: refresh via Google OAuth
    if (platform === "youtube" && conn.refreshToken) {
      try {
        const refreshed = await refreshYouTubeToken(conn.refreshToken);
        const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000);
        await prisma.platformConnection.update({
          where: { id: connectionId },
          data: {
            accessToken: refreshed.access_token,
            tokenExpiresAt: newExpiry,
          },
        });
        return refreshed.access_token;
      } catch {
        return null;
      }
    }
    // LinkedIn / Meta: long-lived tokens, no refresh needed
  }

  return conn.accessToken;
}

// ─── YouTube Analytics ───────────────────────────────────

export async function fetchYouTubeMetrics(
  connectionId: string,
  videoId: string
): Promise<PlatformMetrics | null> {
  const token = await getAccessToken(connectionId, "youtube");
  if (!token) return null;

  try {
    // Fetch video statistics
    const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    statsUrl.searchParams.set("part", "statistics,contentDetails");
    statsUrl.searchParams.set("id", videoId);

    const statsRes = await fetch(statsUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!statsRes.ok) {
      console.error("[yt-analytics] Stats fetch failed:", statsRes.status);
      return null;
    }

    const statsData = await statsRes.json();
    const item = statsData.items?.[0];
    if (!item) return null;

    const stats = item.statistics;
    const views = parseInt(stats.viewCount || "0", 10);
    const likes = parseInt(stats.likeCount || "0", 10);
    const comments = parseInt(stats.commentCount || "0", 10);

    // Fetch analytics (requires YouTube Analytics API)
    let ctr: number | undefined;
    let retention: number | undefined;
    let watchTime: number | undefined;

    try {
      const analyticsUrl = new URL(
        "https://youtubeanalytics.googleapis.com/v2/reports"
      );
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      analyticsUrl.searchParams.set("ids", "channel==MINE");
      analyticsUrl.searchParams.set(
        "startDate",
        weekAgo.toISOString().split("T")[0]
      );
      analyticsUrl.searchParams.set(
        "endDate",
        now.toISOString().split("T")[0]
      );
      analyticsUrl.searchParams.set(
        "metrics",
        "estimatedMinutesWatched,averageViewPercentage,cardClickRate"
      );
      analyticsUrl.searchParams.set("filters", `video==${videoId}`);

      const analyticsRes = await fetch(analyticsUrl.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        const row = analyticsData.rows?.[0];
        if (row) {
          watchTime = (row[0] ?? 0) * 60; // minutes → seconds
          retention = row[1] ?? undefined;
          ctr = row[2] ?? undefined;
        }
      }
    } catch {
      // Analytics API might not be available — stats are sufficient
    }

    const engagementRate =
      views > 0 ? ((likes + comments) / views) * 100 : 0;

    return {
      views,
      likes,
      comments,
      shares: 0, // YouTube doesn't expose share count directly
      clicks: 0,
      reach: views,
      impressions: views,
      engagementRate: Math.round(engagementRate * 100) / 100,
      ctr,
      retention,
      watchTime,
      rawData: { statistics: stats, videoId },
    };
  } catch (err) {
    console.error("[yt-analytics] Error:", err);
    return null;
  }
}

// ─── Twitter/X Analytics ─────────────────────────────────

export async function fetchTwitterMetrics(
  connectionId: string,
  tweetId: string
): Promise<PlatformMetrics | null> {
  const token = await getAccessToken(connectionId, "x");
  if (!token) return null;

  try {
    const url = new URL(`https://api.twitter.com/2/tweets/${tweetId}`);
    url.searchParams.set(
      "tweet.fields",
      "public_metrics,non_public_metrics,organic_metrics"
    );

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error("[x-analytics] Tweet fetch failed:", res.status);
      return null;
    }

    const data = await res.json();
    const pub = data.data?.public_metrics;
    const organic = data.data?.organic_metrics;
    const nonPublic = data.data?.non_public_metrics;

    if (!pub) return null;

    const impressions =
      organic?.impression_count ?? nonPublic?.impression_count ?? 0;
    const views = impressions;
    const likes = pub.like_count ?? 0;
    const retweets = pub.retweet_count ?? 0;
    const quotes = pub.quote_count ?? 0;
    const comments = pub.reply_count ?? 0;
    const clicks = nonPublic?.url_link_clicks ?? 0;

    const engagementRate =
      impressions > 0
        ? ((likes + retweets + quotes + comments + clicks) / impressions) * 100
        : 0;

    return {
      views,
      likes,
      comments,
      shares: retweets + quotes,
      clicks,
      reach: impressions,
      impressions,
      engagementRate: Math.round(engagementRate * 100) / 100,
      retweets,
      quotes,
      rawData: {
        public_metrics: pub,
        organic_metrics: organic,
        non_public_metrics: nonPublic,
      },
    };
  } catch (err) {
    console.error("[x-analytics] Error:", err);
    return null;
  }
}

// ─── Instagram Insights ──────────────────────────────────

export async function fetchInstagramMetrics(
  connectionId: string,
  mediaId: string
): Promise<PlatformMetrics | null> {
  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
  });
  if (!conn) return null;

  const config = (conn.config as Record<string, unknown>) ?? {};
  const pageToken = (config.pageAccessToken as string) || conn.accessToken;
  if (!pageToken) return null;

  try {
    // Fetch media insights
    const insightsUrl = new URL(
      `https://graph.facebook.com/v19.0/${mediaId}/insights`
    );
    insightsUrl.searchParams.set(
      "metric",
      "impressions,reach,saved,shares,comments,likes,plays"
    );
    insightsUrl.searchParams.set("access_token", pageToken);

    const res = await fetch(insightsUrl.toString());

    if (!res.ok) {
      // Fallback to basic media fields
      return await fetchInstagramBasicMetrics(mediaId, pageToken);
    }

    const data = await res.json();
    const metricsMap: Record<string, number> = {};

    for (const entry of data.data ?? []) {
      metricsMap[entry.name] = entry.values?.[0]?.value ?? 0;
    }

    const impressions = metricsMap.impressions ?? 0;
    const reach = metricsMap.reach ?? 0;
    const likes = metricsMap.likes ?? 0;
    const comments = metricsMap.comments ?? 0;
    const shares = metricsMap.shares ?? 0;
    const saves = metricsMap.saved ?? 0;
    const views = metricsMap.plays ?? impressions;

    const engagementRate =
      reach > 0 ? ((likes + comments + shares + saves) / reach) * 100 : 0;

    return {
      views,
      likes,
      comments,
      shares,
      clicks: 0,
      reach,
      impressions,
      engagementRate: Math.round(engagementRate * 100) / 100,
      saves,
      rawData: metricsMap,
    };
  } catch (err) {
    console.error("[ig-analytics] Error:", err);
    return null;
  }
}

async function fetchInstagramBasicMetrics(
  mediaId: string,
  token: string
): Promise<PlatformMetrics | null> {
  try {
    const url = new URL(`https://graph.facebook.com/v19.0/${mediaId}`);
    url.searchParams.set("fields", "like_count,comments_count,timestamp");
    url.searchParams.set("access_token", token);

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    const likes = data.like_count ?? 0;
    const comments = data.comments_count ?? 0;

    return {
      views: 0,
      likes,
      comments,
      shares: 0,
      clicks: 0,
      reach: 0,
      impressions: 0,
      engagementRate: 0,
      rawData: data,
    };
  } catch {
    return null;
  }
}

// ─── Facebook Insights ───────────────────────────────────

export async function fetchFacebookMetrics(
  connectionId: string,
  postId: string
): Promise<PlatformMetrics | null> {
  const conn = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
  });
  if (!conn) return null;

  const config = (conn.config as Record<string, unknown>) ?? {};
  const pageToken = (config.pageAccessToken as string) || conn.accessToken;
  if (!pageToken) return null;

  try {
    const url = new URL(
      `https://graph.facebook.com/v19.0/${postId}/insights`
    );
    url.searchParams.set(
      "metric",
      "post_impressions,post_engaged_users,post_clicks,post_reactions_like_total"
    );
    url.searchParams.set("access_token", pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    const metricsMap: Record<string, number> = {};

    for (const entry of data.data ?? []) {
      metricsMap[entry.name] = entry.values?.[0]?.value ?? 0;
    }

    const impressions = metricsMap.post_impressions ?? 0;
    const likes = metricsMap.post_reactions_like_total ?? 0;
    const clicks = metricsMap.post_clicks ?? 0;
    const engaged = metricsMap.post_engaged_users ?? 0;

    const engagementRate =
      impressions > 0 ? (engaged / impressions) * 100 : 0;

    return {
      views: impressions,
      likes,
      comments: 0,
      shares: 0,
      clicks,
      reach: impressions,
      impressions,
      engagementRate: Math.round(engagementRate * 100) / 100,
      rawData: metricsMap,
    };
  } catch (err) {
    console.error("[fb-analytics] Error:", err);
    return null;
  }
}

// ─── LinkedIn Analytics ──────────────────────────────────

export async function fetchLinkedInMetrics(
  connectionId: string,
  postUrn: string
): Promise<PlatformMetrics | null> {
  const token = await getAccessToken(connectionId, "linkedin");
  if (!token) return null;

  try {
    // LinkedIn uses organization stats API
    const encodedUrn = encodeURIComponent(postUrn);
    const url = `https://api.linkedin.com/v2/socialActions/${encodedUrn}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const likes = data.likesSummary?.totalLikes ?? 0;
    const comments = data.commentsSummary?.totalFirstLevelComments ?? 0;

    return {
      views: 0,
      likes,
      comments,
      shares: 0,
      clicks: 0,
      reach: 0,
      impressions: 0,
      engagementRate: 0,
      rawData: data,
    };
  } catch (err) {
    console.error("[li-analytics] Error:", err);
    return null;
  }
}

// ─── Unified fetcher ─────────────────────────────────────

export async function fetchPlatformMetrics(
  platform: string,
  connectionId: string,
  platformPostId: string
): Promise<PlatformMetrics | null> {
  switch (platform) {
    case "youtube":
      return fetchYouTubeMetrics(connectionId, platformPostId);
    case "x":
      return fetchTwitterMetrics(connectionId, platformPostId);
    case "instagram":
      return fetchInstagramMetrics(connectionId, platformPostId);
    case "facebook":
      return fetchFacebookMetrics(connectionId, platformPostId);
    case "linkedin":
      return fetchLinkedInMetrics(connectionId, platformPostId);
    default:
      console.warn(`[analytics] No fetcher for platform: ${platform}`);
      return null;
  }
}
