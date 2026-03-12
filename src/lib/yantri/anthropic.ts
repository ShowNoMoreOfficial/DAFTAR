import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as {
  anthropicClient: Anthropic | undefined;
};

const anthropic =
  globalForAnthropic.anthropicClient ??
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

if (process.env.NODE_ENV !== "production")
  globalForAnthropic.anthropicClient = anthropic;

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CallClaudeOptions {
  maxTokens?: number;
  temperature?: number;
  /** Per-attempt timeout in ms (default: 30000) */
  timeoutMs?: number;
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options?: CallClaudeOptions
): Promise<{ parsed: unknown; raw: string }> {
  let lastError: Error | null = null;
  const timeoutMs = options?.timeoutMs ?? 30000;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const apiCall = anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: options?.maxTokens ?? 8192,
        temperature: options?.temperature ?? 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      // Race against timeout
      const response = await Promise.race([
        apiCall,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Claude API timeout after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      const textBlock = response.content.find((b) => b.type === "text");
      const rawText = textBlock?.text ?? "";

      if (!rawText.trim()) {
        console.error("Claude returned empty response");
        return { parsed: null, raw: rawText };
      }

      try {
        return { parsed: JSON.parse(rawText), raw: rawText };
      } catch {
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
        try {
          return { parsed: JSON.parse(jsonStr), raw: rawText };
        } catch {
          console.error(
            "Failed to parse Claude response as JSON. Raw (first 500 chars):",
            rawText.slice(0, 500)
          );
          return { parsed: null, raw: rawText };
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[callClaude] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError.message);

      const message = lastError.message.toLowerCase();
      if (
        message.includes("api key") ||
        message.includes("invalid") ||
        message.includes("authentication")
      ) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error("callClaude failed after retries");
}
