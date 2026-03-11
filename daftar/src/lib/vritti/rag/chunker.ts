// ─── Vritti RAG: Semantic Text Chunker ──────────────────
// Splits long-form article content into overlapping chunks
// suitable for embedding. Respects sentence boundaries to
// avoid cutting context mid-thought.
//
// Token estimation: ~4 characters per token (English average).

const CHARS_PER_TOKEN = 4;
const DEFAULT_CHUNK_TOKENS = 500;
const DEFAULT_OVERLAP_TOKENS = 50;

export interface ChunkOptions {
  /** Target tokens per chunk (default: 500) */
  chunkSize?: number;
  /** Overlap tokens between consecutive chunks (default: 50) */
  overlap?: number;
}

export interface Chunk {
  /** Zero-based chunk index */
  index: number;
  /** The chunk text */
  text: string;
  /** Estimated token count */
  tokenEstimate: number;
  /** Character offset in the original text */
  charOffset: number;
}

/**
 * Split a long article into semantic chunks with overlap.
 *
 * Strategy:
 * 1. Split text into sentences (preserving punctuation)
 * 2. Greedily accumulate sentences until the target chunk size
 * 3. Roll back the overlap window for the next chunk start
 *
 * This ensures no sentence is broken mid-way, and consecutive
 * chunks share context via the overlap region.
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): Chunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_TOKENS;
  const overlap = options.overlap ?? DEFAULT_OVERLAP_TOKENS;

  const maxChunkChars = chunkSize * CHARS_PER_TOKEN;
  const overlapChars = overlap * CHARS_PER_TOKEN;

  // Clean the text: normalize whitespace but preserve paragraph breaks
  const cleaned = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();

  if (!cleaned) return [];

  // Split into sentences using common terminators + newlines as boundaries.
  // Regex keeps the delimiter attached to the preceding sentence.
  const sentences = splitSentences(cleaned);

  if (sentences.length === 0) return [];

  const chunks: Chunk[] = [];
  let sentenceIdx = 0;
  let charOffset = 0;

  while (sentenceIdx < sentences.length) {
    let currentChars = 0;
    const chunkSentences: string[] = [];
    const startIdx = sentenceIdx;

    // Accumulate sentences until we hit the chunk size
    while (sentenceIdx < sentences.length) {
      const sentence = sentences[sentenceIdx];
      const sentenceChars = sentence.length;

      // If adding this sentence exceeds the limit and we already
      // have content, stop here (but always include at least one sentence)
      if (currentChars + sentenceChars > maxChunkChars && chunkSentences.length > 0) {
        break;
      }

      chunkSentences.push(sentence);
      currentChars += sentenceChars;
      sentenceIdx++;
    }

    const chunkText = chunkSentences.join("").trim();

    if (chunkText) {
      chunks.push({
        index: chunks.length,
        text: chunkText,
        tokenEstimate: Math.ceil(chunkText.length / CHARS_PER_TOKEN),
        charOffset,
      });
    }

    // Calculate overlap: walk backward from the current position
    // to find a sentence boundary that gives us ~overlapChars of overlap
    if (sentenceIdx < sentences.length) {
      let overlapAccum = 0;
      let rewindTo = sentenceIdx;

      for (let i = sentenceIdx - 1; i > startIdx; i--) {
        overlapAccum += sentences[i].length;
        if (overlapAccum >= overlapChars) {
          rewindTo = i;
          break;
        }
        rewindTo = i;
      }

      // Update charOffset for the next chunk
      charOffset = 0;
      for (let i = 0; i < rewindTo; i++) {
        charOffset += sentences[i].length;
      }

      sentenceIdx = rewindTo;
    }
  }

  return chunks;
}

/**
 * Split text into sentences while keeping delimiters attached.
 * Handles:
 * - Standard terminators: . ! ?
 * - Paragraph breaks (double newline)
 * - Quoted speech and abbreviations (basic heuristic)
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace,
  // or on double newlines (paragraph breaks).
  // The regex uses a lookbehind to keep the punctuation with the sentence.
  const raw = text.split(/(?<=[.!?])\s+|(?<=\n)\n+/);

  // Filter empty strings and re-add spacing
  const sentences: string[] = [];
  for (const segment of raw) {
    const trimmed = segment.trim();
    if (trimmed) {
      sentences.push(trimmed + " ");
    }
  }

  return sentences;
}

/**
 * Estimate token count for a string (~4 chars/token).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
