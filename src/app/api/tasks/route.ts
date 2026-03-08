import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const assigneeId = searchParams.get("assigneeId");
  const departmentId = searchParams.get("departmentId");
  const brandId = searchParams.get("brandId");
  const projectId = searchParams.get("projectId");
  const priority = searchParams.get("priority");

  const where: Record<string, unknown> = {};

  // Role-based scoping
  const { role, id: userId, primaryDepartmentId } = session.user;
  if (role === "MEMBER" || role === "CONTRACTOR") {
    where.OR = [{ assigneeId: userId }, { creatorId: userId }];
  } else if (role === "DEPT_HEAD" && primaryDepartmentId) {
    where.departmentId = primaryDepartmentId;
  }

  if (status) where.status = status;
  if (assigneeId) where.assigneeId = assigneeId;
  if (departmentId) where.departmentId = departmentId;
  if (brandId) where.brandId = brandId;
  if (projectId) where.projectId = projectId;
  if (priority) where.priority = priority;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true, avatar: true } },
      department: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      tags: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "pms.write.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, priority, assigneeId, departmentId, brandId, projectId, dueDate, difficultyWeight, tags } = body;

  if (!title) return badRequest("Title is required");

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || "MEDIUM",
      difficultyWeight: difficultyWeight || 1,
      creatorId: session.user.id,
      assigneeId,
      departmentId,
      brandId,
      projectId,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: assigneeId ? "ASSIGNED" : "CREATED",
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true, avatar: true } },
      department: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
    },
  });

  // Create tags if provided
  if (tags && Array.isArray(tags) && tags.length > 0) {
    await prisma.taskTag.createMany({
      data: tags.map((name: string) => ({ taskId: task.id, name })),
    });
  }

  // Log activity
  await prisma.taskActivity.create({
    data: {
      taskId: task.id,
      actorId: session.user.id,
      action: "created",
    },
  });

  return NextResponse.json(task, { status: 201 });
}
