import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  if (!["ADMIN", "FINANCE"].includes(session.user.role)) return forbidden();

  const { searchParams } = req.nextUrl;
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [invoices, expenses, paidInvoices, overdueInvoices] = await Promise.all([
    prisma.invoice.findMany({ where: { createdAt: { gte: since } } }),
    prisma.expense.findMany({ where: { createdAt: { gte: since } } }),
    prisma.invoice.findMany({ where: { status: "PAID", paidAt: { gte: since } } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
  ]);

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const pendingAmount = invoices
    .filter((i) => ["DRAFT", "SENT"].includes(i.status))
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Expenses by category
  const expensesByCategory = expenses.reduce<Record<string, number>>((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  // Monthly trend (last 6 months)
  const monthlyTrend: { month: string; revenue: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthLabel = monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const monthRev = paidInvoices
      .filter((inv) => inv.paidAt && inv.paidAt >= monthStart && inv.paidAt <= monthEnd)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const monthExp = expenses
      .filter((exp) => exp.date >= monthStart && exp.date <= monthEnd)
      .reduce((sum, exp) => sum + exp.amount, 0);

    monthlyTrend.push({ month: monthLabel, revenue: monthRev, expenses: monthExp });
  }

  return NextResponse.json({
    totalRevenue,
    totalExpenses,
    netProfit,
    pendingAmount,
    overdueInvoices,
    totalInvoices: invoices.length,
    expensesByCategory,
    monthlyTrend,
    period: { days, since: since.toISOString() },
  });
});
