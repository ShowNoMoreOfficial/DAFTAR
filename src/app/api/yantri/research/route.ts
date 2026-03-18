import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGeminiResearch } from "@/lib/yantri/gemini";
import { buildResearchPrompt } from "@/lib/yantri/prompts";
import { apiHandler } from "@/lib/api-handler";

export const POST = apiHandler(async (request) => {
  const { narrativeId } = await request.json();

  const narrative = await prisma.editorialNarrative.findUnique({
    where: { id: narrativeId },
  });

  if (!narrative) return NextResponse.json({ error: "Narrative not found" }, { status: 404 });

  // Fetch related brand and trend separately
  const brand = await prisma.brand.findUnique({ where: { id: narrative.brandId } });
  const trend = narrative.trendId
    ? await prisma.importedTrend.findUnique({ where: { id: narrative.trendId } })
    : null;

  // Use the generated prompt if available, fallback to template if missing
  const systemPrompt = narrative.researchPrompt || buildResearchPrompt(
    narrative.angle,
    trend?.headline ?? "",
    brand?.name ?? "Unknown Brand",
    narrative.platform
  ).systemPrompt;

  const userMessage = `Research this narrative angle now: ${narrative.angle}`;

  // Ensure prompt is saved (in case we fell back) and update status
  await prisma.editorialNarrative.update({
    where: { id: narrativeId },
    data: {
      researchPrompt: systemPrompt,
      status: "researching",
    },
  });

  // Stream SSE response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      sendEvent({ event: "prompt_ready", researchPrompt: systemPrompt });
      sendEvent({
        event: "status",
        message: "Researching with Gemini + Google Search grounding...",
        phase: "researching",
      });

      try {
        const text = await callGeminiResearch(systemPrompt, userMessage);

        if (text) {
          await prisma.editorialNarrative.update({
            where: { id: narrativeId },
            data: { researchResults: text },
          });
          sendEvent({ event: "complete", research: text });
          sendEvent({ event: "done", success: true });
        } else {
          await prisma.editorialNarrative.update({
            where: { id: narrativeId },
            data: { status: "planned" },
          });
          sendEvent({ event: "error", message: "Research completed but returned empty output" });
          sendEvent({ event: "done", success: false, error: "Empty output" });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Reset status so user can retry
        await prisma.editorialNarrative.update({
          where: { id: narrativeId },
          data: { status: "planned" },
        });
        sendEvent({ event: "error", message: "Research temporarily unavailable. Please try again in a moment." });
        sendEvent({ event: "done", success: false, error: "Research temporarily unavailable" });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
