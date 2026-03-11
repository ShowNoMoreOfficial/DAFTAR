import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, notFound, badRequest } from "@/lib/api-utils";

// GET /api/client/brands/[brandId]/deliverables
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { brandId } = await params;

  // Verify brand ownership
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { client: { select: { id: true, userId: true } } },
  });

  if (!brand) return notFound("Brand not found");

  if (session.user.role === "CLIENT") {
    if (brand.client.userId !== session.user.id) return forbidden();
  } else if (session.user.role !== "ADMIN") {
    return forbidden();
  }

  // Optional status filter
  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { brandId };
  if (status) {
    where.status = status;
  }

  const deliverables = await prisma.clientDeliverable.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(deliverables);
}

// POST /api/client/brands/[brandId]/deliverables
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  // Only ADMIN or internal team roles can push deliverables to clients
  if (!["ADMIN", "DEPT_HEAD", "MEMBER"].includes(session.user.role)) {
    return forbidden();
  }

  const { brandId } = await params;

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { client: { select: { id: true } } },
  });

  if (!brand) return notFound("Brand not found");

  const body = await req.json();
  const { title, description, type, fileUrl, thumbnailUrl, taskId, postId } = body;

  if (!title || !type) {
    return badRequest("title and type are required");
  }

  const deliverable = await prisma.clientDeliverable.create({
    data: {
      clientId: brand.client.id,
      brandId,
      title,
      description: description || null,
      type,
      fileUrl: fileUrl || null,
      thumbnailUrl: thumbnailUrl || null,
      status: "ready_for_review",
      taskId: taskId || null,
      postId: postId || null,
    },
  });

  return NextResponse.json(deliverable, { status: 201 });
}
