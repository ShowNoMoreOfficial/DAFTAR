import type { Role } from "@prisma/client";
import {
  generateInsights,
  clearInsightsCache,
  type GIInsight,
  type GIEngineContext,
} from "@/lib/gi-engine";
import { skillOrchestrator, type SkillFile } from "@/lib/skill-orchestrator";
import { daftarEvents } from "@/lib/event-bus";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────

export interface GISkillContext extends GIEngineContext {
  brandSlug?: string;
  platform?: string;
  signalData?: Record<string, unknown>;
}

export interface GISkillInsight extends GIInsight {
  skillSource?: string;
  skillDomain?: string;
}

interface GIConfig {
  tier: number; // 1=Baby, 2=Toddler, 3=Adolescent, 4=Adult
  enabledCategories: string[];
  enableSkillLoading: boolean;
  notificationLevel: "minimal" | "balanced" | "active" | "maximum";
}

// ─── Default Config ────────────────────────────────────────

const DEFAULT_CONFIG: GIConfig = {
  tier: 2,
  enabledCategories: [
    "task-nudges",
    "overdue-warnings",
    "celebrations",
    "workload",
    "streak",
  ],
  enableSkillLoading: true,
  notificationLevel: "balanced",
};

// ─── Module-to-Skill Mapping ──────────────────────────────

const MODULE_SKILL_MAP: Record<string, string[]> = {
  khabri: [
    "gi/behavioral-principles.md",
    "gi/scenario-playbook.md",
    "signals/detection/event-detection.md",
  ],
  yantri: [
    "gi/behavioral-principles.md",
    "narrative/editorial/topic-selection.md",
    "narrative/editorial/narrative-arc-construction.md",
    "narrative/voice/hook-engineering.md",
  ],
  pms: [
    "gi/behavioral-principles.md",
    "gi/motivational-intelligence.md",
    "gi/scenario-playbook.md",
    "workflows/daily-content-plan.md",
  ],
  relay: [
    "gi/behavioral-principles.md",
    "distribution/cross-platform-scheduling.md",
    "distribution/release-cadence-management.md",
    "distribution/content-sequencing.md",
  ],
  finance: ["gi/behavioral-principles.md", "gi/role-boundaries.md"],
  hoccr: [
    "gi/behavioral-principles.md",
    "gi/organizational-learning.md",
  ],
  dashboard: ["gi/behavioral-principles.md", "gi/motivational-intelligence.md"],
};

// Role-specific skill files loaded for behavior guidance
const ROLE_SKILL_MAP: Record<string, string[]> = {
  ADMIN: ["gi/admin-controls.md", "gi/tier-definitions.md"],
  HEAD_HR: ["gi/role-boundaries.md"],
  DEPT_HEAD: ["gi/role-boundaries.md", "gi/tier-definitions.md"],
  MEMBER: ["gi/motivational-intelligence.md"],
  CLIENT: ["gi/role-boundaries.md"],
  FINANCE: ["gi/role-boundaries.md"],
  CONTRACTOR: ["gi/role-boundaries.md"],
};

// ─── Skill-Aware GI Engine ────────────────────────────────

/**
 * Enhanced GI engine that loads relevant skill files to provide
 * context-aware, module-specific insights alongside the existing
 * database-driven insights from gi-engine.ts.
 */
export async function generateSkillAwareInsights(
  userId: string,
  context: GISkillContext,
  config: Partial<GIConfig> = {}
): Promise<GISkillInsight[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // 1. Generate base insights from existing engine (all 23 generators)
  const baseInsights = await generateInsights(userId, context);

  // 2. If skill loading is disabled or tier is too low, return base only
  if (!cfg.enableSkillLoading || cfg.tier < 2) {
    return baseInsights;
  }

  // 3. Load module-specific skill insights
  const skillInsights = await generateModuleSkillInsights(
    userId,
    context,
    cfg
  );

  // 4. Merge and deduplicate
  const allInsights = [...baseInsights, ...skillInsights];

  // 5. Apply notification level limits
  const limit = getInsightLimit(cfg.notificationLevel);
  return allInsights.slice(0, limit);
}

// ─── Module-Specific Skill Insights ───────────────────────

async function generateModuleSkillInsights(
  userId: string,
  context: GISkillContext,
  config: GIConfig
): Promise<GISkillInsight[]> {
  const insights: GISkillInsight[] = [];
  const moduleSkills = MODULE_SKILL_MAP[context.module] ?? [];
  const roleSkills = ROLE_SKILL_MAP[context.userRole] ?? [];

  // Load skills silently — never let skill loading break GI
  const loadedSkills: SkillFile[] = [];
  for (const skillPath of [...moduleSkills, ...roleSkills]) {
    try {
      const skill = await skillOrchestrator.loadSkill(skillPath);
      loadedSkills.push(skill);
    } catch {
      // Skill file may not exist yet — silently skip
    }
  }

  if (loadedSkills.length === 0) return insights;

  // Generate context-specific insights based on loaded skills
  const moduleInsights = getModuleSpecificInsights(
    context,
    loadedSkills,
    config
  );
  insights.push(...moduleInsights);

  return insights;
}

function getModuleSpecificInsights(
  context: GISkillContext,
  skills: SkillFile[],
  config: GIConfig
): GISkillInsight[] {
  const insights: GISkillInsight[] = [];

  // Khabri-specific: Signal processing guidance
  if (context.module === "khabri" && context.signalData) {
    const signalSkill = skills.find((s) =>
      s.path.includes("event-detection")
    );
    if (signalSkill) {
      insights.push({
        id: `skill-khabri-signal-${Date.now()}`,
        type: "suggestion",
        priority: "medium",
        title: "Signal Analysis Available",
        message:
          "High-velocity signal detected. Use the signal-to-deliverable workflow for structured coverage planning.",
        action: {
          label: "Start workflow",
          href: "/admin/skills?skill=workflows/signal-to-deliverable.md",
        },
        context: context.module,
        skillSource: signalSkill.path,
        skillDomain: signalSkill.domain,
      });
    }
  }

  // PMS-specific: Production guidance
  if (context.module === "pms") {
    const scenarioSkill = skills.find((s) =>
      s.path.includes("scenario-playbook")
    );
    if (scenarioSkill && config.tier >= 3) {
      insights.push({
        id: `skill-pms-workflow-${Date.now()}`,
        type: "info",
        priority: "low",
        title: "Production Skills Loaded",
        message:
          "GI has loaded production workflow skills. Task sequencing and capacity matching are active.",
        context: context.module,
        skillSource: scenarioSkill.path,
        skillDomain: scenarioSkill.domain,
      });
    }
  }

  // Relay-specific: Distribution guidance
  if (context.module === "relay") {
    const schedulingSkill = skills.find((s) =>
      s.path.includes("cross-platform-scheduling")
    );
    if (schedulingSkill) {
      insights.push({
        id: `skill-relay-scheduling-${Date.now()}`,
        type: "suggestion",
        priority: "low",
        title: "Scheduling Intelligence Active",
        message:
          "Platform-specific scheduling skills loaded. Optimal posting times and cadence rules are available.",
        context: context.module,
        skillSource: schedulingSkill.path,
        skillDomain: schedulingSkill.domain,
      });
    }
  }

  // HOCCR-specific: Learning insights
  if (context.module === "hoccr" && config.tier >= 3) {
    const learningSkill = skills.find((s) =>
      s.path.includes("organizational-learning")
    );
    if (learningSkill) {
      insights.push({
        id: `skill-hoccr-learning-${Date.now()}`,
        type: "info",
        priority: "low",
        title: "Organizational Learning Active",
        message:
          "Cross-domain pattern synthesis is enabled. Skill performance scoring and learning cycle data are available.",
        context: context.module,
        skillSource: learningSkill.path,
        skillDomain: learningSkill.domain,
      });
    }
  }

  return insights;
}

// ─── Event Bus Integration ────────────────────────────────

/**
 * Register GI event listeners on the event bus.
 * The GI listens for organizational events and loads relevant
 * skills to generate reactive insights.
 */
export function registerGIEventListeners(): void {
  // Signal detected — load signal analysis skills
  daftarEvents.on(
    "signal.detected",
    async (payload: Record<string, unknown>) => {
      try {
        await skillOrchestrator.loadSkill("signals/detection/event-detection.md");
        await skillOrchestrator.loadSkill(
          "narrative/editorial/topic-selection.md"
        );
        // Skills are now cached for when GI generates insights
        // Emit that GI has processed the signal
        daftarEvents.emitEvent("gi.signal.processed", {
          signalId: payload.signalId,
          skillsLoaded: [
            "signals/detection/event-detection.md",
            "narrative/editorial/topic-selection.md",
          ],
        });
      } catch {
        // Silent — event processing should never throw
      }
    }
  );

  // Content published — load analytics skills for learning
  daftarEvents.on(
    "content.published",
    async (payload: Record<string, unknown>) => {
      try {
        await skillOrchestrator.loadSkill(
          "distribution/content-sequencing.md"
        );
        daftarEvents.emitEvent("gi.content.tracked", {
          contentId: payload.contentId,
          brand: payload.brand,
        });
      } catch {
        // Silent
      }
    }
  );

  // Task status changed — load scenario playbook for context
  daftarEvents.on(
    "task.updated",
    async (payload: Record<string, unknown>) => {
      try {
        if (payload.status === "BLOCKED" || payload.status === "OVERDUE") {
          await skillOrchestrator.loadSkill("gi/scenario-playbook.md");
          daftarEvents.emitEvent("gi.task.escalation", {
            taskId: payload.taskId,
            status: payload.status,
            scenario: payload.status === "BLOCKED" ? "dependency_block" : "deadline_risk",
          });
        }
      } catch {
        // Silent
      }
    }
  );

  // Deliverable ready for review — load approval workflow
  daftarEvents.on(
    "deliverable.review_requested",
    async (payload: Record<string, unknown>) => {
      try {
        await skillOrchestrator.loadSkill("workflows/approval-loop.md");
        daftarEvents.emitEvent("gi.review.loaded", {
          deliverableId: payload.deliverableId,
        });
      } catch {
        // Silent
      }
    }
  );

  // Breaking news signal — high urgency, load full workflow
  daftarEvents.on(
    "signal.breaking",
    async (payload: Record<string, unknown>) => {
      try {
        const skills = [
          "signals/detection/event-detection.md",
          "narrative/editorial/topic-selection.md",
          "workflows/signal-to-deliverable.md",
          "gi/scenario-playbook.md",
        ];
        await skillOrchestrator.loadSkillChain(skills);
        daftarEvents.emitEvent("gi.breaking.ready", {
          signalId: payload.signalId,
          skillsLoaded: skills,
          mode: "breaking",
        });
      } catch {
        // Silent
      }
    }
  );

  // ─── PMS: GI Task Reviewer (Phase 1) ────────────────────
  // When a task moves to REVIEW, run the task-reviewer skill
  // and inject GI feedback as a comment + notification.
  daftarEvents.on(
    "PMS_TASK_NEEDS_REVIEW",
    async (payload: {
      taskId: string;
      title: string;
      description: string | null;
      assigneeId: string | null;
      assigneeName: string;
      departmentId: string | null;
    }) => {
      try {
        const result = await skillOrchestrator.executeSkill({
          skillPath: "pms/task-reviewer.md",
          context: {
            task: {
              title: payload.title,
              description: payload.description || "(No description provided)",
              assigneeName: payload.assigneeName,
            },
          },
        });

        if (!result.success) return;

        const review = result.output as {
          approvedForDone?: boolean;
          feedbackComment?: string;
          flaggedDependencies?: string[];
        };

        if (!review.feedbackComment) return;

        // Use first admin as system user for GI comments
        const systemUser = await prisma.user.findFirst({
          where: { role: "ADMIN" },
          select: { id: true },
        });
        if (!systemUser) return;

        // Inject GI review as task comment
        await prisma.taskComment.create({
          data: {
            taskId: payload.taskId,
            authorId: systemUser.id,
            content: `**GI Review:** ${review.feedbackComment}${
              review.flaggedDependencies?.length
                ? `\n\n**Flagged Dependencies:**\n${review.flaggedDependencies.map((d) => `- ${d}`).join("\n")}`
                : ""
            }${
              review.approvedForDone
                ? "\n\n*Recommendation: Ready to move to DONE.*"
                : "\n\n*Recommendation: Needs attention before completion.*"
            }`,
          },
        });

        // Log GI review activity
        await prisma.taskActivity.create({
          data: {
            taskId: payload.taskId,
            actorId: systemUser.id,
            action: "gi_review",
            field: "status",
            oldValue: "REVIEW",
            newValue: review.approvedForDone ? "approved" : "needs_attention",
          },
        });

        // Notify task creator
        const task = await prisma.task.findUnique({
          where: { id: payload.taskId },
          select: { creatorId: true },
        });
        if (task?.creatorId) {
          await prisma.notification.create({
            data: {
              userId: task.creatorId,
              type: "GI_REVIEW",
              title: `GI reviewed: ${payload.title}`,
              message: review.feedbackComment,
              link: `/m/pms/board?task=${payload.taskId}`,
            },
          });
        }

        daftarEvents.emitEvent("gi.task.reviewed", {
          taskId: payload.taskId,
          approved: review.approvedForDone,
          dependencies: review.flaggedDependencies,
        });
      } catch {
        // Silent — GI review should never block task flow
      }
    }
  );

  // ─── PMS: Task Created — Track Department Metrics ───────
  daftarEvents.on(
    "PMS_TASK_CREATED",
    async (payload: { taskId: string; departmentId: string | null }) => {
      if (!payload.departmentId) return;
      try {
        await prisma.departmentMetrics.upsert({
          where: { departmentId: payload.departmentId },
          create: { departmentId: payload.departmentId, velocity: 0, openBlockers: 0 },
          update: {},
        });
      } catch {
        // Silent
      }
    }
  );

  // ─── PMS: Task Done — Update Department Velocity ────────
  daftarEvents.on(
    "PMS_TASK_STATUS_CHANGED",
    async (payload: { taskId: string; oldStatus: string; newStatus: string }) => {
      if (payload.newStatus !== "DONE") return;
      try {
        const task = await prisma.task.findUnique({
          where: { id: payload.taskId },
          select: { departmentId: true },
        });
        if (!task?.departmentId) return;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const completedThisWeek = await prisma.task.count({
          where: {
            departmentId: task.departmentId,
            status: "DONE",
            completedAt: { gte: weekAgo },
          },
        });

        await prisma.departmentMetrics.upsert({
          where: { departmentId: task.departmentId },
          create: { departmentId: task.departmentId, velocity: completedThisWeek, openBlockers: 0 },
          update: { velocity: completedThisWeek },
        });
      } catch {
        // Silent
      }
    }
  );
}

// ─── Skill-Aware GI Query Handler ────────────────────────

/**
 * Handle a GI chat query with skill context.
 * Loads relevant skills based on the query topic and module context.
 */
export async function handleGIQueryWithSkills(
  query: string,
  userId: string,
  context: GISkillContext,
  config: Partial<GIConfig> = {}
): Promise<{
  skillContext: string;
  loadedSkills: string[];
  insights: GISkillInsight[];
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const loadedSkillPaths: string[] = [];
  const skillContextParts: string[] = [];

  // Load module skills
  const moduleSkills = MODULE_SKILL_MAP[context.module] ?? [];
  for (const skillPath of moduleSkills) {
    try {
      const skill = await skillOrchestrator.loadSkill(skillPath);
      loadedSkillPaths.push(skillPath);
      skillContextParts.push(
        `### ${skill.meta.name}\n${skill.instructions}\n`
      );
    } catch {
      // Skip unavailable skills
    }
  }

  // Load brand-specific skills if brand context provided
  if (context.brandSlug) {
    const brandSkills = [
      `brand/identity/${context.brandSlug}/identity.md`,
      `brand/identity/${context.brandSlug}/audience.md`,
    ];
    for (const skillPath of brandSkills) {
      try {
        const skill = await skillOrchestrator.loadSkill(skillPath);
        loadedSkillPaths.push(skillPath);
        skillContextParts.push(
          `### ${skill.meta.name}\n${skill.instructions}\n`
        );
      } catch {
        // Brand may not exist
      }
    }
  }

  // Load platform-specific skills if platform context provided
  if (context.platform) {
    const platformMap: Record<string, string[]> = {
      youtube: [
        "platforms/youtube/title-engineering.md",
        "platforms/youtube/analytics-interpretation.md",
      ],
      "x-twitter": [
        "platforms/x-twitter/tweet-crafting.md",
        "platforms/x-twitter/algorithm-awareness.md",
      ],
      instagram: [
        "platforms/meta/reel-production.md",
        "platforms/meta/instagram-seo.md",
      ],
      linkedin: [
        "platforms/linkedin/professional-tone-calibration.md",
      ],
    };
    const platSkills = platformMap[context.platform] ?? [];
    for (const skillPath of platSkills) {
      try {
        const skill = await skillOrchestrator.loadSkill(skillPath);
        loadedSkillPaths.push(skillPath);
        skillContextParts.push(
          `### ${skill.meta.name}\n${skill.instructions}\n`
        );
      } catch {
        // Platform skill may not exist
      }
    }
  }

  // Generate insights with skill awareness
  const insights = await generateSkillAwareInsights(userId, context, cfg);

  return {
    skillContext: skillContextParts.join("\n---\n\n"),
    loadedSkills: loadedSkillPaths,
    insights,
  };
}

// ─── Helpers ──────────────────────────────────────────────

function getInsightLimit(
  level: GIConfig["notificationLevel"]
): number {
  switch (level) {
    case "minimal":
      return 5;
    case "balanced":
      return 15;
    case "active":
      return 25;
    case "maximum":
      return 50;
  }
}

// ─── Exports ──────────────────────────────────────────────

export { clearInsightsCache };
export type { GIConfig };
