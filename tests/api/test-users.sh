#!/bin/bash
# Daftar API Tests — Users Module
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
echo "  Daftar API Tests — Users Module"
echo "=========================================="
echo ""

# ---- Happy Path Tests ----

echo "--- Happy Path ---"

# GET /api/users — list users (ADMIN only)
test_endpoint "List users (ADMIN)" "GET" "/api/users" "200"
check_field "[0].id"
check_field "[0].email"
check_field "[0].name"
check_field "[0].role"

# GET /api/users/me — get own profile
test_endpoint "Get own profile" "GET" "/api/users/me" "200"
check_field "id"
check_field "email"
check_field "name"
check_field "role"
check_field "primaryDepartment"

# POST /api/users — create user (email, name, role required)
TIMESTAMP=$(date +%s)
CREATE_BODY="{\"email\":\"testuser-${TIMESTAMP}@daftar.test\",\"name\":\"Test User ${TIMESTAMP}\",\"role\":\"MEMBER\"}"
test_endpoint "Create user" "POST" "/api/users" "201" "$CREATE_BODY"
check_field "id"
check_field "email"
check_field "role"

# Store the created user ID for cleanup
CREATED_USER_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Created user ID: $CREATED_USER_ID"

# PATCH /api/users/me — update own name
test_endpoint "Update own name" "PATCH" "/api/users/me" "200" '{"name":"Updated Test Name"}'
check_field "name"

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# GET /api/users — no cookie → 401
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/users")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: List users without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: List users without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# GET /api/users/me — no cookie → 401
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/users/me")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Get profile without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Get profile without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# POST /api/users — invalid body (missing required fields) → 400
test_endpoint "Create user missing fields → 400" "POST" "/api/users" "400" '{"email":"incomplete@test.com"}'

# POST /api/users — duplicate email → 400
test_endpoint "Create user duplicate email → 400" "POST" "/api/users" "400" "$CREATE_BODY"

# ---- Cleanup ----

echo ""
echo "--- Cleanup ---"

if [ -n "$CREATED_USER_ID" ] && [ "$CREATED_USER_ID" != "null" ]; then
    echo "  → Cleaning up created user: $CREATED_USER_ID"
    # Delete via direct API call if delete endpoint exists, otherwise note for manual cleanup
    cleanup_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/users/$CREATED_USER_ID" \
        -H "Cookie: $COOKIE")
    cleanup_status=$(echo "$cleanup_response" | tail -1)
    if [ "$cleanup_status" = "200" ] || [ "$cleanup_status" = "204" ]; then
        echo "  ✓ User cleaned up successfully"
    else
        echo "  ⚠ Could not auto-delete user $CREATED_USER_ID (HTTP $cleanup_status) — manual cleanup may be needed"
    fi
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
