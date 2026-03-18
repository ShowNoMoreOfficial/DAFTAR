import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/vritti/articles/[id]/comments — List editorial comments for an article
export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return notFound("Article not found");

  const comments = await prisma.editorialComment.findMany({
    where: { articleId: id },
    include: {
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: comments });
});

// POST /api/vritti/articles/[id]/comments — Add editorial comment
export const POST = apiHandler(async (req: NextRequest, { session, params }) => {
  const { id } = params;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return notFound("Article not found");

  const body = await req.json();
  const { content, type } = body;

  if (!content) return badRequest("Content is required");

  const validTypes = ["comment", "suggestion", "revision_request"];
  if (type && !validTypes.includes(type)) {
    return badRequest("Invalid type. Must be one of: " + validTypes.join(", "));
  }

  const comment = await prisma.editorialComment.create({
    data: {
      articleId: id,
      authorId: session.user.id,
      content,
      type: type || "comment",
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
});
