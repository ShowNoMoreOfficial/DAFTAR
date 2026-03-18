import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { badRequest } from "@/lib/api-utils";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const deptId = searchParams.get("departmentId");

  const deptFilter =
    role === "DEPT_HEAD" && session.user.primaryDepartmentId
      ? {
          OR: [
            { fromDeptId: session.user.primaryDepartmentId },
            { toDeptId: session.user.primaryDepartmentId },
          ],
        }
      : deptId
      ? {
          OR: [{ fromDeptId: deptId }, { toDeptId: deptId }],
        }
      : {};

  const where = {
    ...deptFilter,
    ...(status ? { status } : {}),
  };

  const dependencies = await prisma.crossDeptDependency.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Resolve department names
  const deptIds = new Set<string>();
  for (const dep of dependencies) {
    deptIds.add(dep.fromDeptId);
    deptIds.add(dep.toDeptId);
  }

  const departments = await prisma.department.findMany({
    where: { id: { in: [...deptIds] } },
    select: { id: true, name: true },
  });

  const deptMap = new Map(departments.map((d) => [d.id, d.name]));

  // Aggregate stats
  const stats = {
    total: dependencies.length,
    waiting: dependencies.filter((d) => d.status === "waiting").length,
    acknowledged: dependencies.filter((d) => d.status === "acknowledged").length,
    escalated: dependencies.filter((d) => d.status === "escalated").length,
    resolved: dependencies.filter((d) => d.status === "resolved").length,
  };

  return NextResponse.json({
    dependencies: dependencies.map((d) => ({
      ...d,
      fromDeptName: deptMap.get(d.fromDeptId) || "Unknown",
      toDeptName: deptMap.get(d.toDeptId) || "Unknown",
    })),
    stats,
  });
});

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { fromDeptId, toDeptId, description, priority, taskId } = body;

  if (!fromDeptId || !toDeptId || !description) {
    return badRequest("fromDeptId, toDeptId, and description are required");
  }

  const dependency = await prisma.crossDeptDependency.create({
    data: {
      fromDeptId,
      toDeptId,
      description,
      priority: priority || "medium",
      taskId: taskId || null,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(dependency, { status: 201 });
});
