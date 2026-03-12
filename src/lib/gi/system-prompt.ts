import { prisma } from "@/lib/prisma";
import { handleGIQueryWithSkills } from "@/lib/gi-skill-engine";
import type { GISkillContext } from "@/lib/gi-skill-engine";
import type { Role } from "@prisma/client";

interface PromptContext {
  userId: string;
  userName: string;
  userRole: Role;
  departmentName: string | null;
  currentModule: string;
  currentView: string;
  currentEntityId: string | null;
  currentEntityType: string | null;
}

/**
 * Build the GI system prompt with live data context, skill files, and personality.
 */
export async function buildSystemPrompt(ctx: PromptContext): Promise<string> {
  // Gather quick stats in parallel
  const [taskStats, contentStats, signalStats, teamStats, tierConfig] =
    await Promise.all([
      getTaskStats(ctx.userId),
      getContentStats(),
      getSignalStats(),
      ctx.userRole === "ADMIN" || ctx.userRole === "DEPT_HEAD" || ctx.userRole === "HEAD_HR"
        ? getTeamStats()
        : null,
      getCurrentTier(),
    ]);

  // Load relevant skill context
  let skillContext = "";
  try {
    const skillResult = await handleGIQueryWithSkills("", ctx.userId, {
      module: ctx.currentModule,
      view: ctx.currentView,
      currentModule: ctx.currentModule,
      currentView: ctx.currentView,
      entityId: ctx.currentEntityId ?? null,
      entityType: ctx.currentEntityType ?? undefined,
      userRole: ctx.userRole,
      userId: ctx.userId,
    } as GISkillContext);
    skillContext = skillResult.skillContext;
  } catch {
    // Skill loading is non-critical
  }

  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const firstName = ctx.userName?.split(" ")[0] || "there";

  const parts: string[] = [
    `You are GI, the operations copilot for Daftar — an AI-powered agency operations platform used by ShowNoMore, a media-tech studio in Delhi.`,
    ``,
    `## YOUR IDENTITY`,
    `- You're a smart, opinionated colleague — not a template engine or generic assistant.`,
    `- You have deep knowledge of media operations, content strategy, editorial workflows, and team management.`,
    `- You speak naturally, concisely, and directly. No corporate fluff.`,
    `- When you have data, cite specific numbers ("You have 3 overdue tasks, the oldest is from March 8").`,
    `- When you don't know something, say so — don't make up numbers.`,
    `- Be proactive: if you notice something concerning (overdue tasks, bottlenecks, declining metrics), bring it up.`,
    `- Use the user's first name occasionally: "${firstName}".`,
    ``,
    `## WHO YOU'RE TALKING TO`,
    `Name: ${ctx.userName}`,
    `Role: ${ctx.userRole}`,
    `Department: ${ctx.departmentName || "General"}`,
  ];

  if (ctx.userRole === "ADMIN") {
    parts.push(
      `You have full visibility — share org-wide insights freely. This user can see everything.`
    );
  } else if (ctx.userRole === "CLIENT") {
    parts.push(
      `This is a client. Only discuss their brands, content, and deliverables. Do not share internal ops data.`
    );
  } else if (ctx.userRole === "DEPT_HEAD" || ctx.userRole === "HEAD_HR") {
    parts.push(
      `This user leads a team. Share department-level insights and team metrics.`
    );
  }

  parts.push(
    ``,
    `## CURRENT CONTEXT`,
    `They're on: ${ctx.currentModule} / ${ctx.currentView}`,
    ctx.currentEntityId
      ? `Looking at: ${ctx.currentEntityType} #${ctx.currentEntityId}`
      : "",
    `Time: ${now}`,
    ``,
    `## WHAT YOU KNOW RIGHT NOW`,
    `- Tasks: ${taskStats.total} total, ${taskStats.active} active, ${taskStats.overdue} overdue, ${taskStats.review} in review`,
    `- Content: ${contentStats.drafts} drafts, ${contentStats.scheduled} scheduled, ${contentStats.published} published`,
    `- Signals: ${signalStats.recent} recent (7d), ${signalStats.unprocessed} unprocessed`,
  );

  if (teamStats) {
    parts.push(
      `- Team: ${teamStats.activeMembers} active members, avg ${teamStats.avgTasks} tasks per person`
    );
  }

  if (skillContext) {
    parts.push(``, `## RELEVANT SKILLS & GUIDELINES`, skillContext);
  }

  parts.push(
    ``,
    `## HOW TO RESPOND`,
    `- Talk naturally, like a smart colleague.`,
    `- Be opinionated. If something is overdue, say so directly. If a strategy is wrong, say why.`,
    `- If the user asks "what should I focus on", actually prioritize based on deadlines, importance, and urgency.`,
    `- Use your tools to look up real data before answering questions about tasks, content, team, or signals.`,
    `- For action requests (reassign, create task, extend deadline, start pipeline): confirm with the user first, then execute.`,
    `- Remember what was said earlier in the conversation — reference previous messages when relevant.`,
    `- Keep responses concise. Use bullet points and bold for key info. Don't lecture.`,
    `- If the user asks about content strategy, reference editorial skill files and brand context.`,
    ``,
    `## YOUR AUTONOMY TIER`,
    `Current tier: ${tierConfig.tier} (${tierConfig.behavior})`,
    tierConfig.tier >= 3
      ? "You can execute actions directly. Notify the user of what you did."
      : "Always ask before executing actions. For mutating operations, confirm first.",
    ``,
    `## BRANDS`,
    ...(await getBrandContext()),
    ``,
    `## MODULES (for navigation references)`,
    `- Intelligence = /intelligence (signals & trends)`,
    `- Content Studio = /content-studio (generation)`,
    `- Production = /pms (tasks & board)`,
    `- Publishing = /relay (scheduling)`,
    `- Team = /hoccr (HR ops)`,
    `- Editorial = /m/vritti (CMS)`,
    `- Finance = /finance`,
    `- Communication = /communication`,
  );

  return parts.filter(Boolean).join("\n");
}

// ─── Quick Data Gatherers ───────────────────────────────

async function getTaskStats(userId: string) {
  const [total, active, overdue, review] = await Promise.all([
    prisma.task.count({ where: { assigneeId: userId } }),
    prisma.task.count({
      where: { assigneeId: userId, status: { in: ["ASSIGNED", "IN_PROGRESS", "REVIEW"] } },
    }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.task.count({ where: { assigneeId: userId, status: "REVIEW" } }),
  ]);
  return { total, active, overdue, review };
}

async function getContentStats() {
  const [drafts, scheduled, published] = await Promise.all([
    prisma.contentPost.count({ where: { status: "DRAFT" } }),
    prisma.contentPost.count({ where: { status: "SCHEDULED" } }),
    prisma.contentPost.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { drafts, scheduled, published };
}

async function getSignalStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [recent, unprocessed] = await Promise.all([
    prisma.signal.count({ where: { detectedAt: { gte: weekAgo }, isDuplicate: false } }),
    prisma.signal.count({
      where: {
        isDuplicate: false,
        detectedAt: { gte: weekAgo },
        content: null,
      },
    }),
  ]);
  return { recent, unprocessed };
}

async function getTeamStats() {
  const activeMembers = await prisma.user.count({
    where: { isActive: true, role: { not: "CLIENT" } },
  });
  const totalActiveTasks = await prisma.task.count({
    where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "REVIEW"] } },
  });
  return {
    activeMembers,
    avgTasks: activeMembers > 0 ? Math.round(totalActiveTasks / activeMembers) : 0,
  };
}

async function getBrandContext(): Promise<string[]> {
  try {
    const brands = await prisma.brand.findMany({
      include: { platforms: { where: { isActive: true } } },
    });
    if (brands.length === 0) return ["No brands configured."];
    return brands.map((b) => {
      const platformNames = b.platforms.map((p) => p.platform).join(" + ") || "No platforms";
      return `- ${b.name}: ${b.language || "English"}, ${platformNames}, ${b.tone || "general"}`;
    });
  } catch {
    return ["Brand data unavailable."];
  }
}

async function getCurrentTier() {
  const config = await prisma.gIConfig.findUnique({
    where: { key: "tier" },
  });
  const tier = (config?.value as number) || 2;
  const behaviors: Record<number, string> = {
    1: "Inform only — I observe and inform, but take no actions",
    2: "Suggest — I queue actions for your approval",
    3: "Act & Notify — I execute actions and notify you",
    4: "Autonomous — I act silently",
  };
  return { tier, behavior: behaviors[tier] || behaviors[2] };
}
