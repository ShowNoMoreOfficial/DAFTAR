import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import { toCSV, csvResponse } from "@/lib/csv";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { role } = session.user;
  if (!["ADMIN", "FINANCE", "CLIENT"].includes(role)) return forbidden();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (role === "CLIENT") where.clientId = session.user.id;
  if (status) where.status = status;

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
    include: {
      brand: { select: { name: true } },
      client: { select: { name: true, company: true } },
    },
  });

  const csv = toCSV(invoices as unknown as Record<string, unknown>[], [
    { key: "number", label: "Invoice #" },
    { key: "status", label: "Status" },
    { key: "client", label: "Client", format: (v) => {
      const c = v as { name: string; company?: string } | null;
      return c?.company || c?.name || "";
    }},
    { key: "brand", label: "Brand", format: (v) => (v as { name: string } | null)?.name ?? "" },
    { key: "amount", label: "Amount", format: (v) => String(v ?? 0) },
    { key: "tax", label: "Tax", format: (v) => String(v ?? 0) },
    { key: "totalAmount", label: "Total", format: (v) => String(v ?? 0) },
    { key: "dueDate", label: "Due Date", format: (v) => v ? new Date(v as string).toISOString().split("T")[0] : "" },
    { key: "description", label: "Description", format: (v) => String(v ?? "") },
    { key: "createdAt", label: "Created At", format: (v) => new Date(v as string).toISOString().split("T")[0] },
  ]);

  return csvResponse(csv, `invoices-${new Date().toISOString().split("T")[0]}.csv`);
});
