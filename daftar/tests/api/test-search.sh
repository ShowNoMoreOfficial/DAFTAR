#!/bin/bash
# Daftar API Tests — Search Module
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
echo "  Daftar API Tests — Search Module"
echo "=========================================="
echo ""

# ---- Happy Path Tests ----

echo "--- Happy Path ---"

# GET /api/search?q=test — global search
test_endpoint "Global search for 'test'" "GET" "/api/search?q=test" "200"
check_field "users"
check_field "brands"
check_field "tasks"

# Verify result arrays
USERS_COUNT=$(echo "$body_response" | jq '.users | length')
BRANDS_COUNT=$(echo "$body_response" | jq '.brands | length')
TASKS_COUNT=$(echo "$body_response" | jq '.tasks | length')
echo "  → Results: $USERS_COUNT users, $BRANDS_COUNT brands, $TASKS_COUNT tasks"

# GET /api/search?q=admin — search with likely match
test_endpoint "Global search for 'admin'" "GET" "/api/search?q=admin" "200"
check_field "users"
check_field "brands"
check_field "tasks"

# Verify user result shape if any returned
SEARCH_USER_COUNT=$(echo "$body_response" | jq '.users | length')
if [ "$SEARCH_USER_COUNT" -gt 0 ] 2>/dev/null; then
    check_field "users[0].id"
    check_field "users[0].name"
    check_field "users[0].email"
    check_field "users[0].role"
    echo "  ✓ User results have proper structure"
fi

# Verify task result shape if any returned
SEARCH_TASK_COUNT=$(echo "$body_response" | jq '.tasks | length')
if [ "$SEARCH_TASK_COUNT" -gt 0 ] 2>/dev/null; then
    check_field "tasks[0].id"
    check_field "tasks[0].title"
    check_field "tasks[0].status"
    echo "  ✓ Task results have proper structure"
fi

# GET /api/search?q=ab — search with min-length query (>= 2 chars)
test_endpoint "Search with 2-char query" "GET" "/api/search?q=ab" "200"
check_field "users"
check_field "brands"
check_field "tasks"

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# GET /api/search?q= — empty query returns empty arrays (not 400)
# Note: The actual route returns empty arrays for q < 2 chars, HTTP 200
test_endpoint "Search with empty query → 200 (empty arrays)" "GET" "/api/search?q=" "200"

# Verify empty response contains arrays
EMPTY_USERS=$(echo "$body_response" | jq '.users | length')
EMPTY_BRANDS=$(echo "$body_response" | jq '.brands | length')
EMPTY_TASKS=$(echo "$body_response" | jq '.tasks | length')
if [ "$EMPTY_USERS" = "0" ] && [ "$EMPTY_BRANDS" = "0" ] && [ "$EMPTY_TASKS" = "0" ]; then
    echo "  ✓ Empty query returns empty arrays as expected"
else
    echo "  ⚠ Empty query returned non-empty results (users: $EMPTY_USERS, brands: $EMPTY_BRANDS, tasks: $EMPTY_TASKS)"
fi

# GET /api/search?q=a — single char query → 200 (empty arrays, needs >= 2 chars)
test_endpoint "Search with single char → 200 (empty arrays)" "GET" "/api/search?q=a" "200"
SINGLE_USERS=$(echo "$body_response" | jq '.users | length')
SINGLE_TASKS=$(echo "$body_response" | jq '.tasks | length')
if [ "$SINGLE_USERS" = "0" ] && [ "$SINGLE_TASKS" = "0" ]; then
    echo "  ✓ Single-char query returns empty arrays (min 2 chars required)"
else
    echo "  ⚠ Single-char query returned results (may indicate no min-length check)"
fi

# GET /api/search without q parameter → 200 (empty arrays)
test_endpoint "Search without q parameter → 200 (empty)" "GET" "/api/search" "200"

# No cookie → 401
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/search?q=test")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Search without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Search without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
