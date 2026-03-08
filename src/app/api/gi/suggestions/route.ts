import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { generateInsights, type GIEngineContext } from "@/lib/gi-engine";
import type { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const module = searchParams.get("module") || "dashboard";
  const view = searchParams.get("view") || "main";
  const entityId = searchParams.get("entityId") || null;

  const context: GIEngineContext = {
    module,
    view,
    entityId,
    userRole: session.user.role as Role,
  };

  try {
    const insights = await generateInsights(session.user.id, context);
    return NextResponse.json(insights);
  } catch {
    return NextResponse.json([]);
  }
}
