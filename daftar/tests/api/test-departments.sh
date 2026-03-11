#!/bin/bash
# Daftar API Tests — Departments Module
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
echo "  Daftar API Tests — Departments Module"
echo "=========================================="
echo ""

# ---- Happy Path Tests ----

echo "--- Happy Path ---"

# GET /api/departments — list all
test_endpoint "List departments" "GET" "/api/departments" "200"
check_field "[0].id"
check_field "[0].name"
check_field "[0].type"
check_field "[0]._count"

# Capture first department ID for subsequent tests
FIRST_DEPT_ID=$(echo "$body_response" | jq -r '.[0].id')
echo "  → First department ID: $FIRST_DEPT_ID"

# GET /api/departments/[id] — get by ID
if [ -n "$FIRST_DEPT_ID" ] && [ "$FIRST_DEPT_ID" != "null" ]; then
    test_endpoint "Get department by ID" "GET" "/api/departments/$FIRST_DEPT_ID" "200"
    check_field "id"
    check_field "name"
    check_field "members"
    check_field "primaryUsers"
    check_field "projects"
    check_field "_count"
fi

# POST /api/departments — create (ADMIN)
TIMESTAMP=$(date +%s)
CREATE_BODY="{\"name\":\"Test Dept ${TIMESTAMP}\",\"type\":\"PRODUCTION\",\"description\":\"Test department for API testing\"}"
test_endpoint "Create department (ADMIN)" "POST" "/api/departments" "201" "$CREATE_BODY"
check_field "id"
check_field "name"
check_field "type"

# Store created department ID for cleanup
CREATED_DEPT_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Created department ID: $CREATED_DEPT_ID"

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# GET /api/departments/invalid-id — 404
test_endpoint "Get department with invalid ID → 404" "GET" "/api/departments/nonexistent-id-12345" "404"

# POST /api/departments — missing required fields → 400
test_endpoint "Create department missing fields → 400" "POST" "/api/departments" "400" '{"name":"Incomplete"}'

# No cookie → 401 on list
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/departments")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: List departments without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: List departments without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on get by ID
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/departments/$FIRST_DEPT_ID")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Get department without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Get department without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Cleanup ----

echo ""
echo "--- Cleanup ---"

if [ -n "$CREATED_DEPT_ID" ] && [ "$CREATED_DEPT_ID" != "null" ]; then
    echo "  → Cleaning up created department: $CREATED_DEPT_ID"
    cleanup_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/departments/$CREATED_DEPT_ID" \
        -H "Cookie: $COOKIE")
    cleanup_status=$(echo "$cleanup_response" | tail -1)
    if [ "$cleanup_status" = "200" ] || [ "$cleanup_status" = "204" ]; then
        echo "  ✓ Department cleaned up successfully"
    else
        echo "  ⚠ Could not auto-delete department $CREATED_DEPT_ID (HTTP $cleanup_status) — manual cleanup may be needed"
    fi
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
