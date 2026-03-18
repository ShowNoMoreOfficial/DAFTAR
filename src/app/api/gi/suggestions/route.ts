import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import {
  generateSkillAwareInsights,
  type GISkillContext,
} from "@/lib/gi-skill-engine";
import type { Role } from "@prisma/client";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = req.nextUrl;
  const module = searchParams.get("module") || "dashboard";
  const view = searchParams.get("view") || "main";
  const entityId = searchParams.get("entityId") || null;
  const brandSlug = searchParams.get("brand") || undefined;
  const platform = searchParams.get("platform") || undefined;

  const context: GISkillContext = {
    module,
    view,
    entityId,
    userRole: session.user.role as Role,
    brandSlug,
    platform,
  };

  try {
    const insights = await generateSkillAwareInsights(
      session.user.id,
      context
    );
    return NextResponse.json(insights);
  } catch {
    return NextResponse.json([]);
  }
});
