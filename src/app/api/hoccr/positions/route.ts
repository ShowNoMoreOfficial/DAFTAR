import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { badRequest } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  if (!hasPermission(session.user.role, session.user.permissions, "hoccr.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId");
  const isOpen = searchParams.get("isOpen");

  const where: Record<string, unknown> = {};
  if (departmentId) where.departmentId = departmentId;
  if (isOpen !== null) where.isOpen = isOpen === "true";

  const positions = await prisma.hiringPosition.findMany({
    where,
    include: {
      department: { select: { id: true, name: true } },
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(positions);
});

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  if (!hasPermission(session.user.role, session.user.permissions, "hoccr.write.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, departmentId, description, requirements } = await req.json();
  if (!title || !departmentId) return badRequest("Title and department are required");

  const position = await prisma.hiringPosition.create({
    data: { title, departmentId, description, requirements },
    include: { department: { select: { id: true, name: true } } },
  });

  return NextResponse.json(position, { status: 201 });
});
