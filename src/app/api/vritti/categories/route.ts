import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import { hasPermission } from "@/lib/permissions";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/vritti/categories — List all categories with article counts
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  if (!hasPermission(session.user.role, session.user.permissions, "vritti.read.own")) {
    return forbidden();
  }

  const categories = await prisma.articleCategory.findMany({
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: { select: { id: true, name: true, slug: true } },
      _count: { select: { articles: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: categories });
});

// POST /api/vritti/categories — Create category (ADMIN only)
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  if (session.user.role !== "ADMIN") {
    return forbidden();
  }

  const body = await req.json();
  const { name, description, color, parentId } = body;

  if (!name) return badRequest("Name is required");

  // Generate unique slug
  let slug = slugify(name);
  const existing = await prisma.articleCategory.findFirst({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Validate parentId if provided
  if (parentId) {
    const parent = await prisma.articleCategory.findUnique({ where: { id: parentId } });
    if (!parent) return badRequest("Parent category not found");
  }

  const category = await prisma.articleCategory.create({
    data: {
      name,
      slug,
      description: description || null,
      color: color || null,
      parentId: parentId || null,
    },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: { select: { id: true, name: true, slug: true } },
      _count: { select: { articles: true } },
    },
  });

  return NextResponse.json(category, { status: 201 });
});
