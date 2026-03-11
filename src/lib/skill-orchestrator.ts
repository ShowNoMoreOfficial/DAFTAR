import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { routeToModel, type TaskType } from "@/lib/yantri/model-router";

// ─── Types ────────────────────────────────────────────────

export interface SkillMeta {
  name: string;
  module: string;
  trigger: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  scripts: string[];
}

export interface SkillFile {
  path: string;
  domain: string;
  meta: SkillMeta;
  instructions: string;
  learningLog: string;
  rawContent: string;
}

export interface SkillExecutionRequest {
  skillPath: string;
  context: Record<string, unknown>;
  model?: string;
  executedById?: string;
  brandId?: string;
  platform?: string;
  deliverableId?: string;
  /** Skip LLM call — return only the assembled prompt (for callers that handle LLM themselves) */
  skipLlm?: boolean;
}

export interface SkillExecutionResult {
  success: boolean;
  output: Record<string, unknown>;
  tokensUsed?: number;
  durationMs: number;
  error?: string;
}

export interface SkillChainRequest {
  skillPaths: string[];
  context: Record<string, unknown>;
  model?: string;
  executedById?: string;
  brandId?: string;
  platform?: string;
}

export interface SkillChainResult {
  success: boolean;
  results: Array<{ skillPath: string; result: SkillExecutionResult }>;
  mergedOutput: Record<string, unknown>;
  totalDurationMs: number;
}

// ─── Constants ────────────────────────────────────────────

const SKILLS_DIR = path.join(process.cwd(), "skills");
const SKILL_CACHE = new Map<string, { content: string; loadedAt: number }>();
const CACHE_TTL = 60_000; // 60s

// Domain to module mapping
const DOMAIN_MODULE_MAP: Record<string, string> = {
  signals: "khabri",
  narrative: "yantri",
  production: "pms",
  platforms: "relay",
  distribution: "relay",
  analytics: "hoccr",
  brand: "daftar",
  gi: "gi",
  workflows: "daftar",
  system: "daftar",
};

// Domain to LLM task type mapping
const DOMAIN_TASK_MAP: Record<string, TaskType> = {
  signals: "analysis",
  narrative: "drafting",
  production: "packaging",
  platforms: "drafting",
  distribution: "packaging",
  analytics: "analysis",
  brand: "analysis",
  gi: "analysis",
  workflows: "strategy",
  system: "analysis",
};

// ─── Parser ───────────────────────────────────────────────

function parseSkillMeta(content: string): SkillMeta {
  const getField = (label: string): string => {
    const match = content.match(new RegExp(`^## ${label}:\\s*(.+)$`, "m"));
    return match?.[1]?.trim() ?? "";
  };

  const getListField = (label: string): string[] => {
    const val = getField(label);
    if (!val) return [];
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  return {
    name: getField("Skill") || getField("Name") || extractNameFromPath(""),
    module: getField("Module"),
    trigger: getField("Trigger"),
    inputs: getListField("Inputs"),
    outputs: getListField("Outputs"),
    dependencies: getListField("Dependencies"),
    scripts: getListField("Scripts"),
  };
}

function extractNameFromPath(filePath: string): string {
  const base = path.basename(filePath, ".md");
  return base
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractInstructions(content: string): string {
  const instrMatch = content.match(
    /## Instructions\s*\n([\s\S]*?)(?=\n## Learning Log|$)/
  );
  return instrMatch?.[1]?.trim() ?? "";
}

function extractLearningLog(content: string): string {
  const logMatch = content.match(/## Learning Log\s*\n([\s\S]*?)$/);
  return logMatch?.[1]?.trim() ?? "";
}

function extractDomain(skillPath: string): string {
  // skillPath like "/signals/detection/event-detection.md"
  const normalized = skillPath.replace(/\\/g, "/").replace(/^\//, "");
  const firstSegment = normalized.split("/")[0];
  return firstSegment || "system";
}

// ─── Skill Orchestrator ──────────────────────────────────

export class SkillOrchestrator {
  /**
   * Load a skill file from the /skills/ directory
   */
  async loadSkill(skillPath: string): Promise<SkillFile> {
    const normalized = skillPath.replace(/\\/g, "/");
    const fullPath = path.join(SKILLS_DIR, normalized);

    // Check cache
    const cached = SKILL_CACHE.get(normalized);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL) {
      return this.parseSkillFile(normalized, cached.content);
    }

    const content = await fs.readFile(fullPath, "utf-8");

    SKILL_CACHE.set(normalized, { content, loadedAt: Date.now() });

    return this.parseSkillFile(normalized, content);
  }

  /**
   * Load multiple skills for a workflow chain
   */
  async loadSkillChain(paths: string[]): Promise<SkillFile[]> {
    return Promise.all(paths.map((p) => this.loadSkill(p)));
  }

  /**
   * Parse a skill file's raw content into structured SkillFile
   */
  private parseSkillFile(skillPath: string, content: string): SkillFile {
    const meta = parseSkillMeta(content);
    const domain = extractDomain(skillPath);

    if (!meta.name || meta.name === extractNameFromPath("")) {
      meta.name = extractNameFromPath(skillPath);
    }
    if (!meta.module) {
      meta.module = DOMAIN_MODULE_MAP[domain] ?? "daftar";
    }

    return {
      path: skillPath,
      domain,
      meta,
      instructions: extractInstructions(content),
      learningLog: extractLearningLog(content),
      rawContent: content,
    };
  }

  /**
   * Execute a skill: load md → combine with context → call LLM → return generated content.
   * Set `skipLlm: true` to only assemble the prompt without calling the LLM.
   */
  async executeSkill(
    req: SkillExecutionRequest
  ): Promise<SkillExecutionResult> {
    const startTime = Date.now();

    try {
      const skill = await this.loadSkill(req.skillPath);

      // Build the prompt from skill instructions + context
      const prompt = this.buildPrompt(skill, req.context);

      // If skipLlm, return prompt-only (for GI skill-engine and other prompt assemblers)
      if (req.skipLlm) {
        const durationMs = Date.now() - startTime;
        await this.recordExecution({
          skillPath: req.skillPath,
          context: req.context,
          output: { prompt, instructions: skill.instructions },
          model: "prompt-only",
          durationMs,
          executedById: req.executedById,
          brandId: req.brandId,
          platform: req.platform,
          deliverableId: req.deliverableId,
          status: "completed",
        });
        return {
          success: true,
          output: {
            prompt,
            skillName: skill.meta.name,
            domain: skill.domain,
            instructions: skill.instructions,
            learningLog: skill.learningLog,
            dependencies: skill.meta.dependencies,
            scripts: skill.meta.scripts,
          },
          durationMs,
        };
      }

      // Determine LLM task type from domain
      const taskType: TaskType =
        DOMAIN_TASK_MAP[skill.domain] ?? "drafting";

      // System prompt: skill instructions + learning context
      const systemPrompt = [
        `You are executing the "${skill.meta.name}" skill.`,
        skill.instructions,
        skill.learningLog
          ? `\n## Previous Learnings\n${skill.learningLog}`
          : "",
        "\nRespond with valid JSON containing your output. Include a `draft` field with the main generated text content.",
      ]
        .filter(Boolean)
        .join("\n");

      // User message: the context data
      const userMessage = `Process the following context and produce the output:\n\n${JSON.stringify(req.context, null, 2)}`;

      // Call LLM via model-router
      const llmResult = await routeToModel(taskType, systemPrompt, userMessage, {
        temperature: taskType === "analysis" ? 0.2 : 0.5,
      });

      const durationMs = Date.now() - startTime;

      // Parse LLM output
      const parsedOutput =
        typeof llmResult.parsed === "object" && llmResult.parsed !== null
          ? (llmResult.parsed as Record<string, unknown>)
          : { draft: llmResult.raw };

      const output: Record<string, unknown> = {
        ...parsedOutput,
        draft: parsedOutput.draft ?? llmResult.raw,
        prompt,
        skillName: skill.meta.name,
        domain: skill.domain,
        modelUsed: llmResult.model,
      };

      // Record execution in DB
      await this.recordExecution({
        skillPath: req.skillPath,
        context: req.context,
        output,
        model: llmResult.model,
        durationMs,
        executedById: req.executedById,
        brandId: req.brandId,
        platform: req.platform,
        deliverableId: req.deliverableId,
        status: "completed",
      });

      return {
        success: true,
        output,
        tokensUsed: undefined, // Gemini SDK doesn't expose token count in current wrapper
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";

      await this.recordExecution({
        skillPath: req.skillPath,
        context: req.context,
        output: { error: errorMsg },
        model: req.model ?? "system",
        durationMs,
        executedById: req.executedById,
        brandId: req.brandId,
        platform: req.platform,
        deliverableId: req.deliverableId,
        status: "failed",
        errorMessage: errorMsg,
      });

      return {
        success: false,
        output: {},
        durationMs,
        error: errorMsg,
      };
    }
  }

  /**
   * Execute a chain of skills sequentially, piping context forward
   */
  async executeChain(req: SkillChainRequest): Promise<SkillChainResult> {
    const startTime = Date.now();
    const results: SkillChainResult["results"] = [];
    let mergedOutput: Record<string, unknown> = { ...req.context };

    for (const skillPath of req.skillPaths) {
      const result = await this.executeSkill({
        skillPath,
        context: mergedOutput,
        model: req.model,
        executedById: req.executedById,
        brandId: req.brandId,
        platform: req.platform,
      });

      results.push({ skillPath, result });

      if (!result.success) {
        return {
          success: false,
          results,
          mergedOutput,
          totalDurationMs: Date.now() - startTime,
        };
      }

      // Merge output into context for next skill
      mergedOutput = { ...mergedOutput, ...result.output };
    }

    return {
      success: true,
      results,
      mergedOutput,
      totalDurationMs: Date.now() - startTime,
    };
  }

  /**
   * Build a prompt from a skill file + context
   */
  private buildPrompt(
    skill: SkillFile,
    context: Record<string, unknown>
  ): string {
    const parts: string[] = [];

    parts.push(`# Skill: ${skill.meta.name}`);
    parts.push(`## Domain: ${skill.domain}`);
    parts.push(`## Module: ${skill.meta.module}`);
    parts.push("");

    if (skill.instructions) {
      parts.push("## Instructions");
      parts.push(skill.instructions);
      parts.push("");
    }

    if (skill.learningLog) {
      parts.push("## Previous Learnings");
      parts.push(skill.learningLog);
      parts.push("");
    }

    parts.push("## Context");
    parts.push("```json");
    parts.push(JSON.stringify(context, null, 2));
    parts.push("```");

    return parts.join("\n");
  }

  /**
   * Record an execution in the database
   */
  private async recordExecution(data: {
    skillPath: string;
    context: Record<string, unknown>;
    output: Record<string, unknown>;
    model: string;
    durationMs: number;
    executedById?: string;
    brandId?: string;
    platform?: string;
    deliverableId?: string;
    status: string;
    errorMessage?: string;
  }) {
    try {
      // Find or create the skill record
      const skill = await prisma.skill.upsert({
        where: { path: data.skillPath },
        create: {
          path: data.skillPath,
          domain: extractDomain(data.skillPath),
          module:
            DOMAIN_MODULE_MAP[extractDomain(data.skillPath)] ?? "daftar",
          name: extractNameFromPath(data.skillPath),
        },
        update: {},
      });

      await prisma.skillExecution.create({
        data: {
          skillId: skill.id,
          deliverableId: data.deliverableId,
          brandId: data.brandId,
          platform: data.platform,
          inputContext: data.context as object,
          outputSummary: data.output as object,
          modelUsed: data.model,
          durationMs: data.durationMs,
          status: data.status,
          errorMessage: data.errorMessage,
          executedById: data.executedById,
        },
      });
    } catch {
      // Don't let recording failure break execution
      console.error("[SkillOrchestrator] Failed to record execution");
    }
  }

  /**
   * Scan the /skills/ directory and sync all skill files to the database
   */
  async syncSkillsToDb(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    const skillFiles = await this.scanSkillFiles();

    for (const filePath of skillFiles) {
      try {
        const skill = await this.loadSkill(filePath);
        await prisma.skill.upsert({
          where: { path: filePath },
          create: {
            path: filePath,
            domain: skill.domain,
            module: skill.meta.module,
            name: skill.meta.name,
            description: skill.instructions.slice(0, 500) || null,
            metadata: {
              trigger: skill.meta.trigger,
              inputs: skill.meta.inputs,
              outputs: skill.meta.outputs,
              dependencies: skill.meta.dependencies,
              scripts: skill.meta.scripts,
            },
          },
          update: {
            domain: skill.domain,
            module: skill.meta.module,
            name: skill.meta.name,
            description: skill.instructions.slice(0, 500) || null,
            version: { increment: 1 },
            metadata: {
              trigger: skill.meta.trigger,
              inputs: skill.meta.inputs,
              outputs: skill.meta.outputs,
              dependencies: skill.meta.dependencies,
              scripts: skill.meta.scripts,
            },
          },
        });
        synced++;
      } catch (error) {
        errors.push(
          `${filePath}: ${error instanceof Error ? error.message : "Unknown"}`
        );
      }
    }

    return { synced, errors };
  }

  /**
   * Recursively scan /skills/ for .md files (excluding README.md)
   */
  private async scanSkillFiles(dir?: string): Promise<string[]> {
    const scanDir = dir ?? SKILLS_DIR;
    const results: string[] = [];

    try {
      const entries = await fs.readdir(scanDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(scanDir, entry.name);

        if (entry.isDirectory() && entry.name !== "scripts") {
          const nested = await this.scanSkillFiles(fullPath);
          results.push(...nested);
        } else if (
          entry.isFile() &&
          entry.name.endsWith(".md") &&
          entry.name !== "README.md"
        ) {
          // Convert to relative path from skills dir
          const relative = path
            .relative(SKILLS_DIR, fullPath)
            .replace(/\\/g, "/");
          results.push(relative);
        }
      }
    } catch {
      // Directory may not exist yet
    }

    return results;
  }

  /**
   * Get skill performance stats from the database
   */
  async getSkillPerformance(
    skillPath?: string
  ): Promise<
    Array<{
      path: string;
      name: string;
      domain: string;
      totalExecutions: number;
      avgDuration: number;
      avgScore: number | null;
      successRate: number;
    }>
  > {
    const where = skillPath ? { path: skillPath } : {};

    const skills = await prisma.skill.findMany({
      where,
      include: {
        executions: {
          select: {
            durationMs: true,
            performanceScore: true,
            status: true,
          },
        },
        _count: { select: { executions: true, learningLogs: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return skills.map((skill) => {
      const execs = skill.executions;
      const successful = execs.filter((e) => e.status === "completed");
      const scores = execs
        .map((e) => e.performanceScore)
        .filter((s): s is number => s !== null);
      const durations = execs
        .map((e) => e.durationMs)
        .filter((d): d is number => d !== null);

      return {
        path: skill.path,
        name: skill.name,
        domain: skill.domain,
        totalExecutions: execs.length,
        avgDuration:
          durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0,
        avgScore:
          scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : null,
        successRate:
          execs.length > 0 ? successful.length / execs.length : 1,
      };
    });
  }

  /**
   * Check if a skill file exists without loading it
   */
  async skillExists(skillPath: string): Promise<boolean> {
    const normalized = skillPath.replace(/\\/g, "/");
    // Check cache first
    if (SKILL_CACHE.has(normalized)) return true;
    const fullPath = path.join(SKILLS_DIR, normalized);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear the in-memory skill cache
   */
  clearCache(): void {
    SKILL_CACHE.clear();
  }
}

// Singleton export
export const skillOrchestrator = new SkillOrchestrator();
