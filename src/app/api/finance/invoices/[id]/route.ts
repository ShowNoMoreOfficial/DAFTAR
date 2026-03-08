import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, notFound, badRequest } from "@/lib/api-utils";
import { notifyInvoiceSent, notifyInvoicePaid } from "@/lib/notifications";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { role } = session.user;
  if (!["ADMIN", "FINANCE", "CLIENT"].includes(role)) return forbidden();

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, company: true, email: true } },
    },
  });

  if (!invoice) return notFound("Invoice not found");

  // CLIENT can only see their own invoices
  if (role === "CLIENT" && invoice.clientId !== session.user.id) {
    return forbidden();
  }

  return NextResponse.json(invoice);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (!["ADMIN", "FINANCE"].includes(session.user.role)) return forbidden();

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return notFound("Invoice not found");

  const body = await req.json();
  const { status, amount, tax, totalAmount, dueDate, description, items, brandId, clientId } = body;

  const data: Record<string, unknown> = {};

  if (status !== undefined) {
    data.status = status;
    // When marking as PAID, set paidAt
    if (status === "PAID" && !existing.paidAt) {
      data.paidAt = new Date();
    }
    // When un-paying, clear paidAt
    if (status !== "PAID" && existing.status === "PAID") {
      data.paidAt = null;
    }
  }

  if (amount !== undefined) data.amount = amount;
  if (tax !== undefined) data.tax = tax;
  if (totalAmount !== undefined) data.totalAmount = totalAmount;
  if (dueDate !== undefined) data.dueDate = new Date(dueDate);
  if (description !== undefined) data.description = description;
  if (items !== undefined) data.items = items;
  if (brandId !== undefined) data.brandId = brandId || null;
  if (clientId !== undefined) data.clientId = clientId || null;

  // Recompute total if amount or tax changed but totalAmount not explicitly set
  if ((amount !== undefined || tax !== undefined) && totalAmount === undefined) {
    const newAmount = amount !== undefined ? amount : existing.amount;
    const newTax = tax !== undefined ? tax : existing.tax;
    data.totalAmount = newAmount + newTax;
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data,
    include: {
      brand: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, company: true, userId: true } },
    },
  });

  // Send notifications for status transitions
  if (status === "SENT" && existing.status === "DRAFT" && invoice.client?.userId) {
    const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(invoice.totalAmount);
    notifyInvoiceSent(invoice.client.userId, invoice.number, invoice.id, formatted).catch(() => {});
  }
  if (status === "PAID" && existing.status !== "PAID") {
    notifyInvoicePaid(invoice.createdById, invoice.number, invoice.id).catch(() => {});
  }

  return NextResponse.json(invoice);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return notFound("Invoice not found");

  if (invoice.status !== "DRAFT") {
    return badRequest("Only DRAFT invoices can be deleted");
  }

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
