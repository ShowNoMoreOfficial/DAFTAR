// ─── GI Engine RAG Hook ─────────────────────────────────
// Middleware that intercepts content-creation-related prompts
// to the GI engine, retrieves relevant historical context
// from the Vritti knowledge base, and injects it into the
// system prompt before the GI responds.

import { findRelevantContext, formatContextForPrompt } from "@/lib/vritti/rag/search";

// Keywords that indicate the user is asking about content creation,
// editorial work, or writing — contexts where CMS history is valuable.
const CONTENT_CREATION_SIGNALS = [
  "write", "draft", "article", "script", "thread", "headline",
  "hook", "caption", "copy", "blog", "editorial", "content",
  "story", "narrative", "angle", "pitch", "title", "outline",
  "vritti", "video script", "reel", "thumbnail", "description",
  "similar to", "like we did", "past coverage", "previous article",
  "historically", "what worked", "best performing", "tone",
  "brand voice", "style guide",
];

/**
 * Detect whether a user prompt is content-creation-related.
 */
function isContentCreationQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return CONTENT_CREATION_SIGNALS.some((signal) => lower.includes(signal));
}

export interface RAGAugmentedPrompt {
  /** The original user message, unchanged */
  originalMessage: string;
  /** System prompt prefix with retrieved CMS context (empty if not applicable) */
  systemContext: string;
  /** Number of knowledge base chunks retrieved */
  chunksRetrieved: number;
  /** Whether RAG was triggered for this prompt */
  ragTriggered: boolean;
}

/**
 * GI RAG middleware. Call this before sending a prompt to the GI engine.
 *
 * If the user's message relates to content creation, this function:
 * 1. Runs semantic search against the Vritti knowledge base
 * 2. Formats the retrieved chunks into a context block
 * 3. Returns a system prompt prefix for injection
 *
 * If the message is unrelated to content, it passes through unchanged.
 *
 * Usage in GI chat route:
 * ```ts
 * const augmented = await augmentWithRAG(userMessage);
 * // Prepend augmented.systemContext to your LLM system prompt
 * ```
 */
export async function augmentWithRAG(
  message: string,
  options: { limit?: number; threshold?: number } = {}
): Promise<RAGAugmentedPrompt> {
  const result: RAGAugmentedPrompt = {
    originalMessage: message,
    systemContext: "",
    chunksRetrieved: 0,
    ragTriggered: false,
  };

  if (!isContentCreationQuery(message)) {
    return result;
  }

  result.ragTriggered = true;

  try {
    const chunks = await findRelevantContext(
      message,
      options.limit ?? 5,
      options.threshold ?? 0.4
    );

    if (chunks.length === 0) {
      return result;
    }

    result.chunksRetrieved = chunks.length;

    const formattedContext = formatContextForPrompt(chunks);

    result.systemContext = [
      "Context from our CMS history (use this to inform your response — match tone, depth, and style of our past successful content):",
      "",
      formattedContext,
      "",
      "---",
      "Use the above context as reference material. Do not copy verbatim — adapt the style and insights to the current request.",
    ].join("\n");
  } catch (err) {
    // RAG failure should never block the GI response
    console.error("[GI RAG Hook] Failed to retrieve context:", err);
  }

  return result;
}
