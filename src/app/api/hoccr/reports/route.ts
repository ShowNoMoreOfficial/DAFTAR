import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

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
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

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
  }

  const report = await prisma.report.create({
    data: { title, type, description, config, departmentId, createdById: session.user.id, generatedData: generatedData ?? undefined },
    include: {
      createdBy: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(report, { status: 201 });
}
