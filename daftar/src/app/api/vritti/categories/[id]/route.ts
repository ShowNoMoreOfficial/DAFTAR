import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest, forbidden, notFound } from "@/lib/api-utils";

// PATCH /api/vritti/categories/[id] — Update category (ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return forbidden();
  }

  const { id } = await params;

  const category = await prisma.articleCategory.findUnique({ where: { id } });
  if (!category) return notFound("Category not found");

  const body = await req.json();
  const { name, description, color, parentId } = body;

  const data: Record<string, unknown> = {};

  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (color !== undefined) data.color = color;
  if (parentId !== undefined) {
    if (parentId === id) return badRequest("Category cannot be its own parent");
    if (parentId) {
      const parent = await prisma.articleCategory.findUnique({ where: { id: parentId } });
      if (!parent) return badRequest("Parent category not found");
    }
    data.parentId = parentId || null;
  }

  const updated = await prisma.articleCategory.update({
    where: { id },
    data,
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: { select: { id: true, name: true, slug: true } },
      _count: { select: { articles: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/vritti/categories/[id] — Delete category (ADMIN only, fails if has articles)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return forbidden();
  }

  const { id } = await params;

  const category = await prisma.articleCategory.findUnique({
    where: { id },
    include: { _count: { select: { articles: true } } },
  });

  if (!category) return notFound("Category not found");

  if (category._count.articles > 0) {
    return badRequest("Cannot delete category that has articles. Reassign or delete articles first.");
  }

  await prisma.articleCategory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
