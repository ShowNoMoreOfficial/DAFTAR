import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const batches = await prisma.trendBatch.findMany({
    orderBy: { importedAt: "desc" },
    include: {
      trends: {
        orderBy: { rank: "asc" },
        include: { narratives: { select: { id: true } } },
      },
    },
  });
  return NextResponse.json(batches);
}
