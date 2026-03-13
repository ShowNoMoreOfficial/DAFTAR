import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { routeToModel } from "@/lib/yantri/model-router";

// POST /api/yantri/prompt-templates/test — test a prompt template against a mock context
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { systemPrompt, userMessage } = body;

  if (!systemPrompt || !userMessage) {
    return NextResponse.json(
      { error: "systemPrompt and userMessage are required" },
      { status: 400 }
    );
  }

  try {
    const result = await routeToModel("drafting", systemPrompt, userMessage, {
      temperature: 0.5,
    });

    return NextResponse.json({
      raw: result.raw,
      parsed: result.parsed,
      model: result.model,
    });
  } catch (error) {
    console.error("[prompt-test] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Content generation temporarily unavailable. Please try again in a moment.",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined },
      { status: 503 }
    );
  }
}
