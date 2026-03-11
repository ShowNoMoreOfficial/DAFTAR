# Finance

## What It Does

The Finance module manages DAFTAR's invoicing, expense tracking, and financial overview. It provides a complete invoice lifecycle (draft -> sent -> paid/overdue), categorized expense logging, CSV exports, printable HTML invoices, and a financial dashboard with monthly breakdowns, client revenue analysis, and expense categorization.

Key capabilities:

- **Invoice Management:** Full CRUD with auto-generated invoice numbers (`INV-00001` format), line items (JSON), tax computation, status tracking (DRAFT, SENT, PAID, OVERDUE, CANCELLED), and client/brand association.
- **Expense Tracking:** Categorized expenses (8 categories: SALARY, SOFTWARE, EQUIPMENT, TRAVEL, MARKETING, PRODUCTION, OFFICE, MISCELLANEOUS) with department attribution, receipt URL storage, and approval tracking.
- **Financial Overview Dashboard:** Aggregated view of total revenue, outstanding amounts, total expenses, net profit, monthly breakdown (up to 12 months), expense breakdown by category, and revenue by client (top 10).
- **Financial Summary:** Time-scoped summary (configurable day range) with monthly trends and category analysis.
- **Auto-overdue detection:** The overview endpoint automatically transitions SENT invoices past their due date to OVERDUE status.
- **CSV Exports:** Both invoices and expenses can be exported as CSV files.
- **Printable HTML Invoices:** Each invoice can be rendered as a styled HTML page suitable for browser-to-PDF printing.
- **Notifications:** Clients are notified when invoices are sent; creators are notified when invoices are marked as paid.
- **Role-based access:** ADMIN and FINANCE have full access. CLIENT can view only their own invoices. DEPT_HEAD can view their department's expenses.

---

## Database Models

### Invoice
Table: `invoices`

| Field       | Type            | Notes                                                     |
|-------------|-----------------|-----------------------------------------------------------|
| id          | String (cuid)   | Primary key                                               |
| number      | String          | Unique. Auto-generated as `INV-XXXXX` if not provided     |
| brandId     | String? (FK)    | -> Brand. Optional brand association                      |
| clientId    | String? (FK)    | -> Client. Who is being billed                            |
| status      | InvoiceStatus   | Enum: DRAFT, SENT, PAID, OVERDUE, CANCELLED. Default DRAFT |
| amount      | Float           | Subtotal before tax                                       |
| tax         | Float           | Tax amount. Default 0                                     |
| totalAmount | Float           | Computed: amount + tax                                    |
| dueDate     | DateTime        | Payment due date                                          |
| paidAt      | DateTime?       | Set when status transitions to PAID                       |
| description | String?         | Optional invoice description                              |
| items       | Json?           | Array of line items: `[{description, qty, rate, amount}]` |
| createdById | String          | User who created the invoice                              |
| createdAt   | DateTime        | Auto                                                      |
| updatedAt   | DateTime        | Auto                                                      |

Indexes: `[status]`, `[clientId]`

**InvoiceStatus enum values:**
| Status    | Description                           |
|-----------|---------------------------------------|
| DRAFT     | Invoice created but not sent          |
| SENT      | Sent to client                        |
| PAID      | Client has paid                       |
| OVERDUE   | Past due date (auto-set by overview)  |
| CANCELLED | Voided invoice                        |

### Expense
Table: `expenses`

| Field        | Type             | Notes                                            |
|--------------|------------------|--------------------------------------------------|
| id           | String (cuid)    | Primary key                                      |
| title        | String           | Expense description/name                         |
| amount       | Float            | Expense amount                                   |
| category     | ExpenseCategory  | Enum (see below)                                 |
| departmentId | String? (FK)     | -> Department. Which department incurred the cost|
| description  | String?          | Additional notes                                 |
| receiptUrl   | String?          | URL to uploaded receipt                          |
| approvedBy   | String?          | Who approved this expense                        |
| createdById  | String           | User who logged the expense                      |
| date         | DateTime         | Date the expense occurred. Default now()         |
| createdAt    | DateTime         | Auto                                             |
| updatedAt    | DateTime         | Auto                                             |

Indexes: `[category]`, `[departmentId]`

**ExpenseCategory enum values:**
| Category      | Description                  |
|---------------|------------------------------|
| SALARY        | Payroll and compensation     |
| SOFTWARE      | Software licenses and SaaS   |
| EQUIPMENT     | Hardware and office equipment|
| TRAVEL        | Business travel and lodging  |
| MARKETING     | Advertising and marketing    |
| PRODUCTION    | Content production costs     |
| OFFICE        | Office supplies and rent     |
| MISCELLANEOUS | Everything else              |

---

## API Routes

All routes require authentication via NextAuth session.

### Invoices

#### GET /api/finance/invoices
List invoices with filtering and pagination.

**Auth:** ADMIN, FINANCE, CLIENT only. Returns `403` for other roles.

**Query params:**
- `status` -- Filter by InvoiceStatus.
- `clientId` -- Filter by client (not available to CLIENT role).
- `brandId` -- Filter by brand.
- `dateFrom`, `dateTo` -- Due date range filter.
- `search` -- Invoice number substring search (case-insensitive).
- `page`, `limit` -- Pagination.

**Role scoping:**
- CLIENT: only sees invoices where `clientId` matches their user ID.
- ADMIN / FINANCE: all invoices.

**Response:** Paginated response with invoices including brand and client details.

---

#### POST /api/finance/invoices
Create a new invoice.

**Auth:** ADMIN, FINANCE only.

**Request body:**
```json
{
  "number": "string? -- auto-generated if omitted",
  "brandId": "string?",
  "clientId": "string?",
  "amount": "number (required)",
  "tax": "number? -- default 0",
  "totalAmount": "number? -- auto-computed as amount + tax if omitted",
  "dueDate": "ISO date string (required)",
  "description": "string?",
  "items": [
    { "description": "string", "qty": "number", "rate": "number", "amount": "number" }
  ],
  "status": "InvoiceStatus? -- default DRAFT"
}
```

**Response:** `201` with the created invoice including brand and client details.

**Validation:** Invoice number must be unique. Returns `400` if duplicate.

---

#### GET /api/finance/invoices/[id]
Get a single invoice.

**Auth:** ADMIN, FINANCE, CLIENT (own invoices only).

**Response:** Invoice with brand and client details (including email).

---

#### PATCH /api/finance/invoices/[id]
Update an invoice.

**Auth:** ADMIN, FINANCE only.

**Request body:** Any combination of: `status`, `amount`, `tax`, `totalAmount`, `dueDate`, `description`, `items`, `brandId`, `clientId`.

**Special behavior:**
- Setting `status` to `PAID` automatically sets `paidAt` to now.
- Changing `status` away from `PAID` clears `paidAt`.
- Changing `amount` or `tax` without explicitly setting `totalAmount` auto-recomputes it.

**Notifications:**
- DRAFT -> SENT: Notifies the client (if client has a userId) about the invoice amount.
- Any -> PAID: Notifies the invoice creator that payment has been received.

---

#### DELETE /api/finance/invoices/[id]
Delete an invoice.

**Auth:** ADMIN only.

**Validation:** Only DRAFT invoices can be deleted. Returns `400` for non-draft invoices.

**Response:** `{ "success": true }`

---

#### GET /api/finance/invoices/[id]/pdf
Render an invoice as printable HTML.

**Auth:** ADMIN, FINANCE, CLIENT (own invoices only).

**Response:** `text/html` document styled for printing. Includes:
- Invoice number, status badge, dates.
- Bill-to client details and brand name.
- Line items table (or "No line items" if empty).
- Subtotal, tax, and total amounts (formatted as INR).
- Paid date if applicable.

Intended for browser `Ctrl+P` to PDF conversion.

---

#### GET /api/finance/invoices/export
Export invoices as CSV.

**Auth:** ADMIN, FINANCE, CLIENT (own invoices only).

**Query params:**
- `status` -- Filter by status.

**Response:** CSV file download. Columns: Invoice #, Status, Client, Brand, Amount, Tax, Total, Due Date, Description, Created At.

---

### Expenses

#### GET /api/finance/expenses
List expenses with filtering and pagination.

**Auth:** ADMIN, FINANCE, DEPT_HEAD only.

**Query params:**
- `category` -- Filter by ExpenseCategory.
- `departmentId` -- Filter by department (DEPT_HEAD auto-scoped to own department).
- `dateFrom`, `dateTo` -- Date range filter.
- `search` -- Title substring search (case-insensitive).
- `page`, `limit` -- Pagination.

**Role scoping:**
- DEPT_HEAD: only sees expenses in their primary department.
- ADMIN / FINANCE: all expenses.

---

#### POST /api/finance/expenses
Create a new expense.

**Auth:** ADMIN, FINANCE, DEPT_HEAD only.

**Request body:**
```json
{
  "title": "string (required)",
  "amount": "number (required)",
  "category": "ExpenseCategory (required)",
  "departmentId": "string?",
  "description": "string?",
  "receiptUrl": "string?",
  "date": "ISO date string? -- default now()"
}
```

**Validation:** Category must be one of the 8 valid values. Returns `400` for invalid category.

**Response:** `201` with the created expense including department details.

---

#### GET /api/finance/expenses/[id]
Get a single expense.

**Auth:** ADMIN, FINANCE, DEPT_HEAD (own department only).

---

#### PATCH /api/finance/expenses/[id]
Update an expense.

**Auth:** ADMIN, FINANCE, DEPT_HEAD (own department only).

**Request body:** Any combination of: `title`, `amount`, `category`, `departmentId`, `description`, `receiptUrl`, `date`, `approvedBy`.

---

#### DELETE /api/finance/expenses/[id]
Delete an expense.

**Auth:** ADMIN only.

---

#### GET /api/finance/expenses/export
Export expenses as CSV.

**Auth:** ADMIN, FINANCE, DEPT_HEAD only. (Route exists at `src/app/api/finance/expenses/export/route.ts`.)

---

### Dashboard

#### GET /api/finance/overview
Financial overview with monthly breakdown and aggregated metrics.

**Auth:** ADMIN, FINANCE only.

**Query params:**
- `months` -- Number of months for breakdown (default 6, max 12).

**Side effect:** Auto-marks SENT invoices past their due date as OVERDUE.

**Response:**
```json
{
  "totalRevenue": 1500000,
  "outstanding": 350000,
  "totalExpenses": 800000,
  "netProfit": 700000,
  "monthlyBreakdown": [
    { "month": "Oct", "year": 2025, "revenue": 200000, "expenses": 130000, "profit": 70000 }
  ],
  "byCategory": {
    "SALARY": 400000,
    "SOFTWARE": 120000,
    "MARKETING": 80000
  },
  "byClient": [
    { "id": "...", "name": "Client A", "company": "Corp A", "revenue": 500000 }
  ]
}
```

---

#### GET /api/finance/summary
Time-scoped financial summary.

**Auth:** ADMIN, FINANCE only.

**Query params:**
- `days` -- Look-back period in days (default 30).

**Response:**
```json
{
  "totalRevenue": 250000,
  "totalExpenses": 150000,
  "netProfit": 100000,
  "pendingAmount": 75000,
  "overdueInvoices": 2,
  "totalInvoices": 15,
  "expensesByCategory": { "SALARY": 80000, "SOFTWARE": 20000 },
  "monthlyTrend": [
    { "month": "Oct '25", "revenue": 50000, "expenses": 30000 }
  ],
  "period": { "days": 30, "since": "2026-02-09T00:00:00.000Z" }
}
```

---

## UI Pages

### /finance (Main Dashboard)
The primary finance page. Displays:
- Summary cards: total revenue, outstanding, expenses, net profit.
- Monthly revenue vs. expenses chart (Recharts bar/line chart).
- Invoice list with status badges, filtering, and quick actions (send, mark paid).
- Expense list with category tags and department attribution.
- Create Invoice dialog (component: `src/components/finance/create-invoice-dialog.tsx`) for inline invoice creation with line item support.
- Export buttons for CSV downloads.

---

## Background Jobs (Inngest)

The Finance module does not define any Inngest background jobs. All operations are synchronous API calls. The auto-overdue detection runs in-band on every `/api/finance/overview` GET request.

---

## Known Issues and Gaps

1. **No payment gateway integration.** Invoices track status manually (DRAFT -> SENT -> PAID) but there is no Razorpay, Stripe, or other payment processor integration for actual payment collection.
2. **PDF generation is HTML-based.** The `/api/finance/invoices/[id]/pdf` route returns styled HTML rather than a true PDF file. Users must use browser print-to-PDF. There is no server-side PDF rendering (e.g., Puppeteer, jsPDF).
3. **No recurring invoices.** Each invoice is a one-off document. There is no subscription billing or automatic invoice generation.
4. **No expense approval workflow.** The `approvedBy` field exists on expenses but there is no formal approval pipeline with notifications and status tracking.
5. **Currency is hardcoded to INR.** All formatting uses `en-IN` locale with INR currency. There is no multi-currency support.
6. **Auto-overdue is side-effectful.** SENT invoices are automatically transitioned to OVERDUE on every `/api/finance/overview` GET request. This means the status change only happens when someone views the dashboard, not on a schedule.
7. **No financial reporting period closing.** There is no concept of closed fiscal periods. Historical data can be modified at any time.
8. **Delete restricted to ADMIN.** Only ADMIN can delete invoices and expenses. FINANCE role cannot delete even their own created records.
9. **No client portal payment view.** CLIENT role can view their invoices but there is no dedicated payment portal or payment confirmation mechanism.

---

## Dependencies on Other Modules

| Module        | Direction        | Description                                                         |
|---------------|------------------|---------------------------------------------------------------------|
| Brand         | Finance -> Brand | Invoices are associated with brands via `brandId`                   |
| Client        | Finance -> Client| Invoices are billed to clients via `clientId`. Client model holds company and contact info |
| Department    | Finance -> Dept  | Expenses are attributed to departments via `departmentId`           |
| Notifications | Finance -> Notif | Invoice status changes (sent, paid) trigger in-app notifications    |
| GI            | GI reads Finance | GI chat does not currently surface financial data, but the overview data is available for future integration |
