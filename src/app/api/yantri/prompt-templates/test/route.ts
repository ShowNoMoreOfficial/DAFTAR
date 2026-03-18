import { NextRequest, NextResponse } from "next/server";
import { routeToModel } from "@/lib/yantri/model-router";
import { apiHandler } from "@/lib/api-handler";

// POST /api/yantri/prompt-templates/test — test a prompt template against a mock context
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { systemPrompt, userMessage } = body;

  if (!systemPrompt || !userMessage) {
    return NextResponse.json(
      { error: "systemPrompt and userMessage are required" },
      { status: 400 }
    );
  }

  const result = await routeToModel("drafting", systemPrompt, userMessage, {
    temperature: 0.5,
  });

  return NextResponse.json({
    raw: result.raw,
    parsed: result.parsed,
    model: result.model,
  });
});
