import { buildContentGenerationPrompt, buildPackagingPrompt } from "@/lib/yantri/prompts";
import { routeToModel } from "@/lib/yantri/model-router";
import { type SEOAnalysis } from "@/lib/yantri/seo-engine";

export interface ContentEngineParams {
  narrativeAngle: string;
  trendHeadline: string;
  platform: string;
  format: string;
  brandName: string;
  brandTone: string;
  voiceRules: string;
  language: string;
  researchResults: string;
  seo?: SEOAnalysis | null;
}

export interface ContentEngineResult {
  platform: string;
  content: Record<string, unknown>;
  postingPlan: Record<string, unknown>;
  model: string;
  raw: string;
}

export interface PackagingEngineParams {
  narrativeAngle: string;
  platform: string;
  brandName: string;
  keyDataPoints: string;
}

export interface PackagingEngineResult {
  titles: {
    data_first: string;
    question: string;
    consequence: string;
  };
  thumbnail: {
    visual: string;
    text_overlay: string;
    emotion: string;
    color_mood: string;
  };
  description: string;
  tags: string[];
  posting_time: {
    time_ist: string;
    reasoning: string;
  };
  repurpose: Array<{
    target_platform: string;
    what_to_extract: string;
    format: string;
  }>;
  model: string;
  raw: string;
}

export async function runContentEngine(
  params: ContentEngineParams
): Promise<ContentEngineResult> {
  const {
    narrativeAngle,
    trendHeadline,
    platform,
    format,
    brandName,
    brandTone,
    voiceRules,
    language,
    researchResults,
  } = params;

  if (!narrativeAngle?.trim()) {
    throw new Error("ContentEngine: narrativeAngle is required");
  }
  if (!platform?.trim()) {
    throw new Error("ContentEngine: platform is required");
  }
  if (!brandName?.trim()) {
    throw new Error("ContentEngine: brandName is required");
  }

  const { systemPrompt, userMessage } = await buildContentGenerationPrompt(
    platform,
    narrativeAngle,
    format,
    brandName,
    brandTone,
    voiceRules,
    language,
    researchResults,
    trendHeadline,
    undefined,
    params.seo
  );

  const result = await routeToModel("drafting", systemPrompt, userMessage, {
    temperature: 0.5,
  });

  if (!result.parsed) {
    throw new Error(
      `ContentEngine: model returned unparseable response. Raw (first 300 chars): ${result.raw.slice(0, 300)}`
    );
  }

  const parsed = result.parsed as Record<string, unknown>;

  return {
    platform: (parsed.platform as string) ?? platform,
    content: (parsed.content as Record<string, unknown>) ?? {},
    postingPlan: (parsed.postingPlan as Record<string, unknown>) ?? {},
    model: result.model,
    raw: result.raw,
  };
}

export async function runPackagingEngine(
  params: PackagingEngineParams
): Promise<PackagingEngineResult> {
  const { narrativeAngle, platform, brandName, keyDataPoints } = params;

  if (!narrativeAngle?.trim()) {
    throw new Error("PackagingEngine: narrativeAngle is required");
  }
  if (!platform?.trim()) {
    throw new Error("PackagingEngine: platform is required");
  }
  if (!brandName?.trim()) {
    throw new Error("PackagingEngine: brandName is required");
  }

  const { systemPrompt, userMessage } = buildPackagingPrompt(
    narrativeAngle,
    platform,
    brandName,
    keyDataPoints
  );

  const result = await routeToModel("packaging", systemPrompt, userMessage);

  if (!result.parsed) {
    throw new Error(
      `PackagingEngine: model returned unparseable response. Raw (first 300 chars): ${result.raw.slice(0, 300)}`
    );
  }

  const parsed = result.parsed as Record<string, unknown>;

  const titles = (parsed.titles ?? {}) as PackagingEngineResult["titles"];
  const thumbnail = (parsed.thumbnail ?? {}) as PackagingEngineResult["thumbnail"];
  const posting_time = (parsed.posting_time ?? {}) as PackagingEngineResult["posting_time"];
  const repurpose = (parsed.repurpose ?? []) as PackagingEngineResult["repurpose"];

  return {
    titles,
    thumbnail,
    description: (parsed.description as string) ?? "",
    tags: (parsed.tags as string[]) ?? [],
    posting_time,
    repurpose,
    model: result.model,
    raw: result.raw,
  };
}
