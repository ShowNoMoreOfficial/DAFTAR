// ─── Vritti RAG: Semantic Search ────────────────────────
// Retrieves the most relevant historical article chunks
// from the knowledge_base_chunks table using pgvector
// cosine similarity search.

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/khabri/vector-store";

export interface RelevantChunk {
  id: string;
  articleId: string;
  articleTitle: string;
  chunkIndex: number;
  content: string;
  distance: number;
}

/**
 * Embed a user query and find the most semantically similar
 * article chunks from the knowledge base.
 *
 * Uses pgvector's cosine distance operator (`<=>`) against
 * the `knowledge_base_chunks` table.
 *
 * @param userQuery  The search query or GI prompt
 * @param limit      Max chunks to return (default: 5)
 * @param threshold  Max cosine distance to include (default: 0.4)
 */
export async function findRelevantContext(
  userQuery: string,
  limit = 5,
  threshold = 0.4
): Promise<RelevantChunk[]> {
  // Generate embedding for the query
  const embedding = await generateEmbedding(userQuery);
  if (!embedding) {
    console.warn("[Vritti RAG] Embedding generation failed — skipping search");
    return [];
  }

  const vectorStr = `[${embedding.join(",")}]`;

  // Cosine similarity search against the knowledge base
  const results = await prisma.$queryRaw<RelevantChunk[]>`
    SELECT
      kbc.id,
      kbc."articleId",
      kbc."articleTitle",
      kbc."chunkIndex",
      kbc.content,
      kbc.embedding <=> ${vectorStr}::vector(768) AS distance
    FROM knowledge_base_chunks kbc
    WHERE kbc.embedding IS NOT NULL
      AND kbc.embedding <=> ${vectorStr}::vector(768) < ${threshold}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  return results;
}

/**
 * Build a formatted context string from retrieved chunks,
 * suitable for injection into an LLM system prompt.
 *
 * Groups chunks by article and presents them with source attribution.
 */
export function formatContextForPrompt(chunks: RelevantChunk[]): string {
  if (chunks.length === 0) return "";

  // Group by article
  const byArticle = new Map<string, RelevantChunk[]>();
  for (const chunk of chunks) {
    const existing = byArticle.get(chunk.articleId) || [];
    existing.push(chunk);
    byArticle.set(chunk.articleId, existing);
  }

  const sections: string[] = [];

  for (const [, articleChunks] of byArticle) {
    // Sort by chunk index for reading order
    articleChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    const title = articleChunks[0].articleTitle;
    const body = articleChunks.map((c) => c.content).join("\n\n");
    sections.push(`--- From: "${title}" ---\n${body}`);
  }

  return sections.join("\n\n");
}
