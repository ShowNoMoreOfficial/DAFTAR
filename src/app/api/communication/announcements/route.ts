import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest, forbidden, handleApiError } from "@/lib/api-utils";
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [];

  if (departmentId) {
    conditions.push({ departmentId });
  } else {
    conditions.push({
      OR: [
        { departmentId: null },
        ...(session.user.primaryDepartmentId
          ? [{ departmentId: session.user.primaryDepartmentId }]
          : []),
      ],
    });
  }

  if (pinned === "true") conditions.push({ isPinned: true });
  if (pinned === "false") conditions.push({ isPinned: false });

  // Filter out expired announcements
  conditions.push({
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  });

  const where = { AND: conditions };

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

  // Resolve author names and department names
  const authorIds = [...new Set(announcements.map((a) => a.authorId))];
  const deptIds = [...new Set(announcements.map((a) => a.departmentId).filter(Boolean))] as string[];

  const [authors, departments] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true },
    }),
    deptIds.length > 0
      ? prisma.department.findMany({
          where: { id: { in: deptIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const authorMap = Object.fromEntries(authors.map((u) => [u.id, u.name]));
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = announcements.map((a: any) => ({
    ...a,
    authorName: authorMap[a.authorId] || "Unknown",
    departmentName: a.departmentId ? deptMap[a.departmentId] || null : null,
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

  const allowedRoles = ["ADMIN", "HEAD_HR", "DEPT_HEAD"];
  if (!allowedRoles.includes(session.user.role)) {
    return forbidden();
  }

  try {
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
  } catch (error) {
    return handleApiError(error);
  }
}
