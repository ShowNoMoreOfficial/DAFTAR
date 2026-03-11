import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

// GET /api/yantri/narratives — List all narrative trees with counts
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  const trees = await prisma.narrativeTree.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true } },
      narratives: {
        select: {
          id: true,
          brandId: true,
          platform: true,
          status: true,
          angle: true,
          taskId: true,
          contentPostId: true,
        },
      },
      _count: { select: { narratives: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(trees);
}

// POST /api/yantri/narratives — Create a narrative tree from a signal
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { title, summary, signalId, signalData, urgency } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const tree = await prisma.narrativeTree.create({
    data: {
      title,
      summary: summary || null,
      signalId: signalId || null,
      signalData: signalData || null,
      urgency: urgency || "normal",
      status: "INCOMING",
      createdById: session.user.id,
    },
  });

  return NextResponse.json(tree, { status: 201 });
}
