import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import { hasPermission } from "@/lib/permissions";
import { parsePagination, paginatedResponse } from "@/lib/pagination";
import { daftarEvents } from "@/lib/event-bus";

// GET /api/relay/posts — List content posts with filters, role-scoped
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const brandId = searchParams.get("brandId");
  const platform = searchParams.get("platform");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  // Role-based scoping
  const { role, id: userId, accessibleBrandIds, primaryDepartmentId } = session.user;
  if (role === "CLIENT") {
    where.brandId = { in: accessibleBrandIds };
  } else if (role === "MEMBER" || role === "CONTRACTOR") {
    where.createdById = userId;
  } else if (role === "DEPT_HEAD" && primaryDepartmentId) {
    if (accessibleBrandIds.length > 0) {
      where.brandId = { in: accessibleBrandIds };
    }
  }
  // ADMIN sees all

  if (brandId) where.brandId = brandId;
  if (platform) where.platform = platform;
  if (status) where.status = status;
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const pg = parsePagination(req, 25);

  const [posts, total] = await Promise.all([
    prisma.contentPost.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        analytics: {
          select: {
            views: true,
            likes: true,
            shares: true,
            comments: true,
            engagementRate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: pg.skip,
      take: pg.limit,
    }),
    prisma.contentPost.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(posts, total, pg));
});

// POST /api/relay/posts — Create a new content post
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, platform, brandId, scheduledAt, mediaUrls, metadata, taskId } = body;

  if (!title) return badRequest("Title is required");
  if (!platform) return badRequest("Platform is required");
  if (!brandId) return badRequest("Brand ID is required");

  const validPlatforms = ["youtube", "x", "instagram", "linkedin", "facebook"];
  if (!validPlatforms.includes(platform)) {
    return badRequest("Invalid platform. Must be one of: " + validPlatforms.join(", "));
  }

  // CLIENT users can only create posts for their brands
  if (session.user.role === "CLIENT") {
    if (!session.user.accessibleBrandIds.includes(brandId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const post = await prisma.contentPost.create({
    data: {
      title,
      content: content || null,
      platform,
      brandId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      mediaUrls: mediaUrls || undefined,
      metadata: metadata || undefined,
      taskId: taskId || null,
      status: scheduledAt ? "SCHEDULED" : "DRAFT",
      createdById: session.user.id,
    },
    include: {
      brand: { select: { id: true, name: true } },
    },
  });

  daftarEvents.emitEvent("post.created", {
    postId: post.id,
    title: post.title,
    platform: post.platform,
    brandId: post.brandId,
    createdById: session.user.id,
  });

  return NextResponse.json(post, { status: 201 });
});
