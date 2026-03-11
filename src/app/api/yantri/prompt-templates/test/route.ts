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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
