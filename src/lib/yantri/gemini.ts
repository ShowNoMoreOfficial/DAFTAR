import { GoogleGenAI } from "@google/genai";

const globalForGemini = globalThis as unknown as {
  genAI: GoogleGenAI | undefined;
};

const genAI =
  globalForGemini.genAI ??
  new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

if (process.env.NODE_ENV !== "production") globalForGemini.genAI = genAI;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CallGeminiOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  options?: CallGeminiOptions
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          temperature: options?.temperature ?? 0.3,
          maxOutputTokens: options?.maxOutputTokens ?? 65536,
          responseMimeType: "application/json",
        },
      });

      const rawText = result.text ?? "";

      if (!rawText.trim()) {
        console.error("Gemini returned empty response");
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
          console.error("Failed to parse Gemini response as JSON. Raw (first 500 chars):", rawText.slice(0, 500));
          return { parsed: null, raw: rawText };
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const message = lastError.message.toLowerCase();
      if (message.includes("api key") || message.includes("invalid") || message.includes("permission")) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error("callGemini failed after retries");
}

export interface InlineImageData {
  mimeType: string;
  base64: string;
}

/**
 * Safely parse LLM text as JSON — strips markdown fences, finds JSON objects/arrays.
 * Returns null if parsing fails entirely.
 */
export function safeParseJSON(text: string): unknown {
  if (!text?.trim()) return null;

  // Strip markdown code fences
  let clean = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();

  // Try direct parse
  try {
    return JSON.parse(clean);
  } catch {
    // noop
  }

  // Try finding the first JSON object or array
  const jsonMatch = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // noop
    }
  }

  console.error("[safeParseJSON] Could not parse LLM response:", clean.substring(0, 200));
  return null;
}

export async function callGeminiResearch(
  systemPrompt: string,
  userMessage: string,
  inlineImages?: InlineImageData[]
): Promise<string> {
  let lastError: Error | null = null;

  const contents: unknown = inlineImages && inlineImages.length > 0
    ? [
        { text: userMessage },
        ...inlineImages.map((img) => ({
          inlineData: { mimeType: img.mimeType, data: img.base64 },
        })),
      ]
    : userMessage;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents as string,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          maxOutputTokens: 65536,
          tools: [{ googleSearch: {} }],
        },
      });

      return result.text ?? "";
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const message = lastError.message.toLowerCase();
      if (message.includes("api key") || message.includes("invalid") || message.includes("permission")) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error("callGeminiResearch failed after retries");
}
