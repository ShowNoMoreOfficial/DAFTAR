import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (_req: NextRequest, { session, params }) => {
  const { role, primaryDepartmentId } = session.user;
  if (!["ADMIN", "FINANCE", "DEPT_HEAD"].includes(role)) return forbidden();

  const { id } = params;

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  if (!expense) return notFound("Expense not found");

  // DEPT_HEAD can only see their department's expenses
  if (role === "DEPT_HEAD" && primaryDepartmentId && expense.departmentId !== primaryDepartmentId) {
    return forbidden();
  }

  return NextResponse.json(expense);
});

export const PATCH = apiHandler(async (req: NextRequest, { session, params }) => {
  if (!["ADMIN", "FINANCE", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  const { id } = params;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return notFound("Expense not found");

  // DEPT_HEAD can only edit their department's expenses
  if (
    session.user.role === "DEPT_HEAD" &&
    session.user.primaryDepartmentId &&
    existing.departmentId !== session.user.primaryDepartmentId
  ) {
    return forbidden();
  }

  const body = await req.json();
  const { title, amount, category, departmentId, description, receiptUrl, date, approvedBy } = body;

  const data: Record<string, unknown> = {};

  if (title !== undefined) data.title = title;
  if (amount !== undefined) data.amount = amount;
  if (category !== undefined) data.category = category;
  if (departmentId !== undefined) data.departmentId = departmentId || null;
  if (description !== undefined) data.description = description;
  if (receiptUrl !== undefined) data.receiptUrl = receiptUrl;
  if (date !== undefined) data.date = new Date(date);

  // Approve expense: set approvedBy to current user's name/id
  if (approvedBy !== undefined) {
    data.approvedBy = approvedBy;
  }

  const expense = await prisma.expense.update({
    where: { id },
    data,
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(expense);
});

export const DELETE = apiHandler(async (_req: NextRequest, { session, params }) => {
  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = params;
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return notFound("Expense not found");

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
