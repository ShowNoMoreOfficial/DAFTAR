import { callGemini, callGeminiResearch, type CallGeminiOptions } from "./gemini";
import { callClaude, type CallClaudeOptions } from "./anthropic";

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
 * Route tasks to the best model:
 * - Gemini: research (web grounding), strategy, analysis
 * - Claude: drafting (creative writing), packaging (titles/descriptions), visual (prompt engineering)
 */
export function getModelForTask(task: TaskType): ModelId {
  switch (task) {
    case "drafting":
    case "packaging":
    case "visual":
      return "claude";
    case "research":
    case "strategy":
    case "analysis":
    default:
      return "gemini";
  }
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
  const model = options?.forceModel ?? getModelForTask(task);

  // Research always uses Gemini (web grounding)
  if (task === "research") {
    const raw = await callGeminiResearch(systemPrompt, userMessage);
    return { parsed: null, raw, model: "gemini" };
  }

  if (model === "claude") {
    const claudeOpts: CallClaudeOptions = {};
    if (options?.maxTokens) claudeOpts.maxTokens = options.maxTokens;
    if (options?.temperature) claudeOpts.temperature = options.temperature;

    const result = await callClaude(systemPrompt, userMessage, claudeOpts);
    return { ...result, model: "claude" };
  }

  // Default: Gemini
  const geminiOpts: CallGeminiOptions = {};
  if (options?.maxTokens) geminiOpts.maxOutputTokens = options.maxTokens;
  if (options?.temperature) geminiOpts.temperature = options.temperature;

  const result = await callGemini(systemPrompt, userMessage, geminiOpts);
  return { ...result, model: "gemini" };
}
