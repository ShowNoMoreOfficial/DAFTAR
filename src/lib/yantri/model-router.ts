import { callGemini, callGeminiResearch, type CallGeminiOptions } from "./gemini";

export type TaskType =
  | "strategy"
  | "research"
  | "drafting"
  | "packaging"
  | "analysis"
  | "visual";

export type ModelId = "gemini" | "claude";

interface ModelResult {
  parsed: unknown;
  raw: string;
  model: ModelId;
}

/**
 * All content generation routes to Gemini.
 * Claude is reserved exclusively for GI chat (tool use + small prompts).
 */
export function getModelForTask(_task: TaskType): ModelId {
  return "gemini";
}

export async function routeToModel(
  task: TaskType,
  systemPrompt: string,
  userMessage: string,
  options?: {
    forceModel?: ModelId;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<ModelResult> {
  // Research uses Gemini with web grounding
  if (task === "research") {
    const raw = await callGeminiResearch(systemPrompt, userMessage);
    return { parsed: null, raw, model: "gemini" };
  }

  // All other tasks use Gemini
  const geminiOpts: CallGeminiOptions = {};
  if (options?.maxTokens) geminiOpts.maxOutputTokens = options.maxTokens;
  if (options?.temperature) geminiOpts.temperature = options.temperature;

  const result = await callGemini(systemPrompt, userMessage, geminiOpts);
  return { ...result, model: "gemini" };
}
