import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, notFound } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";

/**
 * GET /api/finance/invoices/[id]/pdf
 *
 * Generates a simple HTML-based PDF-printable invoice.
 * Browsers can print this to PDF natively via Ctrl+P.
 */
export const GET = apiHandler(async (_req: NextRequest, { session, params }) => {
  const { role } = session.user;
  if (!["ADMIN", "FINANCE", "CLIENT"].includes(role)) return forbidden();

  const { id } = params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      brand: { select: { name: true } },
      client: { select: { name: true, company: true, email: true } },
    },
  });

  if (!invoice) return notFound("Invoice not found");
  if (role === "CLIENT" && invoice.clientId !== session.user.id) return forbidden();

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(n);

  const items = (invoice.items as Array<{ description: string; qty: number; rate: number; amount: number }>) ?? [];

  const itemRows = items.length > 0
    ? items
        .map(
          (item, i) =>
            `<tr>
              <td style="padding:8px;border-bottom:1px solid #eee">${i + 1}</td>
              <td style="padding:8px;border-bottom:1px solid #eee">${item.description ?? ""}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.qty ?? 1}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmt(item.rate ?? 0)}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmt(item.amount ?? 0)}</td>
            </tr>`
        )
        .join("")
    : `<tr><td colspan="5" style="padding:8px;text-align:center;color:#999">No line items</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .brand { font-size: 24px; font-weight: 700; color: #2E86AB; }
    .invoice-num { font-size: 14px; color: #6B7280; margin-top: 4px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-DRAFT { background: #F3F4F6; color: #6B7280; }
    .status-SENT { background: #DBEAFE; color: #2563EB; }
    .status-PAID { background: #D1FAE5; color: #059669; }
    .status-OVERDUE { background: #FEE2E2; color: #DC2626; }
    .section { margin-bottom: 24px; }
    .label { font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #E5E7EB; font-size: 12px; text-transform: uppercase; color: #6B7280; }
    .totals { text-align: right; margin-top: 16px; }
    .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
    .totals .total { font-size: 18px; font-weight: 700; color: #2E86AB; border-top: 2px solid #2E86AB; padding-top: 8px; margin-top: 8px; }
    .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9CA3AF; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">DAFTAR</div>
      <div class="invoice-num">${invoice.number}</div>
    </div>
    <div style="text-align:right">
      <span class="status status-${invoice.status}">${invoice.status}</span>
      <div style="margin-top:8px;font-size:13px;color:#6B7280">
        Date: ${invoice.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}<br>
        Due: ${invoice.dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </div>
    </div>
  </div>

  <div style="display:flex;gap:40px;margin-bottom:32px">
    <div class="section" style="flex:1">
      <div class="label">Bill To</div>
      <div style="font-weight:600">${invoice.client?.company || invoice.client?.name || "—"}</div>
      <div style="font-size:13px;color:#6B7280">${invoice.client?.email || ""}</div>
    </div>
    <div class="section" style="flex:1">
      <div class="label">Brand</div>
      <div style="font-weight:600">${invoice.brand?.name || "—"}</div>
    </div>
  </div>

  ${invoice.description ? `<div class="section"><div class="label">Description</div><p style="font-size:14px;color:#374151">${invoice.description}</p></div>` : ""}

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Rate</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span style="color:#6B7280">Subtotal</span><span>${fmt(invoice.amount)}</span></div>
    <div class="row"><span style="color:#6B7280">Tax</span><span>${fmt(invoice.tax)}</span></div>
    <div class="row total"><span>Total</span><span>${fmt(invoice.totalAmount)}</span></div>
  </div>

  ${invoice.paidAt ? `<div style="margin-top:24px;text-align:right;font-size:13px;color:#059669">Paid on ${invoice.paidAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>` : ""}

  <div class="footer">
    <p>Generated by Daftar Finance</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${invoice.number}.html"`,
    },
  });
});
