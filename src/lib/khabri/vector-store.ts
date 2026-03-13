import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Types ───────────────────────────────────────────────

export interface SignalInsertData {
  trendId: string;
  title: string;
  content: string;
  source: string;
  sourceCredibility?: number;
  eventType?: string;
  sentiment?: string;
  stakeholders?: Record<string, unknown>;
  eventMarkers?: Record<string, unknown>;
  geoRelevance?: Record<string, unknown>;
  isDuplicate?: boolean;
  duplicateOfId?: string;
}

export interface SignalWithEmbedding extends SignalInsertData {
  id: string;
  embedding: number[];
  detectedAt: Date;
}

// ─── Embedding Client ────────────────────────────────────
// Uses Google's text-embedding-004 model (768 dimensions).
// Falls back gracefully if API key is missing.

const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIMENSIONS = 768;

let genAI: GoogleGenerativeAI | null = null;

function getEmbeddingClient(): GoogleGenerativeAI | null {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[VectorStore] GEMINI_API_KEY not set — embeddings disabled"
    );
    return null;
  }
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

// ─── Generate Embedding ──────────────────────────────────

/**
 * Generate a 768-dimensional embedding for the given text.
 * Truncates text to ~8000 tokens (~32000 chars) to stay within limits.
 * Returns null if the embedding API is unavailable.
 */
export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  const client = getEmbeddingClient();
  if (!client) return null;

  // Truncate to ~8000 tokens (rough estimate: 4 chars per token)
  const truncated = text.slice(0, 32000);

  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(truncated);
  const embedding = result.embedding.values;

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    console.warn(
      `[VectorStore] Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`
    );
  }

  return embedding;
}

// ─── Insert Signal with Vector ───────────────────────────

/**
 * Insert a signal into the database with its vector embedding.
 * Uses raw SQL for the pgvector column since Prisma doesn't
 * natively support the vector type in its ORM layer.
 *
 * If embedding generation fails, the signal is still inserted
 * without an embedding (the column is nullable).
 */
export async function insertSignalWithEmbedding(
  data: SignalInsertData
): Promise<string> {
  // Generate embedding from title + content
  const embeddingText = `${data.title}\n\n${data.content}`;
  const embedding = await generateEmbedding(embeddingText);

  const id = generateCuid();
  const now = new Date();

  if (embedding) {
    // Insert with vector embedding using raw SQL
    // pgvector expects the embedding as a string like '[0.1,0.2,...]'
    const vectorStr = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO signals (
        id, "trendId", title, content, source,
        "sourceCredibility", "eventType", sentiment,
        stakeholders, "eventMarkers", "geoRelevance",
        "isDuplicate", "duplicateOfId",
        embedding, "detectedAt"
      ) VALUES (
        ${id}, ${data.trendId}, ${data.title}, ${data.content}, ${data.source},
        ${data.sourceCredibility ?? null}, ${data.eventType ?? null}, ${data.sentiment ?? null},
        ${data.stakeholders ? JSON.stringify(data.stakeholders) : null}::jsonb,
        ${data.eventMarkers ? JSON.stringify(data.eventMarkers) : null}::jsonb,
        ${data.geoRelevance ? JSON.stringify(data.geoRelevance) : null}::jsonb,
        ${data.isDuplicate ?? false}, ${data.duplicateOfId ?? null},
        ${vectorStr}::vector(768), ${now}
      )
    `;
  } else {
    // Insert without embedding using Prisma ORM
    await prisma.signal.create({
      data: {
        id,
        trendId: data.trendId,
        title: data.title,
        content: data.content,
        source: data.source,
        sourceCredibility: data.sourceCredibility,
        eventType: data.eventType,
        sentiment: data.sentiment,
        stakeholders: data.stakeholders as object,
        eventMarkers: data.eventMarkers as object,
        geoRelevance: data.geoRelevance as object,
        isDuplicate: data.isDuplicate ?? false,
        duplicateOfId: data.duplicateOfId,
        detectedAt: now,
      },
    });
  }

  return id;
}

// ─── Similarity Search ───────────────────────────────────

/**
 * Find the most similar signals to the given text using
 * cosine distance on pgvector embeddings.
 *
 * Returns signals ordered by similarity (closest first).
 */
export async function findSimilarSignals(
  text: string,
  limit = 10,
  threshold = 0.3
): Promise<{ id: string; title: string; source: string; distance: number }[]> {
  const embedding = await generateEmbedding(text);
  if (!embedding) return [];

  const vectorStr = `[${embedding.join(",")}]`;

  const results = await prisma.$queryRaw<
    { id: string; title: string; source: string; distance: number }[]
  >`
    SELECT id, title, source,
           embedding <=> ${vectorStr}::vector(768) AS distance
    FROM signals
    WHERE embedding IS NOT NULL
      AND embedding <=> ${vectorStr}::vector(768) < ${threshold}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  return results;
}

/**
 * Check if a signal is a duplicate by comparing its embedding
 * to existing signals. Returns the ID of the closest match
 * if the distance is below the duplicate threshold.
 */
export async function checkDuplicate(
  title: string,
  content: string,
  duplicateThreshold = 0.1
): Promise<{ isDuplicate: boolean; duplicateOfId: string | null }> {
  const similar = await findSimilarSignals(
    `${title}\n\n${content}`,
    1,
    duplicateThreshold
  );

  if (similar.length > 0) {
    return { isDuplicate: true, duplicateOfId: similar[0].id };
  }

  return { isDuplicate: false, duplicateOfId: null };
}

// ─── Helpers ─────────────────────────────────────────────

function generateCuid(): string {
  // Simple CUID-like ID generator
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `c${timestamp}${random}`;
}
