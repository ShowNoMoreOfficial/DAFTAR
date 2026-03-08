import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest, forbidden } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/vritti/media — List media files with pagination and filters
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "vritti.read.own")) {
    return forbidden();
  }

  const { searchParams } = req.nextUrl;
  const fileType = searchParams.get("fileType");
  const articleId = searchParams.get("articleId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  if (fileType) where.fileType = fileType;
  if (articleId) where.articleId = articleId;
  if (search) where.fileName = { contains: search, mode: "insensitive" };

  const pg = parsePagination(req, 25);

  const [media, total] = await Promise.all([
    prisma.articleMedia.findMany({
      where,
      include: {
        article: { select: { id: true, title: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: pg.skip,
      take: pg.limit,
    }),
    prisma.articleMedia.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(media, total, pg));
}

// POST /api/vritti/media — Create media record
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "vritti.read.own")) {
    return forbidden();
  }

  const body = await req.json();
  const { fileName, fileUrl, fileType, fileSize, altText, caption, articleId } = body;

  if (!fileName) return badRequest("fileName is required");
  if (!fileUrl) return badRequest("fileUrl is required");
  if (!fileType) return badRequest("fileType is required");

  // Validate articleId if provided
  if (articleId) {
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return badRequest("Article not found");
  }

  const media = await prisma.articleMedia.create({
    data: {
      fileName,
      fileUrl,
      fileType,
      fileSize: fileSize || null,
      altText: altText || null,
      caption: caption || null,
      articleId: articleId || null,
      uploadedById: session.user.id,
    },
    include: {
      article: { select: { id: true, title: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(media, { status: 201 });
}
