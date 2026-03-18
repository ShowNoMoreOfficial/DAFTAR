import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { notFound } from "@/lib/api-utils";

export const GET = apiHandler(async (_req: NextRequest, { session, params }) => {
  const { id } = params;

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
});

export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  const { id } = params;
  const body = await req.json();

  const position = await prisma.hiringPosition.update({
    where: { id },
    data: body,
    include: { department: { select: { id: true, name: true } } },
  });

  return NextResponse.json(position);
});
