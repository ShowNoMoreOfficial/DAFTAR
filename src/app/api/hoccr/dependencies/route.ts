import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const fromDeptId = searchParams.get("fromDeptId");
  const toDeptId = searchParams.get("toDeptId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (fromDeptId) where.fromDeptId = fromDeptId;
  if (toDeptId) where.toDeptId = toDeptId;
  if (status) where.status = status;

  // DEPT_HEAD: only see dependencies involving their department
  if (role === "DEPT_HEAD" && session.user.primaryDepartmentId) {
    where.OR = [
      { fromDeptId: session.user.primaryDepartmentId },
      { toDeptId: session.user.primaryDepartmentId },
    ];
  }

  const dependencies = await prisma.crossDeptDependency.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Resolve department names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deptIds = Array.from(new Set((dependencies as any[]).flatMap((d) => [d.fromDeptId, d.toDeptId]))) as string[];
  const depts = await prisma.department.findMany({
    where: { id: { in: deptIds } },
    select: { id: true, name: true },
  });
  const deptMap = Object.fromEntries(depts.map((d) => [d.id, d.name]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = dependencies.map((dep: any) => ({
    ...dep,
    fromDeptName: deptMap[dep.fromDeptId] || dep.fromDeptId,
    toDeptName: deptMap[dep.toDeptId] || dep.toDeptId,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { fromDeptId, toDeptId, description, taskId, priority } = body;

  if (!fromDeptId || !toDeptId || !description) {
    return badRequest("fromDeptId, toDeptId, and description are required");
  }

  if (fromDeptId === toDeptId) {
    return badRequest("fromDeptId and toDeptId must be different departments");
  }

  const dependency = await prisma.crossDeptDependency.create({
    data: {
      fromDeptId,
      toDeptId,
      description,
      taskId: taskId || null,
      priority: priority || "medium",
      createdById: session.user.id,
    },
  });

  return NextResponse.json(dependency, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return badRequest("id and status are required");
  }

  const validStatuses = ["waiting", "acknowledged", "resolved", "escalated"];
  if (!validStatuses.includes(status)) {
    return badRequest(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  const existing = await prisma.crossDeptDependency.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Dependency not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { status };

  if (status === "acknowledged") {
    updateData.acknowledgedById = session.user.id;
  }
  if (status === "resolved") {
    updateData.resolvedAt = new Date();
  }

  const updated = await prisma.crossDeptDependency.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
