#!/bin/bash
# Daftar API Tests — Finance Module
# Prerequisites: Server running at localhost:3000, valid session cookie
# Assumes seed data from tests/seed/seed-test-data.ts has been run

BASE_URL="http://localhost:3000"
COOKIE="next-auth.session-token=YOUR_TOKEN_HERE"
PASS=0
FAIL=0
TOTAL=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local expected_status="$4"
    local body="$5"

    TOTAL=$((TOTAL + 1))

    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" \
            -H "Cookie: $COOKIE" \
            -H "Content-Type: application/json" \
            -d "$body")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" \
            -H "Cookie: $COOKIE")
    fi

    status=$(echo "$response" | tail -1)
    body_response=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo "✅ PASS: $name (HTTP $status)"
        PASS=$((PASS + 1))
    else
        echo "❌ FAIL: $name (Expected $expected_status, got $status)"
        echo "   Response: $(echo "$body_response" | head -3)"
        FAIL=$((FAIL + 1))
    fi
}

# Helper: check JSON field exists in last response
check_field() {
    local field="$1"
    echo "$body_response" | jq -e ".$field" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  ✓ Field '$field' present"
    else
        echo "  ⚠ Field '$field' missing"
    fi
}

echo "=========================================="
echo "  Daftar API Tests — Finance Module"
echo "=========================================="
echo ""

# ---- Happy Path Tests ----

echo "--- Happy Path ---"

# GET /api/finance/invoices — list (ADMIN, FINANCE, CLIENT)
test_endpoint "List invoices" "GET" "/api/finance/invoices" "200"
check_field "data"
check_field "total"
check_field "page"

# Capture first invoice ID if available
FIRST_INVOICE_ID=$(echo "$body_response" | jq -r '.data[0].id // empty')
if [ -n "$FIRST_INVOICE_ID" ]; then
    echo "  → First invoice ID: $FIRST_INVOICE_ID"
fi

# POST /api/finance/invoices — create (ADMIN, FINANCE only)
TIMESTAMP=$(date +%s)
DUE_DATE=$(date -d "+30 days" +%Y-%m-%d 2>/dev/null || date -v+30d +%Y-%m-%d 2>/dev/null || echo "2026-04-15")
CREATE_INVOICE_BODY="{\"amount\":5000,\"dueDate\":\"${DUE_DATE}\",\"description\":\"Test invoice from API tests ${TIMESTAMP}\"}"
test_endpoint "Create invoice" "POST" "/api/finance/invoices" "201" "$CREATE_INVOICE_BODY"
check_field "id"
check_field "number"
check_field "amount"
check_field "dueDate"
check_field "status"

# Store created invoice ID for cleanup
CREATED_INVOICE_ID=$(echo "$body_response" | jq -r '.id')
CREATED_INVOICE_NUM=$(echo "$body_response" | jq -r '.number')
echo "  → Created invoice ID: $CREATED_INVOICE_ID (Number: $CREATED_INVOICE_NUM)"

# GET /api/finance/invoices/[id] — get invoice detail
if [ -n "$CREATED_INVOICE_ID" ] && [ "$CREATED_INVOICE_ID" != "null" ]; then
    test_endpoint "Get invoice by ID" "GET" "/api/finance/invoices/$CREATED_INVOICE_ID" "200"
    check_field "id"
    check_field "number"
    check_field "amount"
fi

# PATCH /api/finance/invoices/[id] — update status
if [ -n "$CREATED_INVOICE_ID" ] && [ "$CREATED_INVOICE_ID" != "null" ]; then
    test_endpoint "Update invoice status" "PATCH" "/api/finance/invoices/$CREATED_INVOICE_ID" "200" '{"status":"SENT"}'
fi

# GET /api/finance/overview — get dashboard totals
test_endpoint "Get finance overview" "GET" "/api/finance/overview" "200"

# GET /api/finance/expenses — list expenses
test_endpoint "List expenses" "GET" "/api/finance/expenses" "200"
check_field "data"
check_field "total"

# POST /api/finance/expenses — create expense
CREATE_EXPENSE_BODY="{\"title\":\"Test Expense ${TIMESTAMP}\",\"amount\":150.50,\"category\":\"SOFTWARE\",\"description\":\"API test expense\"}"
test_endpoint "Create expense" "POST" "/api/finance/expenses" "201" "$CREATE_EXPENSE_BODY"
check_field "id"
check_field "title"
check_field "amount"
check_field "category"

CREATED_EXPENSE_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Created expense ID: $CREATED_EXPENSE_ID"

# GET /api/finance/summary — finance summary
test_endpoint "Get finance summary" "GET" "/api/finance/summary" "200"

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# POST /api/finance/invoices — missing amount → 400
test_endpoint "Create invoice missing amount → 400" "POST" "/api/finance/invoices" "400" \
    "{\"dueDate\":\"${DUE_DATE}\",\"description\":\"Missing amount\"}"

# POST /api/finance/invoices — missing dueDate → 400
test_endpoint "Create invoice missing dueDate → 400" "POST" "/api/finance/invoices" "400" \
    '{"amount":1000,"description":"Missing due date"}'

# POST /api/finance/expenses — missing required fields → 400
test_endpoint "Create expense missing fields → 400" "POST" "/api/finance/expenses" "400" \
    '{"description":"Missing title and amount"}'

# POST /api/finance/expenses — invalid category → 400
test_endpoint "Create expense invalid category → 400" "POST" "/api/finance/expenses" "400" \
    '{"title":"Bad Category","amount":100,"category":"INVALID_CAT"}'

# No cookie → 401 on invoices
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/finance/invoices")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: List invoices without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: List invoices without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on expenses
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/finance/expenses")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: List expenses without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: List expenses without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on overview
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/finance/overview")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Finance overview without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Finance overview without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Cleanup ----

echo ""
echo "--- Cleanup ---"

if [ -n "$CREATED_INVOICE_ID" ] && [ "$CREATED_INVOICE_ID" != "null" ]; then
    echo "  → Cleaning up invoice: $CREATED_INVOICE_ID"
    cleanup_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/finance/invoices/$CREATED_INVOICE_ID" \
        -H "Cookie: $COOKIE")
    cleanup_status=$(echo "$cleanup_response" | tail -1)
    if [ "$cleanup_status" = "200" ] || [ "$cleanup_status" = "204" ]; then
        echo "  ✓ Invoice cleaned up successfully"
    else
        echo "  ⚠ Could not auto-delete invoice $CREATED_INVOICE_ID (HTTP $cleanup_status) — manual cleanup may be needed"
    fi
fi

if [ -n "$CREATED_EXPENSE_ID" ] && [ "$CREATED_EXPENSE_ID" != "null" ]; then
    echo "  → Cleaning up expense: $CREATED_EXPENSE_ID"
    cleanup_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/finance/expenses/$CREATED_EXPENSE_ID" \
        -H "Cookie: $COOKIE")
    cleanup_status=$(echo "$cleanup_response" | tail -1)
    if [ "$cleanup_status" = "200" ] || [ "$cleanup_status" = "204" ]; then
        echo "  ✓ Expense cleaned up successfully"
    else
        echo "  ⚠ Could not auto-delete expense $CREATED_EXPENSE_ID (HTTP $cleanup_status) — manual cleanup may be needed"
    fi
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
