import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/vritti/rag/chunker";
import { generateEmbedding } from "@/lib/khabri/vector-store";

// ─── Vritti RAG: Article Ingestion Pipeline ─────────────
// Triggered when an article is published in the CMS.
// Chunks the content, generates embeddings, and stores
// vectors in the knowledge_base_chunks table for semantic search.

export const ingestVrittiArticle = inngest.createFunction(
  {
    id: "vritti-article-ingest",
    name: "Vritti: RAG Article Ingestion",
    retries: 2,
    concurrency: [{ limit: 3 }],
  },
  { event: "vritti/article.published" as never },
  async ({ event, step }) => {
    const { articleId } = event.data as { articleId: string };

    // ──────────────────────────────────────────────────────
    // Step 1: Fetch the published article
    // ──────────────────────────────────────────────────────
    const article = await step.run("fetch-article", async () => {
      const found = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          body: true,
          excerpt: true,
          status: true,
          category: { select: { name: true } },
          author: { select: { name: true } },
        },
      });

      if (!found || found.status !== "PUBLISHED") {
        throw new Error(`Article ${articleId} not found or not published`);
      }

      return {
        id: found.id,
        title: found.title,
        content: found.body,
        excerpt: found.excerpt,
        categoryName: found.category?.name ?? "Uncategorized",
        authorName: found.author?.name ?? "Unknown",
      };
    });

    // ──────────────────────────────────────────────────────
    // Step 2: Delete any existing chunks for this article
    //         (handles re-publish / content updates)
    // ──────────────────────────────────────────────────────
    await step.run("clear-existing-chunks", async () => {
      await prisma.$executeRaw`
        DELETE FROM knowledge_base_chunks
        WHERE "articleId" = ${article.id}
      `;
    });

    // ──────────────────────────────────────────────────────
    // Step 3: Chunk the article content
    // ──────────────────────────────────────────────────────
    const chunks = await step.run("chunk-content", async () => {
      // Prepend title and metadata for richer semantic context
      const fullText = [
        article.title,
        `Category: ${article.categoryName} | Author: ${article.authorName}`,
        article.excerpt ?? "",
        article.content,
      ]
        .filter(Boolean)
        .join("\n\n");

      return chunkText(fullText, { chunkSize: 500, overlap: 50 });
    });

    if (chunks.length === 0) {
      return { status: "empty", articleId, chunks: 0 };
    }

    // ──────────────────────────────────────────────────────
    // Step 4: Generate embeddings and store chunks
    //         Process in batches of 5 to respect rate limits
    // ──────────────────────────────────────────────────────
    let storedCount = 0;

    for (let i = 0; i < chunks.length; i += 5) {
      const batch = chunks.slice(i, i + 5);
      const batchKey = `embed-batch-${Math.floor(i / 5)}`;

      const batchResult = await step.run(batchKey, async () => {
        let saved = 0;

        for (const chunk of batch) {
          const embedding = await generateEmbedding(chunk.text);

          if (embedding) {
            const vectorStr = `[${embedding.join(",")}]`;
            const chunkId = generateId();

            await prisma.$executeRaw`
              INSERT INTO knowledge_base_chunks (
                id, "articleId", "articleTitle", "chunkIndex",
                content, "tokenEstimate", "charOffset",
                embedding, "createdAt"
              ) VALUES (
                ${chunkId}, ${article.id}, ${article.title}, ${chunk.index},
                ${chunk.text}, ${chunk.tokenEstimate}, ${chunk.charOffset},
                ${vectorStr}::vector(768), NOW()
              )
            `;
            saved++;
          } else {
            // Store chunk without embedding — can be backfilled later
            const chunkId = generateId();
            await prisma.$executeRaw`
              INSERT INTO knowledge_base_chunks (
                id, "articleId", "articleTitle", "chunkIndex",
                content, "tokenEstimate", "charOffset",
                "createdAt"
              ) VALUES (
                ${chunkId}, ${article.id}, ${article.title}, ${chunk.index},
                ${chunk.text}, ${chunk.tokenEstimate}, ${chunk.charOffset},
                NOW()
              )
            `;
            saved++;
          }
        }

        return saved;
      });

      storedCount += batchResult;
    }

    return {
      status: "ingested",
      articleId: article.id,
      title: article.title,
      totalChunks: chunks.length,
      storedChunks: storedCount,
    };
  }
);

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `kbc_${timestamp}${random}`;
}
