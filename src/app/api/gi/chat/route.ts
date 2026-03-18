import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/api-utils";
import { buildSystemPrompt } from "@/lib/gi/system-prompt";
import { GI_TOOLS, executeTool } from "@/lib/gi/tools";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY_MESSAGES = 10;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
  const session = await getAuthSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { message?: string; context?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const { message, context } = body;
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
  }

  const { role, id: userId, primaryDepartmentId, name: userName } = session.user;

  // Get department name
  let departmentName: string | null = null;
  if (primaryDepartmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: primaryDepartmentId },
      select: { name: true },
    });
    departmentName = dept?.name ?? null;
  }

  // ─── Load conversation history ───────────────────────
  let conversation = await prisma.gIConversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  const history: ConversationMessage[] = conversation
    ? (conversation.messages as unknown as ConversationMessage[]).slice(-MAX_HISTORY_MESSAGES)
    : [];

  // ─── Build system prompt ─────────────────────────────
  const systemPrompt = await buildSystemPrompt({
    userId,
    userName,
    userRole: role,
    departmentName,
    currentModule: context?.currentModule || "daftar",
    currentView: context?.currentView || "dashboard",
    currentEntityId: context?.currentEntityId || null,
    currentEntityType: context?.currentEntityType || null,
  });

  // ─── Build messages for Claude ───────────────────────
  const claudeMessages: Anthropic.MessageParam[] = [];

  // Add conversation history
  for (const msg of history) {
    claudeMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add current user message
  claudeMessages.push({ role: "user", content: message.trim() });

  // ─── Stream response with tool use ───────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let messages = [...claudeMessages];
        let fullResponse = "";
        let toolRounds = 0;

        // Tool use loop — Claude may call tools and we respond with results
        while (toolRounds < MAX_TOOL_ROUNDS) {
          const response = await anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            system: systemPrompt,
            messages,
            tools: GI_TOOLS,
          }).finalMessage();

          // Process response content blocks
          const toolUseBlocks: Anthropic.ContentBlockParam[] = [];
          let hasToolUse = false;

          for (const block of response.content) {
            if (block.type === "text") {
              fullResponse += block.text;
              // Stream text chunks
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", text: block.text })}\n\n`
                )
              );
            } else if (block.type === "tool_use") {
              hasToolUse = true;

              // Notify client that a tool is being called
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_call",
                    tool: block.name,
                    input: block.input,
                  })}\n\n`
                )
              );

              // Execute the tool
              let toolResult: unknown;
              try {
                toolResult = await executeTool(
                  block.name,
                  block.input as Record<string, unknown>,
                  userId
                );
              } catch (err) {
                toolResult = {
                  error: `Tool execution failed: ${err instanceof Error ? err.message : "Unknown error"}`,
                };
              }

              toolUseBlocks.push({
                type: "tool_result" as const,
                tool_use_id: block.id,
                content: JSON.stringify(toolResult, null, 2).slice(0, 10000), // Limit tool result size
              } as Anthropic.ContentBlockParam);
            }
          }

          // If no tool use, we're done
          if (!hasToolUse || response.stop_reason === "end_turn") {
            break;
          }

          // Continue with tool results
          messages = [
            ...messages,
            { role: "assistant" as const, content: response.content as Anthropic.ContentBlockParam[] },
            { role: "user" as const, content: toolUseBlocks },
          ];
          toolRounds++;
        }

        // ─── Save conversation ───────────────────────────
        const updatedMessages = [
          ...history,
          { role: "user" as const, content: message.trim(), timestamp: new Date().toISOString() },
          { role: "assistant" as const, content: fullResponse, timestamp: new Date().toISOString() },
        ].slice(-20); // Keep last 20 messages

        if (conversation) {
          await prisma.gIConversation.update({
            where: { id: conversation.id },
            data: { messages: updatedMessages as object[] },
          });
        } else {
          await prisma.gIConversation.create({
            data: {
              userId,
              messages: updatedMessages as object[],
            },
          });
        }

        // Signal done
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      } catch (err) {
        console.error("[GI Chat] Error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: "Sorry, I encountered an error. Please try again.",
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
  } catch (err) {
    console.error("[GI Chat] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { status: 500 },
    );
  }
}
