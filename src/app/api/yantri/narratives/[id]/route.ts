import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

// GET /api/yantri/narratives/:id — Get narrative tree detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const tree = await prisma.narrativeTree.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      narratives: {
        include: {
          brand: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tree) return notFound("Narrative tree not found");

  return NextResponse.json(tree);
}

// PATCH /api/yantri/narratives/:id — Update status, summary, etc.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const { status, summary, title } = body;
  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (summary !== undefined) data.summary = summary;
  if (title !== undefined) data.title = title;

  const tree = await prisma.narrativeTree.update({
    where: { id },
    data,
  });

  return NextResponse.json(tree);
}

// DELETE /api/yantri/narratives/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  await prisma.narrativeTree.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
