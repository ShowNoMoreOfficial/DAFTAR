import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest, notFound } from "@/lib/api-utils";
import { daftarEvents } from "@/lib/event-bus";
import { skillOrchestrator } from "@/lib/skill-orchestrator";

// POST /api/signals/promote — Promote a trend to the narrative pipeline (Khabri → Yantri handoff)
export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { trendId, brandIds, urgency, notes } = body;

  if (!trendId) return badRequest("trendId is required");

  // Fetch the trend with its signals
  const trend = await prisma.trend.findUnique({
    where: { id: trendId },
    include: {
      signals: {
        where: { isDuplicate: false },
        orderBy: { detectedAt: "desc" },
        take: 20,
      },
      _count: { select: { signals: true } },
    },
  });

  if (!trend) return notFound("Trend not found");

  // Run geo-relevance skill to assess brand fit
  let geoResult = null;
  try {
    geoResult = await skillOrchestrator.executeSkill({
      skillPath: "signals/analysis/geo-relevance-mapping.md",
      context: {
        trend: { id: trend.id, name: trend.name, lifecycle: trend.lifecycle },
        signals: trend.signals.map((s) => ({
          title: s.title,
          source: s.source,
          eventType: s.eventType,
          geoRelevance: s.geoRelevance,
          stakeholders: s.stakeholders,
        })),
        requestedBrandIds: brandIds ?? [],
      },
      model: "system",
      executedById: session.user.id,
    });
  } catch {
    // Skill execution is optional — promotion continues regardless
  }

  // Run escalation assessment
  let escalationResult = null;
  try {
    escalationResult = await skillOrchestrator.executeSkill({
      skillPath: "signals/analysis/escalation-assessment.md",
      context: {
        trend: { id: trend.id, name: trend.name, lifecycle: trend.lifecycle, velocityScore: trend.velocityScore },
        signalCount: trend._count.signals,
        sources: [...new Set(trend.signals.map((s) => s.source))],
        stakeholders: trend.signals.flatMap((s) => {
          const sk = s.stakeholders as Record<string, unknown> | null;
          return sk ? Object.values(sk).flat() : [];
        }),
      },
      model: "system",
      executedById: session.user.id,
    });
  } catch {
    // Optional
  }

  // Emit the handoff event — Yantri listens for this
  daftarEvents.emitEvent("signal.ready_for_narrative", {
    trendId: trend.id,
    trendName: trend.name,
    lifecycle: trend.lifecycle,
    velocityScore: trend.velocityScore,
    signalCount: trend._count.signals,
    topSignals: trend.signals.slice(0, 5).map((s) => ({
      id: s.id,
      title: s.title,
      source: s.source,
      eventType: s.eventType,
      sentiment: s.sentiment,
      geoRelevance: s.geoRelevance,
    })),
    brandIds: brandIds ?? [],
    urgency: urgency ?? "standard",
    notes: notes ?? null,
    promotedBy: session.user.id,
    geoRelevance: geoResult?.success ? geoResult.output : null,
    escalation: escalationResult?.success ? escalationResult.output : null,
  });

  // Update trend lifecycle to indicate it's been promoted
  if (trend.lifecycle === "emerging") {
    await prisma.trend.update({
      where: { id: trendId },
      data: { lifecycle: "peaking" },
    });
  }

  return NextResponse.json({
    data: {
      promoted: true,
      trendId: trend.id,
      trendName: trend.name,
      event: "signal.ready_for_narrative",
      brandIds: brandIds ?? [],
      urgency: urgency ?? "standard",
      geoRelevance: geoResult?.success ? "assessed" : "skipped",
      escalation: escalationResult?.success ? "assessed" : "skipped",
    },
  });
}
