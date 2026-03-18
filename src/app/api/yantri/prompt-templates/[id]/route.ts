import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

// GET /api/yantri/prompt-templates/:id
export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params;
  const template = await prisma.promptTemplate.findUnique({ where: { id } });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(template);
});

// PUT /api/yantri/prompt-templates/:id
export const PUT = apiHandler(async (req: NextRequest, { params }) => {
  const { id } = params;
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
});

// DELETE /api/yantri/prompt-templates/:id
export const DELETE = apiHandler(async (_req: NextRequest, { params }) => {
  const { id } = params;
  await prisma.promptTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
