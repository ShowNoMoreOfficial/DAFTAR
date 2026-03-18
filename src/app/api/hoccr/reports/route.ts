import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { badRequest } from "@/lib/api-utils";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (departmentId) where.departmentId = departmentId;
  if (type) where.type = type;

  const reports = await prisma.report.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
});

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const { title, type, description, config, departmentId } = await req.json();
  if (!title || !type) return badRequest("Title and type are required");

  // Auto-generate report data based on type
  let generatedData = null;

  if (type === "TASK_COMPLETION") {
    const where: Record<string, unknown> = {};
    if (departmentId) where.departmentId = departmentId;

    const [total, completed, inProgress] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: "DONE" } }),
      prisma.task.count({ where: { ...where, status: "IN_PROGRESS" } }),
    ]);
    generatedData = { total, completed, inProgress, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  } else if (type === "HIRING_PIPELINE") {
    const where: Record<string, unknown> = {};
    if (departmentId) where.position = { departmentId };

    const candidates = await prisma.hiringCandidate.groupBy({
      by: ["status"],
      where,
      _count: true,
    });
    generatedData = { pipeline: candidates.map((c) => ({ status: c.status, count: c._count })) };
  } else if (type === "DEPARTMENT_PERFORMANCE") {
    const deptWhere: Record<string, unknown> = {};
    if (departmentId) deptWhere.departmentId = departmentId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, completed, overdue, byStatus] = await Promise.all([
      prisma.task.count({ where: { ...deptWhere, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.task.count({ where: { ...deptWhere, status: "DONE", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.task.count({
        where: { ...deptWhere, status: { notIn: ["DONE", "CANCELLED"] }, dueDate: { lt: new Date() } },
      }),
      prisma.task.groupBy({ by: ["status"], where: deptWhere, _count: true }),
    ]);

    generatedData = {
      total,
      completed,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      statusBreakdown: byStatus.map((s) => ({ status: s.status, count: s._count })),
    };
  } else if (type === "TEAM_WORKLOAD") {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(departmentId ? { primaryDeptId: departmentId } : {}),
      },
      select: {
        id: true,
        name: true,
        role: true,
        _count: {
          select: {
            assignedTasks: { where: { status: { notIn: ["DONE", "CANCELLED"] } } },
          },
        },
      },
    });

    generatedData = {
      teamMembers: users.map((u) => ({
        name: u.name,
        role: u.role,
        activeTasks: u._count.assignedTasks,
      })),
      totalActive: users.reduce((sum, u) => sum + u._count.assignedTasks, 0),
      avgPerMember: users.length > 0
        ? Math.round(users.reduce((sum, u) => sum + u._count.assignedTasks, 0) / users.length * 10) / 10
        : 0,
    };
  }

  const report = await prisma.report.create({
    data: { title, type, description, config, departmentId, createdById: session.user.id, generatedData: generatedData ?? undefined },
    include: {
      createdBy: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(report, { status: 201 });
});
