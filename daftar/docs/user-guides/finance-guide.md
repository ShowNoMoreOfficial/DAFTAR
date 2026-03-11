# DAFTAR Finance Guide

This guide is for users with the **FINANCE** role. Finance users manage invoices, track expenses, monitor revenue, and handle client billing through the Finance module.

---

## Table of Contents

1. [Financial Dashboard Overview](#1-financial-dashboard-overview)
2. [Creating and Managing Invoices](#2-creating-and-managing-invoices)
3. [Tracking Expenses](#3-tracking-expenses)
4. [Client Billing Management](#4-client-billing-management)
5. [Generating Financial Reports](#5-generating-financial-reports)
6. [Month-End Workflows](#6-month-end-workflows)

---

## 1. Financial Dashboard Overview

### Logging In

1. Navigate to the DAFTAR login page.
2. Click **Sign in with Google** or **Sign in with Microsoft**.
3. Complete the OAuth flow. You will be redirected to the Dashboard.

### Sidebar Navigation

As a Finance user, your sidebar includes:

| Sidebar Item | Path | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Organizational overview |
| Finance | `/finance` | Financial dashboard, invoices, and expenses |
| Clients & Brands | `/admin/clients` | Client and brand management |
| Reports | `/reports` | Financial and cross-module reports |

### Finance Dashboard

Navigate to **Finance** (`/finance`) to see the main financial dashboard. The dashboard displays four key metrics:

| Metric | Description |
|--------|-------------|
| **Total Revenue** | Sum of all paid invoices |
| **Outstanding** | Total amount of unpaid invoices (SENT + OVERDUE) |
| **Total Expenses** | Sum of all recorded expenses |
| **Net Profit** | Revenue minus expenses |

Below the key metrics, the dashboard shows:

- **Monthly Breakdown**: Revenue, expenses, and profit charted by month.
- **Expenses by Category**: Breakdown of expenses across categories (Salary, Software, Equipment, Travel, Marketing, Production, Office, Miscellaneous).
- **Revenue by Client**: Which clients are generating the most revenue.

---

## 2. Creating and Managing Invoices

### Invoice Lifecycle

Invoices in DAFTAR follow this status flow:

```
DRAFT --> SENT --> PAID
                \--> OVERDUE
                \--> CANCELLED
```

| Status | Meaning |
|--------|---------|
| `DRAFT` | Invoice is being prepared. Not yet visible to the client. |
| `SENT` | Invoice has been finalized and sent to the client for payment. |
| `PAID` | Payment has been received and recorded. |
| `OVERDUE` | Invoice has passed its due date without payment. |
| `CANCELLED` | Invoice has been voided. |

### Creating a New Invoice

1. Navigate to **Finance** (`/finance`).
2. Switch to the **Invoices** tab.
3. Click the **Create Invoice** button.
4. Fill in the invoice form:

| Field | Description |
|-------|-------------|
| **Invoice Number** | Unique identifier (e.g., `INV-2026-001`). Must be unique across all invoices. |
| **Client** | Select the client from the dropdown. The list is populated from the Clients & Brands module. |
| **Brand** | Optionally associate the invoice with a specific brand. |
| **Amount** | Base amount for the invoice (auto-calculated from line items if provided). |
| **Tax** | Tax amount to add on top of the base amount. |
| **Due Date** | Payment deadline. |
| **Description** | Optional notes about the invoice. |

### Adding Line Items

Line items provide an itemized breakdown of charges:

1. Click **Add Line Item** in the invoice form.
2. For each line item, enter:
   - **Description**: What the charge is for (e.g., "Social media management - March 2026").
   - **Quantity**: Number of units.
   - **Rate**: Price per unit.
   - **Amount**: Auto-calculated as quantity x rate.
3. When line items are present, the invoice **Amount** is auto-calculated as the sum of all line item amounts.
4. The **Total Amount** is always Amount + Tax.

### Managing Existing Invoices

From the Invoices tab, you can perform these actions on each invoice:

| Action | Available When | What It Does |
|--------|---------------|-------------|
| **View** | Any status | Opens the invoice detail view |
| **Edit** | `DRAFT` only | Modify invoice fields and line items |
| **Send** | `DRAFT` | Changes status to `SENT` |
| **Mark as Paid** | `SENT` or `OVERDUE` | Changes status to `PAID` and records payment date |
| **Cancel** | `DRAFT` or `SENT` | Changes status to `CANCELLED` |
| **Delete** | `DRAFT` only | Permanently removes the invoice |
| **Download PDF** | Any status | Downloads a PDF copy of the invoice |

### Filtering and Searching Invoices

- Use the **status filter** to show only invoices in a specific status.
- Use the **search bar** to find invoices by number, client name, or description.
- Sort by date, amount, or status.

---

## 3. Tracking Expenses

### Expense Categories

DAFTAR tracks expenses across eight predefined categories:

| Category | Examples |
|----------|---------|
| `SALARY` | Employee salaries, contractor payments |
| `SOFTWARE` | SaaS subscriptions, licenses, API costs |
| `EQUIPMENT` | Hardware, cameras, devices |
| `TRAVEL` | Travel expenses, accommodation |
| `MARKETING` | Ad spend, promotional materials |
| `PRODUCTION` | Production costs, studio rental |
| `OFFICE` | Rent, utilities, office supplies |
| `MISCELLANEOUS` | Anything not fitting other categories |

### Creating an Expense

1. Navigate to **Finance** (`/finance`).
2. Switch to the **Expenses** tab.
3. Click the **Create Expense** button.
4. Fill in:

| Field | Description |
|-------|-------------|
| **Title** | Brief description of the expense |
| **Amount** | Expense amount |
| **Category** | Select from the predefined categories |
| **Department** | Optionally assign to a specific department |
| **Description** | Detailed notes about the expense |
| **Date** | When the expense was incurred |
| **Receipt** | Upload a receipt image (stored in AWS S3) |

### Managing Expenses

- **View**: Click an expense to see its full details and receipt.
- **Edit**: Modify expense details.
- **Approve**: Mark an expense as approved (stores the approver's ID).
- **Delete**: Remove an expense record.

### Expense Analytics

The Finance dashboard shows expenses broken down by category in a chart format. Use this to:

- Identify the largest expense categories.
- Track spending trends over time.
- Compare department-level spending.

---

## 4. Client Billing Management

### Accessing Clients

Navigate to **Clients & Brands** (`/admin/clients`) to manage client records and their associated brands.

### Client Overview

For each client, you can see:

- **Client name and company**.
- **Associated brands** and their platforms.
- **Invoice history**: All invoices linked to this client.
- **Total revenue**: Sum of paid invoices for this client.
- **Outstanding balance**: Sum of unpaid invoices.

### Invoice-to-Client Workflow

1. Create invoices linked to specific clients and optionally to specific brands.
2. Send invoices to move them from `DRAFT` to `SENT`.
3. Track payment status. Invoices past their due date automatically surface as `OVERDUE`.
4. Record payments by marking invoices as `PAID`.

### Revenue by Client

The Finance dashboard includes a **Revenue by Client** breakdown showing:

- Each client's total revenue contribution.
- Client ID, name, and company.
- Relative revenue share.

Use this data to identify top clients and those with outstanding balances.

---

## 5. Generating Financial Reports

### Reports Page

Navigate to **Reports** (`/reports`) for comprehensive financial reporting.

### Available Report Data

| Report Area | What It Shows |
|-------------|---------------|
| **Revenue Summary** | Total revenue, monthly breakdown, year-over-year comparison |
| **Expense Summary** | Total expenses by category, department, and time period |
| **Profit & Loss** | Net profit calculated as revenue minus expenses, tracked monthly |
| **Outstanding Invoices** | All unpaid invoices with aging information (days past due) |
| **Client Revenue Breakdown** | Revenue contribution per client |
| **Department Expenses** | Expenses allocated to each department |

### Monthly Breakdown

The Finance dashboard includes a monthly breakdown chart showing:

- **Revenue** per month.
- **Expenses** per month.
- **Profit** per month (revenue - expenses).

This data is useful for identifying seasonal patterns, growth trends, and months with unusually high expenses.

### Exporting Data

- Use the **Download** functionality to export invoice and expense data.
- PDF invoices can be downloaded individually from the invoice detail view.

---

## 6. Month-End Workflows

Follow this checklist at the end of each month to ensure financial records are accurate and complete.

### Step 1: Review Outstanding Invoices

1. Navigate to **Finance** (`/finance`), Invoices tab.
2. Filter by status `SENT` and `OVERDUE`.
3. For each outstanding invoice:
   - If paid, mark as `PAID` and record the payment date.
   - If overdue, follow up with the client.
   - If no longer valid, cancel the invoice.

### Step 2: Review Draft Invoices

1. Filter by status `DRAFT`.
2. Finalize and send any invoices that should have been sent during the month.
3. Delete any drafts that are no longer needed.

### Step 3: Review Expenses

1. Switch to the **Expenses** tab.
2. Ensure all expenses for the month have been recorded.
3. Verify expense categories are correct.
4. Approve any pending expenses.
5. Upload missing receipts.

### Step 4: Check Department Allocations

1. Verify that expenses are correctly allocated to departments.
2. Ensure salary expenses match the current headcount.

### Step 5: Review Financial Dashboard

1. Return to the Finance dashboard overview.
2. Verify the monthly breakdown numbers match your expectations.
3. Check that net profit calculations are accurate.
4. Note any anomalies for investigation.

### Step 6: Generate Reports

1. Navigate to **Reports** (`/reports`).
2. Generate the monthly financial summary.
3. Export data as needed for external accounting systems.
4. Archive or download PDF invoices for record-keeping.

### Step 7: Plan Ahead

1. Create draft invoices for the upcoming month based on active client contracts.
2. Set up expected recurring expenses.
3. Update financial projections based on the current month's actuals.
