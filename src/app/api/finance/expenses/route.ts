import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { role, primaryDepartmentId } = session.user;
  if (!["ADMIN", "FINANCE", "DEPT_HEAD"].includes(role)) return forbidden();

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const departmentId = searchParams.get("departmentId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  // DEPT_HEAD can only see their department's expenses
  if (role === "DEPT_HEAD" && primaryDepartmentId) {
    where.departmentId = primaryDepartmentId;
  }

  if (category) where.category = category;
  if (departmentId && role !== "DEPT_HEAD") where.departmentId = departmentId;
  if (search) where.title = { contains: search, mode: "insensitive" };

  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    where.date = dateFilter;
  }

  const pagination = parsePagination(req);

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        department: { select: { id: true, name: true } },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(expenses, total, pagination));
});

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  if (!["ADMIN", "FINANCE", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  const body = await req.json();
  const { title, amount, category, departmentId, description, receiptUrl, date } = body;

  if (!title || !amount || !category) {
    return badRequest("title, amount, and category are required");
  }

  const validCategories = [
    "SALARY", "SOFTWARE", "EQUIPMENT", "TRAVEL",
    "MARKETING", "PRODUCTION", "OFFICE", "MISCELLANEOUS",
  ];
  if (!validCategories.includes(category)) {
    return badRequest(`Invalid category. Must be one of: ${validCategories.join(", ")}`);
  }

  const expense = await prisma.expense.create({
    data: {
      title,
      amount,
      category,
      departmentId: departmentId || null,
      description: description || null,
      receiptUrl: receiptUrl || null,
      createdById: session.user.id,
      date: date ? new Date(date) : new Date(),
    },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(expense, { status: 201 });
});
