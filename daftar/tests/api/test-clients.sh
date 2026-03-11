#!/bin/bash
# Daftar API Tests — Clients Module
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
echo "  Daftar API Tests — Clients Module"
echo "=========================================="
echo ""

# ---- Happy Path Tests ----

echo "--- Happy Path ---"

# GET /api/clients — list (ADMIN, FINANCE only)
test_endpoint "List clients" "GET" "/api/clients" "200"
check_field "[0].id"
check_field "[0].name"
check_field "[0].brands"

# Capture first client ID for subsequent tests
FIRST_CLIENT_ID=$(echo "$body_response" | jq -r '.[0].id')
echo "  → First client ID: $FIRST_CLIENT_ID"

# POST /api/clients — create (name required)
TIMESTAMP=$(date +%s)
CREATE_BODY="{\"name\":\"Test Client ${TIMESTAMP}\",\"company\":\"Test Company ${TIMESTAMP}\",\"email\":\"client-${TIMESTAMP}@test.com\"}"
test_endpoint "Create client" "POST" "/api/clients" "201" "$CREATE_BODY"
check_field "id"
check_field "name"
check_field "company"

# Store created client ID for cleanup
CREATED_CLIENT_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Created client ID: $CREATED_CLIENT_ID"

# GET /api/clients/[id] — get by ID with brands
# Note: There is no /api/clients/[id] route in the codebase; clients list includes brands.
# We test the list endpoint filtered response instead.
if [ -n "$FIRST_CLIENT_ID" ] && [ "$FIRST_CLIENT_ID" != "null" ]; then
    echo "  (Note: No dedicated /api/clients/[id] route — client detail is included in list response)"
fi

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# POST /api/clients — missing name → 400
test_endpoint "Create client missing name → 400" "POST" "/api/clients" "400" '{"company":"No Name Corp"}'

# No cookie → 401
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/clients")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: List clients without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: List clients without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# POST without auth → 401
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/clients" \
    -H "Content-Type: application/json" \
    -d '{"name":"Unauthorized Client","company":"No Auth"}')
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Create client without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Create client without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Cleanup ----

echo ""
echo "--- Cleanup ---"

if [ -n "$CREATED_CLIENT_ID" ] && [ "$CREATED_CLIENT_ID" != "null" ]; then
    echo "  → Created client $CREATED_CLIENT_ID — no dedicated DELETE endpoint; manual cleanup may be needed"
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
