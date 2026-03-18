import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import { hasPermission } from "@/lib/permissions";
import { parsePagination, paginatedResponse } from "@/lib/pagination";
import type { ArticleStatus } from "@prisma/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function calculateReadTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// GET /api/vritti/articles — List articles with pagination and filters
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  if (!hasPermission(session.user.role, session.user.permissions, "vritti.read.own")) {
    return forbidden();
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const authorId = searchParams.get("authorId");
  const brandId = searchParams.get("brandId");
  const search = searchParams.get("search");
  const view = searchParams.get("view");

  const where: Record<string, unknown> = {};

  // Role-based scoping
  const { role, id: userId, accessibleBrandIds } = session.user;
  if (role === "MEMBER" || role === "CONTRACTOR") {
    where.OR = [{ authorId: userId }, { editorId: userId }];
  } else if (role === "CLIENT") {
    where.status = "PUBLISHED";
    where.brandId = { in: accessibleBrandIds };
  }
  // ADMIN and DEPT_HEAD see all

  if (status) where.status = status as ArticleStatus;
  if (categoryId) where.categoryId = categoryId;
  if (authorId) where.authorId = authorId;
  if (brandId) where.brandId = brandId;
  if (search) where.title = { contains: search, mode: "insensitive" };

  // Pipeline view: group articles by status
  if (view === "pipeline") {
    const statuses = ["IDEA", "DRAFTING", "EDITING", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"];
    const pipeline = await Promise.all(
      statuses.map(async (s) => {
        const statusWhere = { ...where, status: s as ArticleStatus };
        const articles = await prisma.article.findMany({
          where: statusWhere,
          include: {
            category: { select: { id: true, name: true, slug: true, color: true } },
            author: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 50,
        });
        return { status: s, articles, count: articles.length };
      })
    );
    return NextResponse.json({ data: pipeline });
  }

  const pg = parsePagination(req, 25);

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true } },
        editor: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: pg.skip,
      take: pg.limit,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(articles, total, pg));
});

// POST /api/vritti/articles — Create a new article
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const allowedRoles = ["ADMIN", "DEPT_HEAD", "MEMBER"];
  if (!allowedRoles.includes(session.user.role)) {
    return forbidden();
  }

  const body = await req.json();
  const {
    title,
    categoryId,
    brandId,
    excerpt,
    body: articleBody,
    tags,
    coverImageUrl,
    seoTitle,
    seoDescription,
    editorId,
    reviewerId,
  } = body;

  if (!title) return badRequest("Title is required");

  // Generate unique slug
  let slug = slugify(title);
  const existing = await prisma.article.findFirst({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const wordCount = articleBody ? articleBody.trim().split(/\s+/).length : 0;
  const readTimeMin = articleBody ? calculateReadTime(articleBody) : 0;

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      body: articleBody || null,
      status: "IDEA",
      categoryId: categoryId || null,
      brandId: brandId || null,
      tags: tags || [],
      coverImageUrl: coverImageUrl || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      authorId: session.user.id,
      editorId: editorId || null,
      reviewerId: reviewerId || null,
      wordCount,
      readTimeMin,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
      editor: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(article, { status: 201 });
});
