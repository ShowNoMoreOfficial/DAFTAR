import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const scope = searchParams.get("scope");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const now = new Date();

  // Build visibility filter: user can see org-wide + their department + their brands
  const scopeFilters: Record<string, unknown>[] = [
    { scope: "org" },
  ];

  if (session.user.primaryDepartmentId) {
    scopeFilters.push({
      scope: "department",
      scopeId: session.user.primaryDepartmentId,
    });
  }

  if (session.user.accessibleBrandIds?.length > 0) {
    scopeFilters.push({
      scope: "brand",
      scopeId: { in: session.user.accessibleBrandIds },
    });
  }

  const where: Record<string, unknown> = {
    OR: scopeFilters,
    // Don't show expired announcements
    OR2: undefined,
  };

  // Filter by expiration
  const baseWhere: Record<string, unknown> = {
    AND: [
      { OR: scopeFilters },
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
    ],
  };

  if (type) {
    (baseWhere.AND as Record<string, unknown>[]).push({ type });
  }
  if (scope) {
    (baseWhere.AND as Record<string, unknown>[]).push({ scope });
  }
  if (from) {
    (baseWhere.AND as Record<string, unknown>[]).push({ createdAt: { gte: new Date(from) } });
  }
  if (to) {
    (baseWhere.AND as Record<string, unknown>[]).push({ createdAt: { lte: new Date(to) } });
  }

  const announcements = await prisma.announcement.findMany({
    where: baseWhere,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      readBy: { select: { userId: true } },
    },
  });

  // Resolve author names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authorIds = Array.from(new Set((announcements as any[]).map((a) => a.authorId))) as string[];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, avatar: true },
  });
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = announcements.map((a: any) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    type: a.type,
    scope: a.scope,
    scopeId: a.scopeId,
    authorId: a.authorId,
    author: authorMap[a.authorId] || { id: a.authorId, name: "Unknown", avatar: null },
    isPinned: a.isPinned,
    expiresAt: a.expiresAt,
    readCount: a.readBy.length,
    isRead: a.readBy.some((r: any) => r.userId === session.user.id),
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, type, scope, scopeId, isPinned, expiresAt } = body;

  if (!title || !content) {
    return badRequest("Title and content are required");
  }

  const validTypes = ["general", "urgent", "policy", "celebration"];
  if (type && !validTypes.includes(type)) {
    return badRequest(`Type must be one of: ${validTypes.join(", ")}`);
  }

  const validScopes = ["org", "department", "brand"];
  if (scope && !validScopes.includes(scope)) {
    return badRequest(`Scope must be one of: ${validScopes.join(", ")}`);
  }

  // Map scope to departmentId for backward compat
  let departmentId: string | null = null;
  if (scope === "department" && scopeId) {
    departmentId = scopeId;
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      type: type || "general",
      scope: scope || "org",
      scopeId: scopeId || null,
      authorId: session.user.id,
      departmentId,
      isPinned: isPinned || false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}
