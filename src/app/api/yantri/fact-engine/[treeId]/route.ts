import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

// ─── GET — Dossier for a specific tree ──────────────────────────────────────

export const GET = apiHandler(async (_request, { params }) => {
  const { treeId } = params;

  const tree = await prisma.narrativeTree.findUnique({
    where: { id: treeId },
    include: {
      dossier: true,
      nodes: {
        select: { id: true },
      },
    },
  });

  if (!tree) {
    return NextResponse.json(
      { error: `NarrativeTree not found: ${treeId}` },
      { status: 404 }
    );
  }

  if (!tree.dossier) {
    return NextResponse.json(
      {
        error: `No FactDossier exists for tree: ${treeId}`,
        tree: {
          id: tree.id,
          title: tree.title,
          status: tree.status,
          nodeCount: tree.nodes.length,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    dossier: tree.dossier,
    tree: {
      id: tree.id,
      title: tree.title,
      summary: tree.summary,
      status: tree.status,
      nodeCount: tree.nodes.length,
      createdAt: tree.createdAt,
      updatedAt: tree.updatedAt,
    },
  });
});

// ─── DELETE — Remove a FactDossier ──────────────────────────────────────────

export const DELETE = apiHandler(async (_request, { params }) => {
  const { treeId } = params;

  // Verify the tree exists
  const tree = await prisma.narrativeTree.findUnique({
    where: { id: treeId },
    select: { id: true, title: true },
  });

  if (!tree) {
    return NextResponse.json(
      { error: `NarrativeTree not found: ${treeId}` },
      { status: 404 }
    );
  }

  // Check if dossier exists before attempting deletion
  const existingDossier = await prisma.factDossier.findUnique({
    where: { treeId },
    select: { id: true },
  });

  if (!existingDossier) {
    return NextResponse.json(
      { error: `No FactDossier exists for tree: ${treeId}` },
      { status: 404 }
    );
  }

  await prisma.factDossier.delete({
    where: { treeId },
  });

  return NextResponse.json({
    message: `FactDossier deleted for tree: ${tree.title}`,
    treeId,
  });
});
