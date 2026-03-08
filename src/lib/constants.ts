/**
 * Shared color and style constants used across the application.
 */

// ─── Task Status ────────────────────────────────────────

export const TASK_STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  REVIEW: "bg-purple-100 text-purple-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

// ─── Invoice Status ─────────────────────────────────────

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-50 text-red-500",
};

// ─── Expense Category ───────────────────────────────────

export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  SALARY: "bg-indigo-100 text-indigo-700",
  SOFTWARE: "bg-blue-100 text-blue-700",
  EQUIPMENT: "bg-teal-100 text-teal-700",
  TRAVEL: "bg-amber-100 text-amber-700",
  MARKETING: "bg-pink-100 text-pink-700",
  PRODUCTION: "bg-purple-100 text-purple-700",
  OFFICE: "bg-gray-100 text-gray-700",
  MISCELLANEOUS: "bg-slate-100 text-slate-600",
};

// ─── Roles ──────────────────────────────────────────────

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  HEAD_HR: "bg-blue-100 text-blue-700",
  DEPT_HEAD: "bg-teal-100 text-teal-700",
  MEMBER: "bg-gray-100 text-gray-700",
  CLIENT: "bg-amber-100 text-amber-700",
  FINANCE: "bg-green-100 text-green-700",
  CONTRACTOR: "bg-orange-100 text-orange-700",
};

// ─── Currency Formatter ─────────────────────────────────

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
