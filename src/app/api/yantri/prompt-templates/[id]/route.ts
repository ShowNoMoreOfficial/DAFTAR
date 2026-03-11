import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/yantri/prompt-templates/:id
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const template = await prisma.promptTemplate.findUnique({ where: { id } });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(template);
}

// PUT /api/yantri/prompt-templates/:id
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { platform, name, systemPrompt, userFormat, isActive } = body;

  // If setting as active, deactivate other templates for this platform
  if (isActive) {
    const existing = await prisma.promptTemplate.findUnique({ where: { id } });
    if (existing) {
      await prisma.promptTemplate.updateMany({
        where: { platform: platform ?? existing.platform, isActive: true, NOT: { id } },
        data: { isActive: false },
      });
    }
  }

  const updated = await prisma.promptTemplate.update({
    where: { id },
    data: {
      ...(platform !== undefined && { platform }),
      ...(name !== undefined && { name }),
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(userFormat !== undefined && { userFormat }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/yantri/prompt-templates/:id
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await prisma.promptTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
