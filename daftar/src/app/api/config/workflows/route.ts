import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId");

  const where: Record<string, unknown> = {};
  if (departmentId) where.departmentId = departmentId;

  const workflows = await prisma.workflowTemplate.findMany({
    where,
    include: {
      department: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workflows);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, departmentId, stages, triggers, escalation, isDefault } = body;

  if (!name) return badRequest("Name is required");
  if (!stages) return badRequest("Stages are required");

  const workflow = await prisma.workflowTemplate.create({
    data: {
      name,
      description,
      departmentId,
      stages,
      triggers,
      escalation,
      isDefault: isDefault || false,
    },
    include: {
      department: { select: { id: true, name: true, type: true } },
    },
  });

  return NextResponse.json(workflow, { status: 201 });
}
