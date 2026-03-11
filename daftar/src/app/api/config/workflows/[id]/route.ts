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

  const workflow = await prisma.workflowTemplate.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, type: true } },
    },
  });

  if (!workflow) return notFound("Workflow template not found");
  return NextResponse.json(workflow);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.workflowTemplate.findUnique({ where: { id } });
  if (!existing) return notFound("Workflow template not found");

  const body = await req.json();
  const { name, description, departmentId, stages, triggers, escalation, isDefault, isActive } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (departmentId !== undefined) data.departmentId = departmentId;
  if (stages !== undefined) data.stages = stages;
  if (triggers !== undefined) data.triggers = triggers;
  if (escalation !== undefined) data.escalation = escalation;
  if (isDefault !== undefined) data.isDefault = isDefault;
  if (isActive !== undefined) data.isActive = isActive;

  const workflow = await prisma.workflowTemplate.update({
    where: { id },
    data,
    include: {
      department: { select: { id: true, name: true, type: true } },
    },
  });

  return NextResponse.json(workflow);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.workflowTemplate.findUnique({ where: { id } });
  if (!existing) return notFound("Workflow template not found");

  await prisma.workflowTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
