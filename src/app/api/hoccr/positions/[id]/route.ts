import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const position = await prisma.hiringPosition.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      candidates: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!position) return notFound("Position not found");
  return NextResponse.json(position);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const position = await prisma.hiringPosition.update({
    where: { id },
    data: body,
    include: { department: { select: { id: true, name: true } } },
  });

  return NextResponse.json(position);
}
