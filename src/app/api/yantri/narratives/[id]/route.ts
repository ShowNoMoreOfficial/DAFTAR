import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

// GET /api/yantri/narratives/:id — Get narrative tree detail
export const GET = apiHandler(async (req: NextRequest, { params }) => {
  const { id } = params;

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
});

// PATCH /api/yantri/narratives/:id — Update status, summary, etc.
export const PATCH = apiHandler(async (req: NextRequest, { params }) => {
  const { id } = params;
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
});

// DELETE /api/yantri/narratives/:id
export const DELETE = apiHandler(async (req: NextRequest, { params }) => {
  const { id } = params;

  await prisma.narrativeTree.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
