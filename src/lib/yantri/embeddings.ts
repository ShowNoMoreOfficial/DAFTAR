import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const SIMILARITY_THRESHOLD = 0.85;

const globalForEmbedding = globalThis as unknown as {
  embeddingGenAI: GoogleGenAI | undefined;
};

const genAI =
  globalForEmbedding.embeddingGenAI ??
  new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

if (process.env.NODE_ENV !== "production") globalForEmbedding.embeddingGenAI = genAI;

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await genAI.models.embedContent({
    model: "text-embedding-004",
    contents: text,
  });
  const values = result.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Gemini embedding returned empty values");
  }
  return values;
}

export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export interface SimilarTreeResult {
  id: string;
  title: string;
  similarity: number;
}

export async function findSimilarTree(
  embedding: number[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient: any = prisma,
  threshold: number = SIMILARITY_THRESHOLD
): Promise<SimilarTreeResult | null> {
  const vectorStr = toPgVector(embedding);

  try {
    const results: Array<{ id: string; title: string; distance: number }> =
      await prismaClient.$queryRawUnsafe(
        `SELECT id, title, 1 - (embedding::vector <=> $1::vector) AS distance
         FROM "narrative_trees"
         WHERE embedding IS NOT NULL AND status = 'INCOMING'
         ORDER BY embedding::vector <=> $1::vector
         LIMIT 1`,
        vectorStr
      );

    if (results.length > 0 && results[0].distance >= threshold) {
      return {
        id: results[0].id,
        title: results[0].title,
        similarity: results[0].distance,
      };
    }
    return null;
  } catch {
    const trees = await prismaClient.narrativeTree.findMany({
      where: { embedding: { not: null }, status: "INCOMING" },
      select: { id: true, title: true, embedding: true },
    });

    let best: SimilarTreeResult | null = null;

    for (const tree of trees) {
      if (!tree.embedding) continue;
      try {
        const treeEmbedding: number[] = JSON.parse(tree.embedding);
        if (!Array.isArray(treeEmbedding) || treeEmbedding.length !== embedding.length) continue;
        const sim = cosineSimilarity(embedding, treeEmbedding);
        if (sim > threshold && (!best || sim > best.similarity)) {
          best = { id: tree.id, title: tree.title, similarity: sim };
        }
      } catch {
        continue;
      }
    }

    return best;
  }
}
