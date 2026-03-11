import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await prisma.platformRule.findMany({
    orderBy: { narrativeType: "asc" },
  });
  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const rule = await prisma.platformRule.create({
    data: {
      narrativeType: body.narrativeType,
      primaryPlatform: body.primaryPlatform,
      secondaryPlatform: body.secondaryPlatform || null,
      brandName: body.brandName || null,
      sendWhen: JSON.stringify(body.sendWhen || []),
      neverSend: JSON.stringify(body.neverSend || []),
      speedPriority: body.speedPriority,
    },
  });
  return NextResponse.json(rule, { status: 201 });
}
