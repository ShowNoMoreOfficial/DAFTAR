import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

// GET /api/calendar — Unified calendar: ContentPosts + ContentCalendarEntries + Deliverables
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = req.nextUrl;
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const brandId = searchParams.get("brandId");

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Role-based scoping
  const { role, id: userId, accessibleBrandIds } = session.user;
  const brandFilter: Record<string, unknown> = {};
  if (role === "CLIENT") {
    brandFilter.brandId = { in: accessibleBrandIds };
  } else if (role === "MEMBER" || role === "CONTRACTOR") {
    // Members see all brands' calendar entries (read-only view)
  } else if (role === "DEPT_HEAD" && accessibleBrandIds.length > 0) {
    brandFilter.brandId = { in: accessibleBrandIds };
  }
  if (brandId) brandFilter.brandId = brandId;

  // 1. ContentPosts
  const posts = await prisma.contentPost.findMany({
    where: {
      ...brandFilter,
      status: { in: ["DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED"] },
      OR: [
        { scheduledAt: { gte: startDate, lte: endDate } },
        { publishedAt: { gte: startDate, lte: endDate } },
        { createdAt: { gte: startDate, lte: endDate }, scheduledAt: null, publishedAt: null },
      ],
    },
    select: {
      id: true,
      title: true,
      platform: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
      createdAt: true,
      brandId: true,
      brand: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // 2. ContentCalendarEntries
  const calEntries = await prisma.contentCalendarEntry.findMany({
    where: {
      ...brandFilter,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });

  // 3. Deliverables
  const deliverables = await prisma.deliverable.findMany({
    where: {
      ...brandFilter,
      updatedAt: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      platform: true,
      status: true,
      pipelineType: true,
      createdAt: true,
      updatedAt: true,
      brandId: true,
      brand: { select: { name: true } },
      tree: { select: { headline: true } },
    },
    orderBy: { updatedAt: "asc" },
  });

  // Normalize platform strings
  const normPlatform = (p: string) => {
    const map: Record<string, string> = {
      YOUTUBE: "youtube",
      X_THREAD: "x",
      X_SINGLE: "x",
      LINKEDIN: "linkedin",
      META_REEL: "instagram",
      META_CAROUSEL: "instagram",
      META_POST: "facebook",
      BLOG: "blog",
    };
    return map[p] || p.toLowerCase();
  };

  // Map statuses to unified set
  const mapDeliverableStatus = (s: string) => {
    const map: Record<string, string> = {
      PLANNED: "draft",
      RESEARCHING: "draft",
      SCRIPTING: "draft",
      GENERATING_ASSETS: "draft",
      STORYBOARDING: "draft",
      DRAFTED: "draft",
      REVIEW: "review",
      APPROVED: "approved",
      RELAYED: "published",
      PUBLISHED: "published",
      KILLED: "killed",
    };
    return map[s] || "draft";
  };

  const mapPostStatus = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: "draft",
      SCHEDULED: "approved",
      PUBLISHING: "approved",
      PUBLISHED: "published",
      FAILED: "failed",
      CANCELLED: "killed",
    };
    return map[s] || "draft";
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = [];

  for (const p of posts as any[]) {
    items.push({
      id: p.id,
      source: "post",
      title: p.title,
      platform: p.platform,
      status: mapPostStatus(p.status),
      date: p.scheduledAt || p.publishedAt || p.createdAt,
      brandName: p.brand?.name ?? "",
      brandId: p.brandId,
    });
  }

  for (const c of calEntries) {
    items.push({
      id: c.id,
      source: "calendar",
      title: c.title,
      platform: c.platform,
      status: c.status === "posted" ? "published" : c.status === "ready" ? "approved" : c.status === "in_progress" ? "review" : "draft",
      date: c.date,
      brandName: "",
      brandId: c.brandId,
      deliverableType: c.deliverableType,
    });
  }

  for (const d of deliverables as any[]) {
    items.push({
      id: d.id,
      source: "deliverable",
      title: d.tree?.headline || `${d.pipelineType} deliverable`,
      platform: normPlatform(d.platform),
      status: mapDeliverableStatus(d.status),
      date: d.updatedAt,
      brandName: d.brand?.name ?? "",
      brandId: d.brandId,
      pipelineType: d.pipelineType,
    });
  }

  // Sort by date
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({ items, month, year });
});
