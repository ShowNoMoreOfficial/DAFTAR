import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import { toCSV, csvResponse } from "@/lib/csv";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { role, primaryDepartmentId } = session.user;
  if (!["ADMIN", "FINANCE", "DEPT_HEAD"].includes(role)) return forbidden();

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (role === "DEPT_HEAD" && primaryDepartmentId) where.departmentId = primaryDepartmentId;
  if (category) where.category = category;

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: 1000,
    include: {
      department: { select: { name: true } },
    },
  });

  const csv = toCSV(expenses as unknown as Record<string, unknown>[], [
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    { key: "amount", label: "Amount", format: (v) => String(v ?? 0) },
    { key: "department", label: "Department", format: (v) => (v as { name: string } | null)?.name ?? "" },
    { key: "description", label: "Description", format: (v) => String(v ?? "") },
    { key: "date", label: "Date", format: (v) => v ? new Date(v as string).toISOString().split("T")[0] : "" },
    { key: "approved", label: "Approved", format: (v) => v ? "Yes" : "No" },
    { key: "receiptUrl", label: "Receipt URL", format: (v) => String(v ?? "") },
    { key: "createdAt", label: "Created At", format: (v) => new Date(v as string).toISOString().split("T")[0] },
  ]);

  return csvResponse(csv, `expenses-${new Date().toISOString().split("T")[0]}.csv`);
});
