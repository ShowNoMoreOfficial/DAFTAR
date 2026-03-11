import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (!["ADMIN", "FINANCE"].includes(session.user.role)) return forbidden();

  const { searchParams } = req.nextUrl;
  const months = Math.min(parseInt(searchParams.get("months") || "6"), 12);

  // Date range for monthly breakdown
  const rangeStart = new Date();
  rangeStart.setMonth(rangeStart.getMonth() - (months - 1));
  rangeStart.setDate(1);
  rangeStart.setHours(0, 0, 0, 0);

  // Auto-mark overdue invoices: SENT invoices past their due date
  await prisma.invoice.updateMany({
    where: {
      status: "SENT",
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });

  const [allPaidInvoices, outstandingInvoices, allExpenses, clientRevenue] = await Promise.all([
    // Total revenue: sum of PAID invoices
    prisma.invoice.findMany({
      where: { status: "PAID" },
      select: { totalAmount: true, paidAt: true, clientId: true },
    }),
    // Outstanding: SENT + OVERDUE invoices
    prisma.invoice.findMany({
      where: { status: { in: ["SENT", "OVERDUE"] } },
      select: { totalAmount: true, status: true },
    }),
    // All expenses
    prisma.expense.findMany({
      select: { amount: true, category: true, date: true },
    }),
    // Revenue by client
    prisma.invoice.findMany({
      where: { status: "PAID" },
      select: {
        totalAmount: true,
        client: { select: { id: true, name: true, company: true } },
      },
    }),
  ]);

  const totalRevenue = allPaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const outstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Monthly breakdown (last N months)
  const monthlyBreakdown: {
    month: string;
    year: number;
    revenue: number;
    expenses: number;
    profit: number;
  }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthLabel = monthStart.toLocaleDateString("en-US", { month: "short" });

    const monthRev = allPaidInvoices
      .filter((inv) => inv.paidAt && inv.paidAt >= monthStart && inv.paidAt <= monthEnd)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const monthExp = allExpenses
      .filter((exp) => exp.date >= monthStart && exp.date <= monthEnd)
      .reduce((sum, exp) => sum + exp.amount, 0);

    monthlyBreakdown.push({
      month: monthLabel,
      year: d.getFullYear(),
      revenue: monthRev,
      expenses: monthExp,
      profit: monthRev - monthExp,
    });
  }

  // Expense breakdown by category
  const byCategory = allExpenses.reduce<Record<string, number>>((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  // Revenue by client
  const byClientMap = new Map<string, { id: string; name: string; company: string | null; revenue: number }>();
  for (const inv of clientRevenue) {
    if (inv.client) {
      const key = inv.client.id;
      const entry = byClientMap.get(key) || {
        id: inv.client.id,
        name: inv.client.name,
        company: inv.client.company,
        revenue: 0,
      };
      entry.revenue += inv.totalAmount;
      byClientMap.set(key, entry);
    }
  }
  const byClient = Array.from(byClientMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return NextResponse.json({
    totalRevenue,
    outstanding,
    totalExpenses,
    netProfit,
    monthlyBreakdown,
    byCategory,
    byClient,
  });
}
