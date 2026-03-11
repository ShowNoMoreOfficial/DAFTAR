/**
 * Yantri Ingest Helper
 *
 * Handles the ingestion of external signals (from Khabri or manual input)
 * into the NarrativeTree pipeline. Responsibilities:
 * 1. Generate embeddings for incoming signals
 * 2. Check for similar existing trees (deduplication)
 * 3. Create new NarrativeTree clusters or merge into existing ones
 * 4. Trigger downstream processing via Inngest
 */

import { prisma } from "@/lib/prisma";
import { generateEmbedding, toPgVector, findSimilarTree } from "./embeddings";
import { callGemini } from "./gemini";
import { yantriInngest } from "@/lib/yantri/inngest/client";
import { Prisma } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────

export interface IngestSignal {
  title: string;
  content: string | null;
  source: string;
  sourceUrl?: string;
  signalId?: string; // External ID (e.g., Khabri signal ID)
  stakeholders?: Record<string, unknown>;
  eventMarkers?: Record<string, unknown>;
  detectedAt?: string;
  urgency?: "breaking" | "high" | "normal" | "low";
  metadata?: Record<string, unknown>;
}

export interface IngestResult {
  treeId: string;
  title: string;
  isNew: boolean;
  merged: boolean;
  mergedIntoTreeId?: string;
  embedding: number[] | null;
}

// ─── Summary generation ──────────────────────────────────

async function generateSummary(signal: IngestSignal): Promise<string | null> {
  try {
    const result = await callGemini(
      `You are a news editor. Summarize the following signal in 2-3 sentences. Focus on: who, what, when, where, why. Return a JSON object: { "summary": "..." }`,
      `Title: ${signal.title}\nContent: ${signal.content ?? "No content available"}\nSource: ${signal.source}`
    );

    if (result.parsed && typeof result.parsed === "object" && "summary" in result.parsed) {
      return (result.parsed as { summary: string }).summary;
    }
    return null;
  } catch (error) {
    console.error("[IngestHelper] Failed to generate summary:", error);
    return null;
  }
}

// ─── Urgency detection ───────────────────────────────────

function detectUrgency(signal: IngestSignal): "breaking" | "high" | "normal" | "low" {
  if (signal.urgency) return signal.urgency;

  const title = signal.title.toLowerCase();
  const content = (signal.content ?? "").toLowerCase();
  const combined = `${title} ${content}`;

  // Breaking indicators
  const breakingKeywords = ["breaking", "just in", "urgent", "emergency", "crisis"];
  if (breakingKeywords.some((kw) => combined.includes(kw))) return "breaking";

  // High-priority indicators
  const highKeywords = ["exclusive", "developing", "significant", "major"];
  if (highKeywords.some((kw) => combined.includes(kw))) return "high";

  return "normal";
}

// ─── Create new cluster ──────────────────────────────────

async function createNewCluster(
  signal: IngestSignal,
  embedding: number[] | null,
  summary: string | null,
  createdById: string
): Promise<IngestResult> {
  const tree = await prisma.narrativeTree.create({
    data: {
      title: signal.title,
      summary,
      embedding: embedding ? toPgVector(embedding) : null,
      status: "INCOMING",
      signalData: (signal.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      signalId: signal.signalId ?? null,
      urgency: detectUrgency(signal),
      createdById,
    },
  });

  return {
    treeId: tree.id,
    title: tree.title,
    isNew: true,
    merged: false,
    embedding,
  };
}

// ─── Merge into existing cluster ─────────────────────────

async function mergeIntoCluster(
  existingTreeId: string,
  signal: IngestSignal,
  _createdById: string
): Promise<IngestResult> {
  // Add the signal as a node on the existing tree
  await prisma.narrativeNode.create({
    data: {
      treeId: existingTreeId,
      nodeType: "SIGNAL",
      signalTitle: signal.title,
      signalData: {
        content: signal.content,
        source: signal.source,
        sourceUrl: signal.sourceUrl ?? null,
        stakeholders: signal.stakeholders ?? null,
        eventMarkers: signal.eventMarkers ?? null,
        detectedAt: signal.detectedAt ?? new Date().toISOString(),
        metadata: signal.metadata ?? null,
      } as Prisma.InputJsonValue,
      signalScore: 0,
    },
  });

  const tree = await prisma.narrativeTree.findUniqueOrThrow({
    where: { id: existingTreeId },
  });

  return {
    treeId: existingTreeId,
    title: tree.title,
    isNew: false,
    merged: true,
    mergedIntoTreeId: existingTreeId,
    embedding: null,
  };
}

// ─── Main ingest function ────────────────────────────────

export async function ingestSignal(
  signal: IngestSignal,
  createdById: string,
  options?: {
    skipEmbedding?: boolean;
    skipDedup?: boolean;
    skipTrigger?: boolean;
  }
): Promise<IngestResult> {
  // 1. Generate embedding
  let embedding: number[] | null = null;
  if (!options?.skipEmbedding) {
    try {
      embedding = await generateEmbedding(signal.title + " " + (signal.content ?? ""));
    } catch (error) {
      console.error("[IngestHelper] Embedding generation failed:", error);
    }
  }

  // 2. Check for similar existing trees (deduplication)
  if (embedding && !options?.skipDedup) {
    const similar = await findSimilarTree(embedding);
    if (similar) {
      console.log(
        `[IngestHelper] Signal "${signal.title}" merged into existing tree "${similar.title}" (similarity: ${similar.similarity.toFixed(3)})`
      );
      const result = await mergeIntoCluster(similar.id, signal, createdById);

      // Trigger re-processing of the merged tree
      if (!options?.skipTrigger) {
        await yantriInngest.send({
          name: "yantri/tree.updated",
          data: { treeId: similar.id, trigger: "signal_merged" },
        });
      }

      return result;
    }
  }

  // 3. Generate summary
  const summary = await generateSummary(signal);

  // 4. Create new cluster
  const result = await createNewCluster(signal, embedding, summary, createdById);

  // 5. Trigger downstream processing
  if (!options?.skipTrigger) {
    await yantriInngest.send({
      name: "yantri/tree.created",
      data: {
        treeId: result.treeId,
        title: result.title,
        urgency: detectUrgency(signal),
      },
    });
  }

  console.log(`[IngestHelper] New tree created: "${result.title}" (${result.treeId})`);
  return result;
}

// ─── Simple signal type for processSignalsToTrees ────────

export interface SimpleSignal {
  title: string;
  score?: number;
  reason?: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessSignalsResult {
  ingested: number;
  newTrees: { treeId: string; title: string }[];
  appendedTo: { treeId: string; title: string }[];
  skipped: { title: string; reason: string }[];
  archived: number;
}

/**
 * Converts simple signals (from trend imports, clustering, etc.) into
 * NarrativeTrees via the ingestSignal pipeline.
 */
export async function processSignalsToTrees(
  signals: SimpleSignal[],
  createdById?: string,
): Promise<ProcessSignalsResult> {
  const userId = createdById ?? "system";
  const newTrees: ProcessSignalsResult["newTrees"] = [];
  const appendedTo: ProcessSignalsResult["appendedTo"] = [];
  const skipped: ProcessSignalsResult["skipped"] = [];

  for (const signal of signals) {
    try {
      const ingestInput: IngestSignal = {
        title: signal.title,
        content: signal.reason ?? null,
        source: signal.source,
        metadata: signal.metadata,
      };
      const result = await ingestSignal(ingestInput, userId, {
        skipEmbedding: false,
        skipDedup: false,
        skipTrigger: true,
      });
      if (result.isNew) {
        newTrees.push({ treeId: result.treeId, title: result.title });
      } else if (result.merged) {
        appendedTo.push({ treeId: result.treeId, title: result.title });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      skipped.push({ title: signal.title, reason: message });
    }
  }

  // Archive stale trees (7+ days without new signals)
  let archived = 0;
  try {
    const staleDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const staleResult = await prisma.narrativeTree.updateMany({
      where: {
        status: "INCOMING",
        updatedAt: { lt: staleDate },
      },
      data: { status: "ARCHIVED" },
    });
    archived = staleResult.count;
  } catch {
    // Non-critical — don't fail the whole operation
  }

  return {
    ingested: newTrees.length + appendedTo.length,
    newTrees,
    appendedTo,
    skipped,
    archived,
  };
}

// ─── Batch ingest ────────────────────────────────────────

export async function ingestSignals(
  signals: IngestSignal[],
  createdById: string,
  options?: {
    skipEmbedding?: boolean;
    skipDedup?: boolean;
    skipTrigger?: boolean;
  }
): Promise<IngestResult[]> {
  const results: IngestResult[] = [];

  for (const signal of signals) {
    try {
      const result = await ingestSignal(signal, createdById, options);
      results.push(result);
    } catch (error) {
      console.error(`[IngestHelper] Failed to ingest signal "${signal.title}":`, error);
    }
  }

  return results;
}
