"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  FileText,
  Plus,
  Receipt,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Send,
  Trash2,
  Pencil,
  X,
  Filter,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { CreateInvoiceDialog } from "@/components/finance/create-invoice-dialog";
import { CreateExpenseDialog } from "@/components/finance/create-expense-dialog";

// ─── Types ───────────────────────────────────────────────

interface OverviewData {
  totalRevenue: number;
  outstanding: number;
  totalExpenses: number;
  netProfit: number;
  monthlyBreakdown: { month: string; year: number; revenue: number; expenses: number; profit: number }[];
  byCategory: Record<string, number>;
  byClient: { id: string; name: string; company: string | null; revenue: number }[];
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  amount: number;
  tax: number;
  totalAmount: number;
  dueDate: string;
  paidAt: string | null;
  description: string | null;
  items: unknown;
  client: { id: string; name: string; company: string | null } | null;
  brand: { id: string; name: string } | null;
  createdAt: string;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  description: string | null;
  receiptUrl: string | null;
  approvedBy: string | null;
  department: { id: string; name: string } | null;
  date: string;
  createdAt: string;
}

interface SelectOption {
  id: string;
  name: string;
  company?: string;
}

// ─── Constants ───────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  SALARY: "Salary",
  SOFTWARE: "Software",
  EQUIPMENT: "Equipment",
  TRAVEL: "Travel",
  MARKETING: "Marketing",
  PRODUCTION: "Production",
  OFFICE: "Office",
  MISCELLANEOUS: "Misc",
};

const CATEGORY_COLORS: Record<string, string> = {
  SALARY: "bg-blue-500",
  SOFTWARE: "bg-purple-500",
  EQUIPMENT: "bg-amber-500",
  TRAVEL: "bg-teal-500",
  MARKETING: "bg-pink-500",
  PRODUCTION: "bg-indigo-500",
  OFFICE: "bg-orange-500",
  MISCELLANEOUS: "bg-gray-400",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Main Page ───────────────────────────────────────────

export default function FinancePage() {
  const { data: session } = useSession();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "invoices" | "expenses">("overview");
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);

  // Invoice filters
  const [invStatusFilter, setInvStatusFilter] = useState("");
  const [invClientFilter, setInvClientFilter] = useState("");
  const [invDateFrom, setInvDateFrom] = useState("");
  const [invDateTo, setInvDateTo] = useState("");

  // Expense filters
  const [expCategoryFilter, setExpCategoryFilter] = useState("");
  const [expDeptFilter, setExpDeptFilter] = useState("");
  const [expDateFrom, setExpDateFrom] = useState("");
  const [expDateTo, setExpDateTo] = useState("");

  // Reference data
  const [clients, setClients] = useState<SelectOption[]>([]);
  const [departments, setDepartments] = useState<SelectOption[]>([]);

  // Detail panel
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/finance/overview");
      if (res.ok) setOverview(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchInvoices = useCallback(async () => {
    const params = new URLSearchParams();
    if (invStatusFilter) params.set("status", invStatusFilter);
    if (invClientFilter) params.set("clientId", invClientFilter);
    if (invDateFrom) params.set("dateFrom", invDateFrom);
    if (invDateTo) params.set("dateTo", invDateTo);

    try {
      const res = await fetch(`/api/finance/invoices?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setInvoices(json.data ?? json);
      }
    } catch { /* ignore */ }
  }, [invStatusFilter, invClientFilter, invDateFrom, invDateTo]);

  const fetchExpenses = useCallback(async () => {
    const params = new URLSearchParams();
    if (expCategoryFilter) params.set("category", expCategoryFilter);
    if (expDeptFilter) params.set("departmentId", expDeptFilter);
    if (expDateFrom) params.set("dateFrom", expDateFrom);
    if (expDateTo) params.set("dateTo", expDateTo);

    try {
      const res = await fetch(`/api/finance/expenses?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.data ?? json);
      }
    } catch { /* ignore */ }
  }, [expCategoryFilter, expDeptFilter, expDateFrom, expDateTo]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/departments"),
      ]);
      if (cRes.ok) {
        const data = await cRes.json();
        setClients(Array.isArray(data) ? data : []);
      }
      if (dRes.ok) {
        const data = await dRes.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), fetchInvoices(), fetchExpenses(), fetchReferenceData()]);
    setLoading(false);
  }, [fetchOverview, fetchInvoices, fetchExpenses, fetchReferenceData]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // ─── Invoice Actions ────────────────────────────────────

  const updateInvoiceStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/finance/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchInvoices();
      fetchOverview();
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(await res.json());
      }
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm("Delete this draft invoice?")) return;
    const res = await fetch(`/api/finance/invoices/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchInvoices();
      fetchOverview();
      if (selectedInvoice?.id === id) setSelectedInvoice(null);
    }
  };

  // ─── Expense Actions ────────────────────────────────────

  const approveExpense = async (id: string) => {
    const res = await fetch(`/api/finance/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedBy: "Approved" }),
    });
    if (res.ok) {
      fetchExpenses();
      if (selectedExpense?.id === id) {
        setSelectedExpense(await res.json());
      }
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/finance/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchExpenses();
      fetchOverview();
      if (selectedExpense?.id === id) setSelectedExpense(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Finance</h1>
          <p className="text-sm text-[#9CA3AF]">Financial overview and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const endpoint = tab === "invoices" ? "/api/finance/invoices/export" : "/api/finance/expenses/export";
              window.open(endpoint, "_blank");
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreateExpenseOpen(true)}>
            <Receipt className="mr-1.5 h-3.5 w-3.5" />
            Add Expense
          </Button>
          <Button size="sm" onClick={() => setCreateInvoiceOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Wallet className="h-4 w-4 text-[#2E86AB]" />}
          iconBg="bg-blue-50"
          label="Monthly Revenue"
          value={overview ? formatCurrency(overview.totalRevenue) : "--"}
          subtitle="paid invoices"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          iconBg="bg-amber-50"
          label="Outstanding Invoices"
          value={overview ? formatCurrency(overview.outstanding) : "--"}
          subtitle="sent + overdue"
        />
        <SummaryCard
          icon={<TrendingDown className="h-4 w-4 text-red-500" />}
          iconBg="bg-red-50"
          label="Total Expenses"
          value={overview ? formatCurrency(overview.totalExpenses) : "--"}
          subtitle="all categories"
        />
        <SummaryCard
          icon={
            <TrendingUp
              className={cn(
                "h-4 w-4",
                overview && overview.netProfit >= 0 ? "text-emerald-500" : "text-red-500"
              )}
            />
          }
          iconBg={overview && overview.netProfit >= 0 ? "bg-emerald-50" : "bg-red-50"}
          label="Net Profit"
          value={overview ? formatCurrency(overview.netProfit) : "--"}
          subtitle="revenue - expenses"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-white p-0.5 w-fit">
        {(["overview", "invoices", "expenses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-colors",
              tab === t ? "bg-[#2E86AB] text-white" : "text-[#6B7280] hover:bg-[#F0F2F5]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[#9CA3AF]">Loading finance data...</div>
      ) : tab === "overview" ? (
        <OverviewTab overview={overview} />
      ) : tab === "invoices" ? (
        <InvoicesTab
          invoices={invoices}
          clients={clients}
          statusFilter={invStatusFilter}
          clientFilter={invClientFilter}
          dateFrom={invDateFrom}
          dateTo={invDateTo}
          onStatusFilterChange={setInvStatusFilter}
          onClientFilterChange={setInvClientFilter}
          onDateFromChange={setInvDateFrom}
          onDateToChange={setInvDateTo}
          onSelect={setSelectedInvoice}
          onUpdateStatus={updateInvoiceStatus}
          onDelete={deleteInvoice}
        />
      ) : (
        <ExpensesTab
          expenses={expenses}
          departments={departments}
          categoryFilter={expCategoryFilter}
          deptFilter={expDeptFilter}
          dateFrom={expDateFrom}
          dateTo={expDateTo}
          onCategoryFilterChange={setExpCategoryFilter}
          onDeptFilterChange={setExpDeptFilter}
          onDateFromChange={setExpDateFrom}
          onDateToChange={setExpDateTo}
          onSelect={setSelectedExpense}
          onApprove={approveExpense}
          onDelete={deleteExpense}
        />
      )}

      {/* Invoice Detail Panel */}
      {selectedInvoice && (
        <InvoiceDetailPanel
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdateStatus={updateInvoiceStatus}
          onDelete={deleteInvoice}
        />
      )}

      {/* Expense Detail Panel */}
      {selectedExpense && (
        <ExpenseDetailPanel
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onApprove={approveExpense}
          onDelete={deleteExpense}
        />
      )}

      <CreateInvoiceDialog
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        onCreated={() => { fetchInvoices(); fetchOverview(); }}
      />
      <CreateExpenseDialog
        open={createExpenseOpen}
        onOpenChange={setCreateExpenseOpen}
        onCreated={() => { fetchExpenses(); fetchOverview(); }}
      />
    </div>
  );
}

// ─── Summary Card ────────────────────────────────────────

function SummaryCard({
  icon,
  iconBg,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">{label}</p>
        <div className={cn("rounded-lg p-1.5", iconBg)}>{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-[#1A1A1A]">{value}</p>
      <p className="mt-1 text-xs text-[#9CA3AF]">{subtitle}</p>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────

function OverviewTab({ overview }: { overview: OverviewData | null }) {
  if (!overview) return null;

  const maxBar = Math.max(
    ...overview.monthlyBreakdown.map((m) => Math.max(m.revenue, m.expenses)),
    1
  );

  const totalCategoryExpense = Object.values(overview.byCategory).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Monthly Revenue vs Expenses */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Monthly Revenue vs Expenses</h3>
        <div className="mt-4 space-y-3">
          {overview.monthlyBreakdown.map((m) => (
            <div key={`${m.month}-${m.year}`} className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
                <span>{m.month} {m.year}</span>
                <span className="flex gap-3">
                  <span className="text-emerald-600">{formatCurrency(m.revenue)}</span>
                  <span className="text-red-500">{formatCurrency(m.expenses)}</span>
                </span>
              </div>
              <div className="flex gap-1">
                <div
                  className="h-2.5 rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${(m.revenue / maxBar) * 100}%`, minWidth: m.revenue > 0 ? "4px" : "0px" }}
                />
                <div
                  className="h-2.5 rounded-full bg-red-300 transition-all"
                  style={{ width: `${(m.expenses / maxBar) * 100}%`, minWidth: m.expenses > 0 ? "4px" : "0px" }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-[#9CA3AF]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Revenue
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-300" /> Expenses
          </span>
        </div>
      </div>

      {/* Top Clients by Revenue */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Top Clients by Revenue</h3>
        <div className="mt-4 space-y-3">
          {overview.byClient.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#9CA3AF]">No client revenue data</p>
          ) : (
            overview.byClient.map((client, i) => (
              <div key={client.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2E86AB] text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-[#1A1A1A]">
                    {client.company || client.name}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  {formatCurrency(client.revenue)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Expenses by Category */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Expense Breakdown by Category</h3>
        <div className="mt-4 space-y-2.5">
          {Object.entries(overview.byCategory).length === 0 ? (
            <p className="py-6 text-center text-sm text-[#9CA3AF]">No expenses recorded</p>
          ) : (
            Object.entries(overview.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => {
                const pct = Math.round((amount / totalCategoryExpense) * 100);
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-[#6B7280]">
                      {CATEGORY_LABELS[cat] || cat}
                    </span>
                    <div className="flex-1">
                      <div className="h-2.5 w-full rounded-full bg-[#F0F2F5]">
                        <div
                          className={cn("h-2.5 rounded-full transition-all", CATEGORY_COLORS[cat] || "bg-[#A23B72]")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-xs text-[#9CA3AF]">{pct}%</span>
                    <span className="w-24 text-right text-xs font-medium text-[#1A1A1A]">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Invoices Tab ────────────────────────────────────────

function InvoicesTab({
  invoices,
  clients,
  statusFilter,
  clientFilter,
  dateFrom,
  dateTo,
  onStatusFilterChange,
  onClientFilterChange,
  onDateFromChange,
  onDateToChange,
  onSelect,
  onUpdateStatus,
  onDelete,
}: {
  invoices: Invoice[];
  clients: SelectOption[];
  statusFilter: string;
  clientFilter: string;
  dateFrom: string;
  dateTo: string;
  onStatusFilterChange: (v: string) => void;
  onClientFilterChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onSelect: (inv: Invoice) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
        <Filter className="h-4 w-4 text-[#9CA3AF]" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={clientFilter}
          onChange={(e) => onClientFilterChange(e.target.value)}
          className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs"
        >
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.company || c.name}</option>
          ))}
        </select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="h-7 w-32 text-xs"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="h-7 w-32 text-xs"
          placeholder="To"
        />
        {(statusFilter || clientFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { onStatusFilterChange(""); onClientFilterChange(""); onDateFromChange(""); onDateToChange(""); }}
            className="text-xs text-[#2E86AB] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {invoices.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#D1D5DB]" />
          <h3 className="mt-4 text-sm font-medium text-[#1A1A1A]">No Invoices Found</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            {statusFilter || clientFilter || dateFrom || dateTo
              ? "Try adjusting your filters."
              : "Create your first invoice to start tracking payments."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-xs text-[#6B7280]">
                  <th className="px-4 py-3 font-medium">Invoice #</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Brand</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Tax</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#F8F9FA] cursor-pointer"
                    onClick={() => onSelect(inv)}
                  >
                    <td className="px-4 py-3 font-medium text-[#2E86AB]">{inv.number}</td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {inv.client?.company || inv.client?.name || "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{inv.brand?.name || "\u2014"}</td>
                    <td className="px-4 py-3 text-right text-[#1A1A1A]">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3 text-right text-[#9CA3AF]">{formatCurrency(inv.tax)}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#1A1A1A]">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px]", STATUS_STYLES[inv.status])}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)}
                          className="rounded p-1 hover:bg-[#F0F2F5]"
                        >
                          <MoreHorizontal className="h-4 w-4 text-[#9CA3AF]" />
                        </button>
                        {openMenu === inv.id && (
                          <InvoiceActionMenu
                            invoice={inv}
                            onClose={() => setOpenMenu(null)}
                            onUpdateStatus={onUpdateStatus}
                            onDelete={onDelete}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invoice Action Menu ─────────────────────────────────

function InvoiceActionMenu({
  invoice,
  onClose,
  onUpdateStatus,
  onDelete,
}: {
  invoice: Invoice;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const actions: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];

  if (invoice.status === "DRAFT") {
    actions.push({
      label: "Mark as Sent",
      icon: <Send className="h-3.5 w-3.5" />,
      onClick: () => { onUpdateStatus(invoice.id, "SENT"); onClose(); },
    });
  }
  if (invoice.status === "SENT" || invoice.status === "OVERDUE") {
    actions.push({
      label: "Mark as Paid",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      onClick: () => { onUpdateStatus(invoice.id, "PAID"); onClose(); },
    });
  }
  if (invoice.status !== "PAID" && invoice.status !== "CANCELLED") {
    actions.push({
      label: "Cancel",
      icon: <X className="h-3.5 w-3.5" />,
      onClick: () => { onUpdateStatus(invoice.id, "CANCELLED"); onClose(); },
    });
  }
  if (invoice.status === "DRAFT") {
    actions.push({
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: () => { onDelete(invoice.id); onClose(); },
      danger: true,
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-8 z-50 min-w-[160px] rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-[#F8F9FA]",
              a.danger ? "text-red-600" : "text-[#1A1A1A]"
            )}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Invoice Detail Panel ────────────────────────────────

function InvoiceDetailPanel({
  invoice,
  onClose,
  onUpdateStatus,
  onDelete,
}: {
  invoice: Invoice;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const items = invoice.items as { description: string; amount: number }[] | null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">{invoice.number}</h2>
            <Badge className={cn("mt-1 text-[10px]", STATUS_STYLES[invoice.status])}>
              {invoice.status}
            </Badge>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-[#F0F2F5]">
            <X className="h-5 w-5 text-[#9CA3AF]" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Key Details */}
          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Client" value={invoice.client?.company || invoice.client?.name || "\u2014"} />
            <DetailField label="Brand" value={invoice.brand?.name || "\u2014"} />
            <DetailField label="Amount" value={formatCurrency(invoice.amount)} />
            <DetailField label="Tax" value={formatCurrency(invoice.tax)} />
            <DetailField label="Total Amount" value={formatCurrency(invoice.totalAmount)} highlight />
            <DetailField label="Due Date" value={formatDate(invoice.dueDate)} />
            {invoice.paidAt && (
              <DetailField label="Paid On" value={formatDate(invoice.paidAt)} />
            )}
            <DetailField label="Created" value={formatDate(invoice.createdAt)} />
          </div>

          {/* Description */}
          {invoice.description && (
            <div>
              <p className="text-xs font-medium text-[#6B7280]">Description</p>
              <p className="mt-1 text-sm text-[#1A1A1A]">{invoice.description}</p>
            </div>
          )}

          {/* Line Items */}
          {items && items.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#6B7280]">Line Items</p>
              <div className="mt-2 rounded-lg border border-[#E5E7EB]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-xs text-[#6B7280]">
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F2F5]">
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-[#1A1A1A]">{item.description}</td>
                        <td className="px-3 py-2 text-right text-[#1A1A1A]">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-4">
            {invoice.status === "DRAFT" && (
              <Button size="sm" onClick={() => onUpdateStatus(invoice.id, "SENT")}>
                <Send className="mr-1.5 h-3.5 w-3.5" /> Mark as Sent
              </Button>
            )}
            {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
              <Button size="sm" onClick={() => onUpdateStatus(invoice.id, "PAID")}>
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Mark as Paid
              </Button>
            )}
            {invoice.status === "DRAFT" && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => onDelete(invoice.id)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses Tab ────────────────────────────────────────

function ExpensesTab({
  expenses,
  departments,
  categoryFilter,
  deptFilter,
  dateFrom,
  dateTo,
  onCategoryFilterChange,
  onDeptFilterChange,
  onDateFromChange,
  onDateToChange,
  onSelect,
  onApprove,
  onDelete,
}: {
  expenses: Expense[];
  departments: SelectOption[];
  categoryFilter: string;
  deptFilter: string;
  dateFrom: string;
  dateTo: string;
  onCategoryFilterChange: (v: string) => void;
  onDeptFilterChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onSelect: (exp: Expense) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
        <Filter className="h-4 w-4 text-[#9CA3AF]" />
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs"
        >
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={deptFilter}
          onChange={(e) => onDeptFilterChange(e.target.value)}
          className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="h-7 w-32 text-xs"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="h-7 w-32 text-xs"
          placeholder="To"
        />
        {(categoryFilter || deptFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { onCategoryFilterChange(""); onDeptFilterChange(""); onDateFromChange(""); onDateToChange(""); }}
            className="text-xs text-[#2E86AB] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {expenses.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center">
          <Receipt className="mx-auto h-12 w-12 text-[#D1D5DB]" />
          <h3 className="mt-4 text-sm font-medium text-[#1A1A1A]">No Expenses Found</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            {categoryFilter || deptFilter || dateFrom || dateTo
              ? "Try adjusting your filters."
              : "Start recording expenses to track spending."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-xs text-[#6B7280]">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Approved By</th>
                  <th className="px-4 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-[#F8F9FA] cursor-pointer"
                    onClick={() => onSelect(exp)}
                  >
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{exp.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px]">
                        {CATEGORY_LABELS[exp.category] || exp.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{exp.department?.name || "\u2014"}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#1A1A1A]">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {exp.approvedBy ? (
                        <span className="text-emerald-600">{exp.approvedBy}</span>
                      ) : (
                        <span className="text-[#9CA3AF]">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenMenu(openMenu === exp.id ? null : exp.id)}
                          className="rounded p-1 hover:bg-[#F0F2F5]"
                        >
                          <MoreHorizontal className="h-4 w-4 text-[#9CA3AF]" />
                        </button>
                        {openMenu === exp.id && (
                          <ExpenseActionMenu
                            expense={exp}
                            onClose={() => setOpenMenu(null)}
                            onApprove={onApprove}
                            onDelete={onDelete}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Expense Action Menu ─────────────────────────────────

function ExpenseActionMenu({
  expense,
  onClose,
  onApprove,
  onDelete,
}: {
  expense: Expense;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-8 z-50 min-w-[160px] rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
        {!expense.approvedBy && (
          <button
            onClick={() => { onApprove(expense.id); onClose(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#1A1A1A] hover:bg-[#F8F9FA]"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Approve
          </button>
        )}
        <button
          onClick={() => { onDelete(expense.id); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-[#F8F9FA]"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </>
  );
}

// ─── Expense Detail Panel ────────────────────────────────

function ExpenseDetailPanel({
  expense,
  onClose,
  onApprove,
  onDelete,
}: {
  expense: Expense;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">{expense.title}</h2>
            <Badge variant="secondary" className="mt-1 text-[10px]">
              {CATEGORY_LABELS[expense.category] || expense.category}
            </Badge>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-[#F0F2F5]">
            <X className="h-5 w-5 text-[#9CA3AF]" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Amount" value={formatCurrency(expense.amount)} highlight />
            <DetailField label="Category" value={CATEGORY_LABELS[expense.category] || expense.category} />
            <DetailField label="Department" value={expense.department?.name || "\u2014"} />
            <DetailField label="Date" value={formatDate(expense.date)} />
            <DetailField
              label="Approved By"
              value={expense.approvedBy || "Pending approval"}
              highlight={!!expense.approvedBy}
            />
            <DetailField label="Created" value={formatDate(expense.createdAt)} />
          </div>

          {expense.description && (
            <div>
              <p className="text-xs font-medium text-[#6B7280]">Description</p>
              <p className="mt-1 text-sm text-[#1A1A1A]">{expense.description}</p>
            </div>
          )}

          {expense.receiptUrl && (
            <div>
              <p className="text-xs font-medium text-[#6B7280]">Receipt</p>
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-[#2E86AB] hover:underline"
              >
                View Receipt
              </a>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-4">
            {!expense.approvedBy && (
              <Button size="sm" onClick={() => onApprove(expense.id)}>
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Approve
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete(expense.id)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────

function DetailField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[#6B7280]">{label}</p>
      <p className={cn("mt-0.5 text-sm", highlight ? "font-semibold text-[#1A1A1A]" : "text-[#1A1A1A]")}>
        {value}
      </p>
    </div>
  );
}
