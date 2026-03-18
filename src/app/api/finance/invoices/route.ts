import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { role } = session.user;
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const brandId = searchParams.get("brandId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const search = searchParams.get("search");

  // Role scoping
  if (!["ADMIN", "FINANCE", "CLIENT"].includes(role)) return forbidden();

  const where: Record<string, unknown> = {};

  // CLIENT can only see their own invoices
  if (role === "CLIENT") {
    where.clientId = session.user.id;
  }

  if (status) where.status = status;
  if (clientId && role !== "CLIENT") where.clientId = clientId;
  if (brandId) where.brandId = brandId;
  if (search) where.number = { contains: search, mode: "insensitive" };

  if (dateFrom || dateTo) {
    const dueDateFilter: Record<string, Date> = {};
    if (dateFrom) dueDateFilter.gte = new Date(dateFrom);
    if (dateTo) dueDateFilter.lte = new Date(dateTo);
    where.dueDate = dueDateFilter;
  }

  const pagination = parsePagination(req);

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        brand: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, company: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(invoices, total, pagination));
});

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  if (!["ADMIN", "FINANCE"].includes(session.user.role)) return forbidden();

  const body = await req.json();
  const { number, brandId, clientId, amount, tax, totalAmount, dueDate, description, items, status } = body;

  if (!amount || !dueDate) {
    return badRequest("amount and dueDate are required");
  }

  const taxAmount = tax || 0;
  const computedTotal = totalAmount || amount + taxAmount;

  // Generate invoice number if not provided
  let invoiceNumber = number;
  if (!invoiceNumber) {
    const count = await prisma.invoice.count();
    invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;
  }

  // Check unique number
  const existing = await prisma.invoice.findUnique({ where: { number: invoiceNumber } });
  if (existing) {
    return badRequest(`Invoice number "${invoiceNumber}" already exists`);
  }

  const invoice = await prisma.invoice.create({
    data: {
      number: invoiceNumber,
      brandId: brandId || null,
      clientId: clientId || null,
      status: status || "DRAFT",
      amount,
      tax: taxAmount,
      totalAmount: computedTotal,
      dueDate: new Date(dueDate),
      description: description || null,
      items: items || null,
      createdById: session.user.id,
    },
    include: {
      brand: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, company: true } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
});
