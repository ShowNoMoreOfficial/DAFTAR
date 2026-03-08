import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest, forbidden } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/communication/announcements — list announcements (org-wide + user's department)
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId");
  const pinned = searchParams.get("pinned");
  const { page, limit, skip } = parsePagination(req);

  const where: Record<string, unknown> = {};

  if (departmentId) {
    where.departmentId = departmentId;
  } else {
    // Show org-wide announcements + user's department announcements
    where.OR = [
      { departmentId: null },
      ...(session.user.primaryDepartmentId
        ? [{ departmentId: session.user.primaryDepartmentId }]
        : []),
    ];
  }

  if (pinned === "true") where.isPinned = true;
  if (pinned === "false") where.isPinned = false;

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      include: {
        _count: { select: { readBy: true } },
        readBy: {
          where: { userId: session.user.id },
          select: { readAt: true },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.announcement.count({ where }),
  ]);

  const data = announcements.map((a) => ({
    ...a,
    readCount: a._count.readBy,
    isRead: a.readBy.length > 0,
    readAt: a.readBy[0]?.readAt ?? null,
    _count: undefined,
    readBy: undefined,
  }));

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/communication/announcements — create announcement (ADMIN, HEAD_HR, DEPT_HEAD only)
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "hoccr.write.own")) {
    return forbidden();
  }

  const allowedRoles = ["ADMIN", "HEAD_HR", "DEPT_HEAD"];
  if (!allowedRoles.includes(session.user.role)) {
    return forbidden();
  }

  const { title, content, priority, departmentId, isPinned, expiresAt } = await req.json();

  if (!title || !content) {
    return badRequest("Title and content are required");
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      priority: priority || "NORMAL",
      authorId: session.user.id,
      departmentId: departmentId || null,
      isPinned: isPinned || false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}
