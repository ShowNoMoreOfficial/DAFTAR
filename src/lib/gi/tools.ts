import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import {
  getOverdueTasks,
  getOverloadedUsers,
  getPendingReviewDeliverables,
  getTeamWeeklyStats,
  getRecentSignals,
  getBrandContentPipeline,
  getTeamMembers,
  getUpcomingContent,
} from "./data-queries";
import {
  reassignTask,
  extendDeadline,
  createTask,
  startPipeline,
  suggestTopics,
} from "./action-executor";
import { augmentWithRAG } from "@/lib/gi-engine-rag-hook";

// ─── Tool Definitions (Anthropic format) ───────────────────

export const GI_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_tasks",
    description:
      "Get tasks from the system. Can filter by status, assignee, overdue status, priority, and department. Returns task details including title, status, priority, due date, and assignee.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["CREATED", "ASSIGNED", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED", "CANCELLED"],
          description: "Filter by task status",
        },
        assigneeId: {
          type: "string",
          description: "Filter by assignee user ID",
        },
        assigneeName: {
          type: "string",
          description: "Filter by assignee name (fuzzy match)",
        },
        overdue: {
          type: "boolean",
          description: "If true, only return overdue tasks",
        },
        priority: {
          type: "string",
          enum: ["URGENT", "HIGH", "MEDIUM", "LOW"],
          description: "Filter by priority level",
        },
        departmentId: {
          type: "string",
          description: "Filter by department ID",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 10)",
        },
      },
    },
  },
  {
    name: "get_deliverables",
    description:
      "Get content deliverables. Filter by brand, status, platform. Returns deliverable details with brand and narrative tree info.",
    input_schema: {
      type: "object" as const,
      properties: {
        brandName: {
          type: "string",
          description: "Filter by brand name (e.g. 'The Squirrels', 'Breaking Tube')",
        },
        status: {
          type: "string",
          enum: ["PLANNED", "RESEARCHING", "DRAFTED", "REVIEW", "APPROVED", "PUBLISHED", "REJECTED"],
          description: "Filter by deliverable status",
        },
        platform: {
          type: "string",
          enum: ["YOUTUBE", "X_TWITTER", "INSTAGRAM", "LINKEDIN", "WEBSITE"],
          description: "Filter by platform",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 10)",
        },
      },
    },
  },
  {
    name: "get_signals",
    description:
      "Get intelligence signals from Khabri. Filter by importance/velocity, recency. Returns signal details with trend info.",
    input_schema: {
      type: "object" as const,
      properties: {
        days: {
          type: "number",
          description: "How many days back to look (default 7)",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 10)",
        },
      },
    },
  },
  {
    name: "get_team_workload",
    description:
      "Get team member workload — who's overloaded, who has bandwidth. Shows active task counts per person.",
    input_schema: {
      type: "object" as const,
      properties: {
        threshold: {
          type: "number",
          description: "Task count threshold for 'overloaded' (default 10)",
        },
      },
    },
  },
  {
    name: "get_team_weekly_stats",
    description:
      "Get weekly team performance: tasks completed, total active, XP earned, top streaks.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_brand_pipeline",
    description:
      "Get content pipeline for a specific brand — narrative trees, deliverables by status.",
    input_schema: {
      type: "object" as const,
      properties: {
        brandName: {
          type: "string",
          description: "Brand name (e.g. 'The Squirrels', 'Breaking Tube')",
        },
      },
      required: ["brandName"],
    },
  },
  {
    name: "get_team_members",
    description: "Get list of all active team members with their roles and departments.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_upcoming_content",
    description: "Get upcoming scheduled/queued content posts.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Max results (default 5)",
        },
      },
    },
  },
  {
    name: "search_knowledge_base",
    description:
      "Search past content, articles, and editorial knowledge base using semantic search. Use when user asks about past coverage, brand voice, content history, or similar topics.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "reassign_task",
    description:
      "Reassign a task to a different team member. Always confirm with the user first unless autonomy tier allows direct execution.",
    input_schema: {
      type: "object" as const,
      properties: {
        taskIdentifier: {
          type: "string",
          description: "Task title (fuzzy match) or task ID",
        },
        personName: {
          type: "string",
          description: "Name of the person to reassign to",
        },
      },
      required: ["taskIdentifier", "personName"],
    },
  },
  {
    name: "extend_deadline",
    description:
      "Extend the deadline for a task by a number of days. Always confirm first.",
    input_schema: {
      type: "object" as const,
      properties: {
        taskIdentifier: {
          type: "string",
          description: "Task title (fuzzy match) or task ID",
        },
        days: {
          type: "number",
          description: "Number of days to extend by",
        },
      },
      required: ["taskIdentifier", "days"],
    },
  },
  {
    name: "create_task",
    description: "Create a new task in the PMS system.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Task title",
        },
        description: {
          type: "string",
          description: "Task description",
        },
        assigneeName: {
          type: "string",
          description: "Name of person to assign to (optional)",
        },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
          description: "Task priority (default MEDIUM)",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "start_content_pipeline",
    description:
      "Start the content generation pipeline for a topic. Creates a narrative tree and optionally links to a brand.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string",
          description: "Topic to start the pipeline for",
        },
        brandName: {
          type: "string",
          description: "Brand name to link the pipeline to (optional)",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "suggest_topics",
    description:
      "Get topic suggestions based on recent signals that haven't been covered yet. Ranks by trend velocity.",
    input_schema: {
      type: "object" as const,
      properties: {
        brandName: {
          type: "string",
          description: "Optional brand name to filter for",
        },
      },
    },
  },
];

// ─── Tool Executor ─────────────────────────────────────────

export async function executeTool(
  name: string,
  params: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (name) {
    case "get_tasks": {
      const where: Record<string, unknown> = {};
      if (params.status) where.status = params.status;
      if (params.overdue) {
        where.status = { notIn: ["DONE", "CANCELLED"] };
        where.dueDate = { lt: new Date() };
      }
      if (params.priority) where.priority = params.priority;
      if (params.departmentId) where.departmentId = params.departmentId;
      if (params.assigneeId) where.assigneeId = params.assigneeId;
      if (params.assigneeName) {
        const person = await prisma.user.findFirst({
          where: { name: { contains: params.assigneeName as string, mode: "insensitive" }, isActive: true },
          select: { id: true },
        });
        if (person) where.assigneeId = person.id;
      }
      // If overdue is explicitly requested, use the dedicated function
      if (params.overdue) {
        return await getOverdueTasks(Number(params.limit) || 10);
      }
      const tasks = await prisma.task.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: { select: { id: true, name: true } },
          department: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: Number(params.limit) || 10,
      });
      return { tasks, count: tasks.length };
    }

    case "get_deliverables": {
      if (params.brandName) {
        return await getBrandContentPipeline(params.brandName as string);
      }
      const where: Record<string, unknown> = {};
      if (params.status) where.status = params.status;
      if (params.platform) where.platform = params.platform;
      const deliverables = await prisma.deliverable.findMany({
        where,
        select: {
          id: true,
          platform: true,
          status: true,
          pipelineType: true,
          brand: { select: { name: true } },
          tree: { select: { title: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: Number(params.limit) || 10,
      });
      return { deliverables, count: deliverables.length };
    }

    case "get_signals":
      return await getRecentSignals(
        Number(params.days) || 7,
        Number(params.limit) || 10
      );

    case "get_team_workload":
      return await getOverloadedUsers(Number(params.threshold) || 10);

    case "get_team_weekly_stats":
      return await getTeamWeeklyStats();

    case "get_brand_pipeline":
      return await getBrandContentPipeline(params.brandName as string);

    case "get_team_members":
      return await getTeamMembers();

    case "get_upcoming_content":
      return await getUpcomingContent(Number(params.limit) || 5);

    case "search_knowledge_base": {
      const ragResult = await augmentWithRAG(params.query as string);
      if (ragResult.ragTriggered && ragResult.chunksRetrieved > 0) {
        return { found: true, context: ragResult.systemContext, chunksRetrieved: ragResult.chunksRetrieved };
      }
      return { found: false, message: "No relevant content found in the knowledge base." };
    }

    case "reassign_task":
      return await reassignTask(
        params.taskIdentifier as string,
        params.personName as string,
        userId
      );

    case "extend_deadline":
      return await extendDeadline(
        params.taskIdentifier as string,
        Number(params.days),
        userId
      );

    case "create_task":
      return await createTask(params.title as string, userId, {
        description: params.description as string | undefined,
        assigneeName: params.assigneeName as string | undefined,
        priority: params.priority as string | undefined,
      });

    case "start_content_pipeline":
      return await startPipeline(
        params.topic as string,
        userId,
        params.brandName as string | undefined
      );

    case "suggest_topics":
      return await suggestTopics(params.brandName as string | undefined);

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
