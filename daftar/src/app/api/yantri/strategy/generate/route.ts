import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";
import {
  runStrategist,
  generateStrategyFromDossier,
  persistStrategyDecisions,
  type StrategyDecision,
} from "@/lib/yantri/strategist";
import { skillOrchestrator } from "@/lib/skill-orchestrator";

// POST /api/yantri/strategy/generate
// Generate strategy decisions for a FactDossier + Brand combination.
// Body: { factDossierId: string, brandId?: string, treeId?: string, persist?: boolean }
//
// If persist=true (default), saves decisions as Narrative + Deliverable records.
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  let body: {
    factDossierId?: string;
    brandId?: string;
    treeId?: string;
    persist?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const shouldPersist = body.persist !== false; // default true

  // Support both factDossierId and treeId
  let treeId = body.treeId;
  let factDossierId = body.factDossierId;

  if (factDossierId && !treeId) {
    const dossier = await prisma.factDossier.findUnique({
      where: { id: factDossierId },
      select: { id: true, treeId: true },
    });
    if (!dossier) {
      return NextResponse.json({ error: "FactDossier not found" }, { status: 404 });
    }
    treeId = dossier.treeId;
    factDossierId = dossier.id;
  }

  if (!treeId) {
    return badRequest("Either factDossierId or treeId is required");
  }

  // Fetch tree + dossier
  const tree = await prisma.narrativeTree.findUnique({
    where: { id: treeId },
    include: { dossier: true },
  });

  if (!tree) {
    return NextResponse.json({ error: "NarrativeTree not found" }, { status: 404 });
  }

  if (!tree.dossier) {
    return NextResponse.json(
      { error: "No FactDossier exists for this tree. Build a dossier first." },
      { status: 422 }
    );
  }

  factDossierId = tree.dossier.id;

  // If a specific brandId is provided, use the dossier-first strategy
  if (body.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: body.brandId } });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Load brand identity skill context
    let skillContext: string | undefined;
    try {
      const identity = await skillOrchestrator.loadSkill(
        `brand/identity/${brand.slug}/identity.md`
      );
      skillContext = identity.instructions;
    } catch {
      // No brand identity skill
    }

    const result = await generateStrategyFromDossier({
      factDossierId,
      brandId: body.brandId,
      skillContext,
    });

    let deliverableIds: string[] = [];
    if (shouldPersist && result.decisions.length > 0) {
      deliverableIds = await persistStrategyDecisions(
        treeId,
        factDossierId,
        result.decisions
      );
    }

    return NextResponse.json({
      treeId,
      treeName: tree.title,
      factDossierId,
      model: result.model,
      generatedAt: result.generatedAt,
      decisionsCount: result.decisions.length,
      decisions: result.decisions,
      deliverableIds,
      persisted: shouldPersist,
    });
  }

  // Otherwise, run for all brands using the classic strategist
  const brands = await prisma.brand.findMany();

  if (brands.length === 0) {
    return NextResponse.json({ error: "No brands found" }, { status: 422 });
  }

  const decisions: StrategyDecision[] = await runStrategist({
    treeId,
    brands,
    dossier: {
      structuredData: tree.dossier.structuredData,
      sources: tree.dossier.sources,
      rawResearch: tree.dossier.rawResearch,
    },
  });

  let deliverableIds: string[] = [];
  if (shouldPersist && decisions.length > 0) {
    deliverableIds = await persistStrategyDecisions(
      treeId,
      factDossierId,
      decisions
    );
  }

  return NextResponse.json({
    treeId,
    treeName: tree.title,
    factDossierId,
    decisionsCount: decisions.length,
    decisions,
    deliverableIds,
    persisted: shouldPersist,
  });
}
