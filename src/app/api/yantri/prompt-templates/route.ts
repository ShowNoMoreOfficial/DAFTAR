import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

// GET /api/yantri/prompt-templates — list all templates, optionally filter by platform
export const GET = apiHandler(async (req: NextRequest) => {
  const platform = req.nextUrl.searchParams.get("platform");

  const where: Record<string, unknown> = {};
  if (platform) where.platform = platform;

  const templates = await prisma.promptTemplate.findMany({
    where,
    orderBy: [{ platform: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(templates);
});

// POST /api/yantri/prompt-templates — create a new template
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { platform, name, systemPrompt, userFormat, isActive } = body;

  if (!platform || !name || !systemPrompt || !userFormat) {
    return NextResponse.json(
      { error: "platform, name, systemPrompt, and userFormat are required" },
      { status: 400 }
    );
  }

  // If setting as active, deactivate other templates for this platform
  if (isActive) {
    await prisma.promptTemplate.updateMany({
      where: { platform, isActive: true },
      data: { isActive: false },
    });
  }

  const template = await prisma.promptTemplate.create({
    data: { platform, name, systemPrompt, userFormat, isActive: isActive ?? false },
  });

  return NextResponse.json(template, { status: 201 });
});
