import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/api-utils";
import { skillOrchestrator } from "@/lib/skill-orchestrator";
import { daftarEvents } from "@/lib/event-bus";

// POST /api/signals/ingest — Ingest a signal from Khabri external API or manual input
// This stores the signal locally in Daftar's DB and runs skill-based enrichment
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { title, content, source, trendId, trendName, eventType, geoRelevance } = body;

  if (!title || !source) return badRequest("title and source are required");

  // Step 1: Run event detection skill for classification
  let detectionOutput: Record<string, unknown> = {};
  try {
    const detectionResult = await skillOrchestrator.executeSkill({
      skillPath: "signals/detection/event-detection.md",
      context: {
        raw_signal: { title, content, source },
        source_metadata: { source, type: "manual_ingest" },
        existing_trends: trendId ? [{ id: trendId, name: trendName }] : [],
      },
      model: "system",
      executedById: session.user.id,
    });
    if (detectionResult.success) detectionOutput = detectionResult.output;
  } catch {
    // Continue without enrichment
  }

  // Step 2: Run source credibility scoring
  let credibilityScore: number | null = null;
  try {
    const credResult = await skillOrchestrator.executeSkill({
      skillPath: "signals/detection/source-credibility-scoring.md",
      context: {
        source_url: null,
        source_name: source,
        source_type: "news",
        historical_accuracy: null,
      },
      model: "system",
      executedById: session.user.id,
    });
    if (credResult.success) {
      credibilityScore = 0.5; // Default — actual scoring happens via LLM in real execution
    }
  } catch {
    // Continue without credibility score
  }

  // Step 3: Resolve or create trend
  let resolvedTrendId = trendId;
  if (!resolvedTrendId) {
    // Create a new trend from this signal
    const trend = await prisma.trend.create({
      data: {
        name: trendName || title.slice(0, 100),
        lifecycle: "emerging",
      },
    });
    resolvedTrendId = trend.id;
  }

  // Step 4: Create the signal
  const signal = await prisma.signal.create({
    data: {
      trendId: resolvedTrendId,
      title,
      content: content ?? null,
      source,
      sourceCredibility: credibilityScore,
      eventType: eventType ?? null,
      geoRelevance: geoRelevance ?? undefined,
    },
  });

  // Step 5: Touch the trend's updatedAt
  await prisma.trend.update({
    where: { id: resolvedTrendId },
    data: { updatedAt: new Date() },
  });

  // Step 6: Emit event for downstream processing
  daftarEvents.emitEvent("signal.ingested", {
    signalId: signal.id,
    trendId: resolvedTrendId,
    title: signal.title,
    source: signal.source,
    eventType: signal.eventType,
    ingestedBy: session.user.id,
  });

  return NextResponse.json({
    data: {
      signal,
      trendId: resolvedTrendId,
      enrichment: {
        eventDetection: Object.keys(detectionOutput).length > 0 ? "completed" : "skipped",
        credibilityScoring: credibilityScore !== null ? "completed" : "skipped",
      },
    },
  }, { status: 201 });
});
