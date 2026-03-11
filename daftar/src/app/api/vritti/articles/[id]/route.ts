import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest, forbidden, notFound } from "@/lib/api-utils";

// GET /api/vritti/articles/[id] — Get single article with related data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
      editor: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      versions: {
        orderBy: { version: "desc" },
        take: 5,
        include: {
          editedBy: { select: { id: true, name: true } },
        },
      },
      media: {
        orderBy: { createdAt: "desc" },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!article) return notFound("Article not found");

  // Role-based access check
  const { role, id: userId, accessibleBrandIds } = session.user;
  if (role === "MEMBER" || role === "CONTRACTOR") {
    if (article.authorId !== userId && article.editorId !== userId) {
      return forbidden();
    }
  } else if (role === "CLIENT") {
    if (article.status !== "PUBLISHED" || !accessibleBrandIds.includes(article.brandId || "")) {
      return forbidden();
    }
  }

  return NextResponse.json(article);
}

// PATCH /api/vritti/articles/[id] — Update article
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return notFound("Article not found");

  // Only author, editor, or ADMIN can update
  const { role, id: userId } = session.user;
  if (role !== "ADMIN" && role !== "DEPT_HEAD" && article.authorId !== userId && article.editorId !== userId) {
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
    status,
    scheduledAt,
  } = body;

  const data: Record<string, unknown> = {};

  if (title !== undefined) data.title = title;
  if (categoryId !== undefined) data.categoryId = categoryId;
  if (brandId !== undefined) data.brandId = brandId;
  if (excerpt !== undefined) data.excerpt = excerpt;
  if (tags !== undefined) data.tags = tags;
  if (coverImageUrl !== undefined) data.coverImageUrl = coverImageUrl;
  if (seoTitle !== undefined) data.seoTitle = seoTitle;
  if (seoDescription !== undefined) data.seoDescription = seoDescription;
  if (editorId !== undefined) data.editorId = editorId;
  if (reviewerId !== undefined) data.reviewerId = reviewerId;
  if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;

  if (articleBody !== undefined) {
    data.body = articleBody;
    data.wordCount = articleBody ? articleBody.trim().split(/\s+/).length : 0;
    data.readTimeMin = articleBody ? Math.max(1, Math.ceil(articleBody.trim().split(/\s+/).length / 200)) : 0;
  }

  // Handle status change
  if (status !== undefined && status !== article.status) {
    data.status = status;

    // If changing to PUBLISHED, set publishedAt
    if (status === "PUBLISHED" && !article.publishedAt) {
      data.publishedAt = new Date();
    }

    // Create an ArticleVersion on status change
    const lastVersion = await prisma.articleVersion.findFirst({
      where: { articleId: id },
      orderBy: { version: "desc" },
    });

    await prisma.articleVersion.create({
      data: {
        articleId: id,
        version: (lastVersion?.version || 0) + 1,
        title: (title as string) || article.title,
        body: (articleBody as string) || article.body || "",
        editedById: userId,
        changeNote: `Status changed from ${article.status} to ${status}`,
      },
    });
  }

  const updated = await prisma.article.update({
    where: { id },
    data,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
      editor: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/vritti/articles/[id] — Delete article (ADMIN or author, only IDEA/ARCHIVED)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return notFound("Article not found");

  // Only ADMIN or author can delete
  const { role, id: userId } = session.user;
  if (role !== "ADMIN" && article.authorId !== userId) {
    return forbidden();
  }

  // Only IDEA or ARCHIVED articles can be deleted
  if (article.status !== "IDEA" && article.status !== "ARCHIVED") {
    return badRequest("Only articles in IDEA or ARCHIVED status can be deleted");
  }

  await prisma.article.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
